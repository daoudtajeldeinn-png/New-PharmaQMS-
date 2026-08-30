# PharmaQMS Enterprise — 21 CFR Part 11 / EU GMP Annex 11 Validation Gap Analysis

| Field | Value |
|---|---|
| Document ID | PQMS-VAL-001 |
| Version | 1.1 |
| Date | 2026-08-30 |
| Author | Dr. Daoud Tajeldeinn |
| System | PharmaQMS Enterprise v4.3.3 |
| Scope | Gap analysis for FDA 21 CFR Part 11, EU GMP Annex 11, and ALCOA+ data integrity |

---

## Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-08-28 | Dr. Daoud Tajeldeinn | Initial gap analysis |
| 1.1 | 2026-08-30 | Dr. Daoud Tajeldeinn | Closed GAP-07, GAP-13, GAP-14, GAP-15; updated VTM with verified evidence |

---

## 1. System Description

PharmaQMS Enterprise is an Electron + React + TypeScript desktop application with Supabase as the backend. It manages CAPAs, Deviations, Audits, Market Complaints, Recalls, Training, Stability, Equipment, Suppliers, Materials, COA/BMR/MFR documents, and IPQC/Testing workflows.

---

## 2. Regulatory Requirements Assessment

| Requirement | Regulation | Status | Evidence / Notes |
|---|---|---|---|
| **Electronic signatures** | 21 CFR 11.200 | 🟡 PARTIAL | `SignatureModal.tsx` — real Supabase auth verification enforced in licensed deployments; trial mode clearly disclosed |
| **Audit trail — create/modify/delete** | 21 CFR 11.10(e) | 🟢 COMPLIANT | `AuditLogService` append-only, hash-chained, INSERT-only, DB trigger blocks UPDATE/DELETE |
| **Audit trail immutability** | 21 CFR 11.10(e) | 🟢 COMPLIANT | Two PostgreSQL triggers verified live: `audit_immutable` + `trg_prevent_audit_mutation` on `user_activity_logs` |
| **Record preservation** | 21 CFR 11.10(c) | 🟢 COMPLIANT | Soft-delete with `is_deleted` flag; no hard deletes; tombstones permanent |
| **Data integrity (ALCOA+)** | GMP / Data Integrity | 🟢 COMPLIANT | All records attributable, legible, contemporaneous, original, accurate |
| **Access control (RBAC)** | 21 CFR 11.10(d) | 🟡 PARTIAL | `useRoleAccess` fixed to check `user.role`; `PermissionService` aligned; formal per-role RLS policies pending |
| **Time-source integrity** | 21 CFR 11.10(b) | 🟡 PARTIAL | Uses client timestamps; recommend NTP-synced server timestamp source |
| **Device/IP attribution** | EU GMP Annex 11 7.2 | 🟡 PARTIAL | IP capture currently client-side string; recommend reverse-proxy header |
| **Cross-user record separation** | GxP | 🟢 COMPLIANT | Supabase RLS on domain tables |
| **Data retention schedules** | GxP / local law | 🔴 MISSING | No automated retention/deletion scheduling or archival policy |
| **Disaster recovery / backup** | Annex 11 7.2 | 🟡 PARTIAL | Supabase cloud + local Dexie cache; no tested DR runbook |
| **System validation (IQ/OQ/PQ)** | Annex 11 4.2 | 🔴 MISSING | Protocol drafted (PQMS-VAL-002); not yet executed |
| **Change control for software** | Annex 11 5.1 | 🟡 PARTIAL | Git commits with semantic messages; formal change-control linkage pending |
| **Training records for users** | 21 CFR 11.10(i) | 🟡 PARTIAL | Training module exists; admin training evidence not yet documented |
| **Multi-factor authentication** | Annex 11 12.2 | 🔴 MISSING | Password-based only; no MFA option |
| **Secrets / credential management** | GxP / IT Security | 🟢 COMPLIANT | Hardcoded credentials removed; .env excluded from VCS; fail-fast on missing env vars |
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
| GAP-07 | E-signatures not verified against auth provider | High | Real `supabase.auth.signInWithPassword` verification enforced in licensed mode; trial mode disclosed | ✅ CLOSED |
| GAP-08 | No MFA | High | Add TOTP/WebAuthn for admin/approver roles | ⏳ OPEN |
| GAP-09 | No formal IQ/OQ/PQ execution | High | Execute validation protocol PQMS-VAL-002; retain evidence | ⏳ OPEN |
| GAP-10 | No documented retention schedules | Medium | Define per-record-class retention; automate archival | ⏳ OPEN |
| GAP-11 | No disaster-recovery runbook | Medium | Document backup/restore procedure; test quarterly | ⏳ OPEN |
| GAP-12 | Change control not linked to SCM | Medium | Adopt issue/approval workflow mapping commits to change IDs | ⏳ OPEN |
| GAP-13 | Hardcoded Supabase credentials in source code | Critical | Removed fallback credentials; app fails fast on missing env vars | ✅ CLOSED |
| GAP-14 | .env files tracked in version control | Critical | Untracked via `git rm --cached`; .gitignore updated; .env.example added | ✅ CLOSED |
| GAP-15 | RBAC checked username string instead of role | High | Fixed `useRoleAccess` to check `user.role`; universal password backdoor removed | ✅ CLOSED |

---

## 4. Verification Traceability Matrix (VTM)

| Requirement | Verification Method | Test/Evidence | Result |
|---|---|---|---|
| Audit insert is append-only | Automated test | `AuditLogService.test.ts → "writes audit entries via INSERT"` | ✅ PASS |
| Audit write failure blocks action | Automated test | `AuditLogService.test.ts → "throws (fail-closed)"` | ✅ PASS |
| Hash chaining integrity | Automated test | `AuditLogService.test.ts → "records a hash chain"` | ✅ PASS |
| Soft-delete retains record | Automated test | `DeletedRecordsService.test.ts` | ✅ PASS |
| No hard-delete calls in code | Code inspection | `grep -n "\.delete()"` returns empty for services | ✅ PASS |
| DB-level audit immutability | SQL verification | Triggers `audit_immutable` + `trg_prevent_audit_mutation` verified live in Supabase — both block UPDATE/DELETE on `user_activity_logs` | ✅ PASS |
| No production vulnerabilities | Automated check | `npm audit --omit=dev` → 0 vulnerabilities | ✅ PASS |
| Signature identity verification | Code inspection | `SignatureModal.tsx` — `supabase.auth.signInWithPassword` called in licensed mode; wrong password blocks signature | ✅ PASS |
| RBAC enforces role not username | Code inspection | `useRoleAccess.ts` — `ADMIN_ROLES.has(user.role)` confirmed | ✅ PASS |
| No credentials in source control | Repository audit | `git ls-files` — no `.env` files tracked; no hardcoded keys in `supabase.ts` | ✅ PASS |

---

## 5. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| System Owner | Dr. Daoud Tajeldeinn | | |
| Quality Assurance | | | |
| IT / Validation | | | |
