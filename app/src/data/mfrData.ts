export interface Ingredient {
    itemCode: string;
    description: string;
    quantity: number;
    unit: string;
    category: 'API' | 'Excipient' | 'Packaging';
}

export interface ProcessStep {
    stepNumber: number;
    phase: 'Manufacturing' | 'Packaging';
    department: string;
    description: string;
    instructions: string[]; // Detailed SOP-like steps for operators
    precautions?: string[]; // Safety/Quality warnings
    criticalParameters: string[];
    plannedDuration?: string;
    roomConditions?: {
        temp: string;
        humidity: string;
    };
    equipmentId?: string;
    roleRequired: string;
}

export interface MasterFormula {
    id: string;
    productName: string;
    mfrNumber: string;
    revisionNumber: string;
    effectiveDate: string;
    batchSize: number;
    batchSizeUnit: string;
    strength: string;
    dosageForm: string;
    shelfLife: string;
    theoreticalYieldRange: { min: number; max: number };
    lineClearanceRequired: boolean;
    ingredients: Ingredient[];
    processSteps: ProcessStep[];
    status?: 'Draft' | 'Approved' | 'Closed';
    preparedBy?: string;
    checkedBy?: string;
    approvedBy?: string;
}

export const masterFormulas: Record<string, MasterFormula> = {
    "aspruna_75_pink": {
        id: "aspruna_75_pink",
        productName: "Aspruna 75mg Tablets (Pink Starch)",
        mfrNumber: "MFR/ASPR/75P",
        revisionNumber: "02 (2026)",
        effectiveDate: "2026-02-01",
        batchSize: 150000,
        batchSizeUnit: "Tablets",
        strength: "75mg",
        dosageForm: "Tablet",
        shelfLife: "36 Months",
        theoreticalYieldRange: { min: 98.5, max: 100.5 },
        lineClearanceRequired: true,
        ingredients: [
            { itemCode: "ASA-BP", description: "Aspirin (API) BP Grade", quantity: 11.25, unit: "kg", category: "API" },
            { itemCode: "ST-PINK", description: "Pink Starch (Colorant & Binder)", quantity: 0.75, unit: "kg", category: "Excipient" },
            { itemCode: "MCC-102", description: "Microcrystalline Cellulose PH 102", quantity: 7.5, unit: "kg", category: "Excipient" },
            { itemCode: "ST-MAIZE", description: "Starch Maize (Natural)", quantity: 3.0, unit: "kg", category: "Excipient" },
            { itemCode: "TALC-P", description: "Talcum Powder Purified", quantity: 0.3, unit: "kg", category: "Excipient" },
            { itemCode: "MAG-ST", description: "Magnesium Stearate", quantity: 0.15, unit: "kg", category: "Excipient" }
        ],
        processSteps: [
            { stepNumber: 1, phase: 'Manufacturing', department: "Dispensing", description: "Raw material weighing under LAF. Special care for Pink Starch handling to avoid cross-contamination.", instructions: [], criticalParameters: ["Weight Verification", "Pink Starch Potency"], roleRequired: "QA", plannedDuration: "60 min" },
            { stepNumber: 2, phase: 'Manufacturing', department: "Granulation", description: "Dry Mixing of ASA and Starch. Addition of Pink Starch binder solution.", instructions: [], criticalParameters: ["Mixing Time: 15 min", "Impeller Speed: 120 rpm"], roomConditions: { temp: "21°C", humidity: "40%" }, roleRequired: "Supervisor", plannedDuration: "45 min" },
            { stepNumber: 3, phase: 'Manufacturing', department: "Compression", description: "Compression on Rotary Press. Tablets must show uniform pink color.", instructions: [], criticalParameters: ["Hardness: 3-5kp", "Avg Weight: 153mg ± 5%"], roleRequired: "QA", plannedDuration: "120 min" },
            { stepNumber: 4, phase: 'Packaging', department: "Blistering", description: "Packing into Alu-PVC blisters.", instructions: [], criticalParameters: ["Sealing Temp: 160°C", "Leak Test"], roleRequired: "Operator", plannedDuration: "90 min" },
            { stepNumber: 5, phase: 'Packaging', department: "Cartoning", description: "Final secondary packaging with leaflet.", instructions: [], criticalParameters: ["Batch Coding", "Leaflet Count"], roleRequired: "Supervisor", plannedDuration: "60 min" }
        ]
    },
    "aspruna_100": {
        id: "aspruna_100",
        productName: "Aspruna 100mg Tablets",
        mfrNumber: "MFR/ASPR/100",
        revisionNumber: "01",
        effectiveDate: "2024-01-01",
        batchSize: 100000,
        batchSizeUnit: "Tablets",
        strength: "100mg",
        dosageForm: "Tablet",
        shelfLife: "36 Months",
        theoreticalYieldRange: { min: 98.0, max: 100.5 },
        lineClearanceRequired: true,
        ingredients: [
            { itemCode: "ASA-BP", description: "Aspirin BP", quantity: 10.0, unit: "kg", category: "API" },
            { itemCode: "MCC-101", description: "MCC PH 101", quantity: 5.0, unit: "kg", category: "Excipient" },
            { itemCode: "ST-M", description: "Starch Maize", quantity: 2.0, unit: "kg", category: "Excipient" }
        ],
        processSteps: [
            { stepNumber: 1, phase: 'Manufacturing', department: "Dispensing", description: "Verification and Weighing of active ASA and excipients.", instructions: [], criticalParameters: ["Scale Zeroing", "Potency Check"], roleRequired: "QA", plannedDuration: "45 min" },
            { stepNumber: 2, phase: 'Manufacturing', department: "Mixing", description: "Dry blending in octagonal blender to ensure drug uniformity.", instructions: [], criticalParameters: ["Speed: 15 rpm", "Time: 20 min"], roleRequired: "Supervisor", plannedDuration: "30 min" },
            { stepNumber: 3, phase: 'Manufacturing', department: "Compression", description: "Direct compression into white round tablets.", instructions: [], criticalParameters: ["Weight: 172mg ± 7%", "Friability: < 1.0%"], roleRequired: "QA", plannedDuration: "90 min" },
            { stepNumber: 4, phase: 'Packaging', department: "Bulk Packing", description: "Packing in HDPE containers with desiccant.", instructions: [], criticalParameters: ["Cap Torque", "Seal Integrity"], roleRequired: "Operator", plannedDuration: "45 min" }
        ]
    },
    "aspruna_300": {
        id: "aspruna_300",
        productName: "Aspruna 300mg Tablets",
        mfrNumber: "MFR/ASPR/300",
        revisionNumber: "01",
        effectiveDate: "2024-01-01",
        batchSize: 100000,
        batchSizeUnit: "Tablets",
        strength: "300mg",
        dosageForm: "Tablet",
        shelfLife: "36 Months",
        theoreticalYieldRange: { min: 98.0, max: 101.0 },
        lineClearanceRequired: true,
        ingredients: [
            { itemCode: "ASA-BP", description: "Aspirin BP", quantity: 30.0, unit: "kg", category: "API" },
            { itemCode: "ST-M", description: "Starch Maize", quantity: 10.0, unit: "kg", category: "Excipient" }
        ],
        processSteps: [
            { stepNumber: 1, phase: 'Manufacturing', department: "Dispensing", description: "Weighing of materials for 300mg high dose batch.", instructions: [], criticalParameters: ["Weight Verification"], roleRequired: "QA", plannedDuration: "45 min" },
            { stepNumber: 2, phase: 'Manufacturing', department: "Mixing", description: "Dry Mixing of API and Starch.", instructions: [], criticalParameters: ["20 min blending"], roleRequired: "Supervisor", plannedDuration: "40 min" },
            { stepNumber: 3, phase: 'Manufacturing', department: "Compression", description: "Direct Compression. Flat faced tablets.", instructions: [], criticalParameters: ["Hardness 6-9kp", "Weight: 400mg"], roleRequired: "QA", plannedDuration: "100 min" },
            { stepNumber: 4, phase: 'Packaging', department: "Blistering", description: "Packing into PVC/Alu cold form.", instructions: [], criticalParameters: ["Forming Temp", "Sealing Pressure"], roleRequired: "Operator", plannedDuration: "120 min" }
        ]
    },
    "mfr_metro_500": {
        id: "mfr_metro_500",
        productName: "Metronidazole 500mg Tablets BP",
        mfrNumber: "MFR/TAB/MT-500/02",
        revisionNumber: "02 (GXP)",
        effectiveDate: "2026-01-15",
        batchSize: 100000,
        batchSizeUnit: "Tablets",
        strength: "500mg",
        dosageForm: "Tablet (Scored)",
        shelfLife: "36 Months",
        theoreticalYieldRange: { min: 98.5, max: 101.5 },
        lineClearanceRequired: true,
        ingredients: [
            { itemCode: "MT-API", description: "Metronidazole BP API (Granular)", quantity: 50.0, unit: "kg", category: "API" },
            { itemCode: "MCC-102", description: "Microcrystalline Cellulose PH-102", quantity: 8.5, unit: "kg", category: "Excipient" },
            { itemCode: "PVP-K30", description: "Povidone K-30 (Binder)", quantity: 1.5, unit: "kg", category: "Excipient" },
            { itemCode: "SSG-B", description: "Sodium Starch Glycolate", quantity: 2.0, unit: "kg", category: "Excipient" },
            { itemCode: "TALC-P", description: "Talcum Powder Purified", quantity: 0.5, unit: "kg", category: "Excipient" },
            { itemCode: "MAG-ST", description: "Magnesium Stearate", quantity: 0.5, unit: "kg", category: "Excipient" }
        ],
        processSteps: [
            { stepNumber: 1, phase: 'Manufacturing', department: "Dispensing", description: "Electronic verification and weighing of all raw materials under Reverse Laminar Air Flow (RLAF).", instructions: [], criticalParameters: ["Balance Calibration", "Potency Correction"], roleRequired: "QA", plannedDuration: "60 min" },
            { stepNumber: 2, phase: 'Manufacturing', department: "Granulation", description: "Dry mixing of MT-API and MCC for 15 mins. Wet granulation with Povidone solution in RMG.", instructions: [], criticalParameters: ["Mixing Speed: 120 rpm", "Binder Addition Time: 5 min"], roomConditions: { temp: "22°C", humidity: "45%" }, roleRequired: "Supervisor", plannedDuration: "50 min" },
            { stepNumber: 3, phase: 'Manufacturing', department: "Drying", description: "Drying in Fluid Bed Dryer (FBD) until LOD reaches 1.5 - 2.0%.", instructions: [], criticalParameters: ["Inlet Temp: 60°C", "LOD Target: 1.8%"], roleRequired: "Supervisor", plannedDuration: "120 min" },
            { stepNumber: 4, phase: 'Manufacturing', department: "Lubrication", description: "Sifting through 40 mesh and blending with Talc and Magnesium Stearate in Octagonal Blender.", instructions: [], criticalParameters: ["Blending: 10 min", "Speed: 15 rpm"], roleRequired: "Supervisor", plannedDuration: "30 min" },
            { stepNumber: 5, phase: 'Manufacturing', department: "Compression", description: "Compression on 27-station D-tooling Rotary Press. Scored round biconvex tablets.", instructions: [], criticalParameters: ["Avg Weight: 630mg", "Hardness: 8-12 kp", "Thickness: 4.5mm"], roleRequired: "QA", plannedDuration: "180 min" },
            { stepNumber: 6, phase: 'Packaging', department: "Blistering", description: "Tropical pack (PVC/Alu/Alu) for moisture protection.", instructions: [], criticalParameters: ["Pocket Depth", "Seal Pattern"], roleRequired: "Operator", plannedDuration: "150 min" },
            { stepNumber: 7, phase: 'Packaging', department: "Final Boxing", description: "Boxing of 10 blisters per unit carton.", instructions: [], criticalParameters: ["Expiry Print Clarity", "Leaflet version"], roleRequired: "Supervisor", plannedDuration: "60 min" }
        ]
    },
    "povidone_iodine_10_stab": {
        id: "povidone_iodine_10_stab",
        productName: "Povidone Iodine 10% (Stabilized)",
        mfrNumber: "MFR/PD-STAB/500L",
        revisionNumber: "02 (2025)",
        effectiveDate: "2025-10-21",
        batchSize: 500,
        batchSizeUnit: "Liters",
        strength: "10% Avail. Iodine",
        dosageForm: "Solution / Antiseptic",
        shelfLife: "12 Months Post-Correction",
        theoreticalYieldRange: { min: 98.0, max: 101.0 },
        lineClearanceRequired: true,
        ingredients: [
            { itemCode: "SMB-001", description: "Sodium Metabisulfite (SMB)", quantity: 0.375, unit: "kg", category: "Excipient" },
            { itemCode: "CIT-ANH", description: "Citric Acid (Anhydrous)", quantity: 0.75, unit: "kg", category: "Excipient" },
            { itemCode: "PVP-K30", description: "Extra Povidone K30 (Stabilizer)", quantity: 3.5, unit: "kg", category: "Excipient" },
            { itemCode: "NaOH-10", description: "Sodium Hydroxide 10% Solution", quantity: 0.5, unit: "L", category: "Excipient" },
            { itemCode: "PD-BATCH", description: "Affected Povidone Iodine Bulk", quantity: 500, unit: "L", category: "API" }
        ],
        processSteps: [
            { stepNumber: 1, phase: 'Manufacturing', department: "Stabilization", description: "Pilot Test: Scale-down stabilization on 1L sample to verify pH adjustment response.", instructions: [], criticalParameters: ["Initial pH", "Iodine Assay"], roleRequired: "QA / Technical", plannedDuration: "45 min" },
            { stepNumber: 2, phase: 'Manufacturing', department: "Stabilization", description: "Full Batch: Gradual addition of Citric Acid solution while monitoring pH trend.", instructions: [], criticalParameters: ["pH Target: 4.8", "Stirring Speed: 300 rpm"], roleRequired: "Supervisor", plannedDuration: "90 min" },
            { stepNumber: 3, phase: 'Manufacturing', department: "Stabilization", description: "pH Upward Adjustment: Slow addition of NaOH 10% until stable 4.8 pH is achieved.", instructions: [], criticalParameters: ["pH Max: 5.2", "Addition Rate"], roleRequired: "QA", plannedDuration: "60 min" },
            { stepNumber: 4, phase: 'Manufacturing', department: "Stabilization", description: "Addition of SMB and extra PVP K30. Agitate for 60 mins.", instructions: [], criticalParameters: ["Visual Clarity", "PVP Dissolution"], roleRequired: "Supervisor", plannedDuration: "60 min" },
            { stepNumber: 5, phase: 'Manufacturing', department: "Filtration", description: "Final Stage: 0.45 micron filtration into clean bulk container.", instructions: [], criticalParameters: ["Filter Integrity", "Bioburden Check"], roleRequired: "QA", plannedDuration: "120 min" },
            { stepNumber: 6, phase: 'Packaging', department: "Filling", description: "Filling into 100mL amber PET bottles.", instructions: [], criticalParameters: ["Fill Weight: 100g", "Cap Tightness"], roleRequired: "Operator", plannedDuration: "180 min" }
        ]
    },
    "paramol_500": {
        id: "paramol_500",
        productName: "Paramol 500mg Tablets (Paracetamol BP/USP)",
        mfrNumber: "MFR/TAB/PM-500/A/2026",
        revisionNumber: "04 (GMP COMPLIANT)",
        effectiveDate: "2026-02-08",
        batchSize: 750000,
        batchSizeUnit: "Tablets",
        strength: "500mg",
        dosageForm: "Tablet (Scored)",
        shelfLife: "48 Months",
        theoreticalYieldRange: { min: 98.5, max: 101.0 },
        lineClearanceRequired: true,
        ingredients: [
            { itemCode: "PARA-DC", description: "Paracetamol BP Direct Compression Grade (API)", quantity: 375.0, unit: "kg", category: "API" },
            { itemCode: "ST-M10", description: "Starch Maize BP (Pasturized)", quantity: 48.5, unit: "kg", category: "Excipient" },
            { itemCode: "MCC-101", description: "Microcrystalline Cellulose (Avicel PH101)", quantity: 25.0, unit: "kg", category: "Excipient" },
            { itemCode: "PVP-K30", description: "Povidone K-30 (Ph. Eur.)", quantity: 7.5, unit: "kg", category: "Excipient" },
            { itemCode: "MAG-ST", description: "Magnesium Stearate USP-NF", quantity: 1.0, unit: "kg", category: "Excipient" }
        ],
        processSteps: [
            {
                stepNumber: 1,
                phase: 'Manufacturing',
                department: "Dispensing",
                description: "Raw material weighing under RLAF. Double verification of API (375kg) and Excipients (82kg).",
                instructions: [
                    "Verify line clearance before starting",
                    "Calibrate weighing scales and log results",
                    "Weigh Paracetamol DC (375kg) into clean containers",
                    "Weigh Excipients separately and label each bag clearly",
                    "Perform weight check with QA supervisor"
                ],
                precautions: ["Always wear a mask", "Avoid powder dust accumulation"],
                criticalParameters: ["Scale Calibration", "Material ID"],
                roomConditions: { temp: "22 ± 2°C", humidity: "45 ± 5%" },
                roleRequired: "Operator + QA"
            },
            {
                stepNumber: 2,
                phase: 'Manufacturing',
                department: "Sifting",
                description: "Sifting of API and excipients.",
                instructions: [
                    "Check mesh size (40 mesh)",
                    "Pass API through the sifter gradually",
                    "Check for any foreign particles or clumps",
                    "Collect sifted material in double polybags"
                ],
                criticalParameters: ["Mesh Integrity"],
                roleRequired: "Supervisor"
            },
            {
                stepNumber: 3,
                phase: 'Manufacturing',
                department: "Wet Granulation",
                description: "High shear mixing in RMG 600L.",
                instructions: [
                    "Load sifted dry materials into RMG",
                    "Mix for 5 minutes (Slow Speed)",
                    "Prepare Starch Paste in Binder Tank (80°C)",
                    "Add binder solution gradually over 5 minutes",
                    "Continue kneading until desired granule consistency is reached"
                ],
                precautions: ["Ensure RMG lid is locked", "Do not open while chopper is running"],
                criticalParameters: ["Impeller: 100rpm", "Chopper: 1500rpm"],
                roomConditions: { temp: "23°C", humidity: "50%" },
                roleRequired: "Supervisor",
                plannedDuration: "45 min"
            },
            {
                stepNumber: 4,
                phase: 'Manufacturing',
                department: "Drying",
                description: "Fluid Bed Drying of wet granules.",
                instructions: [
                    "Transfer wet granules to FBD bowls",
                    "Set Inlet Temperature to 65°C",
                    "Start fluidization (Medium Air Flow)",
                    "Turn granules every 30 minutes for uniform drying",
                    "Take sample for LOD testing after 90 minutes"
                ],
                criticalParameters: ["Inlet Temp: 65°C", "LOD Target: < 2.0%"],
                roleRequired: "Operator",
                plannedDuration: "120 min"
            },
            {
                stepNumber: 5,
                phase: 'Manufacturing',
                department: "Milling",
                description: "Sizing of dried granules.",
                instructions: [
                    "Set up Multi-mill with 1.5mm screen",
                    "Check direction of blades (Knife edge for milling)",
                    "Feed dry granules through the mill",
                    "Ensure no blockage in the screen"
                ],
                criticalParameters: ["Screen Size: 1.5mm", "Mill Speed"],
                roleRequired: "Operator",
                plannedDuration: "30 min"
            },
            {
                stepNumber: 6,
                phase: 'Manufacturing',
                department: "Final Blending",
                description: "Blending with Lubricants.",
                instructions: [
                    "Transfer milled granules to Mixer",
                    "Add sifted Magnesium Stearate",
                    "Close Mixer lid and secure clamps",
                    "Blend for exactly 10 minutes at 12 rpm"
                ],
                criticalParameters: ["Blending Time", "Speed"],
                roleRequired: "Supervisor",
                plannedDuration: "15 min"
            },
            {
                stepNumber: 7,
                phase: 'Manufacturing',
                department: "Compression",
                description: "Compression on Rotary Press.",
                instructions: [
                    "Clean compression room and machine",
                    "Load granules into hopper",
                    "Adjust weight to 609.3mg target",
                    "Check tablet hardness every 30 minutes",
                    "Perform friability test every 2 hours"
                ],
                criticalParameters: ["Avg Weight: 609.3mg", "Hardness: 8-12 kp"],
                roleRequired: "QA",
                plannedDuration: "360 min"
            },
            {
                stepNumber: 8,
                phase: 'Packaging',
                department: "Blistering",
                description: "Primary packaging in Alu-PVC blisters.",
                instructions: [
                    "Load PVC film and Aluminum foil",
                    "Set temperature to 165°C",
                    "Perform leak test (Vacuum test) on first 3 cycles",
                    "Monitor blister forming quality continuously"
                ],
                precautions: ["Watch for sharp edges", "Use gloves while handling foil"],
                criticalParameters: ["Sealing Temp", "Leak Test"],
                roleRequired: "Operator",
                plannedDuration: "240 min"
            }
        ]
    },
    "potassium_citrate_sol": {
        id: "potassium_citrate_sol",
        productName: "Potassium Citrate Oral Solution BP",
        mfrNumber: "MFR/LIQ/PC-BP",
        revisionNumber: "01",
        effectiveDate: "2026-02-05",
        batchSize: 500,
        batchSizeUnit: "Liters",
        strength: "30% w/v",
        dosageForm: "Oral Solution",
        shelfLife: "24 Months",
        theoreticalYieldRange: { min: 99.0, max: 100.5 },
        lineClearanceRequired: true,
        ingredients: [
            { itemCode: "PC-API", description: "Potassium Citrate BP", quantity: 150.0, unit: "kg", category: "API" },
            { itemCode: "CIT-ACID", description: "Citric Acid Monohydrate", quantity: 25.0, unit: "kg", category: "Excipient" },
            { itemCode: "METH-PAR", description: "Methyl Hydroxybenzoate", quantity: 0.5, unit: "kg", category: "Excipient" },
            { itemCode: "W-PUR", description: "Purified Water", quantity: 350.0, unit: "L", category: "Excipient" }
        ],
        processSteps: [
            { stepNumber: 1, phase: 'Manufacturing', department: "Liquid Manufacturing", description: "Dissolve Citric Acid and Preservatives in hot Purified Water (80°C).", instructions: [], criticalParameters: ["Temp: 75-85°C", "Dissolution Time"], roleRequired: "Supervisor", plannedDuration: "60 min" },
            { stepNumber: 2, phase: 'Manufacturing', department: "Mixing", description: "Add Potassium Citrate gradually under high shear mixing until clear.", instructions: [], criticalParameters: ["pH: 6.0 - 7.5", "Appearance: Clear"], roleRequired: "QA", plannedDuration: "45 min" },
            { stepNumber: 3, phase: 'Packaging', department: "Filling", description: "Fill into 200mL amber glass bottles.", instructions: [], criticalParameters: ["Volume: 200mL ± 2%", "Capping Torque"], roleRequired: "QA", plannedDuration: "180 min" },
            { stepNumber: 4, phase: 'Packaging', department: "Labeling", description: "Automatic labeling and shrinking.", instructions: [], criticalParameters: ["Label Alignment", "Batch Code Clarity"], roleRequired: "Operator", plannedDuration: "120 min" }
        ]
    },
    "ibuprofen_400": {
        id: "ibuprofen_400",
        productName: "Ibuprofen 400mg Film-Coated Tablets",
        mfrNumber: "MFR/TAB/IBU-400",
        revisionNumber: "03",
        effectiveDate: "2026-02-01",
        batchSize: 250000,
        batchSizeUnit: "Tablets",
        strength: "400mg",
        dosageForm: "Tablet (Coated)",
        shelfLife: "36 Months",
        theoreticalYieldRange: { min: 98.5, max: 100.5 },
        lineClearanceRequired: true,
        ingredients: [
            { itemCode: "IBU-API", description: "Ibuprofen USP Powder", quantity: 100.0, unit: "kg", category: "API" },
            { itemCode: "MCC-102", description: "Microcrystalline Cellulose", quantity: 25.0, unit: "kg", category: "Excipient" },
            { itemCode: "CISC-SOD", description: "Croscarmellose Sodium", quantity: 5.0, unit: "kg", category: "Excipient" },
            { itemCode: "MAG-ST", description: "Magnesium Stearate", quantity: 1.0, unit: "kg", category: "Excipient" },
            { itemCode: "OPX-W", description: "Opadry White (Coating)", quantity: 3.5, unit: "kg", category: "Excipient" }
        ],
        processSteps: [
            { stepNumber: 1, phase: 'Manufacturing', department: "Dispensing", description: "Weighing of IBU API and all coating polymers.", instructions: [], criticalParameters: ["API Verification", "Color Matching"], roleRequired: "QA", plannedDuration: "60 min" },
            { stepNumber: 2, phase: 'Manufacturing', department: "Granulation", description: "Dry blending of IBU, MCC, and half-quantity of disintegrant.", instructions: [], criticalParameters: ["Blending: 20 min"], roleRequired: "Supervisor", plannedDuration: "40 min" },
            { stepNumber: 3, phase: 'Manufacturing', department: "Compression", description: "Compress into biconvex white core tablets.", instructions: [], criticalParameters: ["Hardness: 8-12 kp", "Weight: 520mg ± 5%"], roleRequired: "QA", plannedDuration: "150 min" },
            { stepNumber: 4, phase: 'Manufacturing', department: "Coating", description: "Aqueous film coating in perforated pan until target weight gain.", instructions: [], criticalParameters: ["Exhaust Temp: 45°C", "Weight Gain: 3%"], roleRequired: "QA", plannedDuration: "240 min" },
            { stepNumber: 5, phase: 'Packaging', department: "Blistering", description: "PVC/PVdC for moisture sensitive coating protection.", instructions: [], criticalParameters: ["Blister integrity", "Pin-hole check"], roleRequired: "Operator", plannedDuration: "180 min" }
        ]
    },
    "mag_sulph_eff": {
        id: "mag_sulph_eff",
        productName: "Magnesium Sulphate Effervescent Powder",
        mfrNumber: "MFR/POW/MSE-01",
        revisionNumber: "01",
        effectiveDate: "2026-02-10",
        batchSize: 50,
        batchSizeUnit: "kg",
        strength: "Various",
        dosageForm: "Effervescent Powder",
        shelfLife: "24 Months",
        theoreticalYieldRange: { min: 97.0, max: 100.0 },
        lineClearanceRequired: true,
        ingredients: [
            { itemCode: "MS-API", description: "Magnesium Sulphate (Dried) BP", quantity: 20.0, unit: "kg", category: "API" },
            { itemCode: "SOD-BIC", description: "Sodium Bicarbonate", quantity: 15.0, unit: "kg", category: "Excipient" },
            { itemCode: "CIT-ACD", description: "Anhydrous Citric Acid", quantity: 12.0, unit: "kg", category: "Excipient" },
            { itemCode: "SAC-SOD", description: "Saccharin Sodium", quantity: 0.1, unit: "kg", category: "Excipient" },
            { itemCode: "FLV-OR", description: "Orange Flavor Powder", quantity: 2.9, unit: "kg", category: "Excipient" }
        ],
        processSteps: [
            { stepNumber: 1, phase: 'Manufacturing', department: "Dispensing", description: "Raw material weighing under low humidity environment.", instructions: [], criticalParameters: ["RH Verification (< 30%)"], roleRequired: "Operator", plannedDuration: "60 min" },
            { stepNumber: 2, phase: 'Manufacturing', department: "Mixing", description: "Sieving and blending under RH < 30%. Critical for preventing effervescence in bulk.", instructions: [], criticalParameters: ["RH: < 30%", "Mixing: 30 min"], roleRequired: "Supervisor", plannedDuration: "50 min" },
            { stepNumber: 3, phase: 'Packaging', department: "Filling", description: "Filling into 5g Alu-Alu sachets under dehumidified conditions.", instructions: [], criticalParameters: ["Seal Integrity", "Weight: 5.0g ± 2.5%"], roleRequired: "QA", plannedDuration: "240 min" },
            { stepNumber: 4, phase: 'Packaging', department: "Cartoning", description: "Boxing 20 sachets per unit.", instructions: [], criticalParameters: ["Count Check", "Leaflet insertion"], roleRequired: "Supervisor", plannedDuration: "120 min" }
        ]
    },
    "paramol_draft": {
        id: "paramol_draft",
        productName: "Paramol 500mg (NEW FORMULATION)",
        mfrNumber: "MFR/DRAFT/PM-001",
        revisionNumber: "01",
        effectiveDate: "2026-02-08",
        batchSize: 500000,
        batchSizeUnit: "Tablets",
        strength: "500mg",
        dosageForm: "Tablet",
        shelfLife: "36 Months",
        theoreticalYieldRange: { min: 98.0, max: 101.0 },
        lineClearanceRequired: true,
        status: 'Draft',
        preparedBy: 'Quality Section (Dr. Taj)',
        ingredients: [
            { itemCode: "PARA-API", description: "Paracetamol BP", quantity: 0, unit: "kg", category: "API" },
            { itemCode: "STARCH", description: "Starch Maize", quantity: 0, unit: "kg", category: "Excipient" },
            { itemCode: "BINDER", description: "PVP K-30", quantity: 0, unit: "kg", category: "Excipient" }
        ],
        processSteps: [
            { stepNumber: 1, phase: 'Manufacturing', department: "Dispensing", description: "Weighing of materials", instructions: [], criticalParameters: ["Weight"], roleRequired: "Operator" }
        ]
    }
};
