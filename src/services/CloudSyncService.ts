import { db } from '../db/db';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const syncLocalDataToCloud = async () => {
    try {
        console.log('[Sync] Starting cloud synchronization...');
        
        // 1. Sync Inventory (Raw Materials)
        const inventoryItems = await db.rawMaterials.toArray();
        if (inventoryItems.length > 0) {
            const { error: invError } = await supabase
                .from('inventory')
                .upsert(inventoryItems.map(item => ({
                    id: item.id,
                    item_code: item.id, // Fallback if no code
                    description: item.name,
                    batch_lot: item.batchNumber,
                    quantity: parseFloat(item.currentStock) || 0,
                    unit: item.unit,
                    status: item.status,
                    data: item,
                    updated_at: new Date().toISOString()
                })));
            if (invError) throw invError;
        }

        // 2. Sync Master Formulas
        const mfrs = await db.masterFormulas.toArray();
        if (mfrs.length > 0) {
            const { error: mfrError } = await supabase
                .from('master_formulas')
                .upsert(mfrs.map(mfr => ({
                    id: mfr.id,
                    mfr_number: mfr.id,
                    product_name: mfr.name,
                    version: mfr.version || '1.0',
                    status: 'Active',
                    data: mfr,
                    updated_at: new Date().toISOString()
                })));
            if (mfrError) throw mfrError;
        }

        // 3. Sync Batch Records
        const bmrs = await db.batchRecords.toArray();
        if (bmrs.length > 0) {
            const { error: bmrError } = await supabase
                .from('batch_records')
                .upsert(bmrs.map(bmr => ({
                    id: bmr.id,
                    batch_number: bmr.batchNumber,
                    mfr_id: bmr.productId, // Reference to MFR
                    status: bmr.status,
                    data: bmr,
                    updated_at: new Date().toISOString()
                })));
            if (bmrError) throw bmrError;
        }

        // 4. Sync QC Test Results
        const testResults = await db.testResults.toArray();
        if (testResults.length > 0) {
            const { error: qcError } = await supabase
                .from('qc_tests')
                .upsert(testResults.map(qc => ({
                    id: qc.id,
                    reference_id: qc.batchNumber,
                    test_type: 'Analytical',
                    status: qc.overallResult,
                    data: qc,
                    updated_at: new Date().toISOString()
                })));
            if (qcError) throw qcError;
        }

        console.log('[Sync] Synchronization successful.');
        return { success: true, count: inventoryItems.length + mfrs.length + bmrs.length + testResults.length };
    } catch (error: any) {
        console.error('[Sync] Failed:', error.message);
        return { success: false, error: error.message };
    }
};

export const triggerManualSync = async () => {
    const id = toast.loading('Synchronizing data with Enterprise Cloud...');
    const result = await syncLocalDataToCloud();
    if (result.success) {
        toast.success(`Cloud Sync Complete! ${result.count} records updated.`, { id });
    } else {
        toast.error(`Sync Failed: ${result.error}`, { id });
    }
    return result;
};
