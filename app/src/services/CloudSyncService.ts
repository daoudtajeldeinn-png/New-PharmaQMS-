
import { supabase } from '@/lib/supabase';
import { db } from '@/db/db';
import type { AppState } from '@/hooks/storeReducer';

export const CLOUD_TABLES = [
    'products',
    'testMethods',
    'testResults',
    'capas',
    'deviations',
    'equipment',
    'chemicalReagents',
    'referenceStandards',
    'qualitySystems',
    'trainingRecords',
    'audits',
    'suppliers',
    'changeControls',
    'marketComplaints',
    'productRecalls',
    'stabilityProtocols',
    'ipqcChecks',
    'coaRecords',
    'masterFormulas',
    'batchRecords',
    'rawMaterials',
    'materialMovements',
    'reconciliationRecords',
    'activities',
    'pharmacopeiaMonographs'
] as const;

function getRecordTimestamp(item: Record<string, unknown>): number {
    const ts =
        item.updatedAt ??
        item.updated_at ??
        item.createdAt ??
        item.created_at ??
        item.deleted_at;
    if (!ts) return 0;
    const n = new Date(ts as string | Date).getTime();
    return Number.isFinite(n) ? n : 0;
}

function pickNewerRecord(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
): Record<string, unknown> {
    return getRecordTimestamp(remote) >= getRecordTimestamp(local) ? remote : local;
}

function serializeForSupabase(item: Record<string, unknown>): Record<string, unknown> {
    const cleanItem = { ...item };
    
    // Remove local-only soft delete flags to prevent Supabase schema errors
    delete cleanItem.deleted_at;
    delete cleanItem.deleted_by;
    delete cleanItem.deletion_reason;
    delete cleanItem.is_deleted;
    
    const keys = Object.keys(cleanItem);
    for (const key of keys) {
        if (key !== key.toLowerCase()) {
            const lowerKey = key.toLowerCase();
            if (keys.includes(lowerKey)) {
                delete cleanItem[lowerKey];
            }
        }
    }

    for (const key in cleanItem) {
        const dateKeys = ['date', 'time', 'timestamp', 'at', 'expiry', 'next', 'schedule', 'created', 'updated', 'lastLogin'];
        const isDateKey = dateKeys.some((dk) => key.toLowerCase().includes(dk));
        if (isDateKey && cleanItem[key] instanceof Date) {
            cleanItem[key] = (cleanItem[key] as Date).toISOString();
        }
    }
    return cleanItem;
}

/** Write in-memory store rows to Dexie before cloud sync so today's work is included in PUSH. */
export async function flushAppStateToDexie(state: AppState): Promise<void> {
    const tableData: Record<string, unknown[]> = {
        products: state.products,
        testMethods: state.testMethods,
        testResults: state.testResults,
        capas: state.capas,
        deviations: state.deviations,
        equipment: state.equipment,
        chemicalReagents: state.chemicalReagents,
        referenceStandards: state.referenceStandards,
        qualitySystems: state.qualitySystems,
        trainingRecords: state.trainingRecords,
        audits: state.audits,
        suppliers: state.suppliers,
        changeControls: state.changeControls,
        marketComplaints: state.marketComplaints,
        productRecalls: state.productRecalls,
        stabilityProtocols: state.stabilityProtocols,
        ipqcChecks: state.ipqcChecks,
        coaRecords: state.coaRecords,
        masterFormulas: Object.values(state.masterFormulas ?? {}),
        batchRecords: state.batchRecords,
        rawMaterials: state.rawMaterials,
        materialMovements: state.materialMovements,
        reconciliationRecords: state.reconciliationRecords,
        activities: state.activities,
        pharmacopeiaMonographs: state.pharmacopeiaMonographs,
    };

    for (const tableName of CLOUD_TABLES) {
        const rows = tableData[tableName];
        if (!rows?.length) continue;
        await (db as any)[tableName].bulkPut(rows);
    }
}

