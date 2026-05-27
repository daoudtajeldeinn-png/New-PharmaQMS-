import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  recordLabel: string;
  tableName: string;
}

export function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  recordLabel,
  tableName
}: DeleteConfirmationDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason || reason.trim().length < 8) {
      setError('Please provide a detailed justification (minimum 8 characters).');
      return;
    }
    setError('');
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-200">
        <DialogHeader className="flex flex-row items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
              Confirm Secure Deletion
            </DialogTitle>
            <p className="text-[10px] font-bold text-red-500 tracking-widest uppercase mt-0.5">
              21 CFR Part 11 / EU Annex 11 Audited Action
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Target Record
            </div>
            <div className="text-sm font-bold text-slate-800">
              {recordLabel}
            </div>
            <div className="text-[10px] text-slate-500 font-medium font-mono">
              Table: {tableName}
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/50 rounded-xl flex gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              This action marks the record as <strong>soft-deleted</strong>. It will be hidden from all standard views but retained in the audit history for regulatory inspections.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deletion-reason" className="text-xs font-bold text-slate-700">
              Justification / Reason for Deletion <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="deletion-reason"
              placeholder="e.g. Incorrect batch parameters entered, duplicate record, test cancellation..."
              className="min-h-[90px] text-xs font-medium border-slate-200 focus:border-red-500 focus:ring-red-500 rounded-xl"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
            />
            {error && (
              <p className="text-xs font-bold text-red-500 animate-pulse">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 border-t border-slate-100 pt-3">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-slate-500 font-bold text-xs uppercase tracking-wider h-11 px-6 hover:bg-slate-50 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider h-11 px-8 rounded-xl shadow-lg shadow-red-200"
          >
            Authorize Deletion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
