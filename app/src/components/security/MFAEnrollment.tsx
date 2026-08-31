/**
 * MFAEnrollment.tsx
 * 
 * Component for MFA enrollment with QR code display
 * Compliant with 21 CFR Part 11 §11.300 - Individual accountability
 */

import React, { useState } from 'react';
import { Smartphone, Shield, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecurity } from './SecurityProvider';
import { toast } from 'sonner';

interface MFAEnrollmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MFAEnrollment({ isOpen, onClose, onSuccess }: MFAEnrollmentProps) {
  const { enrollMFA, verifyMFAEnrollment } = useSecurity();
  const [step, setStep] = useState<'qr' | 'verify'>('qr');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const enrollment = await enrollMFA();
      if (enrollment) {
        setQrCode(enrollment.qrCode);
        setSecret(enrollment.secret);
        setStep('verify');
      }
    } catch (error) {
      console.error('MFA enrollment failed:', error);
      toast.error('Failed to start MFA enrollment');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const verified = await verifyMFAEnrollment(verificationCode);
      if (verified) {
        toast.success('MFA enrollment completed successfully!');
        onSuccess();
        onClose();
        // Reset state
        setStep('qr');
        setQrCode('');
        setSecret('');
        setVerificationCode('');
      }
    } catch (error) {
      console.error('MFA verification failed:', error);
      toast.error('MFA verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Secret copied to clipboard');
  };

  const handleClose = () => {
    setStep('qr');
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white rounded-2xl p-6 border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            {step === 'qr' ? 'Set Up Multi-Factor Authentication' : 'Verify MFA Setup'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {step === 'qr' 
              ? 'Enhance your account security with TOTP-based MFA (21 CFR Part 11 §11.300 compliant)'
              : 'Enter the 6-digit code from your authenticator app to complete enrollment'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'qr' && (
          <div className="space-y-4 my-4">
            <Alert className="bg-amber-50 border-amber-200">
              <Smartphone className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800">
                You'll need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Step 1: Start Enrollment</Label>
              <p className="text-xs text-slate-600">
                Click the button below to generate a QR code for your authenticator app
              </p>
            </div>

            <Button 
              onClick={handleEnroll} 
              disabled={isEnrolling}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isEnrolling ? 'Generating QR Code...' : 'Generate QR Code'}
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Step 2: Scan QR Code</Label>
              <p className="text-xs text-slate-600">
                Scan this QR code with your authenticator app
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center bg-white p-4 rounded-lg border border-slate-200">
                <img 
                  src={qrCode} 
                  alt="MFA QR Code" 
                  className="w-48 h-48 object-contain"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Backup Secret (Optional)</Label>
              <div className="flex gap-2">
                <Input 
                  value={secret}
                  readOnly
                  className="font-mono text-xs bg-slate-50"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={copySecret}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">
                Save this secret code as a backup in case you lose access to your authenticator
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Step 3: Verify Setup</Label>
              <p className="text-xs text-slate-600">
                Enter the 6-digit code from your authenticator app to complete enrollment
              </p>
              <Input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="font-mono text-center text-lg tracking-widest"
              />
            </div>

            <Button 
              onClick={handleVerify} 
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isVerifying ? 'Verifying...' : 'Complete Enrollment'}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} className="font-bold">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}