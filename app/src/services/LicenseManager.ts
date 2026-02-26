/**
 * License Manager Utility
 * Handles encryption and decryption of application license keys with obfuscation.
 */

// Simple obfuscation key - Change this to your secret
const SECRET_SALT = 'PHARMA_QC_2024_SECURE';

export interface LicenseStatus {
    isValid: boolean;
    expiryDate: Date | null;
    daysRemaining: number;
    message: string;
}

/**
 * Encrypts a date into a license string
 * @param date The expiration date
 * @returns An obfuscated string
 */
export const generateLicenseKey = (date: Date): string => {
    const timestamp = date.getTime().toString();
    const raw = `${timestamp}:${SECRET_SALT}`;

    // Custom obfuscation: Base64 -> Reverse -> Base64
    const b64 = btoa(raw);
    const reversed = b64.split('').reverse().join('');
    return btoa(reversed);
};

/**
 * Decrypts a license string and validates it
 * @param key The license key string
 * @returns LicenseStatus object
 */
export const validateLicenseKey = (key: string | null): LicenseStatus => {
    if (!key) {
        return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'No license key found.' };
    }

    try {
        // Reverse obfuscation
        const reversed = atob(key);
        const b64 = reversed.split('').reverse().join('');
        const raw = atob(b64);

        const [timestampStr, salt] = raw.split(':');

        if (salt !== SECRET_SALT) {
            throw new Error('Invalid salt');
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
