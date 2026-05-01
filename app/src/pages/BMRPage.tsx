'use client';

import * as React from 'react';
import { batchRecords, type BatchRecord, type QuarantineStep } from '@/data/bmrData';
import { masterFormulas } from '@/data/mfrData';
import { SignatureModal } from '@/components/SignatureModal';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    FlaskConical, 
    Package, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    Circle, 
    PlayCircle, 
    StopCircle,
    FileText,
    Scale,
    Activity,
    Shield
} from 'lucide-react';
import { toast } from 'sonner';

export default function BMRPage() {
    const [selectedBatch, setSelectedBatch] = React.useState<BatchRecord | null>(null);
    const [allBatches, setAllBatches] = React.useState<BatchRecord[]>(batchRecords);
    const [loading, setLoading] = React.useState(true);
    const [showSignature, setShowSignature] = React.useState(false);
    const [signatureAction, setSignatureAction] = React.useState<{
        type: 'operator' | 'supervisor' | 'qa';
        stepIndex: number;
        stepType: 'manufacturing' | 'quarantine';
    } | null>(null);

    React.useEffect(() => {
        const fetchBatches = async () => {
            try {
                const { data, error } = await supabase.from('batch_records').select('*');
                if (error) {
                    console.error('Supabase fetch error:', error);
                    // Fallback to local
                    setAllBatches(batchRecords);
                } else if (data && data.length > 0) {
                    // Map database rows to app format if needed. Here we assume direct match or we combine them.
                    const mapped = data.map((d: any) => ({
                        id: d.id,
                        batchNumber: d.batch_number,
                        mfrId: d.product_id || '',
                        mfrNumber: d.mfr_no,
                        productName: d.product_name || 'Fetched Product',
                        batchSize: Number(d.batch_size_tablet) || 0,
                        batchSizeUnit: 'Tablets',
                        batchSizeKg: Number(d.batch_size_kg) || 0,
                        productionDate: d.production_date,
                        startDate: d.start_date,
                        finishDate: d.finish_date,
                        mfgDate: d.production_date || '',
                        expiryDate: d.exp_date || '',
                        analysisNo: d.analysis_no,
                        status: d.status || 'Manufacturing',
                        issuanceDate: d.created_at,
                        issuedBy: d.created_by || 'Admin',
                        stepExecutions: [], // To be fetched or initialized
                        quarantineSteps: []
                    })) as BatchRecord[];
                    
                    // Combine with local mock data for demo purposes, or replace entirely:
                    setAllBatches([...batchRecords, ...mapped]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Issued': return 'bg-blue-500';
            case 'Manufacturing': return 'bg-amber-500';
            case 'Quarantine': return 'bg-orange-500';
            case 'Released': return 'bg-green-500';
            case 'Rejected': return 'bg-red-500';
            default: return 'bg-slate-500';
        }
    };

    const getStepStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'In-Progress': return <PlayCircle className="h-4 w-4 text-amber-500" />;
            case 'Skipped': return <StopCircle className="h-4 w-4 text-slate-400" />;
            default: return <Circle className="h-4 w-4 text-slate-300" />;
        }
    };

    const handleStepSignature = (type: 'operator' | 'supervisor' | 'qa', stepIndex: number, stepType: 'manufacturing' | 'quarantine') => {
        setSignatureAction({ type, stepIndex, stepType });
        setShowSignature(true);
    };

    const handleConfirmSignature = async (signatureData: { signerName: string; timestamp: Date; intent: string }) => {
        if (!selectedBatch || !signatureAction) return;

        const updatedBatch = { ...selectedBatch };
        const formattedTime = signatureData.timestamp.toLocaleString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        if (signatureAction.stepType === 'manufacturing') {
            const step = updatedBatch.stepExecutions[signatureAction.stepIndex];
            if (signatureAction.type === 'operator') {
                step.operatorSignature = signatureData.signerName;
                if (step.status === 'Pending') {
                    step.status = 'In-Progress';
                    step.startedAt = formattedTime;
                } else if (step.status === 'In-Progress') {
                    step.status = 'Completed';
                    step.completedAt = formattedTime;
                }
            } else if (signatureAction.type === 'supervisor') {
                step.supervisorSignature = signatureData.signerName;
            } else if (signatureAction.type === 'qa') {
                step.qaSignature = signatureData.signerName;
            }
        } else if (signatureAction.stepType === 'quarantine' && updatedBatch.quarantineSteps) {
            const step = updatedBatch.quarantineSteps[signatureAction.stepIndex];
            if (signatureAction.type === 'qa') {
                if (step.status === 'Pending') {
                    step.status = 'In-Progress';
                } else if (step.status === 'In-Progress') {
                    step.status = 'Completed';
                    step.completedAt = formattedTime;
                    step.completedBy = signatureData.signerName;
                }
            }
        }

        setSelectedBatch(updatedBatch);
        setAllBatches(allBatches.map(b => b.id === updatedBatch.id ? updatedBatch : b));

        // Sync to Supabase in the background
        if (!updatedBatch.id.startsWith('bmr_')) {
            try {
                await supabase.from('batch_records').update({ updated_at: new Date().toISOString() }).eq('id', updatedBatch.id);
            } catch (e) {
                console.error("Supabase update failed", e);
            }
        }

        toast.success(`${signatureAction.type.toUpperCase()} signature executed by ${signatureData.signerName} at ${formattedTime}`);
        setShowSignature(false);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getMFRDetails = (mfrId: string) => {
        return masterFormulas[mfrId];
    };

    if (!selectedBatch) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">BMR Execution</h1>
                        <p className="text-sm text-slate-500 font-medium">Batch Manufacturing Record - Select a batch to view</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {loading && <p className="text-sm text-slate-500">Loading batch records...</p>}
                    {allBatches.map((batch) => (
                        <Card 
                            key={batch.id} 
                            className="cursor-pointer hover:border-indigo-500 transition-colors"
                            onClick={() => setSelectedBatch(batch)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap4">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <FlaskConical className="h-6 w-6 text-indigo-500" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-bold text-lg">{batch.productName}</p>
                                            <p className="text-sm text-slate-500 font-medium">Batch: {batch.batchNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 font-bold uppercase">MFR No</p>
                                            <p className="font-mono text-sm">{batch.mfrNumber || batch.mfrId}</p>
                                        </div>
                                        <Badge className={`${getStatusColor(batch.status)} text-white`}>
                                            {batch.status}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const mfr = getMFRDetails(selectedBatch.mfrId);

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setSelectedBatch(null)} className="text-xs font-bold uppercase">
                        ← Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">BMR Execution</h1>
                        <p className="text-sm text-slate-500 font-medium">Batch: {selectedBatch.batchNumber}</p>
                    </div>
                </div>
                <Badge className={`${getStatusColor(selectedBatch.status)} text-white px-4 py-2`}>
                    {selectedBatch.status}
                </Badge>
            </div>

            {/* Batch Information Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Batch Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">MFR No</Label>
                            <p className="font-mono font-bold">{selectedBatch.mfrNumber || selectedBatch.mfrId}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">Batch No</Label>
                            <p className="font-mono font-bold">{selectedBatch.batchNumber}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">Product Name</Label>
                            <p className="font-bold">{selectedBatch.productName}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">Analysis No</Label>
                            <p className="font-mono font-bold text-indigo-600">{selectedBatch.analysisNo || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Production Date
                            </Label>
                            <p className="font-mono font-bold">{formatDate(selectedBatch.productionDate)}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">Mfg Date</Label>
                            <p className="font-mono font-bold">{formatDate(selectedBatch.mfgDate)}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Exp Date
                            </Label>
                            <p className="font-mono font-bold text-red-600">{formatDate(selectedBatch.expiryDate)}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">Start Date</Label>
                            <p className="font-mono font-bold">{formatDate(selectedBatch.startDate)}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">Finish Date</Label>
                            <p className="font-mono font-bold">{formatDate(selectedBatch.finishDate)}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                <Scale className="h-3 w-3" /> Batch Size (Tablets)
                            </Label>
                            <p className="font-mono font-bold">{selectedBatch.batchSize?.toLocaleString()} {selectedBatch.batchSizeUnit}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                <Scale className="h-3 w-3" /> Batch Size (KG)
                            </Label>
                            <p className="font-mono font-bold">{selectedBatch.batchSizeKg?.toFixed(1) || 'N/A'} kg</p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">Issued By</Label>
                            <p className="font-bold">{selectedBatch.issuedBy}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Manufacturing Steps */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Manufacturing Steps
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {selectedBatch.stepExecutions.map((step, index) => (
                            <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        {getStepStatusIcon(step.status)}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">Step {step.stepNumber}</span>
                                                {step.phase && (
                                                    <Badge variant="outline" className="text-[10px]">{step.phase}</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm">{step.description}</p>
                                            {step.plannedDuration && (
                                                <p className="text-xs text-slate-500 mt-1">Planned: {step.plannedDuration}</p>
                                            )}
                                            <div className="flex gap-4 mt-2 text-xs">
                                                {step.startedAt && (
                                                    <p className="text-slate-500">Started: {step.startedAt}</p>
                                                )}
                                                {step.completedAt && (
                                                    <p className="text-slate-500">Completed: {step.completedAt}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {step.operatorSignature && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase">Operator</p>
                                                <p className="text-xs font-medium">{step.operatorSignature}</p>
                                            </div>
                                        )}
                                        {step.supervisorSignature && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase">Supervisor</p>
                                                <p className="text-xs font-medium">{step.supervisorSignature}</p>
                                            </div>
                                        )}
                                        {step.qaSignature && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase">QA</p>
                                                <p className="text-xs font-medium">{step.qaSignature}</p>
                                            </div>
                                        )}
                                        {step.status === 'Pending' && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleStepSignature('operator', index, 'manufacturing')}
                                                className="text-[10px] font-bold uppercase"
                                            >
                                                Start Step
                                            </Button>
                                        )}
                                        {step.status === 'In-Progress' && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleStepSignature('operator', index, 'manufacturing')}
                                                className="text-[10px] font-bold uppercase bg-green-600"
                                            >
                                                Complete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quarantine Steps */}
            <Card className="border-orange-500/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-black uppercase flex items-center gap-2 text-orange-600">
                        <Shield className="h-5 w-5" />
                        Quarantine Steps
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {selectedBatch.quarantineSteps?.map((step, index) => (
                            <div key={index} className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50/50 dark:bg-orange-950/20">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        {getStepStatusIcon(step.status)}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">Step {step.stepNumber}</span>
                                            </div>
                                            <p className="text-sm">{step.description}</p>
                                            {step.completedAt && (
                                                <p className="text-xs text-orange-600 mt-1">Completed: {step.completedAt} by {step.completedBy}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        {step.status === 'Pending' && (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => handleStepSignature('qa', index, 'quarantine')}
                                                className="text-[10px] font-bold uppercase border-orange-500 text-orange-600"
                                            >
                                                Start
                                            </Button>
                                        )}
                                        {step.status === 'In-Progress' && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleStepSignature('qa', index, 'quarantine')}
                                                className="text-[10px] font-bold uppercase bg-orange-600"
                                            >
                                                Complete
                                            </Button>
                                        )}
                                        {step.status === 'Completed' && (
                                            <Badge className="bg-green-500 text-white">Completed</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!selectedBatch.quarantineSteps?.length && (
                            <p className="text-sm text-slate-500 text-center py-4">No quarantine steps pending</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Signature Modal */}
            <SignatureModal
                open={showSignature}
                onOpenChange={setShowSignature}
                onConfirm={handleConfirmSignature}
                title="Electronic Signature Required"
                description="This action requires electronic signature in compliance with 21 CFR Part 11"
                actionIntent={`I verify that the ${signatureAction?.type === 'qa' ? 'QA review' : 'manufacturing step'} has been completed accurately.`}
            />
        </div>
    );
}
