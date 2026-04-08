export const g2Products = {
    metro_tab: {
        name: "Metronidazole Tablets 500mg (BP 2025)",
        specs: [
            { t: "Description", s: "White to off-white, round, biconvex tablets", r: "" },
            { t: "Identification (IR)", s: "Conforms to reference spectrum", r: "" },
            { t: "Identification (Chemical)", s: "Orange-red colour produced", r: "" },
            { t: "Related substances (2-methyl-5-nitroimidazole)", s: "NMT 0.5%", r: "" },
            { t: "Dissolution (45 min, pH 4.5)", s: "NLT 75% (Q)", r: "" },
            { t: "Uniformity of content", s: "85.0% to 115.0% of average", r: "" },
            { t: "Weight variation (20 tablets)", s: "NMT ±5% for ≥250mg", r: "" },
            { t: "Friability", s: "NMT 1.0%", r: "" },
            { t: "Disintegration time", s: "NMT 15 minutes", r: "" },
            { t: "Assay (HPLC)", s: "95.0% to 105.0% of stated amount", r: "" }
        ],
        micro: true,
        microSpecs: [
            { t: "Total Aerobic Microbial Count (TAMC)", s: "NMT 10³ CFU/g (BP/USP)", r: "" },
            { t: "Total Yeast & Mold Count (TYMC)", s: "NMT 10² CFU/g (BP/USP)", r: "" },
            { t: "E. coli", s: "Absent in 1 g", r: "" },
            { t: "Salmonella", s: "Absent in 10 g", r: "" },
            { t: "Staphylococcus aureus", s: "Absent in 1 g", r: "" },
            { t: "Pseudomonas aeruginosa", s: "Absent in 1 g", r: "" }
        ]
    },
    aspirin_tab: {
        name: "Aspirin Tablets 300mg (BP 2025)",
        specs: [
            { t: "Description", s: "White, round tablets", r: "" },
            { t: "Identification (IR)", s: "Conforms to reference spectrum", r: "" },
            { t: "Related substances (Salicylic acid)", s: "NMT 3.0%", r: "" },
            { t: "Dissolution (45 min, pH 4.5)", s: "NLT 75% (Q)", r: "" },
            { t: "2,3-Dimethylaniline", s: "NMT 100 ppm", r: "" },
            { t: "Weight variation (20 tablets)", s: "NMT ±5% for ≥250mg", r: "" },
            { t: "Friability", s: "NMT 1.0%", r: "" },
            { t: "Disintegration time", s: "NMT 15 minutes", r: "" },
            { t: "Assay (HPLC)", s: "95.0% to 105.0% of stated amount", r: "" }
        ],
        micro: true,
        microSpecs: [
            { t: "Total Aerobic Microbial Count (TAMC)", s: "NMT 10³ CFU/g (USP <61>)", r: "" },
            { t: "Total Yeast & Mold Count (TYMC)", s: "NMT 10² CFU/g (USP <61>)", r: "" },
            { t: "E. coli", s: "Absent in 1 g", r: "" },
            { t: "Salmonella", s: "Absent in 10 g", r: "" }
        ]
    }
};

