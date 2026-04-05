// src/lib/constants.ts
import { Beaker, Package } from 'lucide-react';

export const MATERIAL_TYPES = [
  { key: 'API' as const, label: 'Active Pharmaceutical Ingredient (API)', icon: Beaker },
  { key: 'Excipient' as const, label: 'Excipient', icon: Package },
  { key: 'Packaging' as const, label: 'Packaging & Labeling', icon: Package },
  { key: 'Solvent' as const, label: 'Solvent / Vehicle', icon: Beaker },
] as const;

export const PHARMACOPEIA_TESTS = {
  API: [
    { id: 'ID-001', name: 'Identification', spec: 'BP/USP', type: 'qualitative' as const, method: 'IR/UV' },
    { id: 'ASS-001', name: 'Assay', spec: '98.0-102.0%', type: 'quantitative' as const, method: 'HPLC' },
    { id: 'IMP-001', name: 'Related Substances', spec: 'NMT 0.10%', type: 'quantitative' as const, method: 'HPLC' },
    { id: 'IMP-002', name: 'Total Impurities', spec: 'NMT 0.5%', type: 'quantitative' as const, method: 'HPLC' },
    { id: 'LOD-001', name: 'Loss on Drying', spec: 'NMT 0.5%', type: 'quantitative' as const, method: 'Gravimetric' },
    { id: 'SUL-001', name: 'Sulfated Ash', spec: 'NMT 0.1%', type: 'quantitative' as const, method: 'Gravimetric' },
    { id: 'RES-001', name: 'Residual Solvents', spec: 'ICH Q3C', type: 'quantitative' as const, method: 'GC-HS' },
  ],
  Excipient: [
    { id: 'ID-EXC', name: 'Identification', spec: 'BP/USP', type: 'qualitative' as const, method: 'Chemical' },
    { id: 'PUR-001', name: 'Purity', spec: 'As per Spec', type: 'quantitative' as const, method: 'Varies' },
    { id: 'PH-001', name: 'Acidity/Alkalinity', spec: 'As per Spec', type: 'quantitative' as const, method: 'pH Meter' },
    { id: 'LOD-001', name: 'Loss on Drying', spec: 'NMT 5.0%', type: 'quantitative' as const, method: 'Gravimetric' },
  ],
  Packaging: [
    { id: 'DIM-001', name: 'Dimensions & Thickness', spec: '±0.1mm', type: 'quantitative' as const, method: 'Caliper' },
    { id: 'APP-001', name: 'Visual Appearance', spec: 'Defect Free', type: 'qualitative' as const, method: 'Visual' },
    { id: 'LEA-001', name: 'Leak Test', spec: 'No Leakage', type: 'qualitative' as const, method: 'Leak Test' },
    { id: 'STR-001', name: 'Durability Strength', spec: 'As per Spec', type: 'quantitative' as const, method: 'Physical' },
  ],
  Solvent: [
    { id: 'PUR-001', name: 'Purity', spec: 'NLT 99.0%', type: 'quantitative' as const, method: 'GC' },
    { id: 'DEN-001', name: 'Density', spec: 'As per Spec', type: 'quantitative' as const, method: 'Density Meter' },
    { id: 'REF-001', name: 'Refractive Index', spec: 'As per Spec', type: 'quantitative' as const, method: 'Refractometer' },
  ],
} as const;
