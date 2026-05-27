/** True when running inside the Electron desktop shell (not the browser/Vercel app). */
export function isElectron(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as Window & { process?: { versions?: { electron?: string } } };
  if (w.process?.versions?.electron) return true;
  return typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent);
}
