import { createContext, useContext, useReducer, type ReactNode, useEffect } from 'react';
import { appReducerWithPersistence, initialState, type AppState, type Action } from './storeReducer';
import { db } from '../db/db';

// ==================== Context ====================
interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ==================== Provider ====================
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducerWithPersistence, initialState);

  // Load initial data from database
  useEffect(() => {
    const loadData = async () => {
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

        // Convert MFR array to Record object
        const mfrRecord: Record<string, any> = {};
        dbMFRs.forEach(mfr => { mfrRecord[mfr.id] = mfr; });

        // Dispatch all loaded data to state
        dispatch({
          type: 'LOAD_DB_DATA', payload: {
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
            masterFormulas: dbMFRs.length > 0 ? mfrRecord : initialState.masterFormulas,
          }
        });

        // Calculate initial dashboard stats
        dispatch({ type: 'UPDATE_DASHBOARD_STATS' });
      } catch (error) {
        console.error('Error loading data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
      }
    };

    loadData();
  }, []);

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
    <StoreContext.Provider value={{ state, dispatch }}>
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
