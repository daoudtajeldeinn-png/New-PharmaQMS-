import { db } from '@/db/db';
import { supabase } from '@/lib/supabase';

/**
 * AuditLogService.ts
 * 21 CFR Part 11 / EU GMP Annex 11 Compliant Audit Trail
 * - Append-only cloud writes (INSERT, never UPSERT)
 * - Fail-closed: if cloud audit write fails, business action is BLOCKED
 * - Hash-chaining for tamper detection
 */
export class AuditLogService {
  private static configuredIp: string =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_REPORTED_IP) || 'client-side';

  private static lastKnownHash: string | null = null;

  private static async getPreviousHash(): Promise<string | null> {
    if (this.lastKnownHash) return this.lastKnownHash;
    try {
      const { data } = await supabase
        .from('user_activity_logs')
        .select('entry_hash')
        .order('timestamp', { ascending: false })
        .limit(1);
      const latest = data && data[0] ? data[0].entry_hash : null;
      if (latest) this.lastKnownHash = latest;
      return latest;
    } catch (err) {
      console.warn('AuditLogService: Could not fetch previous hash:', err);
      return this.lastKnownHash;
    }
  }

  private static async sha256(input: string): Promise<string> {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      console.warn('AuditLogService: WebCrypto unavailable, using dev fallback');
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
      }
      return `dev-${Math.abs(hash).toString(16)}`;
    }
  }

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
  ): Promise<void> {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const previousHash = await this.getPreviousHash();

    const contentPayload = {
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
      timestamp,
    };

    const entryHash = await this.sha256(JSON.stringify(contentPayload) + (previousHash || ''));

    const logEntry = {
      ...contentPayload,
      ip_address: this.configuredIp,
      device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'NodeJS',
      entry_hash: entryHash,
      previous_hash: previousHash,
    };

    // 1) Local Dexie (best-effort cache)
    try {
      const activityMap: Record<string, string> = {
        CREATE: 'Product_Created',
        UPDATE: 'Product_Updated',
        DELETE: 'Product_Deleted',
        RECOVER: 'Product_Recovered',
        HARD_DELETE: 'Product_Hard_Deleted',
      };

      const localActivity = {
        ...logEntry,
        id,
        type: activityMap[actionType] || 'Product_Updated',
        description: `[${actionType}] ${tableName} (ID: ${recordId}) - ${recordDescription} ${reason ? `Reason: ${reason}` : ''}`,
        user: `${userName} (${userRole})`,
        timestamp: new Date(timestamp),
        relatedId: recordId,
      };
      await db.activities.put(localActivity as any);
    } catch (err) {
      console.warn('AuditLogService: Failed to write to local activities:', err);
    }

    // 2) Supabase - APPEND-ONLY (INSERT, never UPSERT)
    const { error } = await supabase.from('user_activity_logs').insert(logEntry);

    if (error) {
      console.error('AUDIT WRITE FAILED - BLOCKING ACTION', error);
      throw new Error(
        `Audit trail write failed. Action blocked for 21 CFR Part 11 compliance. (${error.message})`
      );
    }

    this.lastKnownHash = entryHash;
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
    console.warn(`[AuditLogService]  HARD_DELETE on ${tableName}:${recordId} - violates ALCOA+ if QMS record`);
    await this.writeLog(userId, userName, userRole, 'HARD_DELETE', tableName, recordId, recordDescription, null, null, reason);
  }
}
