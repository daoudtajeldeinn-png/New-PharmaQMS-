export interface MonographTest {
    test: string;
    specification: string;
    category: 'Physical' | 'Chemical' | 'Microbiological' | 'Descriptive';
}

export interface Monograph {
    id: string; // Product Code or ID
    name: string;
    standard: 'BP' | 'USP' | 'In-House' | 'EP';
    type: 'Finished Product' | 'Raw Material' | 'Utility';
    description: string;
    tests: MonographTest[];
    strength?: string;
    dosageForm?: string;
    attachments?: {
        name: string;
        url: string;
        type: 'Link' | 'File' | 'Method';
    }[];
}

// Comprehensive International Pharmacopeia Microbiology Standard (Sterility & Bioburden)
const standardMicrobiologyTests: MonographTest[] = [
    { test: "Total Aerobic Microbial Count (TAMC)", specification: "NMT 10³ CFU/g", category: "Microbiological" },
    { test: "Total Combined Yeasts and Molds Count (TYMC)", specification: "NMT 10² CFU/g", category: "Microbiological" },
    { test: "Escherichia coli", specification: "Absent in 1 g", category: "Microbiological" },
    { test: "Salmonella species", specification: "Absent in 10 g", category: "Microbiological" },
    { test: "Staphylococcus aureus", specification: "Absent in 1 g", category: "Microbiological" },
    { test: "Pseudomonas aeruginosa", specification: "Absent in 1 g", category: "Microbiological" },
    { test: "Shigella species", specification: "Absent in 10 g", category: "Microbiological" },
    { test: "Clostridium species", specification: "Absent in 1 g", category: "Microbiological" }
];

// Standard Tablet/Capsule Physical IPQC Parameter Set
const standardTabletPhysicalTests: MonographTest[] = [
    { test: "Average Weight", specification: "House Std ± 5%", category: "Physical" },
    { test: "Weight Variation", specification: "Complies (BP/USP)", category: "Physical" },
    { test: "Hardness", specification: "NLT 5.0 kp", category: "Physical" },
    { test: "Friability", specification: "NMT 1.0% w/w", category: "Physical" },
    { test: "Thickness", specification: "House Std ± 5%", category: "Physical" },
    { test: "Disintegration Time", specification: "NMT 15 minutes", category: "Physical" }
];

