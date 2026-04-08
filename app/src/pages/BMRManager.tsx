import { useState, useMemo, useRef } from 'react';
import { Plus, CheckCircle2, Printer, ClipboardCheck, Activity, Thermometer, ShieldCheck, PenLine, AlertTriangle, Scale, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReactToPrint } from 'react-to-print';
import { type BatchRecord } from '@/data/bmrData';
import { useStore } from '@/hooks/useStore';
import { toast } from 'sonner';

import type { BatchRecord, BMRStepExecution, BatchIngredient } from '@/data/bmrData';

export function BMRManagerPage() {
    const { state, dispatch } = useStore();
    const records = state.batchRecords;
    const masterFormulas = state.masterFormulas;
    const [showIssueDialog, setShowIssueDialog] = useState(false);
    const [selectedBMR, setSelectedBMR] = useState<BatchRecord | null>(null);
    const [newBatch, setNewBatch] = useState<Partial<BatchRecord>>({
        mfgDate: new Date().toISOString().split('T')[0],
        status: 'Issuance'
    });
    const printRef = useRef<HTMLDivElement>(null);

const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: selectedBMR ? `BMR-${selectedBMR.batchNumber}` : 'BMR',
    });
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingBMR, setEditingBMR] = useState<BatchRecord | null>(null);

    const handleIssueBatch = () => {
        if (!newBatch.mfrId || !newBatch.batchNumber) {
            toast.error('Please select MFR and enter Batch Number');
            return;
        }
        const mfr = masterFormulas[newBatch.mfrId];
        const requestedBatchSize = newBatch.batchSize || mfr.batchSize;
        const scalingFactor = requestedBatchSize / mfr.batchSize;

        const record: BatchRecord = {
            id: Math.random().toString(36).substr(2, 9),
            batchNumber: newBatch.batchNumber!,
            mfrId: newBatch.mfrId,
            productName: mfr.productName,
            batchSize: requestedBatchSize,
            batchSizeUnit: newBatch.batchSizeUnit || mfr.batchSizeUnit,
            mfgDate: newBatch.mfgDate || '',
            expiryDate: newBatch.expiryDate || '',
            status: 'Manufacturing',
            issuanceDate: new Date().toISOString().split('T')[0],
            issuedBy: 'System Admin',
            ingredients: mfr.ingredients.map(ing => ({
                itemCode: ing.itemCode,
                description: ing.description,
                quantity: ing.quantity,
                unit: ing.unit,
                category: ing.category,
                standardQty: ing.quantity * scalingFactor
            })),
            stepExecutions: mfr.processSteps.map(s => ({
                stepNumber: s.stepNumber,
                phase: s.phase,
                description: s.description,
                plannedDuration: s.plannedDuration,
                status: 'Pending',
                instructionChecklist: s.instructions?.map(text => ({ text, completed: false })) || []
            }))
        };
        dispatch({ type: 'ADD_BMR', payload: record });
        toast.success(`Batch Record ${record.batchNumber} issued successfully`);
        setShowIssueDialog(false);
    };

    const handleDeleteBMR = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this Batch Record? This will also remove it from the archive.')) {
            dispatch({ type: 'DELETE_BMR', payload: id });
            toast.success('BMR Deleted');
        }
    };



interface StepUpdate {
  realizedValue?: string;
  startedAt?: string;
  completedAt?: string;
  operatorSignature?: string;
  supervisorSignature?: string;
  status?: 'Pending' | 'In-Progress' | 'Completed' | 'Skipped';
}

