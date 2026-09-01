# PharmaQMS Enterprise — Data Retention Policy

| Field | Value |
|---|---|
| Document ID | PQMS-RET-001 |
| Version | 1.0 |
| Date | 2026-08-31 |
| Author | Dr. Daoud Tajeldeinn |
| System | PharmaQMS Enterprise v4.3.3 |
| Classification | Controlled Document |

---

## 1. Purpose

This policy defines data retention schedules for all record classes managed by PharmaQMS Enterprise, in compliance with FDA 21 CFR Part 11, EU GMP Annex 11, and applicable local regulations.

---

## 2. Scope

All electronic records created, modified, or deleted within PharmaQMS Enterprise including QMS records, audit trails, training records, and system logs.

---

## 3. Retention Schedule by Record Class

| Record Class | Module | Minimum Retention | Regulatory Basis | Archive Method |
|---|---|---|---|---|
| CAPA Records | CAPA | 5 years after closure | 21 CFR 820.198 | Supabase + annual export |
| Deviation Records | Deviations | 5 years after closure | EU GMP Annex 11 | Supabase + annual export |
| Batch Records (BMR/MFR) | BMR/MFR Manager | Product lifetime + 1 year | 21 CFR 211.188 | Supabase + annual export |
| Audit Trail (user_activity_logs) | System | 5 years | 21 CFR 11.10(e) | Supabase (append-only, never deleted) |
| Training Records | Training | Employment + 3 years | 21 CFR 211.68 | Supabase + annual export |
| Equipment Records | Equipment | Equipment lifetime + 5 years | EU GMP Annex 11 | Supabase + annual export |
| Stability Protocols | Stability | Product lifetime + 2 years | ICH Q1A | Supabase + annual export |
| OOS/OOT Results | Laboratory | 5 years | 21 CFR 211.192 | Supabase + annual export |
| Supplier Records | Suppliers | 5 years after last transaction | EU GMP Chapter 5 | Supabase + annual export |
| Market Complaints | Market Complaints | 5 years | 21 CFR 211.198 | Supabase + annual export |
| Recall Records | Recalls | 5 years after closure | 21 CFR 7.59 | Supabase + annual export |
| Audit Records | Audits | 5 years | EU GMP Chapter 9 | Supabase + annual export |
| COA Records | COA Manager | Batch lifetime + 5 years | 21 CFR 211.184 | Supabase + annual export |
| IPQC Results | IPQC | Batch lifetime + 5 years | EU GMP Annex 11 | Supabase + annual export |
| Deleted Records (tombstones) | System | Permanent | ALCOA+ | Supabase (never purged) |
| System Logs | System | 3 years | EU GMP Annex 11 | Supabase + annual export |

---

## 4. Audit Trail Retention

The `user_activity_logs` table is subject to special retention rules:

- **Retention period:** Minimum 5 years from record creation
- **Deletion:** Never — protected by `prevent_audit_mutation()` and `audit_immutable` database triggers
- **Archival:** Annual SQL export to secure offline storage
- **Verification:** Quarterly hash-chain integrity check

---

## 5. Soft-Delete and Archival Policy

- All records are soft-deleted (`is_deleted = true`) — never hard-deleted
- Tombstones in `deletedRecords` table are permanent
- Records past their retention period are **archived** (exported + flagged) not purged
- Only IT Admin can perform archival actions, with audit trail entry required

---

## 6. Annual Export Procedure

Performed every 12 months by IT Admin:

1. Go to **Supabase Dashboard → Database → Backups**
2. Download full database export
3. Store encrypted copy in secure offline location
4. Log export action in QMS change control record
5. QA Admin verifies export integrity and signs off

---

## 7. Retention Enforcement

| Mechanism | Status |
|---|---|
| Soft-delete only — no hard deletes | ✅ Implemented |
| Audit trail immutability triggers | ✅ Implemented |
| Tombstone permanent records | ✅ Implemented |
| Automated retention expiry alerts | ⏳ Planned (next development cycle) |
| Automated archival workflow | ⏳ Planned (next development cycle) |

---

## 8. Related Documents

| Document | ID |
|---|---|
| Validation Gap Analysis | PQMS-VAL-001 |
| Validation Protocol (IQ/OQ/PQ) | PQMS-VAL-002 |
| Security & Access Control Model | PQMS-SEC-001 |
| Disaster Recovery Runbook | PQMS-DR-001 |

---

## 9. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| System Owner | Dr. Daoud Tajeldeinn | | |
| Quality Assurance | | | |
| IT / Validation | | | |
