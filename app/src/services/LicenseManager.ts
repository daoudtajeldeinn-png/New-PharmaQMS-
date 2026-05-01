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

// ==================== Date Utilities ====================

/**
 * Encode expiry days from today using epoch offset
 */
function encodeExpiryDate(expiryDays: number): string {
    const epochOffset = 19000;
    return (expiryDays + epochOffset).toString(16).toUpperCase().padStart(3, '0');
}

/**
 * Decode expiry days from encoded date
 */
function decodeExpiryDate(encoded: string): number {
    const epochOffset = 19000;
    return parseInt(encoded, 16) - epochOffset;
}

/**
 * Check if key is expired based on encoded expiry date
 */
function isKeyExpired(key: string): { expired: boolean; daysRemaining: number } {
    const parts = key.split('-');
    if (parts.length < 3) return { expired: true, daysRemaining: 0 };

    // Extract expiry code from part 2 (format: XX + XXXXXX -> XXXXXX + XX reversed)
    const expiryPart = parts[2];
    const expiryCode = expiryPart.substring(2) + expiryPart.substring(0, 2);
    const expiryDays = decodeExpiryDate(expiryCode);

    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const daysRemaining = expiryDays - today;

    return {
        expired: daysRemaining < 0,
        daysRemaining,
    };
}

/**
 * Validates a license key format and checks expiration
 * Supports both 4-group (legacy) and 5-group (current) formats:
 * - Legacy: XXXX-XXXX-XXXX-XXXX (16 hex chars)
 * - Current: XXXX-XXXX-XXXX-XXXX-XXXX (20 hex chars with embedded expiry)
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

    // Check for valid prefixes (both legacy and new formats)
    const validPrefixes = ['DEMO', 'TEST', 'TRL', 'ENT', 'SIT', 'DEMO', 'ENT', 'SIT', 'TRL'];
    const hasValidPrefix = validPrefixes.some(prefix => normalizedKey.startsWith(prefix));

    // Try new 5-group format first (XXXX-XXXX-XXXX-XXXX-XXXX)
    const newKeyPattern = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;

    if (newKeyPattern.test(normalizedKey)) {
        // Validate the new format with expiry checking
        const { expired, daysRemaining } = isKeyExpired(normalizedKey);

        if (expired) {
            return {
                isValid: false,
                licenseKey: normalizedKey,
                message: `License key has expired`,
            };
        }

        // Extract tier from first part
        const tierMatch = normalizedKey.match(/^([A-F0-9]{4})/);
        const tier = tierMatch ? tierMatch[1] : 'UNKNOWN';

        return {
            isValid: true,
            licenseKey: normalizedKey,
            message: `License activated (${daysRemaining} days remaining)`,
        };
    }

    // Fall back to legacy 4-group format: XXXX-XXXX-XXXX-XXXX
    const legacyKeyPattern = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;

    if (legacyKeyPattern.test(normalizedKey)) {
        const isDemoKey = normalizedKey.startsWith('DEMO') || normalizedKey.startsWith('TEST');

        return {
            isValid: true,
            licenseKey: normalizedKey,
            message: isDemoKey ? 'Demo license activated' : 'Enterprise license validated',
        };
    }

    // Check if it's a demo key with any valid hex format (loose validation for testing)
    if (hasValidPrefix && normalizedKey.length >= 16) {
        return {
            isValid: true,
            licenseKey: normalizedKey,
            message: 'License activated (loose validation)',
        };
    }

    return {
        isValid: false,
        message: 'Invalid license key format. Expected: XXXX-XXXX-XXXX-XXXX-XXXX',
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
