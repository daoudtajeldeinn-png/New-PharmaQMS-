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
const CLOUD_TABLE_ALIASES = ['deletedRecords', 'deletedrecords', 'deleted_records'];
let resolvedCloudTable: string | null = null;

export async function getDeletedRecordsCloudTableName(): Promise<string> {
  if (resolvedCloudTable) {
    return resolvedCloudTable;
  }

  for (const tableName of CLOUD_TABLE_ALIASES) {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    if (!error) {
      resolvedCloudTable = tableName;
      return tableName;
    }

    const isMissingTable =
      error.status === 404 ||
      error.message?.includes('missing relation') ||
      error.message?.includes('does not exist') ||
      error.details?.includes('missing relation');

    if (isMissingTable) {
      continue;
    }

    console.warn(`DeletedRecordsService: Could not probe table ${tableName}:`, error);
    break;
  }

  resolvedCloudTable = CLOUD_TABLE_ALIASES[0];
  return resolvedCloudTable;
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

  // 1. Save locally immediately
  const local = loadLocalTombstones();
  const existing = local.findIndex(t => t.id === recordId && t.tableName === tableName);
  if (existing >= 0) {
    local[existing] = tombstone; // update if re-deleted
  } else {
    local.push(tombstone);
  }
  saveLocalTombstones(local);

  // 2. Push to Supabase (best effort – non-blocking)
  try {
    const cloudTable = await getDeletedRecordsCloudTableName();
    await supabase
      .from(cloudTable)
      .upsert({
        id: `${tableName}__${recordId}`,   // composite PK
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
  try {
    const cloudTable = await getDeletedRecordsCloudTableName();
    const { data, error } = await supabase
      .from(cloudTable)
      .select('*');

    if (error || !data) {
      console.warn('DeletedRecordsService: Could not fetch tombstones from cloud:', error);
      return;
    }

    const local = loadLocalTombstones();
    const localMap = new Map(local.map(t => [`${t.tableName}__${t.id}`, t]));

    data.forEach((row: any) => {
      const key = `${row.table_name}__${row.record_id}`;
      localMap.set(key, {
        id: row.record_id,
        tableName: row.table_name,
        deletedAt: row.deleted_at,
        deletedBy: row.deleted_by,
        reason: row.reason || undefined,
        snapshot: row.snapshot ? JSON.parse(row.snapshot) : undefined,
        recovered: row.recovered || false,
      });
    });

    saveLocalTombstones(Array.from(localMap.values()));
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

  // Push recovery flag to cloud
  try {
    const cloudTable = await getDeletedRecordsCloudTableName();
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

  // Remove tombstone from cloud
  try {
    const cloudTable = await getDeletedRecordsCloudTableName();
    await supabase
      .from(cloudTable)
      .delete()
      .eq('id', `${tableName}__${recordId}`);
  } catch (err) {
    console.warn('DeletedRecordsService: Could not purge tombstone from cloud:', err);
  }
}
