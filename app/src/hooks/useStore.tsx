import { createContext, useContext, useReducer, type ReactNode, useEffect, useCallback } from 'react';
import { appReducerWithPersistence, initialState, type AppState, type Action } from './storeReducer';
import { db } from '../db/db';
// ==================== Context ====================
interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  reloadFromDB: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ==================== Provider ====================
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducerWithPersistence, initialState);

  // Load initial data from database
  const reloadFromDB = useCallback(async () => {
    try {
      // Load all data from Dexie DB
      const [
        products,
        testMethods,
        testResults,
        capas,
        deviations,
        equipment,
        chemicalReagents,
        referenceStandards,
        qualitySystems,
        trainingRecords,
        audits,
        suppliers,
        changeControls,
        marketComplaints,
        productRecalls,
        stabilityProtocols,
        ipqcChecks,
        coaRecords,
        batchRecords,
        rawMaterials,
        activities,
        materialMovements,
        reconciliationRecords,
        dbMFRs,
      ] = await Promise.all([
        db.products.toArray(),
        db.testMethods.toArray(),
        db.testResults.toArray(),
        db.capas.toArray(),
        db.deviations.toArray(),
        db.equipment.toArray(),
        db.chemicalReagents.toArray(),
        db.referenceStandards.toArray(),
        db.qualitySystems.toArray(),
        db.trainingRecords.toArray(),
        db.audits.toArray(),
        db.suppliers.toArray(),
        db.changeControls.toArray(),
        db.marketComplaints.toArray(),
        db.productRecalls.toArray(),
        db.stabilityProtocols.toArray(),
        db.ipqcChecks.toArray(),
        db.coaRecords.toArray(),
        db.batchRecords.toArray(),
        db.rawMaterials.toArray(),
        db.activities.toArray(),
        db.materialMovements.toArray(),
        db.reconciliationRecords.toArray(),
        db.masterFormulas.toArray(),
      ]);

      // MFR Source of Truth: Use mfrData.ts as the source of truth
      // This ensures step numbers and process definitions are always correct
      const mfrRecord: Record<string, any> = {};
      
      // First, load all MFRs from the source file (mfrData.ts)
      Object.values(initialState.masterFormulas).forEach(mfr => {
        mfrRecord[mfr.id] = mfr;
      });
      
      // Then merge with DB data - DB data only ADDS new fields, never overwrites source
      dbMFRs.forEach(mfr => {
        if (!mfr.deleted_at && mfrRecord[mfr.id]) {
          // Merge: keep source file steps, but allow DB to add execution data
          mfrRecord[mfr.id] = {
            ...mfrRecord[mfr.id],  // Source file wins for structure
            ...mfr,                // DB adds execution/override data
            id: mfrRecord[mfr.id].id, // Ensure ID from source
            processSteps: mfrRecord[mfr.id].processSteps, // Source file wins for steps
          };
        } else if (!mfr.deleted_at) {
          // Allow new MFRs created in DB that aren't in source file
          mfrRecord[mfr.id] = mfr;
        }
      });

      // MIGRATION: Ensure all initial sample BMRs are in the database
      const bmrIds = new Set(batchRecords.map(b => b.id));
      const missingBMRs = initialState.batchRecords.filter(b => !bmrIds.has(b.id));
      if (missingBMRs.length > 0) {
        console.log(`Migrating ${missingBMRs.length} sample BMRs to database...`);
        await db.batchRecords.bulkPut(missingBMRs);
        batchRecords.push(...missingBMRs);
      }

      // Helper to filter out soft-deleted records
      const filterActive = (arr: any[]) => arr.filter(item => !item || !item.deleted_at);

      // Dispatch all loaded data to state
      dispatch({
        type: 'LOAD_DB_DATA', payload: {
          products: filterActive(products),
          testMethods: filterActive(testMethods),
          testResults: filterActive(testResults),
          capas: filterActive(capas),
          deviations: filterActive(deviations),
          equipment: filterActive(equipment),
          chemicalReagents: filterActive(chemicalReagents),
          referenceStandards: filterActive(referenceStandards),
          qualitySystems: filterActive(qualitySystems),
          trainingRecords: filterActive(trainingRecords),
          audits: filterActive(audits),
          suppliers: filterActive(suppliers),
          changeControls: filterActive(changeControls),
          marketComplaints: filterActive(marketComplaints),
          productRecalls: filterActive(productRecalls),
          stabilityProtocols: filterActive(stabilityProtocols),
          ipqcChecks: filterActive(ipqcChecks),
          coaRecords: filterActive(coaRecords),
          batchRecords: filterActive(batchRecords),
          rawMaterials: filterActive(rawMaterials),
          activities, // Activities are audit logs, do not filter soft-deleted
          materialMovements: filterActive(materialMovements),
          reconciliationRecords: filterActive(reconciliationRecords),
          masterFormulas: mfrRecord,
        }
      });

      // Calculate initial dashboard stats
      dispatch({ type: 'UPDATE_DASHBOARD_STATS' });
    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    }
  }, [dispatch]);

  // Load initial data on mount
  useEffect(() => {
    reloadFromDB();
  }, [reloadFromDB]);

  // Data Migration: Cleanup old Hardness Specifications (8-12 kp -> ≥ 4.0 kp)
  useEffect(() => {
    if (state.isLoading || !state.masterFormulas) return;

    // 1. Update Master Formulas
    let mfrChanged = false;
    const updatedMFRs = { ...state.masterFormulas };
    Object.keys(updatedMFRs).forEach(id => {
      const mfr = updatedMFRs[id];
      if (!mfr.processSteps) return;
      
      const newSteps = mfr.processSteps.map(step => {
        if (!step.criticalParameters) return step;
        const newParams = step.criticalParameters.map(p => p.includes("8-12 kp") ? p.replace("8-12 kp", "≥ 4.0 kp") : p);
        if (JSON.stringify(newParams) !== JSON.stringify(step.criticalParameters)) {
          mfrChanged = true;
          return { ...step, criticalParameters: newParams };
        }
        return step;
      });
      if (mfrChanged) updatedMFRs[id] = { ...mfr, processSteps: newSteps };
    });

    // 2. Update Batch Records (if "8-12" is in step descriptions)
    let bmrChangedGlobal = false;
    const updatedBMRs = state.batchRecords.map(bmr => {
      let bmrStepChanged = false;
      const newSteps = bmr.stepExecutions.map(step => {
        if (step.description.includes("8-12 kp")) {
          bmrStepChanged = true;
          bmrChangedGlobal = true;
          return { ...step, description: step.description.replace("8-12 kp", "≥ 4.0 kp") };
        }
        return step;
      });
      return bmrStepChanged ? { ...bmr, stepExecutions: newSteps } : bmr;
    });

    if (mfrChanged) {
      dispatch({ type: 'SET_MFRS', payload: updatedMFRs });
      // Persist to DB directly as well to be sure
      Object.values(updatedMFRs).forEach(mfr => db.masterFormulas.put(mfr));
    }
    if (bmrChangedGlobal) {
      dispatch({ type: 'SET_BMRS', payload: updatedBMRs });
      updatedBMRs.forEach(bmr => db.batchRecords.put(bmr));
    }
  }, [state.isLoading]);

  return (
    <StoreContext.Provider value={{ state, dispatch, reloadFromDB }}>
      {children}
    </StoreContext.Provider>
  );
}

// ==================== Hook ====================
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

// Re-export types for convenience
export type { AppState, Action };
