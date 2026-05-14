import type { TestMethod } from '@/types';

export const STANDARD_PHARMA_TESTS: Partial<TestMethod>[] = [
    {
        name: 'Assay (HPLC)',
        category: 'Assay',
        standardProcedure: 'STP-GEN-001',
        pharmacopeiaReference: 'USP <621>',
        procedureDetails: '1. Prepare mobile phase (Buffer:ACN 60:40). 2. Inject Standard (5 replicates). 3. Inject Sample. 4. Calculate %Assay vs Standard.',
        status: 'Active',
        parameters: [
            { id: 'p1', name: 'Peak Area', unit: 'mAU', isQualitative: false },
            { id: 'p2', name: 'Retention Time', unit: 'min', isQualitative: false },
            { id: 'p3', name: 'Assay (%)', unit: '%', isQualitative: false, minValue: 95, maxValue: 105 }
        ]
    },
    {
        name: 'Dissolution',
        category: 'Dissolution',
        standardProcedure: 'STP-GEN-002',
        pharmacopeiaReference: 'USP <711>',
        procedureDetails: '1. Media: 900ml 0.1N HCl. 2. Apparatus: Paddle at 50rpm. 3. Time: 45 min. 4. Filter and analyze by UV at 240nm.',
        status: 'Active',
        parameters: [
            { id: 'd1', name: 'Amount Dissolved', unit: '%', isQualitative: false, minValue: 75 }
        ]
    },
    {
        name: 'Related Substances',
        category: 'Impurities',
        standardProcedure: 'STP-GEN-003',
        pharmacopeiaReference: 'USP <621>',
        procedureDetails: '1. Sample concentration: 1mg/ml. 2. Gradient elution. 3. Identify impurities by RRT. 4. Calculate % via area normalization.',
        status: 'Active',
        parameters: [
            { id: 'r1', name: 'Individual Impurity', unit: '%', isQualitative: false, maxValue: 0.1 },
            { id: 'r2', name: 'Total Impurities', unit: '%', isQualitative: false, maxValue: 0.5 }
        ]
    },
    {
        name: 'pH Determination',
        category: 'Physical',
        standardProcedure: 'STP-GEN-004',
        pharmacopeiaReference: 'USP <791>',
        procedureDetails: '1. Calibrate pH meter (pH 4, 7, 10). 2. Measure sample in triplicate. 3. Record mean value.',
        status: 'Active',
        parameters: [
            { id: 'ph1', name: 'pH Value', unit: 'pH', isQualitative: false }
        ]
    },
    {
        name: 'Water Content (KF)',
        category: 'Physical',
        standardProcedure: 'STP-GEN-005',
        pharmacopeiaReference: 'USP <921>',
        procedureDetails: '1. Calibrate KF titrator. 2. Weigh 100mg sample. 3. Titrate to end point. 4. Calculate % water.',
        status: 'Active',
        parameters: [
            { id: 'w1', name: 'Water (%)', unit: '%', isQualitative: false }
        ]
    },
    {
        name: 'Hardness',
        category: 'Physical',
        standardProcedure: 'STP-GEN-006',
        pharmacopeiaReference: 'USP <1217>',
        procedureDetails: '1. Test 10 tablets. 2. Record individual breaking force. 3. Calculate mean and RSD.',
        status: 'Active',
        parameters: [
            { id: 'h1', name: 'Breaking Force', unit: 'kp', isQualitative: false }
        ]
    },
    {
        name: 'Friability',
        category: 'Physical',
        standardProcedure: 'STP-GEN-007',
        pharmacopeiaReference: 'USP <1216>',
        procedureDetails: '1. Weigh 6.5g tablets. 2. Rotate at 25rpm for 4 min. 3. De-dust and re-weigh. 4. Loss must be <1.0%.',
        status: 'Active',
        parameters: [
            { id: 'f1', name: 'Weight Loss (%)', unit: '%', isQualitative: false, maxValue: 1.0 }
        ]
    },
    {
        name: 'Disintegration Time',
        category: 'Physical',
        standardProcedure: 'STP-GEN-008',
        pharmacopeiaReference: 'USP <701>',
        procedureDetails: '1. Place 6 tabs in baskets. 2. Medium: Water at 37°C. 3. Observe until all tabs dissolve or drop.',
        status: 'Active',
        parameters: [
            { id: 'dt1', name: 'Disintegration Time', unit: 'min', isQualitative: false, maxValue: 15 }
        ]
    },
    {
        name: 'Acid Degradation',
        category: 'Stability',
        standardProcedure: 'STP-GEN-009',
        pharmacopeiaReference: 'ICH Q1A',
        procedureDetails: '1. Stress: 0.1M HCl at 60°C for 24h. 2. Neutralize. 3. Analyze for degradants. 4. Verify peak purity.',
        status: 'Active',
        parameters: [
            { id: 'ad1', name: 'Total Degradation (%)', unit: '%', isQualitative: false, maxValue: 10 }
        ]
    },
    {
        name: 'Base Degradation',
        category: 'Stability',
        standardProcedure: 'STP-GEN-010',
        pharmacopeiaReference: 'ICH Q1A',
        procedureDetails: '1. Stress: 0.1M NaOH at 60°C for 24h. 2. Neutralize. 3. Analyze for degradants. 4. Verify peak purity.',
        status: 'Active',
        parameters: [
            { id: 'bd1', name: 'Total Degradation (%)', unit: '%', isQualitative: false, maxValue: 10 }
        ]
    },
    {
        name: 'Oxidative Degradation',
        category: 'Stability',
        standardProcedure: 'STP-GEN-011',
        pharmacopeiaReference: 'ICH Q1A',
        procedureDetails: '1. Stress: 3% H2O2 at RT for 48h. 2. Decompose residual H2O2. 3. Analyze for degradants.',
        status: 'Active',
        parameters: [
            { id: 'od1', name: 'Total Degradation (%)', unit: '%', isQualitative: false, maxValue: 10 }
        ]
    },
    {
        name: 'Photolytic Degradation',
        category: 'Stability',
        standardProcedure: 'STP-GEN-012',
        pharmacopeiaReference: 'ICH Q1B',
        procedureDetails: '1. Exposure: 1.2M lux hours (Visible) + 200 Wh/m2 (UV). 2. Control: Dark box. 3. Compare degradant profile.',
        status: 'Active',
        parameters: [
            { id: 'pd1', name: 'Total Degradation (%)', unit: '%', isQualitative: false, maxValue: 10 }
        ]
    },
    {
        name: 'Thermal Stability',
        category: 'Stability',
        standardProcedure: 'STP-GEN-014',
        pharmacopeiaReference: 'ICH Q1A',
        procedureDetails: '1. Store at 60°C for 30 days. 2. Monitor physical change and assay monthly. 3. Check for polymorphic transformation.',
        status: 'Active',
        parameters: [
            { id: 'ts1', name: 'Assay Retention (%)', unit: '%', isQualitative: false, minValue: 95 }
        ]
    },
    {
        name: 'Color Change',
        category: 'Physical',
        standardProcedure: 'STP-GEN-013',
        procedureDetails: '1. Inspect under D65 standard light. 2. Compare against fresh retention sample. 3. Record any fading or spotting.',
        status: 'Active',
        parameters: [
            { id: 'cc1', name: 'Observation', unit: '', isQualitative: true }
        ]
    }
];