export const g2RawMaterials = {
    metro: {
        name: "Metronidazole (BP 2025 / Ph.Eur. 0675)",
        specs: [
            { t: "Characters", s: "White or yellowish, crystalline powder", r: "White crystalline powder" },
            { t: "Identification (IR)", s: "Conforms to reference spectrum", r: "Conforms" },
            { t: "Melting point", s: "159°C to 163°C", r: "161°C" },
            { t: "Specific Absorbance (277 nm)", s: "365 to 395", r: "382" },
            { t: "Appearance of solution", s: "Clear, not more opalescent than Ref.II", r: "Complies" },
            { t: "Related substances (Impurity A)", s: "NMT 0.1%", r: "0.05%" },
            { t: "Total impurities", s: "NMT 0.2%", r: "0.08%" },
            { t: "Loss on drying (105°C, 3h)", s: "NMT 0.5%", r: "0.2%" },
            { t: "Sulfated ash", s: "NMT 0.1%", r: "0.05%" },
            { t: "Assay (Non-aqueous titration)", s: "99.0% to 101.0%", r: "100.2%" }
        ],
        micro: true,
        microSpecs: [
            { t: "Total Aerobic Microbial Count (TAMC)", s: "NMT 10³ CFU/g (BP/USP)", r: "50 CFU/g" },
            { t: "Total Yeast & Mold Count (TYMC)", s: "NMT 10² CFU/g (BP/USP)", r: "< 10 CFU/g" },
            { t: "Escherichia coli", s: "Absent in 1 g (BP)", r: "Absent" },
            { t: "Salmonella", s: "Absent in 10 g (BP)", r: "Absent" },
            { t: "Staphylococcus aureus", s: "Absent in 1 g (BP)", r: "Absent" },
            { t: "Pseudomonas aeruginosa", s: "Absent in 1 g (BP)", r: "Absent" }
        ]
    },
    aspirin: {
        name: "Aspirin (BP 2025 / Ph.Eur. 0309)",
        specs: [
            { t: "Characters", s: "White or almost white, crystalline powder", r: "White crystalline powder" },
            { t: "Solubility", s: "Slightly soluble in water, freely soluble in ethanol", r: "Complies" },
            { t: "Melting point", s: "About 143°C", r: "143.5°C" },
            { t: "Identification (IR)", s: "Conforms to reference spectrum", r: "Conforms" },
            { t: "Appearance of solution", s: "Clear and colourless", r: "Complies" },
            { t: "Related substances (Impurity C)", s: "NMT 0.15%", r: "0.08%" },
            { t: "Total impurities", s: "NMT 0.25%", r: "0.12%" },
            { t: "Loss on drying", s: "NMT 0.5%", r: "0.2%" },
            { t: "Sulfated ash", s: "NMT 0.1%", r: "0.04%" },
            { t: "Assay (Titration)", s: "99.5% to 101.0%", r: "100.3%" }
        ],
        micro: true,
        microSpecs: [
            { t: "Total Aerobic Microbial Count (TAMC)", s: "NMT 10³ CFU/g (USP <61>)", r: "120 CFU/g" },
            { t: "Total Yeast & Mold Count (TYMC)", s: "NMT 10² CFU/g (USP <61>)", r: "25 CFU/g" },
            { t: "Bile-tolerant Gram-negative bacteria", s: "NMT 10² CFU/g (Ph.Eur.)", r: "< 10 CFU/g" },
            { t: "E. coli", s: "Absent in 1 g (BP/USP)", r: "Absent" }
        ]
    }
};

export const g2Staff = [
    { id: "EMP-001", name: "John Doe", role: "Operator", department: "Production", training: { gmp: "Valid", hygiene: "Valid", safety: "Expiring" }, status: "Qualified" },
    { id: "EMP-002", name: "Jane Smith", role: "QA Officer", department: "QA", training: { gmp: "Valid", hygiene: "Valid", safety: "Valid" }, status: "Qualified" },
    { id: "EMP-003", name: "Mike Jones", role: "Trainee", department: "Production", training: { gmp: "Valid", hygiene: "Pending", safety: "Pending" }, status: "Not Qualified" },
    { id: "EMP-004", name: "Sarah Chen", role: "QC Manager", department: "QC", training: { gmp: "Valid", hygiene: "Valid", safety: "Valid" }, status: "Qualified" }
];

export const g2Equipment = [
    { id: "EQ-GR-01", name: "RMG Granulator", type: "Manufacturing", status: "Qualified", cleanStatus: "CLEAN", lastClean: "2026-02-02", nextCal: "2027-01-15" },
    { id: "EQ-CM-02", name: "Rotary Press", type: "Manufacturing", status: "Qualified", cleanStatus: "DIRTY", lastClean: "2026-02-01", nextCal: "2026-06-20" },
    { id: "HPLC-001", name: "Agilent 1260", type: "Laboratory", status: "Qualified", cleanStatus: "N/A", lastClean: "N/A", nextCal: "2026-01-10" },
    { id: "LAF-05", name: "Laminar Air Flow", type: "Laboratory", status: "Maintenance", cleanStatus: "CLEAN", lastClean: "2026-01-25", nextCal: "2026-02-05" }
];

