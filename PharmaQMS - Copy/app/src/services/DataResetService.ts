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
import { getDeletedRecordsCloudTableName } from './DeletedRecordsService';

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

        // ============ STAGE 3: Clear Tombstones & LocalStorage QMS Keys ============
        try {
            const tombstoneTable = await getDeletedRecordsCloudTableName();
            if (tombstoneTable) {
                await supabase.from(tombstoneTable).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            }
            
            // Clear all database cache keys in localStorage
            const STORAGE_KEYS_TO_WIPE = [
                'pharma_products',
                'pharma_test_methods',
                'pharma_test_results',
                'pharma_capas',
                'pharma_deviations',
                'pharma_equipment',
                'pharma_chemical_reagents',
                'pharma_reference_standards',
                'pharma_quality_systems',
                'pharma_training_records',
                'pharma_audits',
                'pharma_suppliers',
                'pharma_change_controls',
                'pharma_market_complaints',
                'pharma_product_recalls',
                'pharma_master_formulas',
                'pharma_batch_records',
                'pqms_deleted_records',
                'activityLog',
                'errorLogs'
            ];
            
            STORAGE_KEYS_TO_WIPE.forEach(key => localStorage.removeItem(key));
            console.log('✅ Cleared tombstones & localStorage QMS keys');
        } catch (err) {
            const errMsg = `Failed to clear tombstones or localStorage: ${err}`;
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
