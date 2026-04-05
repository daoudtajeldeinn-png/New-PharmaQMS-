import { db } from '../db/db';

import type {
    PharmaceuticalProduct,
    TestMethod,
    TestResult,
    CAPA,
    Deviation,
    Equipment,
    ChemicalReagent,
    ReferenceStandard,
    QualitySystem,
    TrainingRecord,
    Audit,
    Supplier,
    DashboardStats,
    Activity,
    ChangeControl,
    PharmacopeiaMonograph,
    MarketComplaint,
    ProductRecall,
    StabilityProtocol,
    IPQCCheck,
    COARecord,
    RawMaterial,
    MaterialMovement,
    ReconciliationRecord,
} from '@/types';
import { masterFormulas as initialMFRs, type MasterFormula } from '@/data/mfrData';
import { batchRecords as initialBMRs, type BatchRecord } from '@/data/bmrData';

// ==================== LocalStorage Keys (Legacy for Migration) ====================
export const STORAGE_KEYS = {
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
    STABILITY_PROTOCOLS: 'pharma_stability_protocols',
    RAW_MATERIALS: 'pharma-materials',
};

// ==================== State Interface ====================
export interface AppState {
    products: PharmaceuticalProduct[];
    testMethods: TestMethod[];
    testResults: TestResult[];
    capas: CAPA[];
    deviations: Deviation[];
    equipment: Equipment[];
    chemicalReagents: ChemicalReagent[];
    referenceStandards: ReferenceStandard[];
    qualitySystems: QualitySystem[];
    trainingRecords: TrainingRecord[];
    audits: Audit[];
    suppliers: Supplier[];
    changeControls: ChangeControl[];
    pharmacopeiaMonographs: PharmacopeiaMonograph[];
    marketComplaints: MarketComplaint[];
    productRecalls: ProductRecall[];
    stabilityProtocols: StabilityProtocol[];
    ipqcChecks: IPQCCheck[];
    coaRecords: COARecord[];
    masterFormulas: Record<string, MasterFormula>;
    batchRecords: BatchRecord[];
    rawMaterials: RawMaterial[];
    materialMovements: MaterialMovement[];
    reconciliationRecords: ReconciliationRecord[];
    dashboardStats: DashboardStats;
    activities: Activity[];
    isLoading: boolean;
    error: string | null;
}

// ==================== Initial State ====================
export const initialState: AppState = {
    products: [],
    testMethods: [],
    testResults: [],
    capas: [],
    deviations: [],
    equipment: [],
    chemicalReagents: [],
    referenceStandards: [],
    qualitySystems: [],
    trainingRecords: [],
    audits: [],
    suppliers: [],
    changeControls: [],
    pharmacopeiaMonographs: [],
    marketComplaints: [],
    productRecalls: [],
    stabilityProtocols: [],
    ipqcChecks: [],
    coaRecords: [],
    masterFormulas: initialMFRs,
    batchRecords: initialBMRs,
    rawMaterials: [],
    materialMovements: [],
    reconciliationRecords: [],
    dashboardStats: {
        totalProducts: 0,
        productsByStatus: {
            Quarantine: 0, Approved: 0, Rejected: 0, Released: 0, Blocked: 0, Expired: 0, Under_Test: 0,
        },
        pendingTests: 0, oosCount: 0, openDeviations: 0, openCAPAs: 0, upcomingCalibrations: 0,
        expiringProducts: 0, openComplaints: 0, activeRecalls: 0, recentActivities: [],
    },
    activities: [],
    isLoading: true,
    error: null,
};

