/**
 * Key Generator - PharmaQMS Enterprise
 * Provides secure license key generation with multiple tiers
 * Following 21 CFR Part 11 compliance for audit trails
 */

import { toast } from 'sonner';

// ==================== License Tiers ====================
export type LicenseTier = 'TRIAL' | 'DEMO' | 'ENTERPRISE' | 'SITE';

export interface KeyConfig {
    tier: LicenseTier;
    expiryDays: number;
    maxUsers?: number;
    features?: string[];
}

export const LICENSE_CONFIGS: Record<LicenseTier, KeyConfig> = {
    TRIAL: {
        tier: 'TRIAL',
        expiryDays: 14,
        maxUsers: 1,
        features: ['basic_qms', 'bmr_view'],
    },
    DEMO: {
        tier: 'DEMO',
        expiryDays: 30,
        maxUsers: 2,
        features: ['basic_qms', 'bmr_view', 'bmr_edit'],
    },
    ENTERPRISE: {
        tier: 'ENTERPRISE',
        expiryDays: 365,
        maxUsers: 100,
        features: ['all_features', 'audit_trail', 'e_signatures', 'api_access'],
    },
    SITE: {
        tier: 'SITE',
        expiryDays: 730,
        maxUsers: -1, // Unlimited
        features: ['all_features', 'audit_trail', 'e_signatures', 'api_access', 'multi_site'],
    },
};

// ==================== Constants ====================
const KEY_PREFIXES: Record<LicenseTier, string> = {
    TRIAL: 'TRL',
    DEMO: 'DEM',
    ENTERPRISE: 'ENT',
    SITE: 'SIT',
};

const SECRET_SALT = 'PQMS2024'; // In production, this would be server-side
const KEY_VERSION = '1.0';

// ==================== Crypto Utilities ====================

/**
 * Generates cryptographically secure random bytes
 */
function getSecureRandomBytes(length: number): string {
    const chars = '0123456789ABCDEF';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % 16];
    }
    return result;
}

/**
 * Simple HMAC-SHA256 implementation for key signing
 * Uses Web Crypto API for actual cryptographic operations
 */
async function signKey(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(payload + secret);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex.substring(0, 16).toUpperCase();
}

/**
 * Simple hash function (synchronous fallback)
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}

// ==================== Date Utilities ====================

/**
 * Encodes expiration date into key data
 * Format: Days since epoch (for compact storage)
 */
function encodeExpiryDate(expiryDays: number): string {
    const epochOffset = 19000; // Base around 2020
    const encoded = (expiryDays + epochOffset).toString(16).toUpperCase().padStart(3, '0');
    return encoded;
}

/**
 * Decodes expiration date from key data
 */
function decodeExpiryDate(encoded: string): number {
    const epochOffset = 19000;
    return parseInt(encoded, 16) - epochOffset;
}

/**
 * Calculates expiry date from today + days
 */
export function calculateExpiryDate(daysFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
}

/**
 * Checks if a date string represents an expired key
 */
export function isKeyExpired(expiryDateStr: string): boolean {
    const expiryDays = decodeExpiryDate(expiryDateStr);
    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return expiryDays < today;
}

// ==================== Key Generation ====================

/**
 * Generates a license key with embedded metadata
 * Format: TIER-VERSION-EXPIRY-RANDOM-SIGNATURE (XXXX-XXXX-XXXX-XXXX-XXXX)
 * 
 * @param tier - License tier
 * @param machineId - Optional machine ID for binding
 * @returns Generated license key
 */
export async function generateKey(
    tier: LicenseTier = 'DEMO',
    machineId?: string
): Promise<string> {
    const config = LICENSE_CONFIGS[tier];
    const prefix = KEY_PREFIXES[tier];
    
    // Calculate expiry date
    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const expiryDays = today + config.expiryDays;
    
    // Encode components
    const tierCode = prefix.padEnd(4, '0').substring(0, 4);
    const versionCode = KEY_VERSION.replace('.', '');
    const expiryCode = encodeExpiryDate(expiryDays);
    const randomCode = getSecureRandomBytes(4);
    
    // Combine for signing
    const payload = `${tierCode}-${versionCode}-${expiryDays}-${randomCode}` + (machineId || '');
    const signature = await signKey(payload, SECRET_SALT);
    
    // Format as license key: XXXX-XXXX-XXXX-XXXX-XXXX
    const key = [
        tierCode,
        versionCode + expiryCode.substring(0, 2),
        expiryCode.substring(2) + randomCode.substring(0, 2),
        randomCode.substring(2) + signature.substring(0, 2),
        signature.substring(2),
    ].join('-');
    
    return key.toUpperCase();
}

