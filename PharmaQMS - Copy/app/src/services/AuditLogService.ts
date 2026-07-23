import { db } from '@/db/db';
import { supabase } from '@/lib/supabase';

export class AuditLogService {
  private static async writeLog(
    userId: string,
    userName: string,
    userRole: string,
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'RECOVER' | 'HARD_DELETE',
    tableName: string,
    recordId: string,
    recordDescription: string,
    oldValues: any = null,
    newValues: any = null,
    reason: string = ''
  ) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const logEntry = {
      id,
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action_type: actionType,
      table_name: tableName,
      record_id: recordId,
      record_description: recordDescription,
      old_values: oldValues || null,
      new_values: newValues || null,
      reason: reason || null,
      ip_address: '127.0.0.1',
      device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'NodeJS',
      timestamp
    };

    // 1. Write to local Dexie `activities`
    try {
      const activityMap: Record<string, string> = {
        CREATE: 'Product_Created',
        UPDATE: 'Product_Updated',
        DELETE: 'Product_Updated',
        RECOVER: 'Product_Created',
        HARD_DELETE: 'Product_Updated'
      };

      const localActivity = {
        id,
        type: activityMap[actionType] || 'Product_Updated',
        description: `[${actionType}] ${tableName} (ID: ${recordId}) - ${recordDescription} ${reason ? `Reason: ${reason}` : ''}`,
        user: `${userName} (${userRole})`,
        timestamp: new Date(timestamp),
        relatedId: recordId,
        // Include full metadata
        ...logEntry
      };
      await db.activities.put(localActivity as any);
    } catch (err) {
      console.warn('AuditLogService: Failed to write to local activities:', err);
    }

    // 2. Write to Supabase table `user_activity_logs`
    try {
      await supabase.from('user_activity_logs').upsert(logEntry, { onConflict: 'id' });
    } catch (err) {
      console.warn('AuditLogService: Failed to write to Supabase user_activity_logs:', err);
    }
  }

  static async logCreate(userId: string, userName: string, userRole: string, tableName: string, recordId: string, recordDescription: string, newValues: any) {
    await this.writeLog(userId, userName, userRole, 'CREATE', tableName, recordId, recordDescription, null, newValues);
  }

  static async logUpdate(userId: string, userName: string, userRole: string, tableName: string, recordId: string, recordDescription: string, oldValues: any, newValues: any) {
    await this.writeLog(userId, userName, userRole, 'UPDATE', tableName, recordId, recordDescription, oldValues, newValues);
  }

  static async logDelete(userId: string, userName: string, userRole: string, tableName: string, recordId: string, recordDescription: string, oldValues: any, reason: string) {
    await this.writeLog(userId, userName, userRole, 'DELETE', tableName, recordId, recordDescription, oldValues, null, reason);
  }

  static async logRecover(userId: string, userName: string, userRole: string, tableName: string, recordId: string, recordDescription: string, reason: string) {
    await this.writeLog(userId, userName, userRole, 'RECOVER', tableName, recordId, recordDescription, null, null, reason);
  }

  static async logHardDelete(userId: string, userName: string, userRole: string, tableName: string, recordId: string, recordDescription: string, reason: string) {
    await this.writeLog(userId, userName, userRole, 'HARD_DELETE', tableName, recordId, recordDescription, null, null, reason);
  }
}
