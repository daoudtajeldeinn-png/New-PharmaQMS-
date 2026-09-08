# AGENTS.md — Workspace Persistent Memory

## Status Overview: ALL TASKS COMPLETED ✅
As of September 2026, all planned development tasks, architectural refactoring, compliance hardening, and feature propagations for PharmaQMS Unified Professional Build are **100% completed and verified**.

---

## Architecture & Established Patterns

### 1. Role-Based Access Control (RBAC)
- **Centralized Guard:** [`app/src/hooks/useRoleAccess.ts`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/hooks/useRoleAccess.ts)
- **Authorized Admin Roles:** `'it_admin'`, `'qa_admin'`, and `'admin'`.
- **Enforcement Rule:** Only users with these roles possess `canModify`, `canDelete`, and `canRecover` capabilities. All other roles (QC Manager, Analyst, Operator, Viewer, Auditor) are strictly **read-only** across all pages (`BMRManager`, `MaterialInventory`, `COAManager`, `Testing`, `CAPA`, `Deviations`).

### 2. Deletion Propagation & Soft Delete Tombstones
- **Services:** [`app/src/services/SoftDeleteService.ts`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/services/SoftDeleteService.ts) and [`app/src/services/CloudSyncService.ts`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/services/CloudSyncService.ts).
- **Tombstone Sync:** Deletions generate tombstones synced to the Supabase `deletedRecords` table. Both PUSH (local-to-cloud) and PULL (cloud-to-local) routines filter out records matching active tombstones, preventing deleted records from resurrecting on any client.
- **Recovery Console:** Admin-only [`app/src/pages/DataRecoveryConsole.tsx`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/pages/DataRecoveryConsole.tsx) enables IT and QA admins to inspect, restore, or permanently purge soft-deleted records.

### 3. Desktop Client Restrictions (Electron Isolation)
- **Environment Check:** `isElectron()` in [`app/src/utils/env.ts`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/utils/env.ts).
- **Isolation Scope:** Laboratory Test Results (`testResults`) are accessible only when running within the Electron desktop container.
- **Web App Guard:** When accessed via standard web browsers (e.g. Vercel deployment), test result reading and cloud sync are suppressed, and [`app/src/pages/Testing.tsx`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/pages/Testing.tsx) displays an access-restriction compliance banner.

### 4. Finished Product COA Ordering
- **Implementation:** [`app/src/pages/COAManager.tsx`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/pages/COAManager.tsx) and [`app/src/lib/coaExport.ts`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/lib/coaExport.ts).
- **Strict Pharmacopeial Order:**
  1. Description / Appearance
  2. Identification (A: IR -> B: Colour reaction -> C: Melting Point)
  3. Uniformity of Weight / Weight Variation
  4. Disintegration
  5. Dissolution
  6. Related Substances (Individual & Total)
  7. Friability
  8. Thickness
  9. Hardness
  10. Remaining / Miscellaneous tests (Assay, Microbiological, etc.)

### 5. Equipment Qualification Lifecycle (EU GMP Annex 15 & 21 CFR 211.68)
- **Services:** [`app/src/services/QualificationService.ts`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/services/QualificationService.ts).
- **Phases:** Design Qualification (DQ), Installation Qualification (IQ), Operational Qualification (OQ), and Performance Qualification (PQ).
- **Status Determination:**
  - `Fully Qualified`: All 4 phases have 'Pass'.
  - `Partially Qualified`: At least one phase passed, none failed.
  - `Qualification Failed`: Any phase marked 'Fail'.
  - `Requalification Required`: Requalification date is in the past.
- **Compliance & Part 11:** Electronic signature verification via [`SignatureModal.tsx`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/components/security/SignatureModal.tsx) and PDF Certificate generation via [`app/src/lib/coaExport.ts`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/lib/coaExport.ts).
- **Sync & Storage:** Dexie table `equipmentQualifications` (version 9) synced to Supabase `equipmentQualifications` table.

---

## Verification & Build Status
- **Vite & React Frontend:** Compiles clean with zero errors (`npm run build`).
- **Dexie Schema:** Version 9 schema consolidated in [`app/src/db/db.ts`](file:///e:/phase%202%20professional%20build/update/New-PharmaQMS-fixed/app/src/db/db.ts).
- **Supabase Integration:** Sync whitelist and schema mappings verified.
