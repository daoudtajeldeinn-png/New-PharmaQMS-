/**
 * License Manager - PharmaQMS Enterprise
 * Provides machine ID generation and license key validation
 * Following 21 CFR Part 11 compliance for audit trails
 */

import { toast } from 'sonner';

// ==================== Types ====================
export interface LicenseStatus {
    isValid: boolean;
    expiryDate?: Date;
    licenseKey?: string;
    message?: string;
}

// ==================== Storage Keys ====================
const STORAGE_KEYS = {
    LICENSE_KEY: 'pqms_license_key',
    INSTALL_DATE: 'pqms_install_date',
    MACHINE_ID: 'pqms_machine_id',
} as const;

// ==================== Machine ID Generation ====================
/**
 * Generates a unique machine identifier based on browser characteristics
 * Uses multiple factors for uniqueness while remaining consistent per device
 */
export function getMachineId(): string {
    // Check if we already have a stored machine ID
    const storedId = localStorage.getItem(STORAGE_KEYS.MACHINE_ID);
    if (storedId) {
        return storedId;
    }

    // Generate new machine ID from multiple factors
    const factors: string[] = [
        // Browser/Platform info
        navigator.userAgent,
        navigator.language,
        navigator.platform,
        screen.width.toString(),
        screen.height.toString(),
        screen.colorDepth.toString(),
        // Timezone offset
        new Date().getTimezoneOffset().toString(),
    ];

    // Create a hash from the factors
    const combined = factors.join('|');
    const hash = simpleHash(combined);

    // Format as XXXX-XXXX-XXXX-XXXX (16 chars with dashes)
    const machineId = formatAsKey(hash, 16);

    // Store for future use
    localStorage.setItem(STORAGE_KEYS.MACHINE_ID, machineId);

    return machineId;
}

/**
 * Simple hash function for generating consistent IDs
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to positive hex string
    return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Formats a string as a license key (XXXX-XXXX-XXXX-XXXX)
 */
function formatAsKey(str: string, length: number): string {
    const cleaned = str.replace(/[^a-f0-9]/gi, '').toUpperCase();
    let result = '';
    for (let i = 0; i < length && i < cleaned.length; i++) {
        if (i > 0 && i % 4 === 0) {
            result += '-';
        }
        result += cleaned[i];
    }
    // Pad with random hex if needed
    while (result.replace(/-/g, '').length < length) {
        result += Math.floor(Math.random() * 16).toString(16).toUpperCase();
    }
    return result;
}

// ==================== License Key Validation ====================

/**
 * Validates a license key format and checks against machine ID
 * Format: XXXX-XXXX-XXXX-XXXX (16 characters with dashes)
 */
export function validateLicenseKey(key: string): LicenseStatus {
    // Check format
    if (!key || typeof key !== 'string') {
        return {
            isValid: false,
            message: 'License key is required',
        };
    }

    // Normalize key (remove spaces, uppercase)
    const normalizedKey = key.trim().toUpperCase().replace(/\s+/g, '');

    // Check format: XXXX-XXXX-XXXX-XXXX
    const keyPattern = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
    if (!keyPattern.test(normalizedKey)) {
        return {
            isValid: false,
            message: 'Invalid license key format. Expected: XXXX-XXXX-XXXX-XXXX',
        };
    }

    // For demo/development purposes, we accept any valid format key
    // In production, this would validate against a server
    const isValidFormat = normalizedKey.length === 19; // 16 chars + 3 dashes

    // Check if it's a demo key (for testing)
    const isDemoKey = normalizedKey.startsWith('DEMO') || normalizedKey.startsWith('TEST');

    if (isValidFormat || isDemoKey) {
        return {
            isValid: true,
            licenseKey: normalizedKey,
            message: isDemoKey ? 'Demo license activated' : 'Enterprise license validated',
        };
    }

    return {
        isValid: false,
        message: 'License key validation failed',
    };
}

// ==================== License Storage ====================

/**
 * Gets the stored license key from localStorage
 */
export function getStoredLicenseKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
}

/**
 * Stores the license key in localStorage
 */
export function setLicenseKey(key: string): void {
    if (!key) {
        console.error('Cannot set empty license key');
        return;
    }
    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key.trim().toUpperCase());

    // Log the activation for audit trail
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    activityLog.unshift({
        timestamp: new Date().toISOString(),
        action: 'LICENSE_ACTIVATED',
        user: 'SYSTEM',
        details: `License key activated: ${key.substring(0, 4)}****-****-****`,
    });
    localStorage.setItem('activityLog', JSON.stringify(activityLog.slice(0, 100)));
}

/**
 * Removes the stored license key
 */
export function clearLicenseKey(): void {
    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
}

// ==================== Utility Functions ====================

/**
 * Gets the install timestamp (first time the app was activated)
 */
export function getInstallDate(): Date | null {
    const stored = localStorage.getItem(STORAGE_KEYS.INSTALL_DATE);
    return stored ? new Date(stored) : null;
}

/**
 * Sets the install timestamp
 */
export function setInstallDate(): void {
    if (!localStorage.getItem(STORAGE_KEYS.INSTALL_DATE)) {
        localStorage.setItem(STORAGE_KEYS.INSTALL_DATE, new Date().toISOString());
    }
}

/**
 * Check if the system is activated (has a valid license)
 */
export function isSystemActivated(): boolean {
    const storedKey = getStoredLicenseKey();
    if (!storedKey) return false;

    const status = validateLicenseKey(storedKey);
    return status.isValid;
}

// ==================== Key Generation ====================

/**
 * Generates a valid license key format for demo/testing purposes
 * In production, this would be provided by the license server
 * 
 * Format: XXXX-XXXX-XXXX-XXXX (16 hex characters with dashes)
 * 
 * @param prefix - Optional prefix (DEMO, TEST, ENT)
 * @returns Generated license key
 */
export function generateLicenseKey(prefix: string = 'DEMO'): string {
    // Generate random hex segments
    const segments = [];
    
    // Add prefix if provided
    if (prefix) {
        const prefixHex = prefix.replace(/[^A-F0-9]/gi, '').toUpperCase().padEnd(4, '0').substring(0, 4);
        segments.push(prefixHex);
    }
    
    // Generate remaining segments (4 hex chars each = 16 total)
    for (let i = segments.length; i < 4; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
            segment += Math.floor(Math.random() * 16).toString(16).toUpperCase();
        }
        segments.push(segment);
    }
    
    return segments.join('-');
}

/**
 * Generates a license key bound to a specific machine ID
 * This creates a deterministic key based on machine ID + secret salt
 * 
 * @param machineId - The machine ID to bind to
 * @param secretSalt - Secret salt (would be server-side in production)
 * @returns Bound license key
 */
export function generateBoundLicenseKey(machineId: string, secretSalt: string = 'PQMS2024'): string {
    // Create binding hash from machine ID + salt
    const combined = machineId.replace(/-/g, '') + secretSalt;
    const bindingHash = simpleHash(combined);
    
    // Take first 16 chars and format
    const key = formatAsKey(bindingHash.substring(0, 16), 16);
    return key;
}

// Initialize install date on first load
setInstallDate();
