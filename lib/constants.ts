export const MATERIAL_TYPES = [
  { key: 'API' as const, label: 'مادة فعالة (API)' },
  { key: 'Excipient' as const, label: 'مادة مضافة' },
  { key: 'Packaging' as const, label: 'تعبئة وتغليف' },
  { key: 'Solvent' as const, label: 'مذيب' },
] as const

export const PHARMACOPEIA_TESTS = {
  API: [
    { id: 'ID-001', name: 'التحديد (Identification)', spec: 'BP/USP', type: 'qualitative' as const, method: 'IR/UV' },
    { id: 'ASS-001', name: 'النقاوة (Assay)', spec: '98.0-102.0%', type: 'quantitative' as const, method: 'HPLC' },
    { id: 'IMP-001', name: 'الشوائب المرتبطة', spec: 'NMT 0.10%', type: 'quantitative' as const, method: 'HPLC' },
    { id: 'IMP-002', name: 'إجمالي الشوائب', spec: 'NMT 0.5%', type: 'quantitative' as const, method: 'HPLC' },
    { id: 'LOD-001', name: 'فقدان التجفيف', spec: 'NMT 0.5%', type: 'quantitative' as const, method: 'Gravimetric' },
    { id: 'SUL-001', name: 'رماد كبريتاتي', spec: 'NMT 0.1%', type: 'quantitative' as const, method: 'Gravimetric' },
    { id: 'RES-001', name: 'مخلفات مذيبات', spec: 'ICH Q3C', type: 'quantitative' as const, method: 'GC-HS' },
  ],
  Excipient: [
    { id: 'ID-EXC', name: 'التحديد', spec: 'BP/USP', type: 'qualitative' as const, method: 'Chemical' },
    { id: 'PUR-001', name: 'النقاوة', spec: 'حسب المواصفات', type: 'quantitative' as const, method: 'Varies' },
    { id: 'PH-001', name: 'الحموضة/القلوية', spec: 'حسب المواصفات', type: 'quantitative' as const, method: 'pH Meter' },
    { id: 'LOD-001', name: 'فقدان التجفيف', spec: 'NMT 5.0%', type: 'quantitative' as const, method: 'Gravimetric' },
  ],
  Packaging: [
    { id: 'DIM-001', name: 'الأبعاد والسمك', spec: '±0.1mm', type: 'quantitative' as const, method: 'Caliper' },
    { id: 'APP-001', name: 'المظهر البصري', spec: 'خالي من العيوب', type: 'qualitative' as const, method: 'Visual' },
    { id: 'LEA-001', name: 'اختبار التسرب', spec: 'لا يوجد تسرب', type: 'qualitative' as const, method: 'Leak Test' },
    { id: 'STR-001', name: 'قوة التحمل', spec: 'حسب المواصفات', type: 'quantitative' as const, method: 'Physical' },
  ],
  Solvent: [
    { id: 'PUR-001', name: 'النقاوة', spec: 'NLT 99.0%', type: 'quantitative' as const, method: 'GC' },
    { id: 'DEN-001', name: 'الكثافة', spec: 'حسب المواصفات', type: 'quantitative' as const, method: 'Density Meter' },
    { id: 'REF-001', name: 'معامل الانكسار', spec: 'حسب المواصفات', type: 'quantitative' as const, method: 'Refractometer' },
  ],
} as const