// ==================== Action Types ====================
export type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'LOAD_DB_DATA'; payload: Partial<AppState> }
    | { type: 'SET_PRODUCTS'; payload: PharmaceuticalProduct[] }
    | { type: 'ADD_PRODUCT'; payload: PharmaceuticalProduct }
    | { type: 'UPDATE_PRODUCT'; payload: PharmaceuticalProduct }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'SET_TEST_METHODS'; payload: TestMethod[] }
    | { type: 'ADD_TEST_METHOD'; payload: TestMethod }
    | { type: 'UPDATE_TEST_METHOD'; payload: TestMethod }
    | { type: 'DELETE_TEST_METHOD'; payload: string }
    | { type: 'SET_TEST_RESULTS'; payload: TestResult[] }
    | { type: 'ADD_TEST_RESULT'; payload: TestResult }
    | { type: 'UPDATE_TEST_RESULT'; payload: TestResult }
    | { type: 'DELETE_TEST_RESULT'; payload: string }
    | { type: 'SET_CAPAS'; payload: CAPA[] }
    | { type: 'ADD_CAPA'; payload: CAPA }
    | { type: 'UPDATE_CAPA'; payload: CAPA }
    | { type: 'DELETE_CAPA'; payload: string }
    | { type: 'SET_DEVIATIONS'; payload: Deviation[] }
    | { type: 'ADD_DEVIATION'; payload: Deviation }
    | { type: 'UPDATE_DEVIATION'; payload: Deviation }
    | { type: 'DELETE_DEVIATION'; payload: string }
    | { type: 'SET_EQUIPMENT'; payload: Equipment[] }
    | { type: 'ADD_EQUIPMENT'; payload: Equipment }
    | { type: 'UPDATE_EQUIPMENT'; payload: Equipment }
    | { type: 'SET_CHEMICAL_REAGENTS'; payload: ChemicalReagent[] }
    | { type: 'ADD_CHEMICAL_REAGENT'; payload: ChemicalReagent }
    | { type: 'UPDATE_CHEMICAL_REAGENT'; payload: ChemicalReagent }
    | { type: 'SET_REFERENCE_STANDARDS'; payload: ReferenceStandard[] }
    | { type: 'ADD_REFERENCE_STANDARD'; payload: ReferenceStandard }
    | { type: 'UPDATE_REFERENCE_STANDARD'; payload: ReferenceStandard }
    | { type: 'SET_QUALITY_SYSTEMS'; payload: QualitySystem[] }
    | { type: 'ADD_QUALITY_SYSTEM'; payload: QualitySystem }
    | { type: 'UPDATE_QUALITY_SYSTEM'; payload: QualitySystem }
    | { type: 'SET_TRAINING_RECORDS'; payload: TrainingRecord[] }
    | { type: 'ADD_TRAINING_RECORD'; payload: TrainingRecord }
    | { type: 'UPDATE_TRAINING_RECORD'; payload: TrainingRecord }
    | { type: 'SET_AUDITS'; payload: Audit[] }
    | { type: 'ADD_AUDIT'; payload: Audit }
    | { type: 'UPDATE_AUDIT'; payload: Audit }
    | { type: 'DELETE_AUDIT'; payload: string }
    | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'SET_CHANGE_CONTROLS'; payload: ChangeControl[] }
    | { type: 'ADD_CHANGE_CONTROL'; payload: ChangeControl }
    | { type: 'UPDATE_CHANGE_CONTROL'; payload: ChangeControl }
    | { type: 'SET_PHARMACOPEIA_MONOGRAPHS'; payload: PharmacopeiaMonograph[] }
    | { type: 'SET_MARKET_COMPLAINTS'; payload: MarketComplaint[] }
    | { type: 'ADD_MARKET_COMPLAINT'; payload: MarketComplaint }
    | { type: 'UPDATE_MARKET_COMPLAINT'; payload: MarketComplaint }
    | { type: 'DELETE_MARKET_COMPLAINT'; payload: string }
    | { type: 'SET_PRODUCT_RECALLS'; payload: ProductRecall[] }
    | { type: 'ADD_PRODUCT_RECALL'; payload: ProductRecall }
    | { type: 'UPDATE_PRODUCT_RECALL'; payload: ProductRecall }
    | { type: 'DELETE_PRODUCT_RECALL'; payload: string }
    | { type: 'SET_MFRS'; payload: Record<string, MasterFormula> }
    | { type: 'ADD_MFR'; payload: MasterFormula }
    | { type: 'UPDATE_MFR'; payload: MasterFormula }
    | { type: 'DELETE_MFR'; payload: string }
    | { type: 'SET_BMRS'; payload: BatchRecord[] }
    | { type: 'ADD_BMR'; payload: BatchRecord }
    | { type: 'UPDATE_BMR'; payload: BatchRecord }
    | { type: 'DELETE_BMR'; payload: string }
    | { type: 'SET_RAW_MATERIALS'; payload: RawMaterial[] }
    | { type: 'ADD_RAW_MATERIAL'; payload: RawMaterial }
    | { type: 'UPDATE_RAW_MATERIAL'; payload: RawMaterial }
    | { type: 'DELETE_RAW_MATERIAL'; payload: string }
    | { type: 'ADD_ACTIVITY'; payload: Activity }
    | { type: 'SET_STABILITY_PROTOCOLS'; payload: StabilityProtocol[] }
    | { type: 'ADD_STABILITY_PROTOCOL'; payload: StabilityProtocol }
    | { type: 'UPDATE_STABILITY_PROTOCOL'; payload: StabilityProtocol }
    | { type: 'DELETE_STABILITY_PROTOCOL'; payload: string }
    | { type: 'SET_IPQC_CHECKS'; payload: IPQCCheck[] }
    | { type: 'ADD_IPQC_CHECK'; payload: IPQCCheck }
    | { type: 'UPDATE_IPQC_CHECK'; payload: IPQCCheck }
    | { type: 'DELETE_IPQC_CHECK'; payload: string }
    | { type: 'SET_COA_RECORDS'; payload: COARecord[] }
    | { type: 'ADD_COA_RECORD'; payload: COARecord }
    | { type: 'UPDATE_COA_RECORD'; payload: COARecord }
    | { type: 'DELETE_COA_RECORD'; payload: string }
    | { type: 'SET_MATERIAL_MOVEMENTS'; payload: MaterialMovement[] }
    | { type: 'ADD_MATERIAL_MOVEMENT'; payload: MaterialMovement }
    | { type: 'UPDATE_MATERIAL_MOVEMENT'; payload: MaterialMovement }
    | { type: 'DELETE_MATERIAL_MOVEMENT'; payload: string }
    | { type: 'SET_RECONCILIATION_RECORDS'; payload: ReconciliationRecord[] }
    | { type: 'ADD_RECONCILIATION_RECORD'; payload: ReconciliationRecord }
    | { type: 'UPDATE_RECONCILIATION_RECORD'; payload: ReconciliationRecord }
    | { type: 'DELETE_RECONCILIATION_RECORD'; payload: string }
    | { type: 'ADD_TEST_METHOD_PDF'; payload: { testMethodId: string; pdfUrl: string } }
    | { type: 'FETCH_BATCH_TESTS_FOR_COA'; payload: { batchNumber: string; coaId?: string } }
    | { type: 'UPDATE_DASHBOARD_STATS' }
    | { type: 'INITIALIZE_DATA' };