export const g1Monographs: Record<string, Monograph> = {
    // ==================== RAW MATERIALS ====================
    "as_raw": {
        id: "as_raw",
        name: "Aspirin Raw Material",
        standard: "BP",
        type: "Raw Material",
        description: "Acetylsalicylic Acid BP API",
        tests: [
            { test: "Characters", specification: "White crystalline powder", category: "Descriptive" },
            { test: "Identification (IR)", specification: "Conforms to reference", category: "Chemical" },
            { test: "Assay", specification: "99.5% to 101.0%", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "paracet_raw": {
        id: "paracet_raw",
        name: "Paracetamol Raw Material",
        standard: "BP",
        type: "Raw Material",
        description: "Paracetamol BP API",
        attachments: [
            { name: "BP 2024 Monograph Reference", url: "https://www.pharmacopoeia.com/monograph/paracetamol", type: "Link" },
            { name: "Analytical Method (QC-MET-042)", url: "/methods/paracetamol-v3.pdf", type: "Method" }
        ],
        tests: [
            { test: "Assay", specification: "99.0% to 101.0%", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "pot_citrate_raw": {
        id: "pot_citrate_raw",
        name: "Potassium Citrate Raw Material",
        standard: "BP",
        type: "Raw Material",
        description: "Potassium Citrate BP API",
        tests: [
            { test: "Identification (Potassium - Flame)", specification: "Violet color in flame", category: "Chemical" },
            { test: "Identification (Citrates)", specification: "Complies with BP test", category: "Chemical" },
            { test: "Tartrate Test", specification: "No crystalline precipitate", category: "Chemical" },
            { test: "Assay (Potassium Content)", specification: "99.0% to 101.0%", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "sodium_bicarb_raw": {
        id: "sodium_bicarb_raw",
        name: "Sodium Bicarbonate",
        standard: "BP",
        type: "Raw Material",
        description: "Sodium Bicarbonate BP API",
        tests: [
            { test: "Appearance", specification: "White or almost white, crystalline powder", category: "Descriptive" },
            { test: "Identification", specification: "Complies with BP tests", category: "Chemical" },
            { test: "Appearance of Solution", specification: "Clear and colorless; pH NMT 8.6", category: "Physical" },
            { test: "Chlorides", specification: "NMT 150 ppm", category: "Chemical" },
            { test: "Sulfates", specification: "NMT 150 ppm", category: "Chemical" },
            { test: "Ammonium", specification: "NMT 20 ppm", category: "Chemical" },
            { test: "Iron", specification: "NMT 20 ppm", category: "Chemical" },
            { test: "Heavy Metals", specification: "NMT 10 ppm", category: "Chemical" },
            { test: "Carbonates", specification: "Complies with BP test", category: "Chemical" },
            { test: "Assay", specification: "99.0% to 101.0% (dried basis)", category: "Chemical" }
        ]
    },
    "mcc_raw": {
        id: "mcc_raw",
        name: "Microcrystalline Cellulose (MCC)",
        standard: "BP",
        type: "Raw Material",
        description: "Microcrystalline Cellulose BP (MCC 101/102)",
        tests: [
            { test: "Characters", specification: "White or almost white, fine or granular powder", category: "Descriptive" },
            { test: "Identification (A, B)", specification: "Complies with BP tests", category: "Chemical" },
            { test: "Solubility", specification: "Insoluble in water and in organic solvents", category: "Physical" },
            { test: "pH", specification: "5.0 to 7.5", category: "Physical" },
            { test: "Loss on Drying", specification: "NMT 7.0%", category: "Physical" },
            { test: "Sulfated Ash", specification: "NMT 0.1%", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "mag_stearate_raw": {
        id: "mag_stearate_raw",
        name: "Magnesium Stearate",
        standard: "BP",
        type: "Raw Material",
        description: "Magnesium Stearate BP Excipient",
        tests: [
            { test: "Characters", specification: "Very fine, light, white powder, greasy to touch", category: "Descriptive" },
            { test: "Identification (A, B, C)", specification: "Complies with BP tests", category: "Chemical" },
            { test: "Acidity or Alkalinity", specification: "Complies with BP", category: "Chemical" },
            { test: "Loss on Drying", specification: "NMT 6.0%", category: "Physical" },
            { test: "Assay (Magnesium)", specification: "4.0% to 5.0% (Mg)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "talcum_raw": {
        id: "talcum_raw",
        name: "Talcum Powder",
        standard: "BP",
        type: "Raw Material",
        description: "Talc BP Excipient",
        tests: [
            { test: "Characters", specification: "Light, homogeneous, white power, greasy to touch", category: "Descriptive" },
            { test: "Identification (A, B, C)", specification: "Complies with BP tests", category: "Chemical" },
            { test: "Acidity or Alkalinity", specification: "Complies with BP", category: "Chemical" },
            { test: "Water-soluble substances", specification: "NMT 10 mg (0.1%)", category: "Chemical" },
            { test: "Loss on Drying", specification: "NMT 0.5%", category: "Physical" },
            ...standardMicrobiologyTests
        ]
    },
    "maize_starch_raw": {
        id: "maize_starch_raw",
        name: "Maize Starch",
        standard: "BP",
        type: "Raw Material",
        description: "Maize Starch BP Excipient",
        tests: [
            { test: "Characters", specification: "White to yellowish-white powder", category: "Descriptive" },
            { test: "Identification (A, B, C)", specification: "Complies with BP tests", category: "Chemical" },
            { test: "pH", specification: "4.0 to 7.0", category: "Physical" },
            { test: "Loss on Drying", specification: "NMT 15.0%", category: "Physical" },
            { test: "Iron", specification: "NMT 8.4 ppm", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "metronidazol_raw": {
        id: "metronidazol_raw",
        name: "Metronidazole Raw Material",
        standard: "BP",
        type: "Raw Material",
        description: "Metronidazole BP API",
        tests: [
            { test: "Characters", specification: "White or yellowish, crystalline powder", category: "Descriptive" },
            { test: "Identification (A, B, C)", specification: "Complies with BP tests", category: "Chemical" },
            { test: "Melting Point", specification: "159 °C to 163 °C", category: "Physical" },
            { test: "Loss on Drying", specification: "NMT 0.5%", category: "Physical" },
            { test: "Assay", specification: "99.0% to 101.0% (dried substance)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "sod_carbonate_raw": {
        id: "sod_carbonate_raw",
        name: "Sodium Carbonate",
        standard: "BP",
        type: "Raw Material",
        description: "Sodium Carbonate BP Excipient",
        tests: [
            { test: "Characters", specification: "White or almost white, crystalline powder", category: "Descriptive" },
            { test: "Identification", specification: "Complies with BP tests for Sodium and Carbonates", category: "Chemical" },
            { test: "Appearance of Solution", specification: "Clear and not more intensely colored than Y6", category: "Physical" },
            { test: "Chlorides", specification: "NMT 125 ppm", category: "Chemical" },
            { test: "Sulfates", specification: "NMT 250 ppm", category: "Chemical" },
            { test: "Iron", specification: "NMT 50 ppm", category: "Chemical" },
            { test: "Assay", specification: "83.0% to 87.5% (Na2CO3)", category: "Chemical" }
        ]
    },
    "citric_acid_raw": {
        id: "citric_acid_raw",
        name: "Citric Acid Monohydrate",
        standard: "BP",
        type: "Raw Material",
        description: "Citric Acid Monohydrate BP Excipient",
        tests: [
            { test: "Characters", specification: "White crystalline powder or colorless crystals", category: "Descriptive" },
            { test: "Identification", specification: "Complies with BP tests", category: "Chemical" },
            { test: "Appearance of Solution", specification: "Clear and not more intensely colored than Y7/BY7/GY7", category: "Physical" },
            { test: "Oxalic Acid", specification: "NMT 360 ppm", category: "Chemical" },
            { test: "Sulfates", specification: "NMT 150 ppm", category: "Chemical" },
            { test: "Water", specification: "7.5% to 9.0%", category: "Physical" },
            { test: "Assay", specification: "99.5% to 100.5% (anhydrous)", category: "Chemical" }
        ]
    },
    "sod_saccharin_raw": {
        id: "sod_saccharin_raw",
        name: "Sodium Saccharin",
        standard: "BP",
        type: "Raw Material",
        description: "Sodium Saccharin BP Excipient",
        tests: [
            { test: "Characters", specification: "White crystalline powder or colorless crystals", category: "Descriptive" },
            { test: "Identification", specification: "Complies with BP tests", category: "Chemical" },
            { test: "Water", specification: "NMT 15.0%", category: "Physical" },
            { test: "Heavy Metals", specification: "NMT 20 ppm", category: "Chemical" },
            { test: "Toluenesulfonamides", specification: "Complies with BP chromatography test", category: "Chemical" },
            { test: "Assay", specification: "99.0% to 101.0% (anhydrous)", category: "Chemical" }
        ]
    },
    "dipot_phosphate_raw": {
        id: "dipot_phosphate_raw",
        name: "Dipotassium Hydrogen Phosphate",
        standard: "BP",
        type: "Raw Material",
        description: "Dipotassium Hydrogen Phosphate BP Excipient",
        tests: [
            { test: "Characters", specification: "White granular powder or colorless crystals; deliquescent", category: "Descriptive" },
            { test: "Identification", specification: "Complies with BP tests for Potassium and Phosphates", category: "Chemical" },
            { test: "pH (5% solution)", specification: "8.5 to 9.6", category: "Physical" },
            { test: "Loss on Drying", specification: "NMT 5.0%", category: "Physical" },
            { test: "Chlorides", specification: "NMT 200 ppm", category: "Chemical" },
            { test: "Assay", specification: "98.0% to 100.5% (dried substance)", category: "Chemical" }
        ]
    },
    "povidone_k30_raw": {
        id: "povidone_k30_raw",
        name: "Povidone K30",
        standard: "BP",
        type: "Raw Material",
        description: "Povidone K30 BP Excipient",
        tests: [
            { test: "Characters", specification: "White to slightly yellowish fine powder", category: "Descriptive" },
            { test: "Identification", specification: "Complies with BP tests", category: "Chemical" },
            { test: "pH (5% solution)", specification: "3.0 to 5.0", category: "Physical" },
            { test: "K-value", specification: "27.0 to 32.4 (90-108% of 30)", category: "Chemical" },
            { test: "Aldehydes", specification: "NMT 500 ppm", category: "Chemical" },
            { test: "Peroxides", specification: "NMT 400 ppm", category: "Chemical" },
            { test: "Loss on Drying", specification: "NMT 5.0%", category: "Physical" },
            ...standardMicrobiologyTests
        ]
    },
    "amlodipine_raw": {
        id: "amlodipine_raw",
        name: "Amlodipine Besylate Raw Material",
        standard: "BP",
        type: "Raw Material",
        description: "Amlodipine Besylate BP API",
        tests: [
            { test: "Characters", specification: "White or almost white powder", category: "Descriptive" },
            { test: "Identification", specification: "Complies with BP (IR, HPLC)", category: "Chemical" },
            { test: "Water", specification: "NMT 0.5%", category: "Physical" },
            { test: "Residue on Ignition", specification: "NMT 0.2%", category: "Chemical" },
            { test: "Heavy Metals", specification: "NMT 20 ppm", category: "Chemical" },
            { test: "Assay", specification: "97.0% to 102.0% (calculated as dried)", category: "Chemical" }
        ]
    },
    // ==================== FINISHED PRODUCTS (Tablets & Capsules) ====================
    "as_100_fp": {
        id: "as_100_fp",
        name: "Aspirin Tablets",
        strength: "100mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Aspirin 100mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White, round tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Assay of Aspirin", specification: "95.0% to 105.0% (95-105mg)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "paracet_500_fp": {
        id: "paracet_500_fp",
        name: "Paracetamol Tablets",
        strength: "500mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Paracetamol 500mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White, capsule shaped tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Assay of Paracetamol", specification: "475mg to 525mg (95-105%)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "metro_500_fp": {
        id: "metro_500_fp",
        name: "Metronidazole Tablets",
        strength: "500mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Metronidazole 500mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White to cream tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Assay of Metronidazole", specification: "475mg to 525mg (95-105%)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "amlod_5_fp": {
        id: "amlod_5_fp",
        name: "Amlodipine Tablets",
        strength: "5mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Amlodipine 5mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White round tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Dissolution", specification: "NLT 75% in 30 minutes", category: "Physical" },
            { test: "Assay", specification: "90.0% to 110.0% (4.5mg to 5.5mg)", category: "Chemical" }
        ]
    },
    "amlod_10_fp": {
        id: "amlod_10_fp",
        name: "Amlodipine Tablets",
        strength: "10mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Amlodipine 10mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White round tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Dissolution", specification: "NLT 75% in 30 minutes", category: "Physical" },
            { test: "Assay", specification: "90.0% to 110.0% (9.0mg to 11.0mg)", category: "Chemical" }
        ]
    },
    "diclo_sod_50_fp": {
        id: "diclo_sod_50_fp",
        name: "Diclofenac Sodium EC Tablets",
        strength: "50mg",
        dosageForm: "Enteric Coated Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Diclofenac Sodium 50mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "Yellow, round biconvex tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Acid Resistance Test", specification: "No break in 2 hours", category: "Physical" },
            { test: "Assay of Diclofenac", specification: "47.5mg to 52.5mg (95-105%)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "pot_citrate_16_fp": {
        id: "pot_citrate_16_fp",
        name: "Potassium Citrate Effervescent Granules 16%",
        strength: "16% w/w",
        dosageForm: "Effervescent Granules",
        standard: "BP",
        type: "Finished Product",
        description: "Potassium Citrate Effervescent BP Granules",
        tests: [
            { test: "Appearance", specification: "White dry granules", category: "Descriptive" },
            { test: "Loss on Drying", specification: "NMT 2.0%", category: "Physical" },
            { test: "Effervescence Time", specification: "NMT 5 minutes", category: "Physical" },
            { test: "pH (of 5% solution)", specification: "5.5 to 7.0", category: "Physical" },
            { test: "Identification (Potassium - Flame)", specification: "Violet color in flame", category: "Chemical" },
            { test: "Identification (Citrates)", specification: "Complies with BP test", category: "Chemical" },
            { test: "Assay of Potassium Citrate", specification: "15.2% to 16.8% (95-105%)", category: "Chemical" },
            { test: "K Content by Flame Photometry", specification: "", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "povidone_iodine_sol": {
        id: "povidone_iodine_sol",
        name: "Povidone Iodine Topical Solution",
        strength: "10% w/v",
        dosageForm: "Solution",
        standard: "BP",
        type: "Finished Product",
        description: "Povidone Iodine 10% Solution BP",
        tests: [
            { test: "Appearance", specification: "Dark brown liquid", category: "Descriptive" },
            { test: "pH", specification: "3.5 to 6.5", category: "Physical" },
            { test: "Identification of Iodine", specification: "Complies", category: "Chemical" },
            { test: "Assay of Available Iodine", specification: "0.85% to 1.20% w/v", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    // ==================== UTILITIES ====================
"pure_water": {
        id: "pure_water",
        name: "Purified Water",
        standard: "BP",
        type: "Utility",
        description: "Purified Water BP Control Monitoring",
        tests: [
            { test: "Appearance", specification: "Clear colorless liquid", category: "Descriptive" },
            { test: "Conductivity", specification: "NMT 1.3 µS/cm", category: "Physical" },
            { test: "pH", specification: "5.0 to 7.0", category: "Physical" },
            { test: "TAMC", specification: "NMT 100 CFU/mL", category: "Microbiological" },
            { test: "Heavy Metals", specification: "NMT 10 ppb (0.001 mg/L)", category: "Chemical" },
            { test: "Nitrate", specification: "NMT 0.2 ppm", category: "Chemical" },
            { test: "Aluminum", specification: "NMT 10 ppb", category: "Chemical" },
            { test: "Oxidisable Substances", specification: "Complies", category: "Chemical" },
            { test: "Acidity or Alkalinity", specification: "Complies", category: "Chemical" },
            { test: "Residual Solvents", specification: "Complies", category: "Chemical" }
        ]
    },
    "ibuprofen_400_fp": {
        id: "ibuprofen_400_fp",
        name: "Ibuprofen Tablets",
        strength: "400mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Ibuprofen 400mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White, circular film-coated tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Assay of Ibuprofen", specification: "380mg to 420mg (95-105%)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "mag_sulph_eff_fp": {
        id: "mag_sulph_eff_fp",
        name: "Magnesium Sulphate Effervescent Powder",
        strength: "5g",
        dosageForm: "Powder",
        standard: "BP",
        type: "Finished Product",
        description: "Magnesium Sulphate Effervescent Powder BP",
        tests: [
            { test: "Appearance", specification: "White, granular powder", category: "Descriptive" },
            { test: "Effervescence", specification: "Vigorous evolution of CO2", category: "Physical" },
            { test: "pH (aqueous)", specification: "5.5 to 7.0", category: "Physical" },
            { test: "Assay (Magnesium)", specification: "90% to 110% of stated amount", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    }
};