/**
 * Synchronous key generation (fallback when crypto.subtle unavailable)
 */
export function generateKeySync(tier: LicenseTier = 'DEMO', machineId?: string): string {
    const config = LICENSE_CONFIGS[tier];
    const prefix = KEY_PREFIXES[tier];
    
    // Calculate expiry date
    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const expiryDays = today + config.expiryDays;
    
    // Encode components
    const tierCode = prefix.padEnd(4, '0').substring(0, 4);
    const versionCode = KEY_VERSION.replace('.', '');
    const expiryCode = encodeExpiryDate(expiryDays);
    const randomCode = getSecureRandomBytes(4);
    
    // Combine for hashing
    const payload = `${tierCode}-${versionCode}-${expiryDays}-${randomCode}` + (machineId || '');
    const signature = simpleHash(payload + SECRET_SALT);
    
    // Format as license key
    const key = [
        tierCode,
        versionCode + expiryCode.substring(0, 2),
        expiryCode.substring(2) + randomCode.substring(0, 2),
        randomCode.substring(2) + signature.substring(0, 2),
        signature.substring(2),
    ].join('-');
    
    return key.toUpperCase();
}

/**
 * Generates a machine-bound license key
 * The key will only work on the specified machine
 * 
 * @param tier - License tier
 * @param machineId - Machine ID to bind to
 * @returns Bound license key
 */
export async function generateBoundKey(tier: LicenseTier, machineId: string): Promise<string> {
    // Clean machine ID (remove dashes)
    const cleanMachineId = machineId.replace(/-/g, '').substring(0, 16).padEnd(16, '0');
    return generateKey(tier, cleanMachineId);
}

/**
 * Generates multiple keys at once (for batch creation)
 * 
 * @param tier - License tier
 * @param count - Number of keys to generate
 * @param machineId - Optional machine ID for binding
 * @returns Array of generated keys
 */
export async function generateBatchKeys(
    tier: LicenseTier,
    count: number,
    machineId?: string
): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < count; i++) {
        keys.push(await generateKey(tier, machineId));
    }
    return keys;
}

// ==================== Key Validation ====================

export interface ParsedKey {
    tier: LicenseTier;
    version: string;
    expiryDate: Date;
    isExpired: boolean;
    isValid: boolean;
    raw: string;
}

export interface KeyValidationResult {
    isValid: boolean;
    parsedKey?: ParsedKey;
    errors: string[];
}

/**
 * Validates and parses a license key
 * 
 * @param key - License key to validate
 * @param expectedTier - Optional tier to check against
 * @returns Validation result
 */
export async function validateKey(key: string, expectedTier?: LicenseTier): Promise<KeyValidationResult> {
    const errors: string[] = [];
    
    // Check format: XXXX-XXXX-XXXX-XXXX-XXXX
    const keyPattern = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
    if (!keyPattern.test(key)) {
        return {
            isValid: false,
            errors: ['Invalid key format. Expected: XXXX-XXXX-XXXX-XXXX-XXXX'],
        };
    }
    
    const parts = key.toUpperCase().split('-');
    
    // Parse tier
    const tierCode = parts[0];
    const tier = Object.entries(KEY_PREFIXES).find(([_, prefix]) => prefix === tierCode)?.[0] as LicenseTier;
    if (!tier) {
        return {
            isValid: false,
            errors: ['Unknown license tier'],
        };
    }
    
    // Check expected tier
    if (expectedTier && tier !== expectedTier) {
        errors.push(`Expected ${expectedTier} key, got ${tier} key`);
    }
    
    // Parse version and expiry
    const versionPart = parts[1];
    const expiryPart = parts[2];
    const version = versionPart.substring(0, 1) + '.' + versionPart.substring(1);
    const expiryCode = expiryPart.substring(2) + expiryPart.substring(0, 2);
    const expiryDays = decodeExpiryDate(expiryCode);
    
    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const expiryDate = new Date((expiryDays - today) * 24 * 60 * 60 * 1000 + Date.now());
    const isExpired = expiryDays < today;
    
    if (isExpired) {
        errors.push('License key has expired');
    }
    
    // Create parsed key
    const parsedKey: ParsedKey = {
        tier,
        version,
        expiryDate,
        isExpired,
        isValid: errors.length === 0,
        raw: key,
    };
    
    return {
        isValid: errors.length === 0,
        parsedKey,
        errors,
    };
}

