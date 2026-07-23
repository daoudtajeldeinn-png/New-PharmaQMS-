import { db } from '@/db/db';
import { supabase } from '@/lib/supabase';
import { AuditLogService } from './AuditLogService';
import { recordDeletion, recoverRecord } from './DeletedRecordsService';

export class SoftDeleteService {
  /**
   * Performs a soft delete on a local Dexie record and upserts the state to Supabase.
   */
  static async softDelete(
    tableName: string,
    recordId: string,
    userId: string,
    userName: string,
    userRole: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const table = (db as any)[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in local DB.`);

      // 1. Fetch old record for audit logging snapshot
      const oldRecord = await table.get(recordId);
      if (!oldRecord) throw new Error(`Record with ID ${recordId} not found in ${tableName}.`);

      const recordLabel = oldRecord.name || oldRecord.title || oldRecord.coaNumber || oldRecord.batchNumber || recordId;

      // 2. Log deletion to audit service
      await AuditLogService.logDelete(userId, userName, userRole, tableName, recordId, recordLabel, oldRecord, reason);

      // 3. Mark soft-deleted fields
      const updatedRecord = {
        ...oldRecord,
        deleted_at: new Date().toISOString(),
        deleted_by: userName,
        deletion_reason: reason
      };

      // 4. Update Dexie
      await table.put(updatedRecord);

      // 5. Update Supabase - delete from main table to propagate globally and prevent resurrection
      try {
        await supabase
          .from(tableName)
          .delete()
          .eq('id', recordId);
      } catch (cloudErr) {
        console.warn('SoftDeleteService: Supabase delete failed:', cloudErr);
      }

      // 6. Record tombstone to prevent sync issues
      await recordDeletion(tableName, recordId, userName, oldRecord, reason);

      return { success: true };
    } catch (err: any) {
      console.error('SoftDeleteService: softDelete failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Recovers a soft-deleted record, clearing its tombstone status and soft-delete attributes.
   */
  static async recover(
    tableName: string,
    recordId: string,
    userId: string,
    userName: string,
    userRole: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const table = (db as any)[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in local DB.`);

      // 1. Mark tombstone as recovered
      const tombstone = await recoverRecord(tableName, recordId, userName);
      
      // 2. Retrieve snapshot for recovery
      let recordToRestore = await table.get(recordId);
      if (!recordToRestore && tombstone && tombstone.snapshot) {
        recordToRestore = tombstone.snapshot;
      }

      if (!recordToRestore) {
        throw new Error(`Record ${recordId} could not be retrieved from DB or snapshot.`);
      }

      // 3. Clear soft delete fields
      const restoredRecord = {
        ...recordToRestore,
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null
      };

      // 4. Update Dexie
      await table.put(restoredRecord);

      // 5. Update Supabase
      try {
        await supabase
          .from(tableName)
          .upsert(restoredRecord);
      } catch (cloudErr) {
        console.warn('SoftDeleteService: Supabase recovery update failed:', cloudErr);
      }

      // 6. Audit log the recovery
      const recordLabel = restoredRecord.name || restoredRecord.title || restoredRecord.coaNumber || restoredRecord.batchNumber || recordId;
      await AuditLogService.logRecover(userId, userName, userRole, tableName, recordId, recordLabel, reason);

      return { success: true };
    } catch (err: any) {
      console.error('SoftDeleteService: recover failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Permanently deletes a record from local Dexie and Supabase (Admin only).
   */
  static async hardDelete(
    tableName: string,
    recordId: string,
    userId: string,
    userName: string,
    userRole: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const table = (db as any)[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in local DB.`);

      const oldRecord = await table.get(recordId);
      const recordLabel = oldRecord ? (oldRecord.name || oldRecord.title || oldRecord.coaNumber || oldRecord.batchNumber) : recordId;

      // 1. Write Hard Delete Audit Log
      await AuditLogService.logHardDelete(userId, userName, userRole, tableName, recordId, recordLabel, reason);

      // 2. Delete from Dexie
      await table.delete(recordId);

      // 3. Delete from Supabase
      try {
        await supabase
          .from(tableName)
          .delete()
          .eq('id', recordId);
      } catch (cloudErr) {
        console.warn('SoftDeleteService: Supabase hard-delete failed:', cloudErr);
      }

      // 4. Purge tombstone
      try {
        const { purgeTombstone } = await import('./DeletedRecordsService');
        await purgeTombstone(tableName, recordId);
      } catch (tombErr) {
        console.warn('SoftDeleteService: failed to purge tombstone:', tombErr);
      }

      return { success: true };
    } catch (err: any) {
      console.error('SoftDeleteService: hardDelete failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Gets all soft-deleted records across all tables, or for a specific table.
   */
  static async getDeletedRecords(tableName?: string): Promise<any[]> {
    const deletedList: any[] = [];
    const tablesToQuery = tableName ? [tableName] : Object.keys(db).filter(k => k !== 'keyValueStore');

    for (const tName of tablesToQuery) {
      const table = (db as any)[tName];
      if (table && typeof table.toArray === 'function') {
        try {
          const records = await table.toArray();
          const softDeleted = records.filter((r: any) => r && r.deleted_at);
          softDeleted.forEach((r: any) => {
            deletedList.push({
              ...r,
              __tableName: tName // attach metadata for recovery UI
            });
          });
        } catch (err) {
          console.warn(`SoftDeleteService: Failed to read soft deleted records from ${tName}:`, err);
        }
      }
    }

    return deletedList.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
  }
}
