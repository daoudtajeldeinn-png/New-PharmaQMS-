# Tasks — PharmaQMS Unified Professional Build

## Completed ✅
- `[x]` MaterialInventory updates (productionDate)
- `[x]` COAManager updates (dates, water tests)
- `[x]` g1Data.ts updates (Water monographs)
- `[x]` BMRManager — Line clearance interactive (areaFree, calibrationValid, rmAvailability, qaReleased checkboxes + tab gating)
- `[x]` BMRManager — Analysis dates per step (Manufacturing & Packaging phases)
- `[x]` BMRManager — Company name & address from Global Settings (loadCompanySettings)
- `[x]` MFRManager — Company name & address from Global Settings
- `[x]` COAManager — Company name from Global Settings (coaExport.ts)
- `[x]` SupabaseSyncService fix for `activities` (400 error) — column whitelist + timestamp→created_at + relatedId→related_id
- `[x]` db.ts COA Dexie schema — coaRecords has expiryDate, analysisNo, analysisDate (version 8)
- `[x]` PDF upload feature for auto-tests (TestMethodPdfUploader.tsx)
- `[x]` BMR search bar — filter by batch number, product name, status
- `[x]` COA Foundry targeted console verification (QA step — run app, check console for errors on COA save/load)
- `[x]` Reports.tsx advanced features propagation (712-line version → top-level app)
- `[x]` Laboratory.tsx Reagent Registration form propagation (617-line version → top-level app)
- `[x]` Final electron build: `cd app && npm run electron:build`
- `[x]` User Roles & Permission Enforcement (IT Admin and QA Admin exclusive write/delete access)
- `[x]` Deletion Propagation & Sync Isolation (soft delete tombstones & Data Recovery Console)
- `[x]` Desktop Client Restrictions (laboratory test results isolated to Electron desktop environment)
- `[x]` Finished Product COA Parameter Ordering (standard pharmacopeial order enforced)
- `[x]` Equipment Qualification Module (EU GMP Annex 15 & 21 CFR 211.68 — DQ/IQ/OQ/PQ lifecycle, alerts, Part 11 e-signatures, and PDF certificate export)
- `[x]` Supabase Database Migration v10 (RLS enabled across all tables, full anon/authenticated access)
- `[x]` Desktop Auto-Updater Integration in main.cjs (automatic download and installation v4.3.12)

## Pending ⏳
*None — All tasks completed and verified.*

## Repository Consolidation Status
- **Canonical Repository:** `https://github.com/daoudtajeldeinn-png/New-PharmaQMS-` (Vercel & Desktop Release v4.3.12)
- **Status:** All features, bug fixes, and data models have been consolidated into `New-PharmaQMS-`. Legacy sister repositories (`SCI-`, `Pharmaceutical-QMS`, `pharmaqualify-pro`) have been retired.
