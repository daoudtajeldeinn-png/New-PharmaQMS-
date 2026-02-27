export interface LicenseStatus {
    isValid: boolean;
    expiryDate: Date | null;
    daysRemaining: number;
    message: string;
}

export const generateLicenseKey = (date: Date): string => {
    return date.getTime().toString();
};

export const validateLicenseKey = (_key: string | null): LicenseStatus => {
    return {
        isValid: true,
        expiryDate: new Date('2099-12-31'),
        daysRemaining: 99999,
        message: 'License valid.'
    };
};

export const setLicenseKey = (key: string) => {
    localStorage.setItem('pqms_enterprise_license', key);
};

export const getStoredLicenseKey = (): string | null => {
    return localStorage.getItem('pqms_enterprise_license');
};
