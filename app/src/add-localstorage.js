#!/usr/bin/env node

/**
 * Script لإضافة localStorage persistence إلى useStore.tsx
 * 
 * الاستخدام:
 * node add-localstorage.js
 */

const fs = require('fs');
const path = require('path');

const useStorePath = path.join(__dirname, '../src/hooks/useStore.tsx');

// قراءة الملف الأصلي
let content = fs.readFileSync(useStorePath, 'utf8');

// 1. إضافة STORAGE_KEYS بعد الـ imports
const storageKeysCode = `
// ==================== LocalStorage Keys ====================
const STORAGE_KEYS = {
  PRODUCTS: 'pharma_products',
  TEST_METHODS: 'pharma_test_methods',
  TEST_RESULTS: 'pharma_test_results',
  CAPAS: 'pharma_capas',
  DEVIATIONS: 'pharma_deviations',
  EQUIPMENT: 'pharma_equipment',
  CHEMICAL_REAGENTS: 'pharma_chemical_reagents',
  REFERENCE_STANDARDS: 'pharma_reference_standards',
  QUALITY_SYSTEMS: 'pharma_quality_systems',
  TRAINING_RECORDS: 'pharma_training_records',
  AUDITS: 'pharma_audits',
  SUPPLIERS: 'pharma_suppliers',
  CHANGE_CONTROLS: 'pharma_change_controls',
  MARKET_COMPLAINTS: 'pharma_market_complaints',
  PRODUCT_RECALLS: 'pharma_product_recalls',
  MASTER_FORMULAS: 'pharma_master_formulas',
  BATCH_RECORDS: 'pharma_batch_records',
};

// ==================== Helper Functions ====================
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    return JSON.parse(item, (key, value) => {
      const dateFields = ['expiryDate', 'manufactureDate', 'calibrationDate', 
                         'nextCalibrationDate', 'createdAt', 'updatedAt', 
                         'timestamp', 'trainingDate', 'completionDate',
                         'effectiveDate', 'scheduledDate', 'receivedDate', 'initiationDate'];
      
      if (dateFields.includes(key) && typeof value === 'string') {
        return new Date(value);
      }
      return value;
    });
  } catch (error) {
    console.error(\`Error loading \${key} from localStorage:\`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(\`Error saving \${key} to localStorage:\`, error);
  }
}
`;

// إضافة بعد الـ imports
const importEndRegex = /import.*from.*bmrData';/;
content = content.replace(importEndRegex, (match) => match + '\n' + storageKeysCode);

// 2. استبدال initialState
content = content.replace(
  /const initialState: AppState = \{[\s\S]*?\n\};/,
  `const initialState: AppState = {
  products: loadFromStorage(STORAGE_KEYS.PRODUCTS, []),
  testMethods: loadFromStorage(STORAGE_KEYS.TEST_METHODS, []),
  testResults: loadFromStorage(STORAGE_KEYS.TEST_RESULTS, []),
  capas: loadFromStorage(STORAGE_KEYS.CAPAS, []),
  deviations: loadFromStorage(STORAGE_KEYS.DEVIATIONS, []),
  equipment: loadFromStorage(STORAGE_KEYS.EQUIPMENT, []),
  chemicalReagents: loadFromStorage(STORAGE_KEYS.CHEMICAL_REAGENTS, []),
  referenceStandards: loadFromStorage(STORAGE_KEYS.REFERENCE_STANDARDS, []),
  qualitySystems: loadFromStorage(STORAGE_KEYS.QUALITY_SYSTEMS, []),
  trainingRecords: loadFromStorage(STORAGE_KEYS.TRAINING_RECORDS, []),
  audits: loadFromStorage(STORAGE_KEYS.AUDITS, []),
  suppliers: loadFromStorage(STORAGE_KEYS.SUPPLIERS, []),
  changeControls: loadFromStorage(STORAGE_KEYS.CHANGE_CONTROLS, []),
  pharmacopeiaMonographs: [],
  marketComplaints: loadFromStorage(STORAGE_KEYS.MARKET_COMPLAINTS, []),
  productRecalls: loadFromStorage(STORAGE_KEYS.PRODUCT_RECALLS, []),
  masterFormulas: loadFromStorage(STORAGE_KEYS.MASTER_FORMULAS, initialMFRs),
  batchRecords: loadFromStorage(STORAGE_KEYS.BATCH_RECORDS, initialBMRs),
  dashboardStats: {
    totalProducts: 0,
    productsByStatus: {
      Quarantine: 0,
      Approved: 0,
      Rejected: 0,
      Released: 0,
      Blocked: 0,
      Expired: 0,
      Under_Test: 0,
    },
    pendingTests: 0,
    oosCount: 0,
    openDeviations: 0,
    openCAPAs: 0,
    upcomingCalibrations: 0,
    expiringProducts: 0,
    openComplaints: 0,
    activeRecalls: 0,
    recentActivities: [],
  },
  activities: [],
  isLoading: false,
  error: null,
};`
);

