
import { supabase } from '@/lib/supabase';
import { db } from '@/db/db';
import { toast } from 'sonner';

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
];

export async function syncAllTables() {
    console.log('Starting Cloud Synchronization...');
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const tableName of CLOUD_TABLES) {
        try {
            console.log(`Syncing table: ${tableName}`);
            
            // 1. PUSH: Get local data from Dexie
            const localData = await (db as any)[tableName].toArray();
            
            if (localData.length > 0) {
                // Convert Date objects to ISO strings for Supabase
                const dataToPush = localData.map((item: any) => {
                    const cleanItem = { ...item };
                    for (const key in cleanItem) {
                        const dateKeys = ['date', 'time', 'timestamp', 'at', 'expiry', 'next', 'schedule', 'created', 'updated', 'lastLogin'];
                        const isDateKey = dateKeys.some(dk => key.toLowerCase().includes(dk));
                        if (isDateKey && cleanItem[key] instanceof Date) {
                            cleanItem[key] = cleanItem[key].toISOString();
                        }
                    }
                    return cleanItem;
                });

                const { error: pushError } = await supabase
                    .from(tableName)
                    .upsert(dataToPush, { onConflict: 'id' });

                if (pushError) {
                    console.warn(`Push error for ${tableName}:`, pushError);
                    throw pushError;
                }
            }

            // 2. PULL: Get remote data from Supabase
            const { data: remoteData, error: pullError } = await supabase
                .from(tableName)
                .select('*');

            if (pullError) {
                throw pullError;
            }

            if (remoteData && remoteData.length > 0) {
                // Store remote data as-is (ISO strings stay as strings).
                // Converting to Date objects here caused React error #31 when components
                // rendered date values directly as JSX children. Components that need
                // actual Date methods should call new Date(value) themselves.
                await (db as any)[tableName].bulkPut(remoteData);
            }

            successCount++;
        } catch (err: any) {
            console.error(`Failed to sync ${tableName}:`, err);
            failCount++;
            errors.push(`${tableName}: ${err.message || 'Unknown error'}`);
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
