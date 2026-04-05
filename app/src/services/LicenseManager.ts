/**
 * License Manager Utility
 * Handles encryption and decryption of application license keys with obfuscation.
 * This version is hardware-locked to the customer's machine.
 */

// Simple obfuscation salt - This remains consistent between generator and client
const SECRET_SALT = 'PHARMA_QC_2024_SECURE';
const BETA_BYPASS_KEY = 'PQMS-BETA-2026';

export interface LicenseStatus {
    isValid: boolean;
    expiryDate: Date | null;
    daysRemaining: number;
    message: string;
}

/**
 * Retrieves the unique Hardware ID from the Electron process
 */
export const getMachineId = (): string => {
    // In Electron, we passed the ID via additionalArguments
    const args = (window as any).process?.argv || [];
    const machineIdArg = args.find((arg: string) => arg.startsWith('--machine-id='));
    if (machineIdArg) {
        return machineIdArg.split('=')[1];
    }

    // Fallback for development/testing if not in Electron
    return 'DEV-ENVIRONMENT-ID';
};

/**
 * Decrypts a license string and validates it against the hardware ID
 * @param key The license key string
 * @returns LicenseStatus object
 */
export const validateLicenseKey = (key: string | null): LicenseStatus => {
    if (!key) {
        return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'No license key found.' };
    }

    // Beta Bypass Check
    if (key === BETA_BYPASS_KEY) {
        return { 
            isValid: true, 
            expiryDate: new Date('2026-12-31'), 
            daysRemaining: 365, 
            message: 'Beta Access Granted.' 
        };
    }

    try {
        const currentMachineId = getMachineId();

        // Reverse obfuscation: Base64 -> Reverse -> Base64
        const reversed = atob(key);
        const b64 = reversed.split('').reverse().join('');
        const raw = atob(b64);

        // Raw format: MACHINE_ID:TIMESTAMP:SALT
        const [machineId, timestampStr, salt] = raw.split(':');

        if (salt !== SECRET_SALT) {
            throw new Error('Invalid salt');
        }

        if (machineId !== currentMachineId) {
            return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'License is locked to another device.' };
        }

        const expiryTimestamp = parseInt(timestampStr);
        const expiryDate = new Date(expiryTimestamp);
        const now = new Date();

        const diffMs = expiryDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs <= 0) {
            return { isValid: false, expiryDate, daysRemaining: 0, message: 'License has expired.' };
        }

        return {
            isValid: true,
            expiryDate,
            daysRemaining,
            message: `License valid for ${daysRemaining} days.`
        };
    } catch (e) {
        return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'Invalid license integrity.' };
    }
};

/**
 * Saves a license key to local storage
 */
export const setLicenseKey = (key: string) => {
    localStorage.setItem('pqms_enterprise_license', key);
};

/**
 * Retrieves the current license key from local storage
 */
export const getStoredLicenseKey = (): string | null => {
    return localStorage.getItem('pqms_enterprise_license');
};