// 3. إضافة wrapper function قبل النهاية
const wrapperCode = `
// ==================== Reducer with Persistence ====================
function appReducerWithPersistence(state: AppState, action: Action): AppState {
  const newState = appReducer(state, action);
  
  // Save to localStorage based on action type
  const saveMapping: Record<string, () => void> = {
    'ADD_PRODUCT': () => saveToStorage(STORAGE_KEYS.PRODUCTS, newState.products),
    'UPDATE_PRODUCT': () => saveToStorage(STORAGE_KEYS.PRODUCTS, newState.products),
    'DELETE_PRODUCT': () => saveToStorage(STORAGE_KEYS.PRODUCTS, newState.products),
    'SET_PRODUCTS': () => saveToStorage(STORAGE_KEYS.PRODUCTS, newState.products),
    
    'ADD_TEST_METHOD': () => saveToStorage(STORAGE_KEYS.TEST_METHODS, newState.testMethods),
    'UPDATE_TEST_METHOD': () => saveToStorage(STORAGE_KEYS.TEST_METHODS, newState.testMethods),
    'DELETE_TEST_METHOD': () => saveToStorage(STORAGE_KEYS.TEST_METHODS, newState.testMethods),
    'SET_TEST_METHODS': () => saveToStorage(STORAGE_KEYS.TEST_METHODS, newState.testMethods),
    
    'ADD_TEST_RESULT': () => saveToStorage(STORAGE_KEYS.TEST_RESULTS, newState.testResults),
    'UPDATE_TEST_RESULT': () => saveToStorage(STORAGE_KEYS.TEST_RESULTS, newState.testResults),
    'SET_TEST_RESULTS': () => saveToStorage(STORAGE_KEYS.TEST_RESULTS, newState.testResults),
    
    'ADD_EQUIPMENT': () => saveToStorage(STORAGE_KEYS.EQUIPMENT, newState.equipment),
    'UPDATE_EQUIPMENT': () => saveToStorage(STORAGE_KEYS.EQUIPMENT, newState.equipment),
    'SET_EQUIPMENT': () => saveToStorage(STORAGE_KEYS.EQUIPMENT, newState.equipment),
    
    'ADD_CAPA': () => saveToStorage(STORAGE_KEYS.CAPAS, newState.capas),
    'UPDATE_CAPA': () => saveToStorage(STORAGE_KEYS.CAPAS, newState.capas),
    'SET_CAPAS': () => saveToStorage(STORAGE_KEYS.CAPAS, newState.capas),
    
    'ADD_DEVIATION': () => saveToStorage(STORAGE_KEYS.DEVIATIONS, newState.deviations),
    'UPDATE_DEVIATION': () => saveToStorage(STORAGE_KEYS.DEVIATIONS, newState.deviations),
    'SET_DEVIATIONS': () => saveToStorage(STORAGE_KEYS.DEVIATIONS, newState.deviations),
    
    'ADD_CHEMICAL_REAGENT': () => saveToStorage(STORAGE_KEYS.CHEMICAL_REAGENTS, newState.chemicalReagents),
    'UPDATE_CHEMICAL_REAGENT': () => saveToStorage(STORAGE_KEYS.CHEMICAL_REAGENTS, newState.chemicalReagents),
    'SET_CHEMICAL_REAGENTS': () => saveToStorage(STORAGE_KEYS.CHEMICAL_REAGENTS, newState.chemicalReagents),
    
    'ADD_REFERENCE_STANDARD': () => saveToStorage(STORAGE_KEYS.REFERENCE_STANDARDS, newState.referenceStandards),
    'UPDATE_REFERENCE_STANDARD': () => saveToStorage(STORAGE_KEYS.REFERENCE_STANDARDS, newState.referenceStandards),
    'SET_REFERENCE_STANDARDS': () => saveToStorage(STORAGE_KEYS.REFERENCE_STANDARDS, newState.referenceStandards),
    
    'ADD_QUALITY_SYSTEM': () => saveToStorage(STORAGE_KEYS.QUALITY_SYSTEMS, newState.qualitySystems),
    'UPDATE_QUALITY_SYSTEM': () => saveToStorage(STORAGE_KEYS.QUALITY_SYSTEMS, newState.qualitySystems),
    'SET_QUALITY_SYSTEMS': () => saveToStorage(STORAGE_KEYS.QUALITY_SYSTEMS, newState.qualitySystems),
    
    'ADD_TRAINING_RECORD': () => saveToStorage(STORAGE_KEYS.TRAINING_RECORDS, newState.trainingRecords),
    'UPDATE_TRAINING_RECORD': () => saveToStorage(STORAGE_KEYS.TRAINING_RECORDS, newState.trainingRecords),
    'SET_TRAINING_RECORDS': () => saveToStorage(STORAGE_KEYS.TRAINING_RECORDS, newState.trainingRecords),
    
    'ADD_AUDIT': () => saveToStorage(STORAGE_KEYS.AUDITS, newState.audits),
    'UPDATE_AUDIT': () => saveToStorage(STORAGE_KEYS.AUDITS, newState.audits),
    'SET_AUDITS': () => saveToStorage(STORAGE_KEYS.AUDITS, newState.audits),
    
    'ADD_SUPPLIER': () => saveToStorage(STORAGE_KEYS.SUPPLIERS, newState.suppliers),
    'UPDATE_SUPPLIER': () => saveToStorage(STORAGE_KEYS.SUPPLIERS, newState.suppliers),
    'SET_SUPPLIERS': () => saveToStorage(STORAGE_KEYS.SUPPLIERS, newState.suppliers),
    
    'ADD_CHANGE_CONTROL': () => saveToStorage(STORAGE_KEYS.CHANGE_CONTROLS, newState.changeControls),
    'UPDATE_CHANGE_CONTROL': () => saveToStorage(STORAGE_KEYS.CHANGE_CONTROLS, newState.changeControls),
    'SET_CHANGE_CONTROLS': () => saveToStorage(STORAGE_KEYS.CHANGE_CONTROLS, newState.changeControls),
    
    'ADD_MARKET_COMPLAINT': () => saveToStorage(STORAGE_KEYS.MARKET_COMPLAINTS, newState.marketComplaints),
    'UPDATE_MARKET_COMPLAINT': () => saveToStorage(STORAGE_KEYS.MARKET_COMPLAINTS, newState.marketComplaints),
    'SET_MARKET_COMPLAINTS': () => saveToStorage(STORAGE_KEYS.MARKET_COMPLAINTS, newState.marketComplaints),
    
    'ADD_PRODUCT_RECALL': () => saveToStorage(STORAGE_KEYS.PRODUCT_RECALLS, newState.productRecalls),
    'UPDATE_PRODUCT_RECALL': () => saveToStorage(STORAGE_KEYS.PRODUCT_RECALLS, newState.productRecalls),
    'SET_PRODUCT_RECALLS': () => saveToStorage(STORAGE_KEYS.PRODUCT_RECALLS, newState.productRecalls),
    
    'ADD_MFR': () => saveToStorage(STORAGE_KEYS.MASTER_FORMULAS, newState.masterFormulas),
    'UPDATE_MFR': () => saveToStorage(STORAGE_KEYS.MASTER_FORMULAS, newState.masterFormulas),
    'DELETE_MFR': () => saveToStorage(STORAGE_KEYS.MASTER_FORMULAS, newState.masterFormulas),
    'SET_MFRS': () => saveToStorage(STORAGE_KEYS.MASTER_FORMULAS, newState.masterFormulas),
    
    'ADD_BMR': () => saveToStorage(STORAGE_KEYS.BATCH_RECORDS, newState.batchRecords),
    'UPDATE_BMR': () => saveToStorage(STORAGE_KEYS.BATCH_RECORDS, newState.batchRecords),
    'SET_BMRS': () => saveToStorage(STORAGE_KEYS.BATCH_RECORDS, newState.batchRecords),
  };
  
  const saveFn = saveMapping[action.type];
  if (saveFn) {
    saveFn();
  }
  
  return newState;
}
`;

// إضافة قبل StoreProvider
content = content.replace(
  /\/\/ ==================== Provider ====================/,
  wrapperCode + '\n// ==================== Provider ===================='
);

// 4. استبدال useReducer
content = content.replace(
  /const \[state, dispatch\] = useReducer\(appReducer, initialState\);/,
  'const [state, dispatch] = useReducer(appReducerWithPersistence, initialState);'
);

// حفظ الملف المعدل
const backupPath = useStorePath + '.backup';
fs.copyFileSync(useStorePath, backupPath);
console.log('✅ تم إنشاء نسخة احتياطية:', backupPath);

fs.writeFileSync(useStorePath, content);
console.log('✅ تم تحديث useStore.tsx بنجاح!');
console.log('📝 يمكنك استرجاع النسخة الأصلية من:', backupPath);
