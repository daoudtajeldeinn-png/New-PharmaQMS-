/**
 * DeletedRecordsService.ts
 *
 * Manages "soft-delete tombstones" so that when IT Admin or QA Admin delete
 * a record, the deletion is propagated to ALL users and cannot be restored
 * by a cloud sync unless an authorised admin explicitly recovers it.
 *
 * Architecture:
 *  - Tombstones are stored in a dedicated Supabase table `deletedRecords`
 *    AND in localStorage (`pqms_deleted_records`) as a fallback.
 *  - Before every sync PULL, CloudSyncService checks this list and skips
 *    any remote record whose id appears in the tombstone list.
 *  - Recovery is only possible by IT Admin / QA Admin via the UI.
 */

import { supabase } from '@/lib/supabase';

export interface DeletedRecord {
  id: string;           // id of the deleted record
  tableName: string;    // which table the record was in
  deletedAt: string;    // ISO timestamp
  deletedBy: string;    // username of the admin who deleted it
  reason?: string;      // optional reason
  snapshot?: any;       // full record snapshot for recovery
  recovered: boolean;   // whether an admin has restored this record
}

const LOCAL_KEY = 'pqms_deleted_records';
// PostgREST exposes unquoted Postgres names as lowercase (e.g. deletedrecords).
const CLOUD_TABLE_ALIASES = ['deletedrecords', 'deleted_records', 'deletedRecords'];

/** undefined = not probed yet; null = no cloud table (local-only mode) */
let resolvedCloudTable: string | null | undefined;
let loggedLocalOnlyMode = false;

function isMissingTableError(error: { status?: number; code?: string; message?: string; details?: string } | null): boolean {
  if (!error) return false;
  const message = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return (
    error.status === 404 ||
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    message.includes('missing relation') ||
    message.includes('does not exist') ||
    message.includes('could not find the table')
  );
}

function logLocalOnlyModeOnce(): void {
  if (loggedLocalOnlyMode) return;
  loggedLocalOnlyMode = true;
  console.info(
    'DeletedRecordsService: Cloud tombstone table not found — using local tombstones only. ' +
      'Run supabase_schema_fix_v6.sql in Supabase to enable cross-device deletion sync.'
  );
}

export async function getDeletedRecordsCloudTableName(): Promise<string | null> {
  if (resolvedCloudTable !== undefined) {
    return resolvedCloudTable;
  }

  for (const tableName of CLOUD_TABLE_ALIASES) {
    const { error } = await supabase.from(tableName).select('id').limit(1);

    if (!error) {
      resolvedCloudTable = tableName;
      return tableName;
    }

    if (isMissingTableError(error)) {
      continue;
    }

    console.warn(`DeletedRecordsService: Could not probe table ${tableName}:`, error);
    break;
  }

  resolvedCloudTable = null;
  logLocalOnlyModeOnce();
  return null;
}

export function isCloudTombstoneSyncAvailable(): boolean {
  return resolvedCloudTable !== null;
}

// ==================== Local Storage Helpers ====================

