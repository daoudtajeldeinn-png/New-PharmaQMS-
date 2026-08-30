# PharmaQMS Enterprise — Disaster Recovery Runbook

| Field | Value |
|---|---|
| Document ID | PQMS-DR-001 |
| Version | 1.0 |
| Date | 2026-08-30 |
| Author | Dr. Daoud Tajeldeinn |
| System | PharmaQMS Enterprise v4.3.3 |
| Classification | Controlled Document |

---

## 1. Purpose

This runbook defines the procedures for backup, restore, and disaster recovery of PharmaQMS Enterprise to ensure business continuity and compliance with EU GMP Annex 11 §7.2 and ALCOA+ data integrity requirements.

---

## 2. Scope

- Supabase cloud database (all QMS records)
- Local Dexie/IndexedDB cache (desktop client)
- Application configuration and environment

---

## 3. Roles & Responsibilities

| Role | Responsibility |
|---|---|
| IT Admin | Execute backup/restore procedures; maintain runbook |
| QA Admin | Verify data integrity after restore; approve recovery |
| System Owner | Authorize recovery actions; sign off on DR test results |

---

## 4. Backup Procedures

### 4.1 Supabase Automated Backups
- Supabase Pro/Enterprise plans include **daily automated backups**
- Retention: 7 days (Pro), 30 days (Enterprise)
- Location: Supabase Dashboard → Project → Database → Backups

### 4.2 Manual Database Export
Run monthly or before any major system change:

1. Go to **Supabase Dashboard → Project → Database → Backups**
2. Click **"Download"** on the latest backup
3. Store the `.sql` dump in a secure, access-controlled location
4. Log the backup action in the QMS change control record

### 4.3 Critical Tables to Verify in Backup
- `user_activity_logs` — audit trail (append-only, must be intact)
- `deletedRecords` — tombstone records
- All QMS domain tables (CAPAs, Deviations, Training, etc.)

---

## 5. Recovery Procedures

### 5.1 Partial Data Recovery (single record/table)
1. Identify the affected record ID from `user_activity_logs`
2. Locate the last known good state in `old_values` / `new_values` audit fields
3. IT Admin restores the record value manually via Supabase SQL Editor
4. QA Admin verifies the restored record against source documents
5. Log recovery action in `user_activity_logs` with action type `RECOVER`

### 5.2 Full Database Restore
1. IT Admin downloads the target backup from Supabase Dashboard
2. Create a new Supabase project or use point-in-time restore (Enterprise)
3. Run the `.sql` dump against the target project via SQL Editor
4. Re-apply all migration files in order:
   - `supabase_audit_datagovernance_part11_v4_3_0.sql`
   - `supabase_deleted_records_migration.sql`
   - `supabase_schema_fix_v*.sql` (in version order)
5. Verify triggers are active (run trigger verification query)
6. Update `.env` with new Supabase project URL and anon key
7. QA Admin performs OQ smoke tests per `PQMS-VAL-002`
8. System Owner signs off on recovery completion

### 5.3 Trigger Verification After Restore
Run in Supabase SQL Editor to confirm immutability triggers are active:

```sql
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'user_activity_logs'
ORDER BY trigger_name;
```

Expected result: `audit_immutable` and `trg_prevent_audit_mutation` both present for UPDATE and DELETE.

---

## 6. Recovery Time Objectives

| Scenario | RTO | RPO |
|---|---|---|
| Single record recovery | 2 hours | Last audit entry |
| Full DB restore (Pro plan) | 4 hours | 24 hours (daily backup) |
| Full DB restore (Enterprise) | 2 hours | 1 hour (PITR) |

---

## 7. DR Test Schedule

| Activity | Frequency | Responsible | Evidence |
|---|---|---|---|
| Verify backup exists and is downloadable | Monthly | IT Admin | Screenshot of backup list |
| Restore test to staging environment | Quarterly | IT Admin | Restore log + QA sign-off |
| Full DR simulation | Annually | IT Admin + QA Admin | DR test report |

---

## 8. Contact List

| Role | Name | Contact |
|---|---|---|
| System Owner | Dr. Daoud Tajeldeinn | daoudtajeldeinn@gmail.com |
| Supabase Support | — | https://supabase.com/support |

---

## 9. Related Documents

| Document | ID |
|---|---|
| Validation Gap Analysis | PQMS-VAL-001 |
| Validation Protocol (IQ/OQ/PQ) | PQMS-VAL-002 |
| Security & Access Control Model | PQMS-SEC-001 |

---

## 10. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| System Owner | Dr. Daoud Tajeldeinn | | |
| Quality Assurance | | | |
| IT / Validation | | | |
