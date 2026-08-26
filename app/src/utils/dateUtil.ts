export function toDateStr(d?: string | Date): string {
  if (d === undefined || d === null || d === '') return '';
  return typeof d === 'string' ? d : d.toISOString().split('T')[0];
}