/** One-time cleanup: physically remove any records with deleted_at from ALL Dexie tables */
async function purgeLocalSoftDeleted(): Promise<void> {
    for (const tableName of CLOUD_TABLES) {
        try {
            const table = (db as any)[tableName];
            if (!table) continue;
            const allRows: Record<string, unknown>[] = await table.toArray();
            const dirtyIds = allRows
                .filter((r) => r.deleted_at)
                .map((r) => r.id as string);
            if (dirtyIds.length > 0) {
                await table.bulkDelete(dirtyIds);
                console.log(`CloudSync cleanup: purged ${dirtyIds.length} soft-deleted records from ${tableName}`);
            }
        } catch (err) {
            console.warn(`CloudSync cleanup: failed for ${tableName}:`, err);
        }
    }
}

export async function syncAllTables() {
    console.log('Starting Cloud Synchronization...');
    // Purge any locally soft-deleted records before syncing
    await purgeLocalSoftDeleted();
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
        const { syncTombstonesFromCloud } = await import('./DeletedRecordsService');
        await syncTombstonesFromCloud();
        console.log('Tombstones synchronised from cloud.');
    } catch (err) {
        console.warn('Could not sync tombstones – proceeding without:', err);
    }

    for (const tableName of CLOUD_TABLES) {
        try {
            console.log(`Syncing table: ${tableName}`);

            const { getDeletedIds } = await import('./DeletedRecordsService');
            const deletedIds = getDeletedIds(tableName);

            if (deletedIds.size > 0) {
                for (const idToDelete of Array.from(deletedIds)) {
                    await (db as any)[tableName].delete(idToDelete);
                }
            }

            const allLocalData: Record<string, unknown>[] = await (db as any)[tableName].toArray();
            // Filter out any records that are soft-deleted locally (safety net — they should already be physically deleted)
            const localData = allLocalData.filter((item) => {
                if (item.deleted_at) return false;
                if (deletedIds.size > 0 && deletedIds.has(String(item.id))) return false;
                return true;
            });

            const pushedIds = new Set(localData.map((item) => String(item.id)));

            if (localData.length > 0) {
                const dataToPush = localData.map((item) => serializeForSupabase(item));

                const { error: pushError } = await supabase
                    .from(tableName)
                    .upsert(dataToPush, { onConflict: 'id' });

                if (pushError) {
                    console.warn(`Push error for ${tableName}:`, pushError);
                    throw pushError;
                }
            }

            const { data: remoteData, error: pullError } = await supabase
                .from(tableName)
                .select('*');

            if (pullError) {
                throw pullError;
            }

            const safeData =
                remoteData && deletedIds.size > 0
                    ? remoteData.filter((row: Record<string, unknown>) => {
                          const rowId = row.id ?? row.record_id;
                          return rowId ? !deletedIds.has(String(rowId)) : true;
                      })
                    : remoteData ?? [];

            const remoteById = new Map(
                safeData.map((row: Record<string, unknown>) => [String(row.id), row])
            );

            const mergedById = new Map<string, Record<string, unknown>>();

            for (const remoteRow of safeData) {
                const id = String(remoteRow.id);
                const localRow = localData.find((l) => String(l.id) === id);
                mergedById.set(
                    id,
                    localRow ? pickNewerRecord(localRow, remoteRow) : remoteRow
                );
            }

            // Keep local-only rows (e.g. today's work not yet visible in pull) — never wipe by empty remote.
            for (const localRow of localData) {
                const id = String(localRow.id);
                if (!mergedById.has(id)) {
                    mergedById.set(id, localRow);
                }
            }

            const merged = Array.from(mergedById.values());
            if (merged.length > 0) {
                await (db as any)[tableName].bulkPut(merged);
            }

            const keptLocalOnly = localData.filter((l) => !remoteById.has(String(l.id))).length;
            if (keptLocalOnly > 0) {
                console.log(
                    `CloudSync: ${tableName} — kept ${keptLocalOnly} local-only row(s) after merge (pushed: ${pushedIds.size})`
                );
            }

            successCount++;
        } catch (err: unknown) {
            console.error(`Failed to sync ${tableName}:`, err);
            failCount++;
            const message = err instanceof Error ? err.message : 'Unknown error';
            errors.push(`${tableName}: ${message}`);
        }
    }

    return { successCount, failCount, errors };
}

export async function verifyCloudConnection() {
    try {
        const { error } = await supabase.from('notifications').select('id').limit(1);
        return !error;
    } catch {
        return false;
    }
}
