# Implementation Plan: User Roles, Deletion Propagation, and Finished Product COA Ordering

This document outlines the architectural plan to restrict data modification and deletion permissions, enforce global soft-delete synchronization, restrict test result access to the desktop Electron client, and implement strict ordering for finished product Certificates of Analysis (COA).

---

## 1. User Roles & Permission Enforcement

### Objective
Ensure that **only IT Admin and QA Admin** roles can create, modify, or delete system data. All other roles (QC Manager, Analyst, Viewer, etc.) must have read-only access.

### Execution Plan
1. **Centralize Permission Guards (`app/src/hooks/useRoleAccess.ts`)**:
   - Verify that `ADMIN_ROLES` includes exactly: `'it_admin'`, `'qa_admin'`, and `'admin'` (legacy alias).
   - Ensure `canModify`, `canDelete`, and `canRecover` return `true` **only** if the current user's role is in the `ADMIN_ROLES` set.
2. **UI Action Hardening**:
   - Audit side bar pages:
     - **BMR Execution** (`app/src/pages/BMRManager.tsx`)
     - **Material Inventory** (`app/src/pages/MaterialInventory.tsx`)
     - **COA Foundry** (`app/src/pages/COAManager.tsx`)
     - **Lab Operations** (`app/src/pages/Testing.tsx`)
     - **CAPA Lifecycle** (`app/src/pages/CAPA.tsx`)
     - **Deviations Hub** (`app/src/pages/Deviations.tsx`)
   - Disable/hide the "Add New", "Edit", "Save", "Delete", and "Restore" actions for unauthorized roles using the `canModify` and `canDelete` values returned by the `useRoleAccess()` hook.

---

## 2. Deletion Propagation & Sync Isolation

### Objective
Ensure that when an administrator deletes a record, the deletion propagates to all other users. Deleted data must not be restored by subsequent synchronizations unless explicitly recovered via the Data Recovery Console.

### Execution Plan
1. **Admin Deletion Registration (`app/src/services/DeletedRecordsService.ts`)**:
   - When a deletion is performed, register a soft-delete "tombstone" containing the `tableName`, `recordId`, `deletedAt` timestamp, `deletedBy` user, and a full JSON `snapshot` of the deleted record.
   - Persist this tombstone locally in `localStorage` and upsert it into the Supabase cloud table `deletedRecords`.
2. **Synchronization Guard (`app/src/services/CloudSyncService.ts`)**:
   - Prior to syncing, call `syncTombstonesFromCloud()` to pull all active deletions from the Supabase database.
   - In both **PUSH** (local-to-cloud) and **PULL** (cloud-to-local) routines, filter out any record whose ID exists in the active tombstone set. This ensures deleted records are deleted on all client machines and are never resurrected.
3. **Data Recovery Console (`app/src/pages/DataRecoveryConsole.tsx`)**:
   - Restrict access strictly to IT and QA admins.
   - Restoring a record will set the tombstone status to `recovered: true` in localStorage and Supabase, and re-insert the JSON `snapshot` back into the local Dexie DB, allowing it to sync again.

---

## 3. Desktop Client Restrictions (Electron Environment Isolation)

### Objective
Restric retrieval of laboratory test results so that they can only be fetched when running inside the desktop Electron container. Online web browsers (running under Vercel/HTTP) must be blocked from fetching or displaying this data.

### Execution Plan
1. **Environment Check Utility (`app/src/utils/env.ts` or similar)**:
   - Implement `isElectron()` to check if the app is running in the Electron process:
     ```typescript
     export function isElectron(): boolean {
       return typeof window !== 'undefined' && 
              window.process && 
              (window.process as any).versions && 
              !!(window.process as any).versions.electron;
     }
     ```
2. **Local Load Prevention (`app/src/hooks/useStore.tsx`)**:
   - In the initial database load function, check `isElectron()`. If false, bypass reading `db.testResults` and set `testResults` to `[]` in the application state.
3. **Sync Block (`app/src/services/CloudSyncService.ts`)**:
   - During `syncAllTables()`, if `isElectron()` is false, skip syncing (both PUSH and PULL) the `testResults` table.