const handleUpdateStep = (stepNumber: number, updates: StepUpdate) => {
        if (!selectedBMR) return;
        const updatedSteps = selectedBMR.stepExecutions.map(s =>
            s.stepNumber === stepNumber ? { ...s, ...updates } : s
        );
        const updatedBMR = { ...selectedBMR, stepExecutions: updatedSteps };
        dispatch({ type: 'UPDATE_BMR', payload: updatedBMR });
        setSelectedBMR(updatedBMR);
    };

    const handleVerifyMaterial = (itemCode: string, qty: number) => {
        if (!selectedBMR) return;
        const verifications = [...(selectedBMR.materialVerifications || [])];
        const existingIdx = verifications.findIndex(v => v.itemCode === itemCode);

        const newEntry = {
            itemCode,
            actualQty: qty,
            verifiedBy: 'Production Supervisor',
            verifiedAt: new Date().toLocaleTimeString()
        };

        if (existingIdx >= 0) verifications[existingIdx] = newEntry;
        else verifications.push(newEntry);

        const updatedBMR = { ...selectedBMR, materialVerifications: verifications };
        dispatch({ type: 'UPDATE_BMR', payload: updatedBMR });
        setSelectedBMR(updatedBMR);
        toast.success(`Material ${itemCode} verified at ${qty} units`);
    };

    const handleToggleInstruction = (stepNumber: number, instructionIndex: number) => {
        if (!selectedBMR) return;
        const updatedSteps = selectedBMR.stepExecutions.map(s => {
            if (s.stepNumber === stepNumber && s.instructionChecklist) {
                const newChecklist = [...s.instructionChecklist];
                newChecklist[instructionIndex] = {
                    ...newChecklist[instructionIndex],
                    completed: !newChecklist[instructionIndex].completed
                };
                return { ...s, instructionChecklist: newChecklist };
            }
            return s;
        });
        const updatedBMR = { ...selectedBMR, stepExecutions: updatedSteps };
        dispatch({ type: 'UPDATE_BMR', payload: updatedBMR });
        setSelectedBMR(updatedBMR);
    };

    const isBatchReadyForRelease = useMemo(() => {
        if (!selectedBMR) return false;
        // Check if all steps have their instruction checklist items completed
        return selectedBMR.stepExecutions.every(step =>
            !step.instructionChecklist || step.instructionChecklist.every(item => item.completed)
        );
    }, [selectedBMR]);

    const handleFinalRelease = () => {
        if (!selectedBMR) return;

        if (!isBatchReadyForRelease) {
            toast.error("RELEASE BLOCKED: All process steps must be completed (All Green) before final release.");
            return;
        }

        if (!window.confirm(`Are you sure you want to FINAL RELEASE batch ${selectedBMR.batchNumber}? This will lock the record and move it to Quarantine for QA Disposition.`)) return;

        const updatedBMR = { ...selectedBMR, status: 'Quarantine' as const };
        dispatch({ type: 'UPDATE_BMR', payload: updatedBMR });

        // Create a reconciliation record
        const reconciliation = {
            id: `REC-${Date.now()}`,
            batchId: selectedBMR.batchNumber,
            productName: selectedBMR.productName,
            theoreticalYield: 100, // Percentage
            actualYield: (selectedBMR.actualYield || 0) / selectedBMR.batchSize * 100,
            status: 'Pending' as const,
            timestamp: new Date(),
        };
        dispatch({ type: 'ADD_RECONCILIATION_RECORD', payload: reconciliation });

        setSelectedBMR(null);
        toast.success(`Batch ${selectedBMR.batchNumber} moved to Quarantine for QC Release`);
    };

    const batchReconciliation = useMemo(() => {
        if (!selectedBMR) return [];
        const ingredients = selectedBMR.ingredients || masterFormulas[selectedBMR.mfrId]?.ingredients || [];

        return ingredients.map(ing => {
            const dispensed = state.materialMovements
                .filter(m => m.batchId === selectedBMR.batchNumber && m.materialId.includes(ing.itemCode))
                .reduce((acc, curr) => acc + curr.quantity, 0);

            const standardQty = 'standardQty' in ing ? (ing as any).standardQty : ing.quantity;
            const variance = standardQty > 0 ? ((dispensed - standardQty) / standardQty) * 100 : 0;

            return {
                ...ing,
                standardQty,
                dispensed,
                variance
            };
        });
    }, [selectedBMR, state.materialMovements, masterFormulas]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                        <ClipboardCheck className="h-8 w-8 text-emerald-600" />
                        BATCH MANUFACTURING RECORDS (BMR)
                    </h1>
                    <p className="text-slate-500 font-medium">GMP Execution & Real-time Batch Monitoring</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowIssueDialog(true)} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 shadow-sm font-bold">
                        <PenLine className="h-4 w-4 mr-2" /> Write New BMR
                    </Button>
                    <Button onClick={() => setShowIssueDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                        <Plus className="h-4 w-4 mr-2" /> Issue Batch Record
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-none shadow-sm"><CardHeader className="pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Production</CardHeader><CardContent><div className="text-3xl font-black text-emerald-600">{records.filter(r => r.status === 'Manufacturing').length}</div></CardContent></Card>
                <Card className="bg-white border-none shadow-sm"><CardHeader className="pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Quarantine</CardHeader><CardContent><div className="text-3xl font-black text-amber-600">{records.filter(r => r.status === 'Quarantine').length}</div></CardContent></Card>
                <Card className="bg-white border-none shadow-sm"><CardHeader className="pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Released</CardHeader><CardContent><div className="text-3xl font-black text-blue-600">{records.filter(r => r.status === 'Released').length}</div></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {records.map((batch: BatchRecord) => (
                    <Card key={batch.id} className="hover:shadow-xl transition-all cursor-pointer border-t-4 border-t-emerald-500 bg-white" onClick={() => setSelectedBMR(batch)}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <Badge variant="secondary" className="mb-1 text-[10px] uppercase font-bold">{batch.status}</Badge>
                                <CardTitle className="text-lg font-black tracking-tight">{batch.batchNumber}</CardTitle>
                            </div>
                            <Activity className="h-5 w-5 text-emerald-300" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-bold text-slate-700 text-sm mb-4 leading-tight">{batch.productName}</div>
                            <div className="grid grid-cols-2 gap-2 mb-4 text-[10px] font-bold text-slate-500 uppercase">
                                <div className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> QC Passed</div>
                                <div className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Line Clear</div>
                            </div>
                            <div className="space-y-2">
                                {(() => {
                                    const total = batch.stepExecutions?.length || 0;
                                    const completed = batch.stepExecutions?.filter((s: any) => s.status === 'Completed').length || 0;
                                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                                    return (
                                        <>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-emerald-600">
                                                <span>{batch.status === 'Released' ? 'Released to Market' : 'Manufacturing Phase'}</span>
                                                <span>{progress}%</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); setEditingBMR(batch); setShowEditDialog(true); }}>
                                    <PenLine className="h-3 w-3 mr-1" /> Edit Meta
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDeleteBMR(batch.id, e)}>
                                    <Plus className="h-3 w-3 mr-1 rotate-45" /> Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* BMR Execution / Professional View */}
            <Dialog open={!!selectedBMR} onOpenChange={() => setSelectedBMR(null)}>
                <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-slate-50 p-0 border-none rounded-none shadow-2xl">
                    {selectedBMR && (
                        <>
                            <div className="bg-white min-h-[297mm] w-full mx-auto p-12 shadow-inner print:p-0 font-serif">
                            {/* Professional Header - A4 Style */}
                            <div className="flex justify-between items-start border-b-4 border-double border-slate-900 pb-8 mb-8">
                                <div className="flex gap-6 items-center">
                                    <div className="bg-slate-900 p-5 rounded-xl text-white shadow-lg">
                                        <ShieldCheck className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">PHARMAQMS ENTERPRISE</h1>
                                        <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Quality Management System | GxP COMPLIANCE</p>
                                        <p className="text-[10px] font-bold text-slate-500 leading-tight">Industrial Zone, Phase 2, Pharmaceutical District<br />Cairo, Egypt | Standard Operating Procedure: SOP-PRD-001</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">BATCH RECORD</div>
                                    <div className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded">OFFICIAL DOCUMENT</div>
                                    <div className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Ref No: {selectedBMR.batchNumber}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 border-2 border-slate-200 rounded-xl mb-8">
                                <div>
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Name</Label>
                                    <div className="text-sm font-black text-slate-900 truncate">{selectedBMR.productName}</div>
                                </div>
                                <div>
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Batch ID</Label>
                                    <div className="text-sm font-black font-mono text-blue-600">{selectedBMR.batchNumber}</div>
                                </div>
                                <div>
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manufacturing Date</Label>
                                    <div className="text-sm font-black text-slate-900">{selectedBMR.mfgDate}</div>
                                </div>
                                <div>
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Date</Label>
                                    <div className="text-sm font-black text-rose-600">{selectedBMR.expiryDate}</div>
                                </div>
                             </div>

                                <div className="flex gap-4 mb-10 pb-6 border-b border-slate-100">
                                    <Button variant="outline" className="gap-2 font-black uppercase text-[10px] tracking-widest h-11 px-6 border-slate-200 hover:bg-slate-50 transition-all shadow-sm" onClick={handlePrint}>
                                        <Printer className="h-4 w-4 text-slate-500" /> Print Full BMR
                                    </Button>
                                    <Button className="bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest h-11 px-10 shadow-lg shadow-slate-200 transition-all">
                                        Save Progress
                                    </Button>
                                </div>

                            <Tabs defaultValue="processing">
                                <TabsList className="grid grid-cols-5 bg-slate-100 p-1 mb-6">
                                    <TabsTrigger value="overview">Summary</TabsTrigger>
                                    <TabsTrigger value="dispensing">Materials</TabsTrigger>
                                    <TabsTrigger value="processing" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Manufacturing</TabsTrigger>
                                    <TabsTrigger value="packaging" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Packaging (BPR)</TabsTrigger>
                                    <TabsTrigger value="reconciliation">Yield Analysis</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-6">
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                                            <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Product Name</Label>
                                            <div className="text-lg font-black text-slate-800">{selectedBMR.productName}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                                            <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Batch Size</Label>
                                            <div className="text-lg font-black text-slate-800">{selectedBMR.batchSize} {selectedBMR.batchSizeUnit}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                                            <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Mfg/Exp Date</Label>
                                            <div className="text-lg font-black text-slate-800">{selectedBMR.mfgDate} / {selectedBMR.expiryDate}</div>
                                        </div>
                                    </div>

                                    <div className="border rounded-xl p-6 bg-emerald-50/30 border-emerald-100 shadow-inner">
                                        <h3 className="font-bold flex items-center gap-2 mb-4 text-emerald-800"><ShieldCheck className="h-5 w-5" /> Mandatory Line Clearance</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-emerald-100">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                <span className="text-sm font-semibold">Area free from previous batches</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-emerald-100">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                <span className="text-sm font-semibold">Calibration labels are valid</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-emerald-100">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                <span className="text-sm font-semibold">RM availability checked</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                                <Activity className="h-5 w-5 text-orange-600 animate-pulse" />
                                                <span className="text-sm font-bold text-orange-800 italic uppercase">QA Release Required</span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="dispensing" className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-4">
                                        <div className="p-3 bg-amber-500/20 rounded-full">
                                            <ShieldCheck className="h-6 w-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-amber-900 text-xs uppercase tracking-wider">Critical Phase: Material Verification (BOM)</h4>
                                            <p className="text-[10px] text-amber-700/80 font-medium">Verify all components (API, Excipients, and Packaging) against the approved Master Formula.</p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-50 border-b">
                                                <tr>
                                                    <th className="p-4 text-left font-bold uppercase tracking-wider text-slate-500">Item / Ingredient</th>
                                                    <th className="p-4 text-right font-bold uppercase tracking-wider text-slate-500">Master Qty</th>
                                                    <th className="p-4 text-right font-bold uppercase tracking-wider text-slate-500">Dispensed Qty</th>
                                                    <th className="p-4 text-center font-bold uppercase tracking-wider text-slate-500">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
{(selectedBMR.ingredients || masterFormulas[selectedBMR.mfrId]?.ingredients || []).map((ing, idx) => {
                                                    const verification = selectedBMR.materialVerifications?.find((v) => v.itemCode === ing.itemCode);
                                                    const qtyPerUnit = ing.standardQty / selectedBMR.batchSize;
                                                    const formattedQtyPerUnit = qtyPerUnit < 0.001 ? qtyPerUnit.toExponential(3) : qtyPerUnit.toFixed(6);
                                                    return (
                                                        <tr key={idx} className={`hover:bg-slate-50 transition-colors ${verification ? 'bg-emerald-50/20' : ''}`}>
                                                            <td className="p-4">
                                                                <div className="font-mono text-indigo-600 font-bold text-[9px] mb-1">{ing.itemCode}</div>
                                                                <div className="font-black text-slate-900 text-[11px]">{ing.description}</div>
                                                                <Badge variant="outline" className="mt-1 text-[8px] uppercase tracking-tighter">{ing.category}</Badge>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        className="w-24 ml-auto h-8 text-right font-bold border-dashed mb-1"
                                                                        defaultValue={ing.standardQty || ing.quantity}
                                                                        onChange={(e) => {
                                                                            const val = parseFloat(e.target.value);
                                                                            const updatedIngs = [...(selectedBMR.ingredients || [])];
                                                                            const ingIdx = updatedIngs.findIndex(i => i.itemCode === ing.itemCode);
                                                                            if (ingIdx >= 0) {
                                                                                updatedIngs[ingIdx] = { ...updatedIngs[ingIdx], standardQty: val };
                                                                            } else {
                                                                                updatedIngs.push({ ...ing, standardQty: val });
                                                                            }
                                                                            const updatedBMR = { ...selectedBMR, ingredients: updatedIngs };
                                                                            dispatch({ type: 'UPDATE_BMR', payload: updatedBMR });
                                                                            setSelectedBMR(updatedBMR);
                                                                        }}
                                                                    />
                                                                    <div className="text-[8px] font-bold text-slate-400 uppercase">
                                                                        {formattedQtyPerUnit} {ing.unit}/Unit
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="relative">
                                                                    <Input
                                                                        className={`w-28 ml-auto h-10 text-right font-black border-slate-200 focus:border-indigo-500 pr-8 ${verification ? 'bg-emerald-50 border-emerald-200' : ''}`}
                                                                        placeholder="0.00"
                                                                        defaultValue={verification?.actualQty || ''}
                                                                        id={`qty-${ing.itemCode}`}
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">{ing.unit}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                {verification ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <Badge className="bg-emerald-500 text-white border-none gap-1 mb-1">
                                                                            <CheckCircle2 className="h-3 w-3" /> VERIFIED
                                                                        </Badge>
                                                                        <span className="text-[8px] font-bold text-slate-400 uppercase italic">By {verification.verifiedBy}</span>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-9 px-4 font-black text-[10px] uppercase border hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all gap-2"
                                                                        onClick={() => {
                                                                            const input = document.getElementById(`qty-${ing.itemCode}`) as HTMLInputElement;
                                                                            handleVerifyMaterial(ing.itemCode, parseFloat(input.value || '0'));
                                                                        }}
                                                                    >
                                                                        <CheckCircle2 className="h-4 w-4" /> Verify
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-6 bg-slate-900 rounded-2xl flex justify-between items-center shadow-lg border border-slate-800">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Processing Mass</p>
                                            <div className="text-2xl font-black text-white">{masterFormulas[selectedBMR.mfrId]?.ingredients.reduce((acc, curr) => acc + curr.quantity, 0).toFixed(3) || '0.000'} <span className="text-xs text-slate-400 font-bold">Kg/L</span></div>
                                        </div>
                                        <Button className="bg-indigo-600 hover:bg-indigo-500 h-12 px-10 font-bold uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-900/40">
                                            Authorize Phase Completion
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="processing" className="space-y-4">
                                    {selectedBMR.stepExecutions.filter((s: BMRStepExecution) => s.phase === 'Manufacturing').map((step: BMRStepExecution, i: number) => {
                                        const mfrStep = masterFormulas[selectedBMR.mfrId]?.processSteps.find(s => s.stepNumber === step.stepNumber);
                                        return (
                                            <div key={i} className={`p-8 border-2 rounded-[32px] transition-all duration-500 ${step.status === 'Completed' ? 'bg-emerald-50/30 border-emerald-200' : step.status === 'In-Progress' ? 'bg-indigo-50/30 border-indigo-200 ring-4 ring-indigo-500/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="bg-slate-200 text-slate-600 text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest">Stage {step.stepNumber}</div>
                                                            <Badge className={step.status === 'Completed' ? 'bg-emerald-500 text-white border-none' : step.status === 'In-Progress' ? 'bg-indigo-500 text-white animate-pulse border-none' : 'bg-slate-200 text-slate-500 border-none'}>{step.status}</Badge>
                                                            {step.plannedDuration && (
                                                                <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px]">Est: {step.plannedDuration}</Badge>
                                                            )}
                                                        </div>
                                                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{mfrStep?.department}</h4>
                                                        <p className="text-slate-500 font-medium text-sm mt-1 leading-relaxed">{step.description}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                                        <div className="text-[9px] font-bold text-amber-600 uppercase mb-2">Detailed Production Steps (Instructions)</div>
                                                        <div className="space-y-2">
                                                            {step.instructionChecklist && step.instructionChecklist.length > 0 ? (
                                                                step.instructionChecklist.map((instr: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-2 group">
                                                                        <div
                                                                            onClick={() => handleToggleInstruction(step.stepNumber, idx)}
                                                                            className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors ${instr.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-emerald-400'}`}
                                                                        >
                                                                            {instr.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                                        </div>
                                                                        <span className={`text-[11px] font-medium leading-tight ${instr.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                                            {instr.text}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-[10px] text-slate-400 italic">No detailed steps defined</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                                            <div className="text-[9px] font-bold text-amber-600 uppercase mb-2">Critical Process Parameters</div>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {mfrStep?.criticalParameters.map((cp: string, cpi: number) => (
                                                                    <span key={cpi} className="text-xs font-bold text-slate-700 bg-white border px-3 py-1 rounded-lg">● {cp}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                            <div className="text-[9px] font-bold text-slate-500 uppercase mb-2">Observation / Value Log</div>
                                                            <Input
                                                                className="h-9 bg-white text-xs font-black"
                                                                placeholder="Enter realized value (e.g. 15.2 kp, 45°C)..."
                                                                value={step.realizedValue || ''}
                                                                onChange={(e) => handleUpdateStep(step.stepNumber, { realizedValue: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                                                    <div className="space-y-2">
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Process Timing</div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                <Label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Start Time</Label>
                                                                <Input 
                                                                    type="time" 
                                                                    className="h-8 text-[10px] font-bold py-1 px-2" 
                                                                    value={step.startedAt || ''} 
                                                                    onChange={(e) => handleUpdateStep(step.stepNumber, { startedAt: e.target.value, status: step.status === 'Pending' ? 'In-Progress' : step.status })}
                                                                />
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                <Label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">End Time</Label>
                                                                <Input 
                                                                    type="time" 
                                                                    className="h-8 text-[10px] font-bold py-1 px-2" 
                                                                    value={step.completedAt || ''} 
                                                                    onChange={(e) => handleUpdateStep(step.stepNumber, { completedAt: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator Action</div>
                                                        {step.operatorSignature ? (
                                                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                                                <div className="text-[10px] font-black text-indigo-700">{step.operatorSignature}</div>
                                                                <div className="text-[8px] text-indigo-400 font-medium">Recorded at {step.startedAt || 'N/A'}</div>
                                                            </div>
                                                        ) : (
                                                            <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase h-10 rounded-xl" onClick={() => handleUpdateStep(step.stepNumber, { operatorSignature: 'Current Operator', startedAt: step.startedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), status: 'In-Progress' })}>Electronic Sign</Button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supervisor Review</div>
                                                        {step.supervisorSignature ? (
                                                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                                <div className="text-[10px] font-black text-emerald-700">{step.supervisorSignature}</div>
                                                                <div className="text-[8px] text-emerald-400 font-medium">Verified at {step.completedAt || 'N/A'}</div>
                                                            </div>
                                                        ) : (
                                                            <Button variant="outline" size="sm" className="w-full border-slate-200 text-slate-600 font-black text-[10px] uppercase h-10 rounded-xl" disabled={!step.operatorSignature} onClick={() => handleUpdateStep(step.stepNumber, { supervisorSignature: 'Shift Supervisor', status: 'Completed', completedAt: step.completedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) })}>Verify & Close</Button>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col justify-end">
                                                        <div className={`p-3 rounded-xl flex items-center justify-center gap-2 border-2 ${step.status === 'Completed' ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-100 border-slate-200'}`}>
                                                            {step.status === 'Completed' ? (
                                                                <>
                                                                    <ShieldCheck className="h-4 w-4 text-white" />
                                                                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Phase Secured</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Awaiting Sign-off</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </TabsContent>

                                <TabsContent value="packaging" className="space-y-4">
                                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-lg text-purple-700"><ClipboardCheck className="h-5 w-5" /></div>
                                            <div>
                                                <h4 className="font-black text-purple-900 text-sm">BATCH PACKAGING RECORD (BPR)</h4>
                                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Secondary & Tertiary Packaging Stage</p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedBMR.stepExecutions.filter(s => s.phase === 'Packaging').length > 0 ? (
selectedBMR.stepExecutions.filter((s: BMRStepExecution) => s.phase === 'Packaging').map((step: BMRStepExecution, i: number) => {
                                            const mfrStep = masterFormulas[selectedBMR.mfrId]?.processSteps.find(s => s.stepNumber === step.stepNumber);
                                            return (
                                                <div key={i} className={`p-8 border-2 rounded-[32px] transition-all duration-500 ${step.status === 'Completed' ? 'bg-emerald-50/30 border-emerald-200' : step.status === 'In-Progress' ? 'bg-purple-50/30 border-purple-200 ring-4 ring-purple-500/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="bg-purple-100 text-purple-600 text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest">BPR Stage {step.stepNumber}</div>
                                                                <Badge className={step.status === 'Completed' ? 'bg-emerald-500 text-white border-none' : step.status === 'In-Progress' ? 'bg-purple-500 text-white animate-pulse border-none' : 'bg-slate-200 text-slate-500 border-none'}>{step.status}</Badge>
                                                                {step.plannedDuration && (
                                                                    <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px]">Est: {step.plannedDuration}</Badge>
                                                                )}
                                                            </div>
                                                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">{mfrStep?.department}</h4>
                                                            <p className="text-slate-500 font-medium text-sm mt-1 leading-relaxed">{step.description}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                                            <div className="text-[9px] font-bold text-purple-600 uppercase mb-2">Packaging Phase Steps</div>
                                                            <div className="space-y-2">
                                                                {step.instructionChecklist && step.instructionChecklist.length > 0 ? (
                                                                    step.instructionChecklist.map((instr: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center gap-2 group">
                                                                            <div
                                                                                onClick={() => handleToggleInstruction(step.stepNumber, idx)}
                                                                                className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors ${instr.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-purple-400'}`}
                                                                            >
                                                                                {instr.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                                            </div>
                                                                            <span className={`text-[11px] font-medium leading-tight ${instr.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                                                {instr.text}
                                                                            </span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-[10px] text-slate-400 italic">No packaging steps defined</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                                                <div className="text-[9px] font-bold text-amber-600 uppercase mb-2">Packaging Checks</div>
                                                                <div className="flex gap-2 flex-wrap">
                                                                    {mfrStep?.criticalParameters.map((cp: string, cpi: number) => (
                                                                        <span key={cpi} className="text-xs font-bold text-slate-700 bg-white border px-3 py-1 rounded-lg">● {cp}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                                <div className="text-[9px] font-bold text-slate-500 uppercase mb-2">Realized Packaging Yield / Observation</div>
                                                                <Input
                                                                    className="h-9 bg-white text-xs font-black"
                                                                    placeholder="Enter actual count or observation..."
                                                                    value={step.realizedValue || ''}
                                                                    onChange={(e) => handleUpdateStep(step.stepNumber, { realizedValue: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                                                        <div className="space-y-2">
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Packaging Timing</div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                    <Label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Start Time</Label>
                                                                    <Input 
                                                                        type="time" 
                                                                        className="h-8 text-[10px] font-bold py-1 px-2" 
                                                                        value={step.startedAt || ''} 
                                                                        onChange={(e) => handleUpdateStep(step.stepNumber, { startedAt: e.target.value, status: step.status === 'Pending' ? 'In-Progress' : step.status })}
                                                                    />
                                                                </div>
                                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                    <Label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">End Time</Label>
                                                                    <Input 
                                                                        type="time" 
                                                                        className="h-8 text-[10px] font-bold py-1 px-2" 
                                                                        value={step.completedAt || ''} 
                                                                        onChange={(e) => handleUpdateStep(step.stepNumber, { completedAt: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator Action</div>
                                                            {step.operatorSignature ? (
                                                                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                                                                    <div className="text-[10px] font-black text-purple-700">{step.operatorSignature}</div>
                                                                    <div className="text-[8px] text-purple-400 font-medium">Recorded at {step.startedAt || 'N/A'}</div>
                                                                </div>
                                                            ) : (
                                                                <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase h-10 rounded-xl" onClick={() => handleUpdateStep(step.stepNumber, { operatorSignature: 'Packaging Operator', startedAt: step.startedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), status: 'In-Progress' })}>Sign Packaging</Button>
                                                            )}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supervisor Review</div>
                                                            {step.supervisorSignature ? (
                                                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                                    <div className="text-[10px] font-black text-emerald-700">{step.supervisorSignature}</div>
                                                                    <div className="text-[8px] text-emerald-400 font-medium">Verified at {step.completedAt || 'N/A'}</div>
                                                                </div>
                                                            ) : (
                                                                <Button variant="outline" size="sm" className="w-full border-slate-200 text-slate-600 font-black text-[10px] uppercase h-10 rounded-xl" disabled={!step.operatorSignature} onClick={() => handleUpdateStep(step.stepNumber, { supervisorSignature: 'Packaging Supervisor', status: 'Completed', completedAt: step.completedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) })}>Close BPR Phase</Button>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col justify-end">
                                                            <div className={`p-3 rounded-xl flex items-center justify-center gap-2 border-2 ${step.status === 'Completed' ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-100 border-slate-200'}`}>
                                                                {step.status === 'Completed' ? (
                                                                    <>
                                                                        <ShieldCheck className="h-4 w-4 text-white" />
                                                                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">BPR Phase Secured</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Awaiting BPR Sign-off</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            );
                                        })
                                    ) : (
                                        <div className="text-center p-12 bg-slate-50 rounded-[32px] border-2 border-dashed">
                                            <p className="text-slate-400 font-bold">No Packaging (BPR) steps defined in MFR template.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="reconciliation" className="space-y-6 pt-4">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="p-6 bg-white border-2 rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Scale className="h-5 w-5 text-indigo-600" />
                                                    <h3 className="font-bold text-slate-800">Theoretical yield calculation</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <div className="text-sm text-slate-600">Standard Batch Size:</div>
                                                        <div className="text-xl font-black">{selectedBMR.batchSize} {selectedBMR.batchSizeUnit}</div>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div className="text-sm text-slate-600">Expected Range ({masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.min || 0}% - {masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.max || 0}%):</div>
                                                        <div className="text-sm font-bold text-emerald-600">
                                                            {(selectedBMR.batchSize * (masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.min || 0) / 100).toFixed(0)} - {(selectedBMR.batchSize * (masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.max || 0) / 100).toFixed(0)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl">
                                                <Label className="text-emerald-800 text-xs font-bold mb-3 block">Enter Actual Finished Yield</Label>
                                                <div className="flex gap-4 items-center">
                                                    <Input
                                                        type="number"
                                                        placeholder="Enter quantity..."
                                                        className="bg-white text-lg font-black h-12"
                                                        value={selectedBMR.actualYield || ''}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            const updatedBMR = { ...selectedBMR, actualYield: val };
                                                            dispatch({ type: "UPDATE_BMR", payload: updatedBMR });
                                                            setSelectedBMR(updatedBMR);
                                                        }}
                                                    />
                                                    <span className="font-bold text-slate-500">{selectedBMR.batchSizeUnit}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center items-center p-8 border-2 border-dashed rounded-3xl bg-slate-50">
                                            {selectedBMR.actualYield ? (
                                                <div className="text-center space-y-4 w-full">
                                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Calculated reconciliation</div>
                                                    <div className={`text-6xl font-black ${(selectedBMR.actualYield / selectedBMR.batchSize * 100) >= (masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.min || 0) && (selectedBMR.actualYield / selectedBMR.batchSize * 100) <= (masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.max || 100) ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {(selectedBMR.actualYield / selectedBMR.batchSize * 100).toFixed(2)}%
                                                    </div>
                                                    <Badge className={(selectedBMR.actualYield / selectedBMR.batchSize * 100) >= (masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.min || 0) && (selectedBMR.actualYield / selectedBMR.batchSize * 100) <= (masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.max || 100) ? 'bg-emerald-500' : 'bg-red-500'}>
                                                        {(selectedBMR.actualYield / selectedBMR.batchSize * 100) >= (masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.min || 0) && (selectedBMR.actualYield / selectedBMR.batchSize * 100) <= (masterFormulas[selectedBMR.mfrId]?.theoreticalYieldRange?.max || 100) ? 'WITHIN LIMIT' : 'OUT OF LIMIT'}
                                                    </Badge>

                                                    <div className="pt-8 space-y-3">
                                                        {!isBatchReadyForRelease && (
                                                            <div className="flex items-center gap-2 justify-center p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                                                                <AlertCircle className="h-4 w-4" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Steps remaining: All steps must be completed (All Green)</span>
                                                            </div>
                                                        )}
                                                        <Button
                                                            className={cn(
                                                                "font-bold w-full h-12 gap-2 transition-all shadow-lg",
                                                                isBatchReadyForRelease ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                                                            )}
                                                            onClick={handleFinalRelease}
                                                        >
                                                            <ShieldCheck className="h-5 w-5" /> Final Batch Release
                                                        </Button>
                                                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Finalizing this will move batch to Quarantine for QC release</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-slate-400">
                                                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                    <p className="font-bold">Waiting for Actual Yield Input</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                                            <h3 className="font-bold text-slate-800">Material Reconciliation Summary</h3>
                                        </div>
                                        <div className="border rounded-xl overflow-hidden shadow-sm">
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-50 border-b">
                                                    <tr>
                                                        <th className="p-4 text-left font-bold uppercase tracking-wider text-slate-500">Ingredient</th>
                                                        <th className="p-4 text-right font-bold uppercase tracking-wider text-slate-500">Standard Qty</th>
                                                        <th className="p-4 text-right font-bold uppercase tracking-wider text-slate-500">Actual Dispensed</th>
                                                        <th className="p-4 text-right font-bold uppercase tracking-wider text-slate-500">Variance (%)</th>
                                                        <th className="p-4 text-center font-bold uppercase tracking-wider text-slate-500">Compliance</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y bg-white">
{batchReconciliation.map((ing, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50">  
                                                            <td className="p-4">
                                                                <div className="font-bold text-slate-900">{ing.description}</div>
                                                                <div className="text-[10px] text-slate-500 font-mono">{ing.itemCode}</div>
                                                            </td>
                                                            <td className="p-4 text-right font-mono">{ing.standardQty || ing.quantity} {ing.unit}</td>
                                                            <td className="p-4 text-right font-mono font-bold text-indigo-600">{ing.dispensed} {ing.unit}</td>
                                                            <td className={cn(
                                                                "p-4 text-right font-mono font-bold",
                                                                Math.abs(ing.variance) > 1 ? "text-red-500" : "text-emerald-600"
                                                            )}>
                                                                {ing.variance > 0 ? "+" : ""}{ing.variance.toFixed(2)}%
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                {Math.abs(ing.variance) > 1 ? (
                                                                    <Badge variant="destructive" className="gap-1">
                                                                        <AlertTriangle className="h-3 w-3" /> INVESTIGATE
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-emerald-500">
                                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> OK
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Hidden Professional Printer Engine */}
            {selectedBMR && (
                <div style={{ position: 'absolute', left: '-9999px' }}>
                    <div ref={printRef} className="p-12 bg-white text-black" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'serif' }}>
                        <style>{`
                            @media print { 
                                @page { size: A4; margin: 10mm; } 
                                .bmr-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                .bmr-table th, .bmr-table td { border: 1px solid black; padding: 6px; text-align: left; font-size: 10pt; }
                                .bmr-header { text-align: center; border-bottom: 3px double black; margin-bottom: 20px; padding-bottom: 10px; }
                                .section-title { background: #f0f0f0; font-weight: bold; padding: 5px; border: 1px solid black; margin-top: 20px; }
                            }
                        `}</style>
                        <div className="bmr-header">
                            <h1 className="text-3xl font-bold uppercase">Manufacturing Batch Record</h1>
                            <p className="text-sm font-bold mt-1">Quality Management System - Manufacturing Division</p>
                        </div>

                        <table className="bmr-table">
                            <tbody>
                                <tr>
                                    <td><strong>Product Name:</strong></td><td>{selectedBMR.productName}</td>
                                    <td><strong>Batch Number:</strong></td><td>{selectedBMR.batchNumber}</td>
                                </tr>
                                <tr>
                                    <td><strong>Batch Size:</strong></td><td>{selectedBMR.batchSize} {selectedBMR.batchSizeUnit}</td>
                                    <td><strong>MFR Reference:</strong></td><td>{selectedBMR.mfrId.toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td><strong>Mfg Date:</strong></td><td>{selectedBMR.mfgDate}</td>
                                    <td><strong>Expiry Date:</strong></td><td>{selectedBMR.expiryDate}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="section-title">I. BILL OF MATERIALS (BOM)</div>
                        <table className="bmr-table">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th>Item Code</th><th>Description</th><th>Standard Qty</th><th>Actual Qty</th><th>Signature</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedBMR && (selectedBMR.ingredients || masterFormulas[selectedBMR.mfrId]?.ingredients).map((ing: any, i: number) => (
                                    <tr key={i}>
                                        <td>{ing.itemCode}</td><td>{ing.description}</td><td>{ing.standardQty || ing.quantity} {ing.unit}</td><td>__________</td><td>__________</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="section-title">II. PROCESS EXECUTION LOG</div>
                        <table className="bmr-table">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th>Step</th><th>Process Stage</th><th>Start Time</th><th>End Time</th><th>Observed Parameters</th><th>Signature</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedBMR.stepExecutions.map((step: any, i: number) => (
                                    <tr key={i}>
                                        <td>{step.stepNumber}</td><td>{step.description}</td><td>{step.startedAt || '____:____'}</td><td>{step.completedAt || '____:____'}</td><td>________________</td><td>__________</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-12 grid grid-cols-2 gap-20 border-t pt-4 text-xs font-bold uppercase">
                            <div className="text-center">Production Supervisor<br /><br />_____________________</div>
                            <div className="text-center">QA / IPQC Inspector<br /><br />_____________________</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit BMR Metadata Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Batch Information</DialogTitle></DialogHeader>
                    {editingBMR && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Batch Number</Label>
                                    <Input value={editingBMR.batchNumber} onChange={e => setEditingBMR({ ...editingBMR, batchNumber: e.target.value })} className="font-mono font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Batch Size</Label>
                                    <Input type="number" value={editingBMR.batchSize} onChange={e => setEditingBMR({ ...editingBMR, batchSize: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mfg Date</Label>
                                    <Input type="date" value={editingBMR.mfgDate} onChange={e => setEditingBMR({ ...editingBMR, mfgDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expiry Date</Label>
                                    <Input type="date" value={editingBMR.expiryDate} onChange={e => setEditingBMR({ ...editingBMR, expiryDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold" value={editingBMR.status} onChange={e => setEditingBMR({ ...editingBMR, status: e.target.value as any })}>
                                    <option value="Issuance">Issuance</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="Quarantine">Quarantine</option>
                                    <option value="Released">Released</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                        <Button className="bg-blue-600" onClick={() => {
                            if (!editingBMR) return;
                            dispatch({ type: 'UPDATE_BMR', payload: editingBMR });
                            toast.success('Batch details updated');
                            setShowEditDialog(false);
                        }}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Issuance Dialog */}
            <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle className="font-black">Issue Batch Record</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-400">Select Production Master (MFR)</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold" 
                                onChange={(e) => {
                                    const mfrId = e.target.value;
                                    const mfr = masterFormulas[mfrId];
                                    setNewBatch({ 
                                        ...newBatch, 
                                        mfrId, 
                                        batchSize: mfr?.batchSize,
                                        batchNumber: `BN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                                    });
                                }}
                            >
                                <option value="">CHOOSE MASTER FORMULA...</option>
                                {Object.values(masterFormulas).map((mfr: any) => (
                                    <option key={mfr.id} value={mfr.id}>{mfr.mfrNumber} | {mfr.productName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-b pb-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-400">Target Batch Size</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 750000"
                                    value={newBatch.batchSize || ''}
                                    onChange={e => setNewBatch({ ...newBatch, batchSize: parseFloat(e.target.value) })}
                                    className="font-black text-emerald-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-400">Batch Number</Label>
                                <Input placeholder="BN-2024-XXXX" value={newBatch.batchNumber || ''} onChange={e => setNewBatch({ ...newBatch, batchNumber: e.target.value })} className="font-mono font-bold" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">Mfg Date</Label><Input type="date" value={newBatch.mfgDate || ''} onChange={e => setNewBatch({ ...newBatch, mfgDate: e.target.value })} /></div>
                            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">Expiry Date</Label><Input type="date" value={newBatch.expiryDate || ''} onChange={e => setNewBatch({ ...newBatch, expiryDate: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleIssueBatch} className="bg-emerald-600 w-full font-bold h-12">Confirm Batch Issuance</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
