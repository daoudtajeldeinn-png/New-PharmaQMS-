
import { type Ingredient } from './mfrData';

export interface BatchIngredient extends Ingredient {
    standardQty: number;
}

export interface BMRStepExecution {
    realizedValue: any;
    stepNumber: number;
    phase?: 'Manufacturing' | 'Packaging';
    description: string;
    plannedDuration?: string;
    startedAt?: string;
    completedAt?: string;
    operatorSignature?: string;
    supervisorSignature?: string;
    qaSignature?: string;
    status: 'Pending' | 'In-Progress' | 'Completed' | 'Skipped';
    comments?: string;
    realizedParameters?: Record<string, string>;
    instructionChecklist?: { text: string; completed: boolean }[];
}

export interface MaterialVerification {
    itemCode: string;
    actualQty: number;
    verifiedBy: string;
    verifiedAt: string;
}

export interface BatchRecord {
    id: string;
    batchNumber: string;
    mfrId: string; // Linked MFR
    productName: string;
    batchSize: number;
    batchSizeUnit: string;
    mfgDate: string;
    expiryDate: string;
    status: 'Issuance' | 'Manufacturing' | 'Quarantine' | 'Released' | 'Rejected';
    issuanceDate: string;
    issuedBy: string;
    stepExecutions: BMRStepExecution[];
    materialVerifications?: MaterialVerification[];
    ingredients?: BatchIngredient[];
    actualYield?: number;
}

export const batchRecords: BatchRecord[] = [
    {
        id: "bmr_001",
        batchNumber: "BN2402001",
        mfrId: "aspruna_100",
        productName: "Aspirin 100mg Tablets",
        batchSize: 100000,
        batchSizeUnit: "Tablets",
        mfgDate: "2024-02-01",
        expiryDate: "2027-02-01",
        status: "Manufacturing",
        issuanceDate: "2024-02-01",
        issuedBy: "Production Manager",
        stepExecutions: [
            { stepNumber: 1, description: "Sifting and Wet Granulation", status: "Completed", startedAt: "2024-02-01 08:00", completedAt: "2024-02-01 12:00", operatorSignature: "John Doe" },
            { stepNumber: 2, description: "Final lubrication", status: "In-Progress", startedAt: "2024-02-01 14:00" },
            { stepNumber: 3, description: "Compression", status: "Pending" }
        ]
    },
    {
        id: "bmr_paramol_real",
        batchNumber: "PM2026-0457",
        mfrId: "paramol_500",
        productName: "Paramol 500mg Tablets",
        batchSize: 750000,
        batchSizeUnit: "Tablets",
        mfgDate: "2026-02-08",
        expiryDate: "2030-02-08",
        status: "Manufacturing",
        issuanceDate: "2026-02-08",
        issuedBy: "QA Director",
        stepExecutions: [
            { stepNumber: 1, phase: 'Manufacturing', description: "Raw material weighing under RLAF. Double verification of API (375kg) and Excipients (82kg).", status: "Completed", startedAt: "08:15 AM", completedAt: "10:30 AM", operatorSignature: "Opr. Khalid", supervisorSignature: "Sup. Ahmed", qaSignature: "QA Sara" },
            { stepNumber: 2, phase: 'Manufacturing', description: "Sifting of API (375kg) and Excipients", status: "Completed", startedAt: "11:00 AM", completedAt: "01:30 PM", operatorSignature: "Opr. Khalid", supervisorSignature: "Sup. Ahmed" },
            { stepNumber: 3, phase: 'Manufacturing', description: "Wet Granulation (High Shear Mixing)", status: "In-Progress", startedAt: "02:00 PM", operatorSignature: "Opr. Khalid", plannedDuration: "45 min" },
            { stepNumber: 8, phase: 'Packaging', description: "Blistering - Secondary Packaging", status: "Pending", plannedDuration: "240 min" }
        ],
        materialVerifications: [
            { itemCode: "PARA-DC", actualQty: 375, verifiedBy: "QA Sara", verifiedAt: "09:40 AM" }
        ]
    }
];
