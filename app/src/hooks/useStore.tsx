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
        ]);

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