export const g2SOPs = [
    { id: "SOP-QA-001", title: "Change Control Procedure", ver: "4.0", dept: "QA", effective: "2025-01-01", status: "Effective" },
    { id: "SOP-QC-010", title: "HPLC Operation", ver: "2.3", dept: "QC", effective: "2024-06-15", status: "Effective" },
    { id: "SOP-PR-005", title: "Line Clearance", ver: "5.0", dept: "Production", effective: "-", status: "Under Review" },
    { id: "SOP-GEN-001", title: "Good Documentation Practices", ver: "1.0", dept: "All", effective: "2023-11-20", status: "Effective" }
];

export const g2BatchArchive = [
    { batch: "BN-2025-001", product: "Metronidazole Tablets 500mg", date: "2025-01-15", qty: "100,000", status: "released", qc: "Passed", releaseDate: "2025-01-20" },
    { batch: "BN-2025-002", product: "Aspirin Tablets 300mg", date: "2025-01-18", qty: "150,000", status: "pending", qc: "Under Review", releaseDate: "-" },
    { batch: "BN-2025-003", product: "Ibuprofen Tablets 400mg", date: "2025-01-20", qty: "80,000", status: "inprogress", qc: "Testing", releaseDate: "-" },
    { batch: "BN-2024-125", product: "Paracetamol Tablets 500mg", date: "2024-12-20", qty: "200,000", status: "released", qc: "Passed", releaseDate: "2024-12-28" },
    { batch: "BN-2024-124", product: "Mefenamic Acid Tablets 500mg", date: "2024-12-15", qty: "75,000", status: "rejected", qc: "Failed - Dissolution", releaseDate: "-" },
    { batch: "BN-2024-123", product: "Metronidazole Tablets 250mg", date: "2024-12-10", qty: "120,000", status: "released", qc: "Passed", releaseDate: "2024-12-18" }
];

export const g2CAPARecords = [
    {
        id: "CAPA-2025-001",
        title: "High Microbial Count in Purified Water",
        description: "Microbial count exceeded specification limit in purified water system",
        rootCause: "Inadequate sanitization frequency",
        action: "Increase sanitization frequency from weekly to twice weekly",
        responsible: "Maintenance Department",
        targetDate: "2025-02-15",
        status: "In Progress",
        effectiveness: "Pending",
        created: "2025-01-10",
        createdBy: "admin"
    },
    {
        id: "CAPA-2025-002",
        title: "Tablet Hardness Variation",
        description: "High RSD in tablet hardness during compression",
        rootCause: "Inadequate granulation moisture content",
        action: "Revise drying parameters and implement in-process moisture checks",
        responsible: "Production Department",
        targetDate: "2025-01-30",
        status: "Completed",
        effectiveness: "Effective",
        created: "2025-01-05",
        createdBy: "qamanager"
    }
];

export const g2RiskAssessments = [
    {
        id: "RA-2025-001",
        process: "Water System Operation",
        hazard: "Microbial contamination",
        severity: "High",
        probability: "Medium",
        detectability: "Medium",
        riskScore: 16,
        riskLevel: "High",
        controlMeasures: "Regular monitoring, sanitization, UV treatment",
        residualRisk: "Low",
        reviewDate: "2025-07-01",
        status: "Active"
    },
    {
        id: "RA-2025-002",
        process: "Tablet Compression",
        hazard: "Weight variation",
        severity: "Medium",
        probability: "High",
        detectability: "High",
        riskScore: 12,
        riskLevel: "Medium",
        controlMeasures: "In-process checks, machine calibration, operator training",
        residualRisk: "Low",
        reviewDate: "2025-06-01",
        status: "Active"
    }
];

