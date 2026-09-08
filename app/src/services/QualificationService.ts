import { db } from '@/db/db';
import { supabase } from '@/lib/supabase';
import { AuditLogService } from './AuditLogService';
import type {
  EquipmentQualification,
  OverallQualificationStatus,
  QualificationPhase,
} from '@/types';

export class QualificationService {
  /**
   * Determine overall qualification status based on qualification records for an equipment.
   * Logic according to EU GMP Annex 15 & 21 CFR 211.68:
   * - Any phase failed -> 'Qualification Failed'
   * - Requalification overdue -> 'Requalification Required'
   * - All 4 phases ('DQ', 'IQ', 'OQ', 'PQ') passed -> 'Fully Qualified'
   * - Some phases passed -> 'Partially Qualified'
   * - No phases completed -> 'Not Qualified'
   */
  public static calculateOverallStatus(
    qualifications: EquipmentQualification[]
  ): OverallQualificationStatus {
    const activeQuals = qualifications.filter(q => !q.is_deleted);
    if (activeQuals.length === 0) return 'Not Qualified';

    // 1. Any phase failed
    const hasFailed = activeQuals.some(q => q.result === 'Fail');
    if (hasFailed) return 'Qualification Failed';

    // 2. Check for overdue requalification on any phase
    const now = new Date();
    const isOverdue = activeQuals.some(q => {
      const nextDateStr = q.next_requalification_date || q.nextRequalificationDate;
      if (!nextDateStr) return false;
      const nextDate = new Date(nextDateStr);
      return !isNaN(nextDate.getTime()) && nextDate < now;
    });
    if (isOverdue) return 'Requalification Required';

    // 3. Check passed phases
    const requiredPhases: QualificationPhase[] = ['DQ', 'IQ', 'OQ', 'PQ'];
    const passedPhases = new Set(
      activeQuals.filter(q => q.result === 'Pass').map(q => q.phase)
    );

    const allPassed = requiredPhases.every(phase => passedPhases.has(phase));
    if (allPassed) return 'Fully Qualified';

    if (passedPhases.size > 0) return 'Partially Qualified';

    return 'Not Qualified';
  }

