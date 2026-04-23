/**
 * License Manager Utility
 * Handles encryption and decryption of application license keys with obfuscation.
 * Supports legacy and new V2 professional formats.
 */

const SECRET_SALT = 'PHARMA_QC_2024_SECURE';

export interface LicenseStatus {
    isValid: boolean;
    expiryDate: Date | null;
    daysRemaining: number;
    message: string;
    customer?: string;
}

/**
 * Retrieves the unique Hardware ID from the Electron process
 */
export const getMachineId = (): string => {
    const args = (window as any).process?.argv || [];
    const machineIdArg = args.find((arg: string) => arg.startsWith('--machine-id='));
    if (machineIdArg) {
        return machineIdArg.split('=')[1];
    }
    return 'DEV-ENVIRONMENT-ID';
};

/**
 * Decrypts a license string and validates it
 */
export const validateLicenseKey = (key: string | null): LicenseStatus => {
    if (!key) {
        return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'No license key found.' };
    }

    try {
        const currentMachineId = getMachineId();
        const cleanKey = key.trim().replace(/\s/g, '');

        // Check if it's the new V2 Format
        if (cleanKey.startsWith('PQMS-V2-')) {
            const actualKey = cleanKey.replace('PQMS-V2-', '');
            const reversedB64 = atob(actualKey);
            const b64 = reversedB64.split('').reverse().join('');
            const raw = atob(b64);

            // V2 Format: V2:MACHINE_ID:CUSTOMER:TIMESTAMP:SALT
            const [version, machineId, customer, timestampStr, salt] = raw.split(':');

            if (version !== 'V2' || salt !== SECRET_SALT) {
                throw new Error('Invalid key signature');
            }

            const isWebVersion = currentMachineId === 'DEV-ENVIRONMENT-ID';
            if (!isWebVersion && machineId !== currentMachineId) {
                return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'License locked to another device.' };
            }

            const expiryDate = new Date(parseInt(timestampStr));
            const now = new Date();
            const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysRemaining <= 0) {
                return { isValid: false, expiryDate, daysRemaining: 0, message: 'Enterprise license has expired.' };
            }

            return {
                isValid: true,
                expiryDate,
                daysRemaining,
                customer,
                message: `Enterprise Licensed to ${customer}`
            };
        }

        // Fallback to Legacy Format (Double Base64 + Reverse)
        const reversedB64 = atob(cleanKey);
        const b64 = reversedB64.split('').reverse().join('');
        const raw = atob(b64);

        // Legacy format: MACHINE_ID:TIMESTAMP:SALT
        const [machineId, timestampStr, salt] = raw.split(':');

        if (salt !== SECRET_SALT) {
            throw new Error('Invalid salt');
        }

        const isWebVersion = currentMachineId === 'DEV-ENVIRONMENT-ID';
        if (!isWebVersion && machineId !== currentMachineId) {
            return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'License locked to another device.' };
        }

        const expiryDate = new Date(parseInt(timestampStr));
        const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 0) {
            return { isValid: false, expiryDate, daysRemaining: 0, message: 'License expired.' };
        }

        return {
            isValid: true,
            expiryDate,
            daysRemaining,
            message: `Legacy License: ${daysRemaining} days remaining.`
        };

    } catch (e) {
        return { isValid: false, expiryDate: null, daysRemaining: 0, message: 'Invalid certification integrity.' };
    }
};

export const setLicenseKey = (key: string) => localStorage.setItem('pqms_enterprise_license', key);
export const getStoredLicenseKey = (): string | null => localStorage.getItem('pqms_enterprise_license');
