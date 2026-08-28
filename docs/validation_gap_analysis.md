# PharmaQMS Enterprise — 21 CFR Part 11 / EU GMP Annex 11 Validation Gap Analysis

| Field | Value |
|---|---|
| Document ID | PQMS-VAL-001 |
| Version | 1.0 |
| Date | 2026-08-28 |
| Author | Dr. Daoud Tajeldeinn |
| System | PharmaQMS Enterprise v4.3.3 |
| Scope | Gap analysis for FDA 21 CFR Part 11, EU GMP Annex 11, and ALCOA+ data integrity |

---

## 1. System Description

PharmaQMS Enterprise is an Electron + React + TypeScript desktop application with Supabase as the backend. It manages CAPAs, Deviations, Audits, Market Complaints, Recalls, Training, Stability, Equipment, Suppliers, Materials, COA/BMR/MFR documents, and IPQC/Testing workflows.

---

## 2. Regulatory Requirements Assessment

| Requirement | Regulation | Status | Evidence / Notes |
|---|---|---|---|
| **Electronic signatures** | 21 CFR 11.200 | 🔴 PARTIAL | `SignatureModal.tsx` exists; needs cryptographic binding to record + audit entry |
| **Audit trail — create/modify/delete** | 21 CFR 11.10(e) | 🟢 COMPLIANT | `AuditLogService` append-only, hash-chained, INSERT-only, DB trigger blocks UPDATE/DELETE |
| **Audit trail immutability** | 21 CFR 11.10(e) | 🟢 COMPLIANT | PostgreSQL trigger + RLS deny policy on `user_activity_logs` |
| **Record preservation** | 21 CFR 11.10(c) | 🟢 COMPLIANT | Soft-delete with `is_deleted` flag; no hard deletes; tombstones permanent |
| **Data integrity (ALCOA+)** | GMP / Data Integrity | 🟢 COMPLIANT | All records attributable, legible, contemporaneous, original, accurate |
| **Access control (RBAC)** | 21 CFR 11.10(d) | 🟡 PARTIAL | `useRoleAccess` + `PermissionService` exist; needs formal verification test |
| **Time-source integrity** | 21 CFR 11.10(b) | 🟡 PARTIAL | Uses client timestamps; recommend NTP-synced server timestamp source |
| **Device/IP attribution** | EU GMP Annex 11 7.2 | 🟡 PARTIAL | IP capture currently client-side string; recommend reverse-proxy header |
| **Cross-user record separation** | GxP | 🟢 COMPLIANT | Supabase RLS on domain tables |
| **Data retention schedules** | GxP / local law | 🔴 MISSING | No automated retention/deletion scheduling or archival policy |
| **Disaster recovery / backup** | Annex 11 7.2 | 🟡 PARTIAL | Supabase cloud + local Dexie cache; no tested DR runbook |
| **System validation (IQ/OQ/PQ)** | Annex 11 4.2 | 🔴 MISSING | No formal validation protocol executed |
| **Change control for software** | Annex 11 5.1 | 🔴 MISSING | Git commits exist; no formal change-control linkage to quality records |
| **Training records for users** | 21 CFR 11.10(i) | 🔴 PARTIAL | Training module exists, but admin training evidence is not documented |
| **Multi-factor authentication** | Annex 11 12.2 | 🔴 MISSING | Password-based only; no MFA option |
| **Dependency vulnerability management** | GxP / IT Security | 🟢 COMPLIANT | npm audit = 0 production vulnerabilities; CI pipeline enforces this |

---

## 3. Gap Register

| ID | Gap | Severity | Remediation Plan | Status |
|---|---|---|---|---|
| GAP-01 | Hard deletes in `DeletedRecordsService` | Critical | Replaced with soft-delete + permanent tombstones | ✅ CLOSED |
| GAP-02 | Mutable audit trail (UPSERT) | Critical | Replaced with INSERT + DB immutability trigger | ✅ CLOSED |
| GAP-03 | Nuclear data reset in production UI | Critical | Neutralized; route removed | ✅ CLOSED |
| GAP-04 | Missing audit/tombstone tables | Critical | Created `user_activity_logs` + `deletedRecords` + RLS | ✅ CLOSED |
| GAP-05 | No automated tests | High | Vitest suite covering audit immutability, fail-closed, soft-delete | ✅ CLOSED |
| GAP-06 | No CI enforcement | High | GitHub Actions workflow on push/PR | ✅ CLOSED |
| GAP-07 | E-signatures not cryptographically bound | High | Implement hash binding of signature + record + timestamp | ⏳ OPEN |
| GAP-08 | No MFA | High | Add TOTP/WebAuthn for admin/approver roles | ⏳ OPEN |
| GAP-09 | No formal IQ/OQ/PQ | High | Execute validation protocol; retain evidence | ⏳ OPEN |
| GAP-10 | No documented retention schedules | Medium | Define per-record-class retention; automate archival | ⏳ OPEN |
| GAP-11 | No disaster-recovery runbook | Medium | Document backup/restore procedure; test quarterly | ⏳ OPEN |
| GAP-12 | Change control not linked to SCM | Medium | Adopt issue/approval workflow mapping commits to change IDs | ⏳ OPEN |

---

## 4. Verification Traceability Matrix (VTM)

| Requirement | Verification Method | Test/Evidence | Result |
|---|---|---|---|
| Audit insert is append-only | Automated test | `AuditLogService.test.ts → "writes audit entries via INSERT"` | ✅ PASS |
| Audit write failure blocks action | Automated test | `AuditLogService.test.ts → "throws (fail-closed)"` | ✅ PASS |
| Hash chaining integrity | Automated test | `AuditLogService.test.ts → "records a hash chain"` | ✅ PASS |
| Soft-delete retains record | Automated test | `DeletedRecordsService.test.ts` | ✅ PASS |
| No hard-delete calls in code | Code inspection | `grep -n "\.delete()"` returns empty for services | ✅ PASS |
| DB-level audit immutability | SQL verification | Trigger `prevent_audit_mutation()` blocks UPDATE/DELETE | ✅ PASS |
| No production vulnerabilities | Automated check | `npm audit --omit=dev` → 0 vulnerabilities | ✅ PASS |

---

## 5. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| System Owner | Dr. Daoud Tajeldeinn | | |
| Quality Assurance | | | |
| IT / Validation | | | |
