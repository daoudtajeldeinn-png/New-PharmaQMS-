/**
 * DeletedRecordsService.ts
 * ALCOA+ Compliant Soft-Delete Tombstones
 */
import { supabase } from '@/lib/supabase';

export interface DeletedRecord {
  id: string;
  tableName: string;
  deletedAt: string;
  deletedBy: string;
  reason?: string;
  recovered: boolean;
}

const LOCAL_KEY = 'pqms_deleted_records';
const CLOUD_TABLE_ALIASES = ['deletedrecords', 'deleted_records', 'deletedRecords'];

let resolvedCloudTable: string | null | undefined;

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

export async function getDeletedRecordsCloudTableName(): Promise<string | null> {
  if (resolvedCloudTable !== undefined) return resolvedCloudTable;

  for (const tableName of CLOUD_TABLE_ALIASES) {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    if (!error) {
      resolvedCloudTable = tableName;
      return tableName;
    }
    if (isMissingTableError(error)) continue;
    console.warn(`DeletedRecordsService: Could not probe table ${tableName}:`, error);
    break;
  }

  resolvedCloudTable = null;
  return null;
}

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

export async function recordDeletion(
  tableName: string,
  recordId: string,
  deletedByUsername: string,
  reason?: string
): Promise<void> {
  try {
    await supabase
      .from(tableName)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedByUsername,
        deletion_reason: reason || null,
      })
      .eq('id', recordId);
  } catch (err) {
    console.warn(`DeletedRecordsService: Soft-delete flag failed for ${tableName}:${recordId}:`, err);
  }

  const tombstone: DeletedRecord = {
    id: recordId,
    tableName,
    deletedAt: new Date().toISOString(),
    deletedBy: deletedByUsername,
    reason,
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
    const { error } = await supabase.from(cloudTable).upsert({
      id: `${tableName}__${recordId}`,
      record_id: recordId,
      table_name: tableName,
      deleted_at: tombstone.deletedAt,
      deleted_by: deletedByUsername,
      reason: reason || null,
      recovered: false,
    }, { onConflict: 'id' });
    if (error) console.error('DeletedRecordsService upsert error:', JSON.stringify(error, null, 2));
  } catch (err) {
    console.warn('DeletedRecordsService: Could not push tombstone to cloud:', err);
  }
}

export function getDeletedIds(tableName: string): Set<string> {
  const local = loadLocalTombstones();
  return new Set(
    local
      .filter(t => t.tableName === tableName && !t.recovered)
      .map(t => t.id)
  );
}

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
        recovered: row.recovered || false,
      });
    }

    const mergedList = Array.from(mergedMap.values());
    const cloudKeys = new Set(data.map((row: any) => `${row.table_name}__${row.record_id}`));

    await Promise.all(
      local
        .filter(t => !t.recovered)
        .map(async (localTomb) => {
          const key = `${localTomb.tableName}__${localTomb.id}`;
          if (cloudKeys.has(key)) return;

          try {
            await supabase.from(cloudTable).upsert({
              id: key,
              record_id: localTomb.id,
              table_name: localTomb.tableName,
              deleted_at: localTomb.deletedAt,
              deleted_by: localTomb.deletedBy,
              reason: localTomb.reason || null,
              recovered: localTomb.recovered || false,
            }, { onConflict: 'id' });
          } catch (e) {
            console.warn(`DeletedRecordsService: failed to push local tombstone ${key}:`, e);
          }
        })
    );

    saveLocalTombstones(mergedList);
  } catch (err) {
    console.warn('DeletedRecordsService: syncTombstonesFromCloud failed:', err);
  }
}

export function getAllTombstones(): DeletedRecord[] {
  return loadLocalTombstones();
}

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

  try {
    await supabase
      .from(tableName)
      .update({ is_deleted: false, deleted_at: null, deleted_by: null, deletion_reason: null })
      .eq('id', recordId);
  } catch (err) {
    console.warn(`DeletedRecordsService: Recovery flag reset failed for ${tableName}:${recordId}:`, err);
  }

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