4. **UI Block (`app/src/pages/Testing.tsx`)**:
   - In the Lab Operations / Test Records page, if `isElectron()` is false, render a full-page blur or access-restriction alert overlay:
     > **GxP Data Integrity Compliance Alert**
     > Laboratory Test Results are only accessible through the local Electron desktop application.

---

## 4. Finished Product COA Parameter Ordering

### Objective
Ensure that Certificates of Analysis (COA) for finished products display analytical test results in a strict, standard order to comply with pharmacopeial and GxP standards.

### Parameter Order Specification
1. **Description or Appearance** (Descriptive characteristics)
2. **Identification**
   - **A: IR** (Infrared Spectroscopy)
   - **B: Colour reaction** (Chemical identification)
   - **C: Melting Point** (Physical identification)
3. **Uniformity of Weight** / Weight Variation
4. **Disintegration**
5. **Dissolution**
6. **Related Substance**
   - Individual related substance
   - Total related substance
7. **Friability**
8. **Thickness**
9. **Hardness**

*Any other test parameters (e.g., Assay, microbiological tests) not defined in this list will be appended at the end.*

### Execution Plan
1. **Sort Comparator Definition (`app/src/pages/COAManager.tsx`)**:
   - Implement a scoring function mapping test names to order weights:
     ```typescript
     function getFinishedProductTestScore(testName: string): number {
       const name = testName.toLowerCase().trim();
       if (name.includes('description') || name.includes('appearance') || name.includes('characters')) return 10;
       
       if (name.includes('identification') || name.includes('identity')) {
         if (name.includes('ir') || name.includes('infra')) return 21;
         if (name.includes('colour') || name.includes('color') || name.includes('reaction')) return 22;
         if (name.includes('melting')) return 23;
         return 24;
       }
       if (name.includes('melting point') || name.includes('melting range')) return 23;
       
       if (name.includes('uniformity') || name.includes('weight') || name.includes('variation')) return 30;
       if (name.includes('disintegration')) return 40;
       if (name.includes('dissolution')) return 50;
       if (name.includes('related') || name.includes('impurity') || name.includes('impurities') || name.includes('degradation')) return 60;
       if (name.includes('friability')) return 70;
       if (name.includes('thickness')) return 80;
       if (name.includes('hardness')) return 90;
       return 999; // Append other tests to the end
     }
     ```
2. **Apply Order to COA Records**:
   - When importing test results (from Monographs or Lab Test results) or when saving/printing the COA for a "Finished Product" type, sort the `testResults` array using:
     ```typescript
     const sortedTests = [...testResults].sort((a, b) => 
       getFinishedProductTestScore(a.test) - getFinishedProductTestScore(b.test)
     );
     ```

---

## Status Summary

All objectives have been successfully implemented and verified:
1. **User Roles & Permission Enforcement**: Centralized guards in `useRoleAccess.ts` and UI-level action hardening in `BMRManager.tsx`, `MaterialInventory.tsx`, `COAManager.tsx`, `Testing.tsx`, `CAPA.tsx`, and `Deviations.tsx` restrict modification and deletion capabilities strictly to IT Admin and QA Admin roles.
2. **Deletion Propagation & Sync Isolation**: Developed the audited soft-delete/hard-delete capabilities in `SoftDeleteService.ts`, propagated deletion state using Supabase tombstones, and created the administrative `DataRecoveryConsole.tsx` page to restore or purge records.
3. **Desktop Client Restrictions**: Implemented `isElectron()` environment checking in `useStore.tsx` and `CloudSyncService.ts` to skip loading/syncing laboratory test results when running in online browsers, and added a premium compliance warning overlay in `Testing.tsx`.
4. **Finished Product COA Ordering**: Designed custom sorting rules in `COAManager.tsx` matching the regulatory parameter order requirement, automatically ordering appearance, identification, weight uniformity, disintegration, dissolution, impurities, friability, thickness, and hardness.
5. **Validation**: Built the entire frontend React/Vite application successfully with zero errors.
