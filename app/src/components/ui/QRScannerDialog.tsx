import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface QRScannerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScan: (decodedText: string) => void;
}

export function QRScannerDialog({ open, onOpenChange }: QRScannerDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-indigo-400" />
                        Scan Intelligence QR/Barcode
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="w-full overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-slate-950/50 min-h-[300px] flex items-center justify-center">
                        <p className="text-slate-400 text-sm">QR Scanner not available in web version</p>
                    </div>
                    <p className="mt-4 text-xs text-slate-400 text-center">
                        Position the QR code or Barcode within the frame to automatically scan and retrieve record details.
                    </p>
                </div>
                <div className="flex justify-end gap-2 p-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/10">
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