  /**
   * Calculate requalification alerts (overdue or due within 30 days)
   */
  public static getRequalificationAlerts(qualifications: EquipmentQualification[]): {
    isOverdue: boolean;
    isDueSoon: boolean;
    daysRemaining: number | null;
    nextDate: Date | null;
  } {
    const activeQuals = qualifications.filter(q => !q.is_deleted);
    let earliestDate: Date | null = null;

    for (const q of activeQuals) {
      const dateVal = q.next_requalification_date || q.nextRequalificationDate;
      if (dateVal) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          if (!earliestDate || d < earliestDate) {
            earliestDate = d;
          }
        }
      }
    }

    if (!earliestDate) {
      return { isOverdue: false, isDueSoon: false, daysRemaining: null, nextDate: null };
    }

    const now = new Date();
    const diffMs = earliestDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      isOverdue: daysRemaining < 0,
      isDueSoon: daysRemaining >= 0 && daysRemaining <= 30,
      daysRemaining,
      nextDate: earliestDate,
    };
  }

  /**
   * Fetch all qualification records for a specific equipment
   */
  public static async getQualificationsForEquipment(
    equipmentId: string
  ): Promise<EquipmentQualification[]> {
    try {
      // 1. Fetch from Dexie
      const local = await db.equipmentQualifications
        .filter(q => (q.equipment_id === equipmentId || q.equipmentId === equipmentId) && !q.is_deleted)
        .toArray();

      if (local && local.length > 0) return local;

      // 2. Fetch from Supabase fallback
      const { data, error } = await supabase
        .from('equipmentQualifications')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('is_deleted', false);

      if (!error && data && data.length > 0) {
        // Cache to local Dexie
        await db.equipmentQualifications.bulkPut(data);
        return data as EquipmentQualification[];
      }

      return local || [];
    } catch (err) {
      console.error('QualificationService: Failed to fetch qualifications:', err);
      return [];
    }
  }

  /**
   * Fetch all active qualification records
   */
  public static async getAllQualifications(): Promise<EquipmentQualification[]> {
    try {
      return await db.equipmentQualifications.filter(q => !q.is_deleted).toArray();
    } catch (err) {
      console.error('QualificationService: Failed to fetch all qualifications:', err);
      return [];
    }
  }

  /**
   * Save or update a qualification record (Dexie + Supabase + Audit Trail)
   */
  /** Validate UUID format — Supabase uuid columns reject short IDs */
  private static isValidUUID(s: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
  }

  public static async saveQualification(
    qualification: EquipmentQualification,
    user?: { id: string; name: string; role: string }
  ): Promise<EquipmentQualification> {
    const isNew = !qualification.id;
    // Always ensure a proper UUID so Supabase uuid columns accept it
    const id = (qualification.id && this.isValidUUID(qualification.id))
      ? qualification.id
      : crypto.randomUUID();
    const now = new Date().toISOString();

    const record: EquipmentQualification = {
      ...qualification,
      id,
      equipment_id: qualification.equipment_id || qualification.equipmentId,
      equipmentId: qualification.equipmentId || qualification.equipment_id,
      protocol_number: qualification.protocol_number || qualification.protocolNumber,
      protocolNumber: qualification.protocolNumber || qualification.protocol_number,
      qualification_date: qualification.qualification_date || qualification.qualificationDate || now,
      qualificationDate: qualification.qualificationDate || qualification.qualification_date || now,
      performed_by: qualification.performed_by || qualification.performedBy,
      performedBy: qualification.performedBy || qualification.performed_by,
      approved_by: qualification.approved_by || qualification.approvedBy,
      approvedBy: qualification.approvedBy || qualification.approved_by,
      next_requalification_date: qualification.next_requalification_date || qualification.nextRequalificationDate,
      nextRequalificationDate: qualification.nextRequalificationDate || qualification.next_requalification_date,
      is_deleted: false,
      created_at: qualification.created_at || now,
      updated_at: now,
    };

    // 1. Save to local Dexie
    await db.equipmentQualifications.put(record);

    // 2. Save to Supabase (async, non-blocking)
    supabase
      .from('equipmentQualifications')
      .upsert({
        id: record.id,
        equipment_id: record.equipment_id,
        phase: record.phase,
        protocol_number: record.protocol_number,
        qualification_date: record.qualification_date,
        performed_by: record.performed_by,
        approved_by: record.approved_by,
        result: record.result,
        next_requalification_date: record.next_requalification_date,
        notes: record.notes,
        is_deleted: false,
        updated_at: now,
      })
      .then(({ error }) => {
        if (error) console.warn('QualificationService: Supabase upsert error:', error.message);
      });

    // 3. Log Audit Trail (non-blocking: audit failure must not prevent qualification save)
    if (user) {
      const desc = `Equipment Qualification: ${record.phase} for Equipment ${record.equipment_id} - Result: ${record.result}`;
      try {
        if (isNew) {
          await AuditLogService.logCreate(
            user.id,
            user.name,
            user.role,
            'equipmentQualifications',
            record.id,
            desc,
            record
          );
        } else {
          await AuditLogService.logUpdate(
            user.id,
            user.name,
            user.role,
            'equipmentQualifications',
            record.id,
            desc,
            null,
            record
          );
        }
      } catch (auditErr: any) {
        // Log but do not re-throw — qualification record is already saved locally.
        // This will self-resolve once supabase_schema_fix_v9.sql is applied
        // (which opens the user_activity_logs INSERT policy to the anon role).
        console.warn('QualificationService: Audit trail write skipped (non-blocking):', auditErr?.message || auditErr);
      }
    }

    return record;
  }

  /**
   * Soft delete a qualification record
   */
  public static async deleteQualification(
    id: string,
    user?: { id: string; name: string; role: string }
  ): Promise<void> {
    const existing = await db.equipmentQualifications.get(id);
    if (!existing) return;

    const updated = { ...existing, is_deleted: true, updated_at: new Date().toISOString() };
    await db.equipmentQualifications.put(updated);

    // Update in Supabase
    supabase
      .from('equipmentQualifications')
      .update({ is_deleted: true, updated_at: updated.updated_at })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('QualificationService: Supabase delete error:', error.message);
      });

    // Audit log
    if (user) {
      await AuditLogService.logDelete(
        user.id,
        user.name,
        user.role,
        'equipmentQualifications',
        id,
        `Deleted ${existing.phase} qualification for equipment ${existing.equipment_id}`,
        existing,
        'User requested qualification deletion'
      );
    }
  }
}
