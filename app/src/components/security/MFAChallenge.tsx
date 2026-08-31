/**
 * MFAChallenge.tsx
 * 
 * Component for MFA challenge during login
 * Compliant with 21 CFR Part 11 §11.300 - Individual accountability
 */

import React, { useState } from 'react';
import { Smartphone, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecurity } from './SecurityProvider';
import { toast } from 'sonner';

interface MFAChallengeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MFAChallenge({ isOpen, onClose, onSuccess }: MFAChallengeProps) {
  const { completeMFAChallenge } = useSecurity();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const verified = await completeMFAChallenge(code);
      if (verified) {
        toast.success('MFA verification successful!');
        onSuccess();
        // Reset state
        setCode('');
        setAttempts(0);
      } else {
        setAttempts(prev => prev + 1);
        if (attempts + 1 >= maxAttempts) {
          toast.error('Maximum attempts reached. Please try logging in again.');
          onClose();
          setCode('');
          setAttempts(0);
        } else {
          toast.error(`Invalid code. ${maxAttempts - attempts - 1} attempts remaining.`);
        }
      }
    } catch (error) {
      console.error('MFA challenge failed:', error);
      toast.error('MFA verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setAttempts(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white rounded-2xl p-6 border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Multi-Factor Authentication Required
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Enter your 6-digit authenticator code to complete login (21 CFR Part 11 §11.300 compliant)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <Alert className="bg-amber-50 border-amber-200">
            <Smartphone className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800">
              Open your authenticator app and enter the current 6-digit code
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Key className="h-3 w-3" />
              Authentication Code
            </Label>
            <Input
              type="text"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="font-mono text-center text-lg tracking-widest"
              autoFocus
            />
            <p className="text-[10px] text-slate-500">
              {maxAttempts - attempts} attempts remaining
            </p>
          </div>

          <Button 
            onClick={handleVerify} 
            disabled={isVerifying || code.length !== 6}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            {isVerifying ? 'Verifying...' : 'Verify & Complete Login'}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} className="font-bold">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}