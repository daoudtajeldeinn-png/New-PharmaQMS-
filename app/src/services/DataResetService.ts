/**
 * DataResetService.ts
 * 
 * NUCLEAR OPTION: Complete data wipe for fresh start
 * Deletes ALL records from both local IndexedDB and Supabase cloud
 * 
 * ⚠️ ADMIN ONLY - IRREVERSIBLE
 */

import { supabase } from '@/lib/supabase';
import { db } from '@/db/db';

const CLOUD_TABLES = [
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
    'rawMaterials',
    'materialMovements',
    'reconciliationRecords',
    'masterFormulas',
    'batchRecords',
    'pharmacopeiaMonographs'
];

export interface ResetProgress {
    stage: 'local' | 'cloud' | 'complete';
    current: string;
    total: number;
    completed: number;
    errors: string[];
}

export async function resetAllData(
    onProgress?: (progress: ResetProgress) => void
): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
        // ============ STAGE 1: Clear Local IndexedDB ============
        onProgress?.({
            stage: 'local',
            current: 'Starting local wipe...',
            total: CLOUD_TABLES.length,
            completed: 0,
            errors: []
        });

        for (let i = 0; i < CLOUD_TABLES.length; i++) {
            const tableName = CLOUD_TABLES[i];
            try {
                onProgress?.({
                    stage: 'local',
                    current: `Clearing ${tableName}...`,
                    total: CLOUD_TABLES.length,
                    completed: i,
                    errors
                });

                const table = (db as any)[tableName];
                if (table) {
                    await table.clear();
                    console.log(`✅ Cleared local ${tableName}`);
                } else {
                    console.warn(`⚠️ Table ${tableName} not found in IndexedDB`);
                }
            } catch (err) {
                const errMsg = `Failed to clear local ${tableName}: ${err}`;
                console.error(errMsg);
                errors.push(errMsg);
            }
        }

        // ============ STAGE 2: Delete from Supabase Cloud ============
        onProgress?.({
            stage: 'cloud',
            current: 'Starting cloud wipe...',
            total: CLOUD_TABLES.length,
            completed: 0,
            errors
        });

        for (let i = 0; i < CLOUD_TABLES.length; i++) {
            const tableName = CLOUD_TABLES[i];
            try {
                onProgress?.({
                    stage: 'cloud',
                    current: `Deleting ${tableName} from cloud...`,
                    total: CLOUD_TABLES.length,
                    completed: i,
                    errors
                });

                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000');

                if (error) {
                    throw error;
                }
                
                console.log(`✅ Deleted cloud ${tableName}`);
            } catch (err) {
                const errMsg = `Failed to delete cloud ${tableName}: ${err}`;
                console.error(errMsg);
                errors.push(errMsg);
            }
        }

        // ============ STAGE 3: Clear Tombstones ============
        try {
            await supabase.from('deletedRecords').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            localStorage.removeItem('pqms_deleted_records');
            console.log('✅ Cleared tombstones');
        } catch (err) {
            const errMsg = `Failed to clear tombstones: ${err}`;
            console.error(errMsg);
            errors.push(errMsg);
        }

        onProgress?.({
            stage: 'complete',
            current: 'Reset complete!',
            total: CLOUD_TABLES.length,
            completed: CLOUD_TABLES.length,
            errors
        });

        return { success: errors.length === 0, errors };
        
    } catch (err) {
        errors.push(`Fatal error during reset: ${err}`);
        return { success: false, errors };
    }
}

export async function resetSpecificTables(
    tableNames: string[],
    onProgress?: (progress: ResetProgress) => void
): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (let i = 0; i < tableNames.length; i++) {
        const tableName = tableNames[i];
        
        try {
            onProgress?.({
                stage: 'local',
                current: `Clearing ${tableName}...`,
                total: tableNames.length,
                completed: i,
                errors
            });

            const table = (db as any)[tableName];
            if (table) await table.clear();

            await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            
        } catch (err) {
            errors.push(`Failed ${tableName}: ${err}`);
        }
    }

    return { success: errors.length === 0, errors };
}
