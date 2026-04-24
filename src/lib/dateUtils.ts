/**
 * Utility for safe date parsing and formatting across the PharmaQMS application.
 * Handles conversion from strings (LocalStorage/IndexedDB) to formatted date strings.
 */

/**
 * Safely converts any date-like value to an ISO date string (YYYY-MM-DD).
 * Returns 'Pending' or a fallback if the date is invalid.
 */
export function formatDateSafe(date: any, fallback: string = 'Pending'): string {
    if (!date) return fallback;
    
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return fallback;
        return d.toISOString().split('T')[0];
    } catch (e) {
        console.warn('Invalid date encountered:', date);
        return fallback;
    }
}

/**
 * Safely converts any date-like value to a localized date string.
 */
export function formatLocalDate(date: any, locale: string = 'en-US'): string {
    if (!date) return 'N/A';
    
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString(locale);
    } catch (e) {
        return 'N/A';
    }
}

/**
 * Returns true if the date is in the past.
 */
export function isPastDate(date: any): boolean {
    if (!date) return false;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
}
