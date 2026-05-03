
import Dexie, { type Table } from 'dexie';
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
    Notification,
} from '@/types';
import { type MasterFormula } from '@/data/mfrData';
import { type BatchRecord } from '@/data/bmrData';

export class PharmaDB extends Dexie {
    products!: Table<PharmaceuticalProduct, string>;
    testMethods!: Table<TestMethod, string>;
    testResults!: Table<TestResult, string>;
    capas!: Table<CAPA, string>;
    deviations!: Table<Deviation, string>;
    equipment!: Table<Equipment, string>;
    chemicalReagents!: Table<ChemicalReagent, string>;
    referenceStandards!: Table<ReferenceStandard, string>;
    qualitySystems!: Table<QualitySystem, string>;
    trainingRecords!: Table<TrainingRecord, string>;
    audits!: Table<Audit, string>;
    suppliers!: Table<Supplier, string>;
    changeControls!: Table<ChangeControl, string>;
    pharmacopeiaMonographs!: Table<PharmacopeiaMonograph, string>;
    marketComplaints!: Table<MarketComplaint, string>;
    productRecalls!: Table<ProductRecall, string>;
    stabilityProtocols!: Table<StabilityProtocol, string>;
    ipqcChecks!: Table<IPQCCheck, string>;
    coaRecords!: Table<COARecord, string>;
    masterFormulas!: Table<MasterFormula, string>;
    batchRecords!: Table<BatchRecord, string>;
    rawMaterials!: Table<RawMaterial, string>;
    materialMovements!: Table<MaterialMovement, string>;
    reconciliationRecords!: Table<ReconciliationRecord, string>;
    notifications!: Table<Notification, string>;
    activities!: Table<Activity, string>;
    // Key-value store for singletons like stats
    keyValueStore!: Table<{ key: string; value: unknown }, string>;

    constructor() {
        super('PharmaQMSDB');

        // Define schema
        // We index by 'id' for most. 
        this.version(1).stores({
            products: 'id, status, name', // Index frequently queried fields
            testMethods: 'id, name, status',
            testResults: 'id, batchNumber, sampleId, status, overallResult',
            capas: 'id, status',
            deviations: 'id, status, type',
            equipment: 'id, status, name',
            chemicalReagents: 'id, name, expiryDate',
            referenceStandards: 'id, name, expiryDate',
            qualitySystems: 'id, type, status',
            trainingRecords: 'id, employeeName, status',
            audits: 'id, type, status, scheduledDate',
            suppliers: 'id, name, status, qualificationStatus',
            changeControls: 'id, status, type',
            pharmacopeiaMonographs: 'id, title, version',
            marketComplaints: 'id, status, severity',
            productRecalls: 'id, status, recallClass',
            stabilityProtocols: 'id, protocolNumber, status, productId',
            masterFormulas: 'id, productCode, name',
            batchRecords: 'id, batchNumber, status, productId',
            activities: 'id, type, timestamp', // Assuming activities have IDs, if not need auto-inc '++id'
            keyValueStore: 'key'
        });

this.version(6).stores({
            rawMaterials: 'id, name, batchNumber, status, type, productionDate, manufacturingDate',
            coaRecords: 'id, productName, coaNumber, status, analysisDate, productionDate',
            ipqcChecks: 'id, stage, status, batchNumber'
        });

        this.version(8).stores({
            materialMovements: 'id, materialId, batchId, type, timestamp',
            reconciliationRecords: 'id, batchId, productId, percentageYield',
            notifications: 'id, read, type, time'
        });

    }
}

export const db = new PharmaDB();