export const g2MaterialInventory = [
    {
        code: "metro",
        name: "Metronidazole",
        batch: "BN-2025-001",
        quantity: 50,
        unit: "kg",
        location: "Warehouse A-12",
        status: "Released",
        expiry: "2026-06-15",
        reorderLevel: 10,
        supplier: "PharmaTech Industries"
    },
    {
        code: "aspirin",
        name: "Aspirin",
        batch: "BN-2025-002",
        quantity: 75,
        unit: "kg",
        location: "Warehouse B-08",
        status: "Quarantined",
        expiry: "2026-05-20",
        reorderLevel: 15,
        supplier: "Chemical Supplies Ltd"
    },
    {
        code: "mag_stearate",
        name: "Magnesium Stearate",
        batch: "BN-2024-089",
        quantity: 20,
        unit: "kg",
        location: "Warehouse C-05",
        status: "Released",
        expiry: "2026-10-10",
        reorderLevel: 5,
        supplier: "Fine Chemicals Co"
    }
];

export const g2COAs = [
    {
        id: 'COA-001',
        type: 'Finished Product',
        coaNumber: 'FP-2025-001',
        productName: 'Metronidazole Tablets 500mg (BP 2025)',
        batchNumber: 'BN-2025-001',
        mfgDate: '2025-01-10',
        expiryDate: '2028-01-09',
        issueDate: '2025-02-04',
        manufacturer: 'Alpha Pharma Industries',
        testResults: [
            { test: 'Appearance', specification: 'White to off-white, round', result: 'Complies', status: 'Pass' },
            { test: 'Identification (IR)', specification: 'Conforms', result: 'Conforms', status: 'Pass' },
            { test: 'Assay (HPLC)', specification: '95.0% to 105.0%', result: '100.2%', status: 'Pass' },
            { test: 'Dissolution', specification: 'NLT 75% (Q)', result: '88%', status: 'Pass' },
        ],
        analyzedBy: 'Dr. Sarah',
        checkedBy: 'Eng. John',
        approvedBy: 'Dr. Ahmed',
        status: 'Approved',
    },
    {
        id: 'COA-002',
        type: 'Raw Material',
        coaNumber: 'RM-2025-045',
        productName: 'Metronidazole (BP 2025)',
        batchNumber: 'RM-8892',
        mfgDate: '2024-12-01',
        expiryDate: '2027-12-01',
        issueDate: '2025-01-15',
        manufacturer: 'Global Excipients Ltd',
        testResults: [
            { test: 'Characaters', specification: 'White crystalline powder', result: 'Complies', status: 'Pass' },
            { test: 'Melting point', specification: '159°C to 163°C', result: '161°C', status: 'Pass' },
            { test: 'Assay', specification: '99.0% to 101.0%', result: '100.2%', status: 'Pass' },
        ],
        analyzedBy: 'Ali K.',
        checkedBy: 'Sara M.',
        approvedBy: 'Dr. Ahmed',
        status: 'Released',
    },
    {
        id: 'COA-003',
        type: 'Water Analysis',
        coaNumber: 'W-2025-02-01',
        productName: 'Purified Water Point 05',
        batchNumber: 'W-FEB-01',
        mfgDate: '2025-02-01',
        expiryDate: '2025-02-02',
        issueDate: '2025-02-01',
        manufacturer: 'Internal System',
        testResults: [
            { test: 'pH', specification: '5.0 - 7.0', result: '6.2', status: 'Pass' },
            { test: 'Conductivity', specification: '< 1.3 µS/cm', result: '0.8 µS/cm', status: 'Pass' },
            { test: 'TOC', specification: '< 500 ppb', result: '120 ppb', status: 'Pass' },
            { test: 'TAMC', specification: 'NMT 100 CFU/mL', result: '15 CFU/mL', status: 'Pass' },
        ],
        analyzedBy: 'Lab Tech 1',
        checkedBy: 'Microbio Sup',
        approvedBy: 'QA Mgr',
        status: 'Approved',
    },
];

