export function toDateStr(d?: string | Date): string {
  if (d === undefined || d === null || d === '') return '';
  if (typeof d === 'string') {
    // Strip time component from ISO strings like '2026-05-07T00:00:00.000Z'
    return d.split('T')[0];
  }
  return d.toISOString().split('T')[0];
}