// ==================== Reducer ====================
export function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'LOAD_DB_DATA':
            return { ...state, ...action.payload, isLoading: false };
        case 'SET_PRODUCTS':
            return { ...state, products: action.payload };
        case 'ADD_PRODUCT':
            return { ...state, products: [...state.products, action.payload] };
        case 'UPDATE_PRODUCT':
            return { ...state, products: state.products.map((p) => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_PRODUCT':
            return { ...state, products: state.products.filter((p) => p.id !== action.payload) };
        case 'SET_TEST_METHODS':
            return { ...state, testMethods: action.payload };
        case 'ADD_TEST_METHOD':
            return { ...state, testMethods: [...state.testMethods, action.payload] };
        case 'UPDATE_TEST_METHOD':
            return { ...state, testMethods: state.testMethods.map((t) => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TEST_METHOD':
            return { ...state, testMethods: state.testMethods.filter((t) => t.id !== action.payload) };
        case 'SET_TEST_RESULTS':
            return { ...state, testResults: action.payload };
        case 'ADD_TEST_RESULT':
            return { ...state, testResults: [...state.testResults, action.payload] };
        case 'UPDATE_TEST_RESULT':
            return { ...state, testResults: state.testResults.map((t) => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TEST_RESULT':
            return { ...state, testResults: state.testResults.filter((t) => t.id !== action.payload) };
        case 'SET_CAPAS':
            return { ...state, capas: action.payload };
        case 'ADD_CAPA':
            return { ...state, capas: [...state.capas, action.payload] };
        case 'UPDATE_CAPA':
            return { ...state, capas: state.capas.map((c) => c.id === action.payload.id ? action.payload : c) };
        case 'DELETE_CAPA':
            return { ...state, capas: state.capas.filter((c) => c.id !== action.payload) };
        case 'SET_DEVIATIONS':
            return { ...state, deviations: action.payload };
        case 'ADD_DEVIATION':
            return { ...state, deviations: [...state.deviations, action.payload] };
        case 'UPDATE_DEVIATION':
            return { ...state, deviations: state.deviations.map((d) => d.id === action.payload.id ? action.payload : d) };
        case 'DELETE_DEVIATION':
            return { ...state, deviations: state.deviations.filter((d) => d.id !== action.payload) };
        case 'SET_EQUIPMENT':
            return { ...state, equipment: action.payload };
        case 'ADD_EQUIPMENT':
            return { ...state, equipment: [...state.equipment, action.payload] };
        case 'UPDATE_EQUIPMENT':
            return { ...state, equipment: state.equipment.map((e) => e.id === action.payload.id ? action.payload : e) };
        case 'SET_CHEMICAL_REAGENTS':
            return { ...state, chemicalReagents: action.payload };
        case 'ADD_CHEMICAL_REAGENT':
            return { ...state, chemicalReagents: [...state.chemicalReagents, action.payload] };
        case 'UPDATE_CHEMICAL_REAGENT':
            return { ...state, chemicalReagents: state.chemicalReagents.map((c) => c.id === action.payload.id ? action.payload : c) };
        case 'SET_REFERENCE_STANDARDS':
            return { ...state, referenceStandards: action.payload };
        case 'ADD_REFERENCE_STANDARD':
            return { ...state, referenceStandards: [...state.referenceStandards, action.payload] };
        case 'UPDATE_REFERENCE_STANDARD':
            return { ...state, referenceStandards: state.referenceStandards.map((r) => r.id === action.payload.id ? action.payload : r) };
        case 'SET_QUALITY_SYSTEMS':
            return { ...state, qualitySystems: action.payload };
        case 'ADD_QUALITY_SYSTEM':
            return { ...state, qualitySystems: [...state.qualitySystems, action.payload] };
        case 'UPDATE_QUALITY_SYSTEM':
            return { ...state, qualitySystems: state.qualitySystems.map((q) => q.id === action.payload.id ? action.payload : q) };
        case 'SET_TRAINING_RECORDS':
            return { ...state, trainingRecords: action.payload };
        case 'ADD_TRAINING_RECORD':
            return { ...state, trainingRecords: [...state.trainingRecords, action.payload] };
        case 'UPDATE_TRAINING_RECORD':
            return { ...state, trainingRecords: state.trainingRecords.map((t) => t.id === action.payload.id ? action.payload : t) };
        case 'SET_AUDITS':
            return { ...state, audits: action.payload };
        case 'ADD_AUDIT':
            return { ...state, audits: [...state.audits, action.payload] };
        case 'UPDATE_AUDIT':
            return { ...state, audits: state.audits.map((a) => a.id === action.payload.id ? action.payload : a) };
        case 'DELETE_AUDIT':
            return { ...state, audits: state.audits.filter((a) => a.id !== action.payload) };
        case 'SET_SUPPLIERS':
            return { ...state, suppliers: action.payload };
        case 'ADD_SUPPLIER':
            return { ...state, suppliers: [...state.suppliers, action.payload] };
        case 'UPDATE_SUPPLIER':
            return { ...state, suppliers: state.suppliers.map((s) => s.id === action.payload.id ? action.payload : s) };
        case 'SET_CHANGE_CONTROLS':
            return { ...state, changeControls: action.payload };
        case 'ADD_CHANGE_CONTROL':
            return { ...state, changeControls: [...state.changeControls, action.payload] };
        case 'UPDATE_CHANGE_CONTROL':
            return { ...state, changeControls: state.changeControls.map((c) => c.id === action.payload.id ? action.payload : c) };
        case 'SET_PHARMACOPEIA_MONOGRAPHS':
            return { ...state, pharmacopeiaMonographs: action.payload };
        case 'SET_MARKET_COMPLAINTS':
            return { ...state, marketComplaints: action.payload };
        case 'ADD_MARKET_COMPLAINT':
            return { ...state, marketComplaints: [action.payload, ...state.marketComplaints] };
        case 'UPDATE_MARKET_COMPLAINT':
            return { ...state, marketComplaints: state.marketComplaints.map((c) => c.id === action.payload.id ? action.payload : c) };
        case 'DELETE_MARKET_COMPLAINT':
            return { ...state, marketComplaints: state.marketComplaints.filter((c) => c.id !== action.payload) };
        case 'SET_PRODUCT_RECALLS':
            return { ...state, productRecalls: action.payload };
        case 'ADD_PRODUCT_RECALL':
            return { ...state, productRecalls: [action.payload, ...state.productRecalls] };
        case 'UPDATE_PRODUCT_RECALL':
            return { ...state, productRecalls: state.productRecalls.map((r) => r.id === action.payload.id ? action.payload : r) };
        case 'DELETE_PRODUCT_RECALL':
            return { ...state, productRecalls: state.productRecalls.filter((r) => r.id !== action.payload) };
        case 'SET_MFRS':
            return { ...state, masterFormulas: action.payload };
        case 'ADD_MFR':
            return { ...state, masterFormulas: { ...state.masterFormulas, [action.payload.id]: action.payload } };
        case 'UPDATE_MFR':
            return { ...state, masterFormulas: { ...state.masterFormulas, [action.payload.id]: action.payload } };
        case 'DELETE_MFR':
            const newMFRs = { ...state.masterFormulas };
            delete newMFRs[action.payload];
            return { ...state, masterFormulas: newMFRs };
        case 'SET_BMRS':
            return { ...state, batchRecords: action.payload };
        case 'ADD_BMR':
            return { ...state, batchRecords: [action.payload, ...state.batchRecords] };
        case 'UPDATE_BMR':
            return { ...state, batchRecords: state.batchRecords.map((b) => b.id === action.payload.id ? action.payload : b) };
        case 'DELETE_BMR':
            return { ...state, batchRecords: state.batchRecords.filter((b) => b.id !== action.payload) };
        case 'SET_RAW_MATERIALS':
            return { ...state, rawMaterials: action.payload };
        case 'ADD_RAW_MATERIAL':
            return { ...state, rawMaterials: [...state.rawMaterials, action.payload] };
        case 'UPDATE_RAW_MATERIAL':
            return { ...state, rawMaterials: state.rawMaterials.map((m) => m.id === action.payload.id ? action.payload : m) };
        case 'DELETE_RAW_MATERIAL':
            return { ...state, rawMaterials: state.rawMaterials.filter((m) => m.id !== action.payload) };
        case 'ADD_ACTIVITY':
            return { ...state, activities: [action.payload, ...state.activities].slice(0, 50) };
        case 'SET_STABILITY_PROTOCOLS':
            return { ...state, stabilityProtocols: action.payload };
        case 'ADD_STABILITY_PROTOCOL':
            return { ...state, stabilityProtocols: [...state.stabilityProtocols, action.payload] };
        case 'UPDATE_STABILITY_PROTOCOL':
            return { ...state, stabilityProtocols: state.stabilityProtocols.map((p) => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_STABILITY_PROTOCOL':
            return { ...state, stabilityProtocols: state.stabilityProtocols.filter((p) => p.id !== action.payload) };
        case 'SET_IPQC_CHECKS':
            return { ...state, ipqcChecks: action.payload };
        case 'ADD_IPQC_CHECK':
            return { ...state, ipqcChecks: [action.payload, ...state.ipqcChecks] };
        case 'UPDATE_IPQC_CHECK':
            return { ...state, ipqcChecks: state.ipqcChecks.map((c) => c.id === action.payload.id ? action.payload : c) };
        case 'DELETE_IPQC_CHECK':
            return { ...state, ipqcChecks: state.ipqcChecks.filter((c) => c.id !== action.payload) };
        case 'SET_COA_RECORDS':
            return { ...state, coaRecords: action.payload };
        case 'ADD_COA_RECORD':
            return { ...state, coaRecords: [action.payload, ...state.coaRecords] };
        case 'UPDATE_COA_RECORD':
            return { ...state, coaRecords: state.coaRecords.map((r) => r.id === action.payload.id ? action.payload : r) };
        case 'DELETE_COA_RECORD':
            return { ...state, coaRecords: state.coaRecords.filter((r) => r.id !== action.payload) };
        case 'SET_MATERIAL_MOVEMENTS':
            return { ...state, materialMovements: action.payload };
        case 'ADD_MATERIAL_MOVEMENT':
            return { ...state, materialMovements: [action.payload, ...state.materialMovements] };
        case 'UPDATE_MATERIAL_MOVEMENT':
            return { ...state, materialMovements: state.materialMovements.map((m) => m.id === action.payload.id ? action.payload : m) };
        case 'DELETE_MATERIAL_MOVEMENT':
            return { ...state, materialMovements: state.materialMovements.filter((m) => m.id !== action.payload) };
        case 'SET_RECONCILIATION_RECORDS':
            return { ...state, reconciliationRecords: action.payload };
        case 'ADD_RECONCILIATION_RECORD':
            return { ...state, reconciliationRecords: [action.payload, ...state.reconciliationRecords] };
        case 'UPDATE_RECONCILIATION_RECORD':
            return { ...state, reconciliationRecords: state.reconciliationRecords.map((r) => r.id === action.payload.id ? action.payload : r) };
        case 'DELETE_RECONCILIATION_RECORD':
            return { ...state, reconciliationRecords: state.reconciliationRecords.filter((r) => r.id !== action.payload) };
        case 'UPDATE_DASHBOARD_STATS':
            // Stat Calculation
            const pendingTests = state.testResults.filter(t => t.status === 'Scheduled' || t.status === 'In_Progress').length;
            const oosCount = state.testResults.filter(t => t.overallResult === 'OOS').length;
            const openDeviations = state.deviations.filter(d => d.status !== 'Closed').length;
            const openCAPAs = state.capas.filter(c => c.status !== 'Closed').length;
            const upcomingCalibrations = state.equipment.filter(e => {
                if (!e.calibrationSchedule.nextCalibration) return false;
                const daysUntil = Math.ceil((new Date(e.calibrationSchedule.nextCalibration).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return daysUntil <= 30 && daysUntil >= 0;
            }).length;
            const expiringProducts = state.products.filter(p => {
                const daysUntil = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return daysUntil <= 90 && daysUntil >= 0;
            }).length;
            const productsByStatus = state.products.reduce((acc, product) => {
                acc[product.status] = (acc[product.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const openComplaints = state.marketComplaints.filter(c => c.status !== 'Closed' && c.status !== 'Invalid').length;
            const activeRecalls = state.productRecalls.filter(r => r.status === 'In_Progress').length;

            return {
                ...state,
                dashboardStats: {
                    totalProducts: state.products.length,
                    productsByStatus: {
                        Quarantine: productsByStatus['Quarantine'] || 0,
                        Approved: productsByStatus['Approved'] || 0,
                        Rejected: productsByStatus['Rejected'] || 0,
                        Released: productsByStatus['Released'] || 0,
                        Blocked: productsByStatus['Blocked'] || 0,
                        Expired: productsByStatus['Expired'] || 0,
                        Under_Test: productsByStatus['Under_Test'] || 0,
                    },
                    pendingTests, oosCount, openDeviations, openCAPAs, upcomingCalibrations, expiringProducts, openComplaints, activeRecalls,
                    recentActivities: state.activities.slice(0, 10),
                },
            };
        case 'ADD_TEST_METHOD_PDF':
            const { testMethodId, pdfUrl } = action.payload;
            const updatedMethods = state.testMethods.map(method =>
              method.id === testMethodId ? { ...method, pdfUrl } : method
            );
            return { ...state, testMethods: updatedMethods };

        case 'FETCH_BATCH_TESTS_FOR_COA':
            const { batchNumber, coaId } = action.payload;
            // Filter test results for this batch
            const batchTests = state.testResults
              .filter(result => result.batchNumber === batchNumber)
              .map(result => ({
                test: result.testMethodId, // or method name if needed
                specification: 'See Test Result #' + result.id,
                result: result.overallResult || 'Pass',
                status: result.overallResult === 'Pass' ? 'Pass' : 'Fail'
              } as any));
            
            if (coaId) {
              // Update existing COA
              const updatedCOAs = state.coaRecords.map(coa =>
                coa.id === coaId
                  ? { ...coa, testResults: [...coa.testResults, ...batchTests] }
                  : coa
              );
              return { ...state, coaRecords: updatedCOAs };
            } else {
              // Return new tests (handled in component)
              console.log('Fetched batch tests:', batchTests);
              return state;
            }

        case 'INITIALIZE_DATA':
            return state;
        default:
            return state;
    }
}

// ==================== Reducer with DB Persistence ====================
export function appReducerWithPersistence(state: AppState, action: Action): AppState {
    const newState = appReducer(state, action);

    switch (action.type) {
        case 'ADD_PRODUCT': case 'UPDATE_PRODUCT':
            db.products.put(action.payload); break;
        case 'DELETE_PRODUCT':
            db.products.delete(action.payload); break;
        case 'ADD_TEST_METHOD': case 'UPDATE_TEST_METHOD':
            db.testMethods.put(action.payload); break;
        case 'DELETE_TEST_METHOD':
            db.testMethods.delete(action.payload); break;
        case 'ADD_TEST_RESULT': case 'UPDATE_TEST_RESULT':
            db.testResults.put(action.payload); break;
        case 'DELETE_TEST_RESULT':
            db.testResults.delete(action.payload); break;
        case 'ADD_EQUIPMENT': case 'UPDATE_EQUIPMENT':
            db.equipment.put(action.payload); break;
        case 'ADD_CAPA': case 'UPDATE_CAPA':
            db.capas.put(action.payload); break;
        case 'DELETE_CAPA':
            db.capas.delete(action.payload); break;
        case 'ADD_DEVIATION': case 'UPDATE_DEVIATION':
            db.deviations.put(action.payload); break;
        case 'DELETE_DEVIATION':
            db.deviations.delete(action.payload); break;
        case 'ADD_CHEMICAL_REAGENT': case 'UPDATE_CHEMICAL_REAGENT':
            db.chemicalReagents.put(action.payload); break;
        case 'ADD_REFERENCE_STANDARD': case 'UPDATE_REFERENCE_STANDARD':
            db.referenceStandards.put(action.payload); break;
        case 'ADD_QUALITY_SYSTEM': case 'UPDATE_QUALITY_SYSTEM':
            db.qualitySystems.put(action.payload); break;
        case 'ADD_TRAINING_RECORD': case 'UPDATE_TRAINING_RECORD':
            db.trainingRecords.put(action.payload); break;
        case 'ADD_AUDIT': case 'UPDATE_AUDIT':
            db.audits.put(action.payload); break;
        case 'DELETE_AUDIT':
            db.audits.delete(action.payload); break;
        case 'ADD_SUPPLIER': case 'UPDATE_SUPPLIER':
            db.suppliers.put(action.payload); break;
        case 'ADD_CHANGE_CONTROL': case 'UPDATE_CHANGE_CONTROL':
            db.changeControls.put(action.payload); break;
        case 'ADD_MARKET_COMPLAINT': case 'UPDATE_MARKET_COMPLAINT':
            db.marketComplaints.put(action.payload); break;
        case 'DELETE_MARKET_COMPLAINT':
            db.marketComplaints.delete(action.payload); break;
        case 'ADD_PRODUCT_RECALL': case 'UPDATE_PRODUCT_RECALL':
            db.productRecalls.put(action.payload); break;
        case 'DELETE_PRODUCT_RECALL':
            db.productRecalls.delete(action.payload); break;
        case 'ADD_MFR': case 'UPDATE_MFR':
            db.masterFormulas.put(action.payload); break;
        case 'DELETE_MFR':
            db.masterFormulas.delete(action.payload); break;
        case 'ADD_BMR': case 'UPDATE_BMR':
            db.batchRecords.put(action.payload); break;
        case 'DELETE_BMR':
            db.batchRecords.delete(action.payload); break;
        case 'ADD_RAW_MATERIAL': case 'UPDATE_RAW_MATERIAL':
            db.rawMaterials.put(action.payload); break;
        case 'DELETE_RAW_MATERIAL':
            db.rawMaterials.delete(action.payload); break;
        case 'ADD_STABILITY_PROTOCOL': case 'UPDATE_STABILITY_PROTOCOL':
            db.stabilityProtocols.put(action.payload); break;
        case 'DELETE_STABILITY_PROTOCOL':
            db.stabilityProtocols.delete(action.payload); break;
        case 'ADD_IPQC_CHECK': case 'UPDATE_IPQC_CHECK':
            db.ipqcChecks.put(action.payload); break;
        case 'DELETE_IPQC_CHECK':
            db.ipqcChecks.delete(action.payload); break;
        case 'ADD_COA_RECORD': case 'UPDATE_COA_RECORD':
            db.coaRecords.put(action.payload); break;
        case 'DELETE_COA_RECORD':
            db.coaRecords.delete(action.payload); break;
        case 'ADD_MATERIAL_MOVEMENT': case 'UPDATE_MATERIAL_MOVEMENT':
            db.materialMovements.put(action.payload); break;
        case 'DELETE_MATERIAL_MOVEMENT':
            db.materialMovements.delete(action.payload); break;
        case 'ADD_RECONCILIATION_RECORD': case 'UPDATE_RECONCILIATION_RECORD':
            db.reconciliationRecords.put(action.payload); break;
        case 'DELETE_RECONCILIATION_RECORD':
            db.reconciliationRecords.delete(action.payload); break;
        case 'ADD_ACTIVITY':
            if ((action.payload as any).id) db.activities.put(action.payload);
            break;
        case 'ADD_TEST_METHOD_PDF': {
            const { testMethodId, pdfUrl } = action.payload;
            // Note: Component should pass full updated TestMethod or handle separately
            // For now, skip DB put to avoid type error; use UPDATE_TEST_METHOD in component
            break;
          }
        case 'UPDATE_TEST_METHOD':
            db.testMethods.put(action.payload);
            break;
        case 'FETCH_BATCH_TESTS_FOR_COA':
            // No direct DB change, handled in component
            break;
    }

    return newState;
}

// ==================== Migration Helper ====================
export async function migrateFromLocalStorage() {
    const parse = (key: string) => {
        const item = localStorage.getItem(key);
        if (!item) return [];
        try { return JSON.parse(item); } catch { return []; }
    };

    await db.transaction('rw', db.tables, async () => {
        await db.products.bulkPut(parse(STORAGE_KEYS.PRODUCTS));
        await db.testMethods.bulkPut(parse(STORAGE_KEYS.TEST_METHODS));
        await db.testResults.bulkPut(parse(STORAGE_KEYS.TEST_RESULTS));
        await db.capas.bulkPut(parse(STORAGE_KEYS.CAPAS));
        await db.deviations.bulkPut(parse(STORAGE_KEYS.DEVIATIONS));
        await db.equipment.bulkPut(parse(STORAGE_KEYS.EQUIPMENT));
        await db.chemicalReagents.bulkPut(parse(STORAGE_KEYS.CHEMICAL_REAGENTS));
        await db.referenceStandards.bulkPut(parse(STORAGE_KEYS.REFERENCE_STANDARDS));
        await db.qualitySystems.bulkPut(parse(STORAGE_KEYS.QUALITY_SYSTEMS));
        await db.trainingRecords.bulkPut(parse(STORAGE_KEYS.TRAINING_RECORDS));
        await db.audits.bulkPut(parse(STORAGE_KEYS.AUDITS));
        await db.suppliers.bulkPut(parse(STORAGE_KEYS.SUPPLIERS));
        await db.changeControls.bulkPut(parse(STORAGE_KEYS.CHANGE_CONTROLS));
        await db.marketComplaints.bulkPut(parse(STORAGE_KEYS.MARKET_COMPLAINTS));
        await db.productRecalls.bulkPut(parse(STORAGE_KEYS.PRODUCT_RECALLS));
        await db.batchRecords.bulkPut(parse(STORAGE_KEYS.BATCH_RECORDS));
        await db.stabilityProtocols.bulkPut(parse(STORAGE_KEYS.STABILITY_PROTOCOLS));
        await db.rawMaterials.bulkPut(parse(STORAGE_KEYS.RAW_MATERIALS));

        const mfrs = parse(STORAGE_KEYS.MASTER_FORMULAS);
        if (!Array.isArray(mfrs) && typeof mfrs === 'object') {
            await db.masterFormulas.bulkPut(Object.values(mfrs));
        } else if (Array.isArray(mfrs)) {
            await db.masterFormulas.bulkPut(mfrs);
        }
    });
}
