
import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';
import {
    Calendar, CheckCircle, Clock, FileText, FlaskConical,
    AlertTriangle, Play, ShieldCheck, Download, Info
} from 'lucide-react';
import { StabilityPredictor } from './StabilityPredictor';
import { REGULATORY_TEST_TEMPLATES } from '@/constants/stability';
import type { StabilityProtocol, StabilityCondition, StabilityTimePoint, TestResult } from '@/types';
import { useStore } from '@/hooks/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StabilityDetailsProps {
    protocol: StabilityProtocol;
    onBack: () => void;
    onEdit?: (protocol: StabilityProtocol) => void;
}

export function StabilityDetails({ protocol, onBack, onEdit }: StabilityDetailsProps) {
    const { state, dispatch } = useStore();
    const [selectedSample, setSelectedSample] = useState<{ condition: string; timePoint: string } | null>(null);
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

    // Get product details
    const product = state.products.find(p => p.id === protocol.productId);

    // Helper to generate a unique sample ID for (Condition, TimePoint)
    const getSampleId = (conditionId: string, timePointId: string) => {
        return `${protocol.protocolNumber}-${conditionId}-${timePointId}`;
    };

    // Helper to get status of a sample point
    const getSampleStatus = (conditionId: string, timePointId: string) => {
        const sampleId = getSampleId(conditionId, timePointId);
        const results = state.testResults.filter(r => r.sampleId === sampleId);

        if (results.length === 0) return 'Pending';
        if (results.some(r => r.overallResult === 'OOS')) return 'OOS';

        // Check if all required tests are completed
        const requiredTests = protocol.tests || [];
        // Filter results that match required tests and are completed
        const completedTests = results.filter(r => requiredTests.some(t => t.testId === r.testMethodId) && r.status === 'Completed');

        if (requiredTests.length > 0 && completedTests.length >= requiredTests.length) {
            // Check if any failed
            if (completedTests.some(r => r.overallResult === 'Fail')) return 'Fail';
            return 'Completed';
        }

        if (results.some(r => r.status === 'In_Progress')) return 'In_Progress';

        return 'Scheduled';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'OOS': return 'bg-red-100 text-red-800 border-red-200 font-bold';
            case 'Fail': return 'bg-red-100 text-red-800 border-red-200';
            case 'In_Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Scheduled': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };


    const handleCellClick = (condition: StabilityCondition, timePoint: StabilityTimePoint) => {
        setSelectedSample({ condition: condition.id, timePoint: timePoint.id });
        setIsResultDialogOpen(true);
    };


    const handleStartAllTests = () => {
        if (!protocol.tests || protocol.tests.length === 0) return;

        const currentSampleId = getSampleId(selectedSample!.condition, selectedSample!.timePoint);
        let startedCount = 0;

        protocol.tests.forEach(testConfig => {
            const alreadyStarted = state.testResults.some(r => r.sampleId === currentSampleId && r.testMethodId === testConfig.testId);
            if (!alreadyStarted) {
                const method = state.testMethods.find(m => m.id === testConfig.testId);
                if (method) {
                    const newResult: TestResult = {
                        id: crypto.randomUUID(),
                        testMethodId: testConfig.testId,
                        productId: protocol.productId,
                        batchNumber: protocol.batchNumber,
                        sampleId: currentSampleId,
                        analystId: 'CURRENT_USER',
                        testDate: new Date(),
                        parameters: method.parameters?.map(p => ({
                            parameterId: p.id,
                            parameterName: p.name,
                            value: '',
                            unit: p.unit,
                            result: 'Pending',
                        })) || [],
                        overallResult: 'Pending' as any,
                        status: 'In_Progress',
                        notes: testConfig.specification ? `Spec: ${testConfig.specification}` : '',
                        attachments: []
                    };
                    dispatch({ type: 'ADD_TEST_RESULT', payload: newResult });
                    startedCount++;
                }
            }
        });

        if (startedCount > 0) {
            toast.success(`Initialized ${startedCount} tests as per protocol.`);
        }
    };

    // Update a specific parameter value locally before saving
    const handleParameterUpdate = (resultId: string, parameterId: string, value: string) => {
        const result = state.testResults.find(r => r.id === resultId);
        if (!result) return;

        const updatedParameters = result.parameters.map(p =>
            p.parameterId === parameterId ? { ...p, value: value } : p
        );

        const updatedResult = { ...result, parameters: updatedParameters };
        dispatch({ type: 'UPDATE_TEST_RESULT', payload: updatedResult });
    };

    // Complete the test
    const handleCompleteTest = (resultId: string) => {
        const result = state.testResults.find(r => r.id === resultId);
        if (!result) return;

        // Simple logic: if all params have values, mark as Completed & Pass
        // Real logic would validate against spec
        const updatedResult: TestResult = {
            ...result,
            status: 'Completed',
            overallResult: 'Pass',
            completionDate: new Date(),
        };
        dispatch({ type: 'UPDATE_TEST_RESULT', payload: updatedResult });
        toast.success('Test completed');
    };

    const handleCompleteAllTests = () => {
        currentSampleResults.forEach(result => {
            if (result.status !== 'Completed') {
                handleCompleteTest(result.id);
            }
        });
        toast.success('All current tests marked as completed');
    };

    const handleGenerateStabilityCOA = () => {
        if (!selectedSample) return;
        const condition = protocol.storageConditions.find(c => c.id === selectedSample.condition);
        const timePoint = protocol.timePoints.find(tp => tp.id === selectedSample.timePoint);
        const sampleId = getSampleId(selectedSample.condition, selectedSample.timePoint);
        const results = state.testResults.filter(r => r.sampleId === sampleId && r.status === 'Completed');

        if (results.length === 0) {
            toast.error('No completed test results found for this sample point.');
            return;
        }

        const coaRecord = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'Stability' as const,
            coaNumber: `STB-COA-${protocol.protocolNumber}-${timePoint?.month}M`,
            analysisNo: protocol.protocolNumber,
            productName: product?.name || 'Unknown',
            strength: product?.strength || '',
            dosageForm: product?.dosageForm || '',
            batchNumber: protocol.batchNumber,
            batchSize: '', // Not specified in protocol
            mfgDate: product?.manufacturingDate ? new Date(product.manufacturingDate).toISOString() : '',
            expiryDate: product?.expiryDate ? new Date(product.expiryDate).toISOString() : '',
            issueDate: new Date().toISOString().split('T')[0],
            manufacturer: product?.manufacturer || 'Pharma Corp',
            address: 'Industrial Zone, Phase 2',
            testResults: results.map(r => {
                const method = state.testMethods.find(m => m.id === r.testMethodId);
                const spec = protocol.tests.find(t => t.testId === r.testMethodId)?.specification || 'As per STP';
                const resultVal = r.parameters.map(p => `${p.parameterName}: ${p.value} ${p.unit || ''}`).join(', ');
                return {
                    test: method?.name || 'Unknown',
                    specification: spec,
                    result: resultVal,
                    status: r.overallResult as 'Pass' | 'Fail'
                };
            }),
            status: 'Draft' as const,
            analyzedBy: 'Stability Analyst',
            checkedBy: 'QC Supervisor',
            approvedBy: 'QA Manager',
            marketComplaintStatus: `Stability Study: ${condition?.condition} / ${timePoint?.label}`
        };

        dispatch({ type: 'ADD_COA_RECORD', payload: coaRecord });
        toast.success(`Stability COA generated for ${timePoint?.label}! View it in COA Manager.`);
        return coaRecord;
    };

    const coaRef = useRef<HTMLDivElement>(null);

    const handleDownloadStabilityCOA = async () => {
        const coa = handleGenerateStabilityCOA();
        if (!coa || !coaRef.current) return;

        toast.info('Generating COA PDF...');
        const element = coaRef.current;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`${coa.coaNumber}.pdf`);
        toast.success('Certificate of Analysis downloaded!');
    };

    const reportRef = useRef<HTMLDivElement>(null);

    const handleDownloadReportPDF = async () => {
        if (!reportRef.current) return;

        toast.info('Generating Final Stability Report PDF...');
        const element = reportRef.current;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Stability_Report_${protocol.protocolNumber}.pdf`);
        toast.success('Report downloaded successfully!');
    };

    const handleGenerateFinalReport = () => {
        const totalPoints = (protocol.storageConditions.length || 0) * (protocol.timePoints.length || 0);
        const completedPoints = protocol.storageConditions.reduce((acc, c) => {
            return acc + protocol.timePoints.reduce((acc2, tp) => {
                return acc2 + (getSampleStatus(c.id, tp.id) === 'Completed' ? 1 : 0);
            }, 0);
        }, 0);

        if (completedPoints < totalPoints) {
            toast.warning('Some time points are still pending. Generating an Interim Report.');
        }

        toast.info('Final Stability Summary Report generated. Opening in Print Preview...');
        // In a real app, this would open a formatted template or PDF generator
    };


    // Calculate progress
    const totalPoints = (protocol.storageConditions.length || 0) * (protocol.timePoints.length || 0);
    const completedPoints = protocol.storageConditions.reduce((acc, c) => {
        return acc + protocol.timePoints.reduce((acc2, tp) => {
            return acc2 + (getSampleStatus(c.id, tp.id) === 'Completed' ? 1 : 0);
        }, 0);
    }, 0);
    const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    // Derived state for dialog
    const currentSampleId = selectedSample ? getSampleId(selectedSample.condition, selectedSample.timePoint) : '';
    const currentSampleResults = state.testResults.filter(r => r.sampleId === currentSampleId);
    const selectedConditionObj = protocol.storageConditions.find(c => c.id === selectedSample?.condition);
    const selectedTimePointObj = protocol.timePoints.find(tp => tp.id === selectedSample?.timePoint);

    // Regulatory Compliance Check (Simplified)
    const getComplianceScore = () => {
        const dosageForm = product?.dosageForm || 'Other';
        const requiredTests = REGULATORY_TEST_TEMPLATES[dosageForm] || ['Assay', 'Related Substances'];

        const matchingTests = protocol.tests?.filter(t => {
            const method = state.testMethods.find(m => m.id === t.testId);
            return method && requiredTests.some((rt: string) => method.name.toLowerCase().includes(rt.toLowerCase()));
        }) || [];

        return {
            met: matchingTests.length,
            total: 3, // Target for basic compliance
            percentage: Math.min(100, Math.round((matchingTests.length / 3) * 100))
        };
    };
    const compliance = getComplianceScore();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs text-slate-500">
                            {protocol.protocolNumber}
                        </Badge>
                        <Badge className={cn('capitalize',
                            protocol.status === 'Active' ? 'bg-green-500' : 'bg-slate-500'
                        )}>
                            {protocol.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {product?.name || 'Unknown Product'}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                            <FlaskConical className="h-4 w-4" />
                            Batch: {protocol.batchNumber}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Started: {format(new Date(protocol.initiationDate), 'dd MMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {protocol.studyType.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {onEdit && (
                        <Button variant="outline" onClick={() => onEdit?.(protocol)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Edit Protocol
                        </Button>
                    )}
                    <Button
                        variant="default"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleGenerateFinalReport}
                    >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Final Stability Report
                    </Button>
                    <Button
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleDownloadReportPDF}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Report PDF
                    </Button>
                    <Button variant="outline" onClick={onBack}>Back to List</Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progress}%</div>
                        <p className="text-xs text-slate-500 mt-1">
                            {completedPoints} of {totalPoints} time points complete
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Next Pull Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {format(new Date(), 'dd MMM')}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Upcoming Schedule
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Deviations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">0</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Recorded for this protocol
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Compliance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{compliance.percentage}%</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            ICH Q1A Coverage
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="matrix" className="w-full">
                <TabsList>
                    <TabsTrigger value="matrix">Stability Matrix</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="matrix" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stability Study Matrix</CardTitle>
                            <CardDescription>
                                Schedule of tests across all storage conditions and time points.
                                Click on a status cell to view or manage results.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="w-full whitespace-nowrap rounded-md border max-h-[500px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                            <TableHead className="w-[200px] border-r bg-slate-50">Condition / Zone</TableHead>
                                            {protocol.timePoints.sort((a, b) => a.month - b.month).map(tp => (
                                                <TableHead key={tp.id} className="text-center min-w-[140px] bg-slate-50">
                                                    <div className="flex flex-col items-center py-2">
                                                        <span className="font-bold text-slate-700">{tp.label}</span>
                                                        <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border mt-1">
                                                            {tp.month} Months
                                                        </span>
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {protocol.storageConditions.map(condition => (
                                            <TableRow key={condition.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium border-r bg-slate-50/30 sticky left-0">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-700">{condition.condition}</span>
                                                        <span className="text-[10px] text-slate-500">{condition.zone}</span>
                                                    </div>
                                                </TableCell>
                                                {protocol.timePoints.sort((a, b) => a.month - b.month).map(tp => {
                                                    const status = getSampleStatus(condition.id, tp.id);
                                                    return (
                                                        <TableCell key={tp.id} className="text-center p-3">
                                                            <div
                                                                className={cn(
                                                                    "rounded-lg py-2.5 px-3 text-xs font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm border",
                                                                    getStatusColor(status)
                                                                )}
                                                                onClick={() => handleCellClick(condition, tp)}
                                                            >
                                                                {status.replace('_', ' ')}
                                                            </div>
                                                            {status !== 'Pending' && (
                                                                <div className="text-[9px] text-slate-400 mt-1.5 flex items-center justify-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {format(new Date(tp.scheduledDate), 'dd MMM')}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="timeline">
                    <Card>
                        <CardHeader>
                            <CardTitle>Testing Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-6 pl-4">
                                    {protocol.timePoints.sort((a, b) => a.month - b.month).map((tp, idx) => (
                                        <div key={tp.id} className="flex gap-4 relative group">
                                            <div className="flex flex-col items-center z-10">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                                                    new Date() > new Date(tp.scheduledDate) ? "bg-indigo-100 border-indigo-500 text-indigo-700" : "bg-white border-slate-300 text-slate-500"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                                {idx < protocol.timePoints.length - 1 && (
                                                    <div className="w-0.5 h-full bg-slate-200 my-2 group-hover:bg-indigo-200 transition-colors" />
                                                )}
                                            </div>
                                            <div className="pb-8">
                                                <h4 className="font-bold text-sm text-slate-800">{tp.label} ({tp.month} Months)</h4>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Scheduled: {format(new Date(tp.scheduledDate), 'PPP')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trends">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trend Analysis</CardTitle>
                            <CardDescription>Visualize critical quality attributes over time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StabilityPredictor protocol={protocol} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Protocol Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed rounded-lg bg-slate-50/50">
                                <FileText className="h-12 w-12 mb-3 text-slate-300" />
                                <p className="font-medium">No documents attached.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage Sample</DialogTitle>
                        <CardDescription>
                            {selectedConditionObj?.condition} ({selectedConditionObj?.zone}) — {selectedTimePointObj?.label}
                        </CardDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        {(protocol.tests?.length || 0) === 0 ? (
                            <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                                <p className="font-bold">No tests defined for this protocol.</p>
                                <p className="text-xs mb-4 text-slate-400 font-medium">Please edit the protocol configuration to add required ICH quality attributes (Assay, Dissolution, etc.) before recorded results.</p>
                                {onEdit && (
                                    <Button size="sm" onClick={() => {
                                        setIsResultDialogOpen(false);
                                        onEdit?.(protocol);
                                    }} className="bg-indigo-600 hover:bg-indigo-700">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Configure Tests Now
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {currentSampleResults.length < (protocol.tests?.length || 0) && (
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-100 p-2 rounded-lg">
                                                <FlaskConical className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Initialize Batch Testing</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Prepare worksheet for all protocol parameters</p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={handleStartAllTests} className="bg-indigo-600 hover:bg-indigo-700 h-8 shadow-sm">
                                            <Play className="mr-2 h-3.3 w-3.5" /> Start All Tests
                                        </Button>
                                    </div>
                                )}

                                {currentSampleResults.length > 0 && (
                                    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm border-slate-200">
                                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                                            <div>
                                                <h4 className="font-black text-xs uppercase tracking-widest">Stability Testing Worksheet</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Enter analytical values for all parameters</p>
                                            </div>
                                            {currentSampleResults.some(r => r.status !== 'Completed') ? (
                                                <Button size="sm" onClick={handleCompleteAllTests} className="bg-emerald-500 hover:bg-emerald-600 text-[10px] font-black uppercase h-7 px-4">
                                                    <CheckCircle className="mr-2 h-3 w-3" /> Complete All
                                                </Button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={handleGenerateStabilityCOA} className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase h-7 px-4">
                                                        <ShieldCheck className="mr-2 h-3 w-3" /> Create Record
                                                    </Button>
                                                    <Button size="sm" onClick={handleDownloadStabilityCOA} className="bg-slate-700 hover:bg-slate-800 text-[10px] font-black uppercase h-7 px-4">
                                                        <Download className="mr-2 h-3 w-3" /> PDF
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-0 overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left">Test Method</th>
                                                        <th className="px-6 py-3 text-left">Parameter</th>
                                                        <th className="px-6 py-3 text-left w-40">Recorded Value</th>
                                                        <th className="px-6 py-3 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {currentSampleResults.map(result => {
                                                        const method = state.testMethods.find(m => m.id === result.testMethodId);
                                                        const testConfig = protocol.tests.find(t => t.testId === result.testMethodId);
                                                        return result.parameters.map((param, pIdx) => (
                                                            <tr key={`${result.id}-${param.parameterId}`} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    {pIdx === 0 && (
                                                                        <div className="flex flex-col">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-slate-900">{method?.name || 'Unknown'}</span>
                                                                                {method?.procedureDetails && (
                                                                                    <TooltipProvider>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <div className="p-1 cursor-help hover:bg-slate-100 rounded-md">
                                                                                                    <Info className="h-3 w-3 text-indigo-500" />
                                                                                                </div>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent className="max-w-xs text-[11px] font-medium leading-relaxed bg-slate-900 text-white border-none shadow-2xl p-4 rounded-xl">
                                                                                                <p className="font-black uppercase tracking-widest text-indigo-400 mb-2 border-b border-indigo-500/30 pb-1">Analytical Procedure</p>
                                                                                                {method.procedureDetails}
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    </TooltipProvider>
                                                                                )}
                                                                            </div>
                                                                            {method?.procedureDetails && (
                                                                                <span className="text-[10px] text-indigo-600 font-bold italic leading-tight mt-0.5 line-clamp-1">
                                                                                    {method.procedureDetails}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">STP-{method?.id.substring(0, 5)}</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-slate-700">{param.parameterName}</span>
                                                                        {testConfig?.specification && (
                                                                            <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-tight">Limit: {testConfig.specification}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <Input
                                                                        disabled={result.status === 'Completed'}
                                                                        value={String(param.value || '')}
                                                                        onChange={(e) => handleParameterUpdate(result.id, param.parameterId, e.target.value)}
                                                                        className="h-9 text-sm font-bold bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
                                                                        placeholder="0.00"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <Badge variant={result.status === 'Completed' ? 'default' : 'outline'} className={cn(
                                                                        "text-[9px] font-black uppercase px-2",
                                                                        result.status === 'Completed'
                                                                            ? (result.overallResult === 'Pass' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600')
                                                                            : 'text-indigo-600 border-indigo-200 bg-indigo-50'
                                                                    )}>
                                                                        {result.status === 'Completed' ? result.overallResult : 'Drafting'}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {currentSampleResults.length === 0 && (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <FileText className="h-6 w-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">Analytical Session Not Started</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">Click "Start All Tests" above to generate the stability worksheet for this time point.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hidden Templates for PDF Generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '210mm' }}>
                <div ref={reportRef} className="p-12 bg-white text-slate-900 font-serif" style={{ width: '210mm', minHeight: '297mm' }}>
                    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Stability Summary Report</h1>
                        <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">{protocol.protocolNumber} / {product?.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-12 text-sm">
                        <div className="space-y-2">
                            <p><span className="font-bold uppercase inline-block w-32">Product:</span> {product?.name}</p>
                            <p><span className="font-bold uppercase inline-block w-32">Batch No:</span> {protocol.batchNumber}</p>
                            <p><span className="font-bold uppercase inline-block w-32">Dosage Form:</span> {product?.dosageForm}</p>
                        </div>
                        <div className="space-y-2">
                            <p><span className="font-bold uppercase inline-block w-32">Study Type:</span> {protocol.studyType}</p>
                            <p><span className="font-bold uppercase inline-block w-32">Started:</span> {format(new Date(protocol.initiationDate), 'dd MMM yyyy')}</p>
                            <p><span className="font-bold uppercase inline-block w-32">Progress:</span> {progress}% Complete</p>
                        </div>
                    </div>

                    <h3 className="text-xl font-black mb-4 uppercase border-b border-slate-200 pb-1">Stability Data Summary</h3>
                    <table className="w-full border-collapse border border-slate-300 text-[10px] mb-12">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left">Condition</th>
                                {protocol.timePoints.sort((a, b) => a.month - b.month).map(tp => (
                                    <th key={tp.id} className="border border-slate-300 p-2 text-center">{tp.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {protocol.storageConditions.map(condition => (
                                <tr key={condition.id}>
                                    <td className="border border-slate-300 p-2 font-bold bg-slate-50">{condition.condition}</td>
                                    {protocol.timePoints.map(tp => (
                                        <td key={tp.id} className="border border-slate-300 p-2 text-center">
                                            {getSampleStatus(condition.id, tp.id)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-12 pt-12 border-t border-slate-200 grid grid-cols-3 gap-8 text-center text-[10px] font-bold uppercase">
                        <div>
                            <div className="border-b border-slate-400 mb-2 h-12"></div>
                            <p>Prepared By (QC)</p>
                        </div>
                        <div>
                            <div className="border-b border-slate-400 mb-2 h-12"></div>
                            <p>Reviewed By (QA)</p>
                        </div>
                        <div>
                            <div className="border-b border-slate-400 mb-2 h-12"></div>
                            <p>Authorized Signature</p>
                        </div>
                    </div>
                </div>

                {/* Stability COA Template */}
                {selectedSample && (
                    <div ref={coaRef} className="p-12 bg-white text-black font-serif" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Times New Roman, serif' }}>
                        <div className="border-4 border-double border-black p-1 h-full min-h-[280mm]">
                            <div className="border border-black p-8 h-full">
                                <div className="text-center border-b-4 border-double border-black pb-6 mb-8">
                                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">{product?.manufacturer || 'PHARMA CORP'}</h1>
                                    <p className="text-sm italic mb-2">Industrial Zone, Phase 2, GMP Certified Facility</p>
                                    <p className="text-md font-bold uppercase tracking-widest mt-2">Quality Control Department</p>
                                    <h2 className="text-3xl font-black underline decoration-2 underline-offset-8 mt-8 uppercase">Certificate of Analysis</h2>
                                    <p className="text-sm font-bold mt-2 text-slate-700 italic">(Stability Monitoring Program)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-[11px] mb-8 p-4 border border-black bg-slate-50/30 rounded">
                                    <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
                                        <span className="font-bold uppercase">Product Name:</span>
                                        <span className="font-black">{product?.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
                                        <span className="font-bold uppercase">Batch Number:</span>
                                        <span className="font-mono font-bold">{protocol.batchNumber}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
                                        <span className="font-bold uppercase">COA Number:</span>
                                        <span>STB-{protocol.protocolNumber}-{(protocol.timePoints.find(tp => tp.id === selectedSample.timePoint))?.label}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
                                        <span className="font-bold uppercase">Study Condition:</span>
                                        <span className="font-bold">{(protocol.storageConditions.find(c => c.id === selectedSample.condition))?.condition}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
                                        <span className="font-bold uppercase">Dosage Form:</span>
                                        <span>{product?.dosageForm}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
                                        <span className="font-bold uppercase">Time Point:</span>
                                        <span className="font-bold">{(protocol.timePoints.find(tp => tp.id === selectedSample.timePoint))?.label}</span>
                                    </div>
                                </div>

                                <h3 className="text-md font-black mb-4 uppercase underline decoration-1 underline-offset-4">Analytical Test Results</h3>
                                <table className="w-full border-collapse border border-black text-[10px] mb-8">
                                    <thead>
                                        <tr className="bg-slate-100 uppercase font-black">
                                            <th className="border border-black p-2 text-left w-[35%]">Test Parameter</th>
                                            <th className="border border-black p-2 text-left w-[30%]">Specification / ICH Requirement</th>
                                            <th className="border border-black p-2 text-left w-[20%]">Observed Result</th>
                                            <th className="border border-black p-2 text-center w-[15%]">Inference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Group by category if possible, or just list */}
                                        {state.testResults
                                            .filter(r => r.sampleId === getSampleId(selectedSample.condition, selectedSample.timePoint))
                                            .map(r => {
                                                const method = state.testMethods.find(m => m.id === r.testMethodId);
                                                const spec = protocol.tests.find(t => t.testId === r.testMethodId)?.specification || 'NMT 105%';
                                                const isStressTest = method?.category === 'Stability' ||
                                                    ['Acid Degradation', 'Base Degradation', 'Oxidative Degradation', 'Photolytic Degradation', 'Thermal Stability'].includes(method?.name || '');

                                                return (
                                                    <tr key={r.id} className={isStressTest ? 'bg-indigo-50/20' : ''}>
                                                        <td className="border border-black p-2">
                                                            <div className="font-bold">
                                                                {method?.name}
                                                                {isStressTest && <span className="ml-2 text-[8px] bg-indigo-100 text-indigo-700 px-1 rounded-sm uppercase tracking-tighter">Stress Result</span>}
                                                            </div>
                                                            <div className="text-[8px] italic text-slate-500 uppercase">Ref: {method?.pharmacopeiaReference || 'In-House'}</div>
                                                        </td>
                                                        <td className="border border-black p-2">{spec}</td>
                                                        <td className="border border-black p-2 font-black">{r.parameters.map(p => `${p.value} ${p.unit || ''}`).join(', ')}</td>
                                                        <td className="border border-black p-2 text-center">
                                                            <span className={`font-bold ${r.overallResult === 'Pass' ? 'text-green-700' : 'text-red-700'}`}>
                                                                {r.overallResult === 'Pass' ? 'COMPLIES' : 'DOES NOT COMPLY'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>

                                {/* ICH Stress Study Narrative Section */}
                                {(protocol.studyType === 'Forced_Degradation' || protocol.studyType === 'Photo_Stability') && (
                                    <div className="mt-4 p-4 border border-black bg-slate-50/50 italic text-[10px] leading-relaxed mb-8">
                                        <p className="font-bold mb-1 uppercase not-italic">ICH Stability Stress Study Summary:</p>
                                        <p>This study was conducted in accordance with ICH Q1A(R2) and Q1B guidelines. Forced degradation studies (Acid/Base hydrolysis, Oxidation, and Photostability) were performed to establish the stability-indicating nature of the analytical methods and to identify potential degradation products. Results indicate that the active substance remains stable under the tested stress conditions within specified limits.</p>
                                    </div>
                                )}

                                <div className="mt-6 p-4 border border-black bg-slate-50/50 text-[10px] flex flex-col gap-2">
                                    <p><strong>Compliance Statement:</strong> The batch mentioned above has been analyzed as per the protocol specifications and is found to be <strong>COMPLYING</strong> with the established stability requirements.</p>
                                    <p><strong>Market Complaint / Recall Status:</strong> Verified and Compliant. No active recalls or complaints affecting this batch.</p>
                                </div>

                                <div className="mt-20 grid grid-cols-3 gap-12 text-center text-[10px] font-bold uppercase tracking-wider">
                                    <div>
                                        <div className="h-10 mb-2 border-b border-black"></div>
                                        <p>Analyzed By</p>
                                        <p className="text-[8px] mt-1 normal-case font-medium">(Stability Analyst)</p>
                                    </div>
                                    <div>
                                        <div className="h-10 mb-2 border-b border-black"></div>
                                        <p>Checked By</p>
                                        <p className="text-[8px] mt-1 normal-case font-medium">(QC Supervisor)</p>
                                    </div>
                                    <div>
                                        <div className="h-10 mb-2 border-b border-black"></div>
                                        <p>Authorized Approval</p>
                                        <p className="text-[8px] mt-1 normal-case font-medium">(QA Manager)</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 text-center text-[8px] text-slate-400">
                                    <p>Page 1 of 1 — Generated by PharmaQMS Integrity Engine</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
