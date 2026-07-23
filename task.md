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

## Pending ⏳
- `[ ]` COA Foundry targeted console verification (QA step — run app, check console for errors on COA save/load)
- `[ ]` Reports.tsx advanced features propagation (712-line version → top-level app)
- `[ ]` Laboratory.tsx Reagent Registration form propagation (617-line version → top-level app)
- `[ ]` Final electron build: `cd app && npm run electron:build`

## Unification Status
- **Canonical source:** `New-PharmaQMS-/app/src/` (Vercel deployed)
- **Files to propagate to SCI-, Pharmaceutical-QMS, pharmaqualify-pro:**
  - `app/src/pages/BMRManager.tsx` (1206 lines — search bar + company settings)
  - `app/src/pages/MFRManager.tsx` (513 lines — company settings)
  - `app/src/pages/Reports.tsx` (712 lines — from PharmaQMS-Copy)
  - `app/src/pages/Laboratory.tsx` (617 lines — reagent registration form)
  - `app/src/lib/coaExport.ts` (337 lines — company settings + Analytical Worksheet)
  - `app/src/hooks/storeReducer.ts` (637 lines — DELETE_CHEMICAL_REAGENT action)
  - `app/src/hooks/useStore.tsx` (219 lines)
  - `app/src/services/CloudSyncService.ts` (291 lines — most complete)
  - `app/src/db/db.ts` (99 lines — version 8 consolidated schema)
  - `app/src/data/bmrData.ts` (97 lines — analysisDate + lineClearance types)