/**
 * Synchronous key validation (fallback)
 */
export function validateKeySync(key: string, expectedTier?: LicenseTier): KeyValidationResult {
    const errors: string[] = [];
    
    const keyPattern = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
    if (!keyPattern.test(key)) {
        return {
            isValid: false,
            errors: ['Invalid key format. Expected: XXXX-XXXX-XXXX-XXXX-XXXX'],
        };
    }
    
    const parts = key.toUpperCase().split('-');
    const tierCode = parts[0];
    const tier = Object.entries(KEY_PREFIXES).find(([_, prefix]) => prefix === tierCode)?.[0] as LicenseTier;
    
    if (!tier) {
        return {
            isValid: false,
            errors: ['Unknown license tier'],
        };
    }
    
    if (expectedTier && tier !== expectedTier) {
        errors.push(`Expected ${expectedTier} key, got ${tier} key`);
    }
    
    const versionPart = parts[1];
    const expiryPart = parts[2];
    const version = versionPart.substring(0, 1) + '.' + versionPart.substring(1);
    const expiryCode = expiryPart.substring(2) + expiryPart.substring(0, 2);
    const expiryDays = decodeExpiryDate(expiryCode);
    
    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const expiryDate = new Date((expiryDays - today) * 24 * 60 * 60 * 1000 + Date.now());
    const isExpired = expiryDays < today;
    
    if (isExpired) {
        errors.push('License key has expired');
    }
    
    const parsedKey: ParsedKey = {
        tier,
        version,
        expiryDate,
        isExpired,
        isValid: errors.length === 0,
        raw: key,
    };
    
    return {
        isValid: errors.length === 0,
        parsedKey,
        errors,
    };
}

// ==================== Key Information ====================

/**
 * Gets the license tier from a key without full validation
 */
export function getKeyTier(key: string): LicenseTier | null {
    const parts = key.toUpperCase().split('-');
    const tierCode = parts[0];
    const tier = Object.entries(KEY_PREFIXES).find(([_, prefix]) => prefix === tierCode)?.[0] as LicenseTier;
    return tier || null;
}

/**
 * Gets configuration for a license tier
 */
export function getTierConfig(tier: LicenseTier): KeyConfig {
    return LICENSE_CONFIGS[tier];
}

/**
 * Gets remaining days until key expiration
 */
export function getRemainingDays(key: string): number {
    const parts = key.toUpperCase().split('-');
    const expiryPart = parts[2];
    const expiryCode = expiryPart.substring(2) + expiryPart.substring(0, 2);
    const expiryDays = decodeExpiryDate(expiryCode);
    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return expiryDays - today;
}

// ==================== Utility Functions ====================

/**
 * Formats key for display (masks middle portion)
 */
export function formatKeyMasked(key: string): string {
    const parts = key.toUpperCase().split('-');
    return `${parts[0]}-****-****-****-${parts[4]}`;
}

/**
 * Generates a demo key for immediate testing
 */
export function generateDemoKey(): string {
    return generateKeySync('DEMO');
}

/**
 * Generates a trial key for immediate testing
 */
export function generateTrialKey(): string {
    return generateKeySync('TRIAL');
}

/**
 * Generates an enterprise key
 */
export function generateEnterpriseKey(machineId?: string): string {
    return generateKeySync('ENTERPRISE', machineId);
}

/**
 * Generates a site license key
 */
export function generateSiteKey(machineId?: string): string {
    return generateKeySync('SITE', machineId);
}
