import { supabase } from '@/lib/supabase';
import type { 
  IPQCCheck, 
  TestResult, 
  COARecord, 
  RawMaterial 
} from '@/types';

export interface BatchTraceData {
  batchNumber: string;
  rawMaterial: RawMaterial | null;
  ipqcChecks: IPQCCheck[];
  testResults: TestResult[];
  coaRecord: COARecord | null;
  bmrData: any | null;
  loading: boolean;
  error: string | null;
}

/**
 * Aggregator service to fetch all batch-related records from Supabase
 * Standardizes on 'batchNumber' as the primary lookup key
 */
export async function fetchBatchTraceability(batchNumber: string): Promise<BatchTraceData> {
  console.log(`[TraceService] Initializing trace for batch: ${batchNumber}`);
  
  const result: BatchTraceData = {
    batchNumber,
    rawMaterial: null,
    ipqcChecks: [],
    testResults: [],
    coaRecord: null,
    bmrData: null,
    loading: false,
    error: null
  };

  try {
    // 1. Fetch Raw Material Receipt (matching batchNumber)
    const { data: rmData, error: rmError } = await supabase
      .from('inventory')
      .select('*')
      .or(`batch_lot.eq.${batchNumber},batchNumber.eq.${batchNumber}`)
      .single();
    
    if (rmError && rmError.code !== 'PGRST116') {
       console.warn('[Trace] RM Fetch Error:', rmError);
    } else if (rmData) {
       result.rawMaterial = rmData as unknown as RawMaterial;
    }

    // 2. Fetch IPQC Checks
    const { data: ipqcData, error: ipqcError } = await supabase
      .from('ipqc_checks')
      .select('*')
      .eq('batchNumber', batchNumber);
    
    if (!ipqcError && ipqcData) {
      result.ipqcChecks = ipqcData as IPQCCheck[];
    }

    // 3. Fetch QC Test Results
    const { data: qcData, error: qcError } = await supabase
      .from('qc_tests')
      .select('*')
      .or(`batchNumber.eq.${batchNumber},reference_id.eq.${batchNumber}`);
    
    if (!qcError && qcData) {
      result.testResults = qcData.map(d => ({
        ...d.data, // Assuming data is stored in a JSONB column as per schema.sql
        id: d.id,
        batchNumber: d.batchNumber || batchNumber
      })) as TestResult[];
    }

    // 4. Fetch COA Record
    const { data: coaData, error: coaError } = await supabase
      .from('coa_records')
      .select('*')
      .eq('batchNumber', batchNumber)
      .single();
    
    if (!coaError && coaData) {
      result.coaRecord = coaData as COARecord;
    }

    // 5. Fetch BMR (Batch Manufacturing Record)
    const { data: bmrData, error: bmrError } = await supabase
      .from('batch_records')
      .select('*')
      .eq('batch_number', batchNumber)
      .single();
    
    if (!bmrError && bmrData) {
      result.bmrData = bmrData;
    }

    console.log(`[TraceService] Completed. Found: ${result.ipqcChecks.length} IPQC, ${result.testResults.length} QC tests.`);
    return result;

  } catch (err: any) {
    console.error('[TraceService] Critical Failure:', err);
    return { ...result, error: err.message };
  }
}