function loadLocalTombstones(): DeletedRecord[] {
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalTombstones(tombstones: DeletedRecord[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(tombstones));
}

// ==================== Public API ====================

/**
 * Record a deletion tombstone locally and attempt cloud push.
 */
export async function recordDeletion(
  tableName: string,
  recordId: string,
  deletedByUsername: string,
  snapshot?: any,
  reason?: string
): Promise<void> {
  const tombstone: DeletedRecord = {
    id: recordId,
    tableName,
    deletedAt: new Date().toISOString(),
    deletedBy: deletedByUsername,
    reason,
    snapshot,
    recovered: false,
  };

  const local = loadLocalTombstones();
  const existing = local.findIndex(t => t.id === recordId && t.tableName === tableName);
  if (existing >= 0) {
    local[existing] = tombstone;
  } else {
    local.push(tombstone);
  }
  saveLocalTombstones(local);

  const cloudTable = await getDeletedRecordsCloudTableName();
  if (!cloudTable) return;

  try {
    await supabase
      .from(cloudTable)
      .upsert({
        id: `${tableName}__${recordId}`,
        record_id: recordId,
        table_name: tableName,
        deleted_at: tombstone.deletedAt,
        deleted_by: deletedByUsername,
        reason: reason || null,
        snapshot: snapshot ? JSON.stringify(snapshot) : null,
        recovered: false,
      }, { onConflict: 'id' });
  } catch (err) {
    console.warn('DeletedRecordsService: Could not push tombstone to cloud:', err);
  }
}

/**
 * Returns the Set of record IDs that have been deleted for a given table.
 * Used by CloudSyncService to filter PULL results.
 */
export function getDeletedIds(tableName: string): Set<string> {
  const local = loadLocalTombstones();
  return new Set(
    local
      .filter(t => t.tableName === tableName && !t.recovered)
      .map(t => t.id)
  );
}

/**
 * Pulls the latest tombstone list from Supabase and merges into local store.
 * Called at sync time so all workstations get the same tombstone list.
 */
export async function syncTombstonesFromCloud(): Promise<void> {
  const cloudTable = await getDeletedRecordsCloudTableName();
  if (!cloudTable) return;

  try {
    const { data, error } = await supabase.from(cloudTable).select('*');

    if (error || !data) {
      if (!isMissingTableError(error)) {
        console.warn('DeletedRecordsService: Could not fetch tombstones from cloud:', error);
      }
      return;
    }

    const local = loadLocalTombstones();

    // Merge into a single map keyed by `${tableName}__${recordId}`
    const mergedMap = new Map<string, DeletedRecord>();

    for (const t of local) {
      mergedMap.set(`${t.tableName}__${t.id}`, t);
    }

    for (const row of data as any[]) {
      const key = `${row.table_name}__${row.record_id}`;
      mergedMap.set(key, {
        id: row.record_id,
        tableName: row.table_name,
        deletedAt: row.deleted_at,
        deletedBy: row.deleted_by,
        reason: row.reason || undefined,
        snapshot: row.snapshot ? JSON.parse(row.snapshot) : undefined,
        recovered: row.recovered || false,
      });
    }

    const mergedList = Array.from(mergedMap.values());

    // Two-way sync: local -> cloud for missing tombstones
    const cloudKeys = new Set(data.map((row: any) => `${row.table_name}__${row.record_id}`));

    await Promise.all(
      local
        .filter(t => !t.recovered)
        .map(async (localTomb) => {
          const key = `${localTomb.tableName}__${localTomb.id}`;
          if (cloudKeys.has(key)) return;

          try {
            await supabase
              .from(cloudTable)
              .upsert(
                {
                  id: key,
                  record_id: localTomb.id,
                  table_name: localTomb.tableName,
                  deleted_at: localTomb.deletedAt,
                  deleted_by: localTomb.deletedBy,
                  reason: localTomb.reason || null,
                  snapshot: localTomb.snapshot ? JSON.stringify(localTomb.snapshot) : null,
                  recovered: localTomb.recovered || false,
                },
                { onConflict: 'id' }
              );
          } catch (e) {
            console.warn(`DeletedRecordsService: failed to push local tombstone ${key}:`, e);
          }
        })
    );

    // Purge remote business records for all active tombstones (including cloud-origin ones)
    const activeTombstones = mergedList.filter(t => !t.recovered);
    await Promise.all(
      activeTombstones.map(async (t) => {
        try {
          await supabase.from(t.tableName).delete().eq('id', t.id);
        } catch (e) {
          console.warn(`DeletedRecordsService: failed to purge remote record ${t.tableName}:${t.id}:`, e);
        }
      })
    );

    // Save the fully merged tombstone list locally
    saveLocalTombstones(mergedList);
  } catch (err) {
    console.warn('DeletedRecordsService: syncTombstonesFromCloud failed:', err);
  }
}

/**
 * Returns all tombstones (for admin view).
 */
export function getAllTombstones(): DeletedRecord[] {
  return loadLocalTombstones();
}

/**
 * Admin-only: mark a tombstone as recovered, restoring the record.
 * Caller is responsible for re-inserting the snapshot into the store.
 */
export async function recoverRecord(
  tableName: string,
  recordId: string,
  recoveredByUsername: string
): Promise<DeletedRecord | null> {
  const local = loadLocalTombstones();
  const idx = local.findIndex(t => t.id === recordId && t.tableName === tableName);
  if (idx < 0) return null;

  local[idx] = { ...local[idx], recovered: true };
  saveLocalTombstones(local);

  const cloudTable = await getDeletedRecordsCloudTableName();
  if (!cloudTable) return local[idx];

  try {
    await supabase
      .from(cloudTable)
      .update({ recovered: true, recovered_by: recoveredByUsername, recovered_at: new Date().toISOString() })
      .eq('id', `${tableName}__${recordId}`);
  } catch (err) {
    console.warn('DeletedRecordsService: Could not push recovery to cloud:', err);
  }

  return local[idx];
}

/**
 * Admin-only: permanently delete/purge a tombstone.
 */
export async function purgeTombstone(
  tableName: string,
  recordId: string
): Promise<void> {
  const local = loadLocalTombstones();
  const filtered = local.filter(t => !(t.id === recordId && t.tableName === tableName));
  saveLocalTombstones(filtered);

  const cloudTable = await getDeletedRecordsCloudTableName();
  if (!cloudTable) return;

  try {
    await supabase
      .from(cloudTable)
      .delete()
      .eq('id', `${tableName}__${recordId}`);
  } catch (err) {
    console.warn('DeletedRecordsService: Could not purge tombstone from cloud:', err);
  }
}
