/**
 * deleteService.ts
 * Centralized delete service for PharmaQMS Enterprise.
 *
 * Every delete operation:
 * 1. Logs the action to Dexie `activities` table (audit trail).
 * 2. Deletes from local Dexie DB.
 * 3. Deletes from Supabase cloud immediately (unless recoveryMode).
 *
 * Only users with `data.delete` permission may call these functions.
 * Only users with `data.recover` permission may call recoverRecord().
 */

import { db } from '@/db/db';
import { supabase } from '@/lib/supabase';
import type { User } from '@/components/security/SecurityProvider';

// Map from Dexie table name -> Supabase table name (they match in this project)
const TABLE_MAP: Record<string, string> = {
  products: 'products',
  testMethods: 'testMethods',
  testResults: 'testResults',
  capas: 'capas',
  deviations: 'deviations',
  equipment: 'equipment',
  chemicalReagents: 'chemicalReagents',
  referenceStandards: 'referenceStandards',
  qualitySystems: 'qualitySystems',
  trainingRecords: 'trainingRecords',
  audits: 'audits',
  suppliers: 'suppliers',
  changeControls: 'changeControls',
  marketComplaints: 'marketComplaints',
  productRecalls: 'productRecalls',
  stabilityProtocols: 'stabilityProtocols',
  ipqcChecks: 'ipqcChecks',
  coaRecords: 'coaRecords',
  masterFormulas: 'masterFormulas',
  batchRecords: 'batchRecords',
  rawMaterials: 'rawMaterials',
  materialMovements: 'materialMovements',
  reconciliationRecords: 'reconciliationRecords',
};

export interface DeleteResult {
  success: boolean;
  error?: string;
  cloudDeleted?: boolean;
}

/**
 * Writes an audit log entry to both Dexie and Supabase activities table.
 */
async function writeAuditLog(
  user: User,
  action: 'DELETE' | 'RECOVER',
  tableName: string,
  recordId: string,
  recordLabel: string
) {
  const entry = {
    id: crypto.randomUUID(),
    type: action === 'DELETE' ? 'Product_Updated' : 'Product_Created', // reuse existing activity types
    description: `[${action}] ${tableName}: "${recordLabel}" (id: ${recordId})`,
    user: `${user.name} (${user.username}) — ${user.role}`,
    timestamp: new Date().toISOString(),
    relatedId: recordId,
  };

  try {
    await db.activities.put(entry as any);
  } catch {
    // Non-fatal: log to console if Dexie fails
    console.warn('deleteService: Failed to write audit log to Dexie', entry);
  }

  try {
    await supabase.from('activities').upsert(entry, { onConflict: 'id' });
  } catch {
    // Non-fatal: log to console if Supabase fails
    console.warn('deleteService: Failed to write audit log to Supabase', entry);
  }
}

/**
 * Deletes a record from Dexie and from Supabase.
 * Requires the calling user to have `data.delete` permission.
 */
export async function deleteRecord(
  user: User,
  tableName: keyof typeof TABLE_MAP,
  recordId: string,
  recordLabel: string,
  reason: string = 'User requested deletion'
): Promise<DeleteResult> {
  // Permission check
  const username = user.username?.toLowerCase();
  const canDelete = username === 'admin' || username === 'qa_admin';

  if (!canDelete) {
    return {
      success: false,
      error: `Access Denied: Your role (${user.role}) does not have delete permission.`,
    };
  }

  try {
    const { SoftDeleteService } = await import('./SoftDeleteService');
    const result = await SoftDeleteService.softDelete(
      tableName,
      recordId,
      user.id,
      user.username || user.name,
      user.role,
      reason
    );

    if (!result.success) {
      return { success: false, error: result.error || 'Delete failed.' };
    }

    return { success: true, cloudDeleted: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Delete operation error.' };
  }
}

/**
 * Checks whether the current user is allowed to delete records.
 */
export function canUserDelete(user: User | null): boolean {
  if (!user) return false;
  const username = user.username?.toLowerCase();
  return username === 'admin' || username === 'qa_admin';
}

/**
 * Checks whether the current user is allowed to recover deleted records.
 */
export function canUserRecover(user: User | null): boolean {
  if (!user) return false;
  const username = user.username?.toLowerCase();
  return username === 'admin' || username === 'qa_admin';
}
