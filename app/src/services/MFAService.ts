/**
 * MFAService.ts
 * 
 * Multi-Factor Authentication service using Supabase Auth MFA
 * Compliant with 21 CFR Part 11 §11.300 - Individual accountability
 * 
 * Implements TOTP (Time-based One-Time Password) via Supabase's MFA API
 * Requires admin and approver roles to use MFA for enhanced security
 */

import { supabase } from '@/lib/supabase';

export interface MFAEnrollment {
  id: string;
  factorId: string;
  secret: string;
  qrCode: string;
  verified: boolean;
}

export interface MFAChallenge {
  id: string;
  factorId: string;
  expiresAt: Date;
}

export interface MFAStatus {
  enrolled: boolean;
  factors: string[];
  lastVerified?: Date;
}

/**
 * MFAService - Handles MFA enrollment, challenge, and verification
 */
export class MFAService {
  private static instance: MFAService;

  private constructor() {}

  public static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
  }

  /**
   * Check if user is enrolled in MFA
   */
  async checkMFAStatus(userId: string): Promise<MFAStatus> {
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('MFA status check failed:', error);
        return { enrolled: false, factors: [] };
      }

      const allFactors = factors?.all || [];
      const totpFactors = allFactors.filter(f => f.factor_type === 'totp');
      
      return {
        enrolled: totpFactors.length > 0,
        factors: totpFactors.map(f => f.factor_id),
      };
    } catch (error) {
      console.error('MFA status check exception:', error);
      return { enrolled: false, factors: [] };
    }
  }

  /**
   * Enroll user in TOTP MFA
   * Returns enrollment details including QR code for authenticator app
   */
  async enrollTOTP(userId: string): Promise<MFAEnrollment> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'PharmaQMS Authenticator',
      });

      if (error) {
        throw new Error(`MFA enrollment failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No enrollment data returned');
      }

      const { id, type, totp } = data;
      
      if (!totp) {
        throw new Error('No TOTP data returned');
      }

      return {
        id: id,
        factorId: id,
        secret: totp.secret,
        qrCode: totp.qr_code,
        verified: false,
      };
    } catch (error) {
      console.error('MFA enrollment exception:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP enrollment with authenticator app code
   */
  async verifyTOTPEnrollment(
    factorId: string, 
    code: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        code,
      });

      if (error) {
        console.error('MFA verification failed:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('MFA verification exception:', error);
      return false;
    }
  }

  /**
   * Challenge user with MFA during login
   */
  async challengeMFA(factorId: string): Promise<MFAChallenge> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) {
        throw new Error(`MFA challenge failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No challenge data returned');
      }

      return {
        id: data.id,
        factorId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      };
    } catch (error) {
      console.error('MFA challenge exception:', error);
      throw error;
    }
  }

  /**
   * Verify MFA challenge response
   */
  async verifyMFAChallenge(
    challengeId: string, 
    code: string
  ): Promise<boolean> {
    try {
      // First create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: challengeId,
      });

      if (challengeError || !challengeData) {
        console.error('MFA challenge creation failed:', challengeError);
        return false;
      }

      // Then verify with the code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: challengeId,
        challengeId: challengeData.id,
        code,
      });

      if (error) {
        console.error('MFA challenge verification failed:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('MFA challenge verification exception:', error);
      return false;
    }
  }

  /**
   * Unenroll user from MFA
   */
  async unenrollMFA(factorId: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        console.error('MFA unenrollment failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('MFA unenrollment exception:', error);
      return false;
    }
  }

  /**
   * Check if user role requires MFA
   */
  requiresMFA(role: string): boolean {
    const mfaRequiredRoles = ['admin', 'qc_manager', 'manager'];
    return mfaRequiredRoles.includes(role);
  }
}

// Export singleton instance
export const mfaService = MFAService.getInstance();