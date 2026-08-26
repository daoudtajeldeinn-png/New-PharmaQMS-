// Single source of truth: Finished Product COA test ordering (monograph sequence)
const FALLBACK = 999;

function scoreTestName(rawName: string): number {
  const name = (rawName || '').toLowerCase().trim();

  // Description / Appearance
  if (name.includes('description') || name.includes('appearance') || name.includes('characters')) return 10;

  // Identification: A(IR)=21, B(Colour Reaction)=22, C(Melting Point)=23, Other=24
  if (name.includes('identification') || name.includes('identity')) {
    if (name.includes('ir') || name.includes('infra')) return 21;
    if (name.includes('colour') || name.includes('color') || name.includes('reaction')) return 22;
    if (name.includes('melting')) return 23;
    return 24;
  }
  if (name.includes('melting point') || name.includes('melting range')) return 23;

  if (name.includes('uniformity') || name.includes('weight') ||
      name.includes('variation') || name.includes('average weight')) return 30;
  if (name.includes('disintegration')) return 40;
  if (name.includes('dissolution')) return 50;
  if (name.includes('related') || name.includes('impurity') ||
      name.includes('impurities') || name.includes('degradation')) return 60;
  if (name.includes('friability')) return 70;
  if (name.includes('thickness')) return 80;
  if (name.includes('hardness')) return 90;

  return FALLBACK;
}

export function getTestScore(t: { test?: string; name?: string }): number {
  return scoreTestName(t.test ?? t.name ?? '');
}

// Stable sort (guaranteed ES2019+): equal scores keep stored insertion order
export function sortFinishedProductTests<T extends { test?: string; name?: string }>(tests: T[]): T[] {
  return [...tests].sort((a, b) => getTestScore(a) - getTestScore(b));
}
