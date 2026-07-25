/**
 * License Manager — PharmaQMS Enterprise
 * Handles trial period, activation keys, and hardware locking.
 *
 * TRIAL FLOW:
 *   Day 0–19  → Free trial, full access, no credentials needed
 *   Day 20–29 → Free trial + warning banner (X days remaining)
 *   Day 30+   → Trial expired → activation required
 */

const SECRET_SALT = 'PHARMA_QC_2024_SECURE';
const TRIAL_DAYS  = 30;
const WARN_AFTER  = 20; // show warning starting day 20

// ── localStorage keys ────────────────────────────────────────
const KEY_INSTALL   = 'pqms_install_date';
const KEY_LICENSE   = 'pqms_enterprise_license';

// ── Types ────────────────────────────────────────────────────
export interface LicenseStatus {
    isValid: boolean;
    expiryDate: Date | null;
    daysRemaining: number;
    message: string;
}

export interface TrialStatus {
    isInTrial: boolean;       // true if within 30-day free period
    trialExpired: boolean;    // true if >30 days with no valid license
    daysUsed: number;         // how many days since install
    daysRemaining: number;    // days left in trial
    showWarning: boolean;     // true from day 20 onward
}

// ── Machine ID ───────────────────────────────────────────────
export const getMachineId = (): string => {
    const args = (window as any).process?.argv || [];
    const arg  = args.find((a: string) => a.startsWith('--machine-id='));
    if (arg) return arg.split('=')[1];
    return 'DEV-ENVIRONMENT-ID'; // web / vercel fallback
};

// ── Trial Status ─────────────────────────────────────────────
export const getTrialStatus = (): TrialStatus => {
    // Record install date on very first launch
    let installDate = localStorage.getItem(KEY_INSTALL);
    if (!installDate) {
        installDate = new Date().toISOString();
        localStorage.setItem(KEY_INSTALL, installDate);
    }

    const install       = new Date(installDate);
    const now           = new Date();
    const msPerDay      = 1000 * 60 * 60 * 24;
    const daysUsed      = Math.floor((now.getTime() - install.getTime()) / msPerDay);
    const daysRemaining = Math.max(0, TRIAL_DAYS - daysUsed);

    return {
        isInTrial:    daysUsed < TRIAL_DAYS,
        trialExpired: daysUsed >= TRIAL_DAYS,
        daysUsed,
        daysRemaining,
        showWarning:  daysUsed >= WARN_AFTER && daysUsed < TRIAL_DAYS,
    };
};

// ── License Key Validation ───────────────────────────────────
export const validateLicenseKey = (key: string | null): LicenseStatus => {
    if (!key) {
        return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'No license key found.' };
    }
    try {
        const currentMachineId = getMachineId();
        const cleanKey = key.replace(/[-\s]/g, '').toLowerCase();

        const hexToString = (hex: string) => {
            let str = '';
            for (let i = 0; i < hex.length; i += 2)
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            return str;
        };

        const reversed = hexToString(cleanKey);
        const b64      = reversed.split('').reverse().join('');
        const raw      = atob(b64);
        const [machineId, timestampStr, salt] = raw.split(':');

        if (salt !== SECRET_SALT)
            throw new Error('Invalid salt');

        if (machineId !== currentMachineId)
            return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'License is locked to another device.' };

        const expiryDate   = new Date(parseInt(timestampStr));
        const now          = new Date();
        const diffMs       = expiryDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs <= 0)
            return { isValid: false, expiryDate, daysRemaining: 0, message: 'License has expired.' };

        return { isValid: true, expiryDate, daysRemaining, message: `License valid for ${daysRemaining} days.` };
    } catch {
        return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'Invalid license integrity.' };
    }
};

// ── Storage helpers ──────────────────────────────────────────
export const setLicenseKey      = (key: string) => localStorage.setItem(KEY_LICENSE, key);
export const getStoredLicenseKey = (): string | null => localStorage.getItem(KEY_LICENSE);
