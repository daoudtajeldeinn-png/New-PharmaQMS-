import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { useSecurity } from '@/components/security/SecurityProvider';
import { toast } from 'sonner';

interface SignatureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (signatureData: {
        signerName: string;
        timestamp: Date;
        intent: string;
    }) => void;
    title?: string;
    description?: string;
    actionIntent?: string;
}

export function SignatureModal({
    open,
    onOpenChange,
    onConfirm,
    title = "Electronic Signature Required",
    description = "This action requires a formal electronic signature in compliance with 21 CFR Part 11.",
    actionIntent = "I approve this record and confirm its accuracy."
}: SignatureModalProps) {
    const { user } = useSecurity();
    const [password, setPassword] = React.useState('');
    const [isVerifying, setIsVerifying] = React.useState(false);

    const handleSign = async () => {
        if (!password) {
            toast.error('Please enter your password to sign');
            return;
        }

        setIsVerifying(true);

        // Simulate password verification (in a real app, this would be a backend call)
        setTimeout(() => {
            setIsVerifying(false);
            onConfirm({
                signerName: user?.name || 'Authorized User',
                timestamp: new Date(),
                intent: actionIntent,
            });
            setPassword('');
            onOpenChange(false);
            toast.success('Record signed successfully');
        }, 1500);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass-card border-indigo-500/30">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/10 rounded-full">
                            <ShieldCheck className="h-6 w-6 text-indigo-500" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">
                            {title}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-500 font-medium italic">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signer Identity</span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Verified Session</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{user?.name || 'Administrator'}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user?.department || 'Quality Assurance'}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Signature Intent</Label>
                            <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                "{actionIntent}"
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sign-password" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Re-authenticate to Sign
                            </Label>
                            <Input
                                id="sign-password"
                                type="password"
                                placeholder="Confirm your password..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-600 font-medium leading-normal">
                            By clicking "Execute Signature", you acknowledge that this electronic signature is the legally binding equivalent of your handwritten signature.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-black uppercase tracking-widest">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSign}
                        disabled={isVerifying || !password}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-indigo-500/20 shadow-lg text-[10px] font-black uppercase tracking-widest px-8"
                    >
                        {isVerifying ? 'Verifying...' : 'Execute Signature'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
