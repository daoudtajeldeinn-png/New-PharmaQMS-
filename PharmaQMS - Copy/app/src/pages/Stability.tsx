import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { StabilityDetails } from '@/components/stability/StabilityDetails';
import {
    Plus, Search, Eye, Trash2, FileText, MoreHorizontal,
    Sparkles, Info, AlertTriangle, FlaskConical, Clock, Play, Download
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
    StabilityProtocol,
    StabilityStatus,
    StabilityCondition,
    StabilityTimePoint,
    TimePointStatus
} from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

import { REGULATORY_TEST_TEMPLATES } from '@/constants/stability';

export function StabilityPage() {
    const { state, dispatch } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProtocol, setSelectedProtocol] = useState<StabilityProtocol | null>(null);
    const [viewingProtocol, setViewingProtocol] = useState<StabilityProtocol | null>(null);
    const [selectedStudyType, setSelectedStudyType] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<StabilityProtocol>>({
        studyType: 'Long_Term',
        storageConditions: [],
        timePoints: [],
        status: 'Draft',
    });

    // Auxiliary State for Conditions and TimePoints
    const [newCondition, setNewCondition] = useState({ condition: '', zone: '' });
    const [newTimePoint, setNewTimePoint] = useState({ month: 0, label: '', windowDays: 7 });
    const [isCustomProduct, setIsCustomProduct] = useState(false);

    const filteredProtocols = (state.stabilityProtocols || []).filter((p) => {
        const matchesSearch = p.protocolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.productName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !selectedStudyType || p.studyType === selectedStudyType;
        return matchesSearch && matchesType;
    });

    const handleAdd = () => {
        setSelectedProtocol(null);
        setFormData({
            studyType: 'Long_Term',
            storageConditions: [],
            timePoints: [],
            status: 'Draft',
            protocolNumber: `STAB-${new Date().getFullYear()}-${String((state.stabilityProtocols?.length || 0) + 1).padStart(3, '0')}`,
        });
        setIsFormOpen(true);
    };

    const handleEdit = (protocol: StabilityProtocol) => {
        setSelectedProtocol(protocol);
        setFormData(protocol);
        setIsCustomProduct(!state.products.find(p => p.id === protocol.productId));
        setIsFormOpen(true);
    };

    const handleView = (protocol: StabilityProtocol) => {
        console.log("Viewing protocol:", protocol); // Debug log
        setViewingProtocol(protocol);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this protocol?')) {
            dispatch({ type: 'DELETE_STABILITY_PROTOCOL', payload: id });
        }
    };

    const handleSave = () => {
        if ((!isCustomProduct && !formData.productId) || (isCustomProduct && !formData.productName) || !formData.protocolNumber) {
            alert('Product and Protocol Number are required.');
            return;
        }

        const product = state.products.find(p => p.id === formData.productId);

        const newProtocol: StabilityProtocol = {
            id: selectedProtocol?.id || crypto.randomUUID(),
            protocolNumber: formData.protocolNumber!,
            productId: formData.productId!,
            productName: product?.name || formData.productName || 'Unknown Product',
            batchNumber: formData.batchNumber || product?.batchNumber || 'N/A',
            studyType: formData.studyType || 'Long_Term',
            storageConditions: formData.storageConditions || [],
            timePoints: formData.timePoints || [],
            tests: formData.tests || [],
            packagingType: formData.packagingType || 'Standard',
            sampleQuantity: formData.sampleQuantity || 0,
            manufacturingDate: formData.manufacturingDate || new Date(),
            expiryDate: formData.expiryDate || new Date(),
            initiationDate: formData.initiationDate || new Date(),
            status: formData.status || 'Draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...formData,
        } as StabilityProtocol;

        if (selectedProtocol) {
            dispatch({ type: 'UPDATE_STABILITY_PROTOCOL', payload: newProtocol });
        } else {
            dispatch({ type: 'ADD_STABILITY_PROTOCOL', payload: newProtocol });
        }
        setIsFormOpen(false);
    };

    // Helper to add condition
    const addCondition = () => {
        if (!newCondition.condition || !newCondition.zone) return;
        const condition: StabilityCondition = {
            id: crypto.randomUUID(),
            condition: newCondition.condition,
            zone: newCondition.zone,
        };
        setFormData(prev => ({ ...prev, storageConditions: [...(prev.storageConditions || []), condition] }));
        setNewCondition({ condition: '', zone: '' });
    };

    // Helper to add timepoint
    const addTimePoint = () => {
        if (newTimePoint.month < 0) return;
        const now = new Date();
        const scheduledDate = new Date(now.setMonth(now.getMonth() + newTimePoint.month));

        const timePoint: StabilityTimePoint = {
            id: crypto.randomUUID(),
            label: newTimePoint.label || `${newTimePoint.month} Months`,
            month: newTimePoint.month,
            scheduledDate: scheduledDate,
            windowDays: newTimePoint.windowDays,
            status: 'Scheduled' as TimePointStatus,
        };
        setFormData(prev => ({ ...prev, timePoints: [...(prev.timePoints || []), timePoint] }));
        setNewTimePoint({ month: 0, label: '', windowDays: 7 });
    };

    const removeCondition = (id: string) => {
        setFormData(prev => ({ ...prev, storageConditions: prev.storageConditions?.filter(c => c.id !== id) }));
    };

    const removeTimePoint = (id: string) => {
        setFormData(prev => ({ ...prev, timePoints: prev.timePoints?.filter(tp => tp.id !== id) }));
    };

    const applyRegulatoryGuidelines = () => {
        const product = state.products.find(p => p.id === formData.productId);
        let dosageForm = product?.dosageForm || 'Other';

        // Guess dosage form from name if "Other" or unknown
        if (dosageForm === 'Other' || !dosageForm) {
            const name = (product?.name || formData.productName || '').toLowerCase();
            if (name.includes('tablet')) dosageForm = 'Tablet';
            else if (name.includes('capsue')) dosageForm = 'Capsule';
            else if (name.includes('inject')) dosageForm = 'Injection';
            else if (name.includes('syrup')) dosageForm = 'Syrup';
            else if (name.includes('suspension')) dosageForm = 'Suspension';
            else if (name.includes('cream')) dosageForm = 'Cream';
            else if (name.includes('ointment')) dosageForm = 'Ointment';
        }

        const requiredTests = [...(REGULATORY_TEST_TEMPLATES[dosageForm] || [])];

        // Add stress tests if study type is Forced_Degradation or Photo_Stability
        if (formData.studyType === 'Forced_Degradation') {
            requiredTests.push(...(REGULATORY_TEST_TEMPLATES['Forced Degradation'] || []));
        } else if (formData.studyType === 'Photo_Stability') {
            requiredTests.push(...(REGULATORY_TEST_TEMPLATES['Photostability'] || []));
        }

        if (requiredTests.length === 0) {
            toast.info(`No specific ICH guidelines found for "${dosageForm}". You can select tests manually below.`);
            return;
        }

        const matchedTestIds: string[] = [];
        const missingTests: string[] = [];

        requiredTests.forEach(testName => {
            const match = state.testMethods.find(m =>
                m.name.toLowerCase().includes(testName.toLowerCase())
            );
            if (match) {
                matchedTestIds.push(match.id);
            } else {
                missingTests.push(testName);
            }
        });

        // Add matched tests to current selection
        const newTests = matchedTestIds.map(testId => {
            const method = state.testMethods.find(m => m.id === testId);
            // Try to find a default spec from parameters
            const defaultSpec = method?.parameters?.map(p => {
                if (p.minValue !== undefined && p.maxValue !== undefined) {
                    return `${p.name}: ${p.minValue} - ${p.maxValue} ${p.unit || ''}`;
                } else if (p.maxValue !== undefined) {
                    return `${p.name}: NMT ${p.maxValue} ${p.unit || ''}`;
                } else if (p.minValue !== undefined) {
                    return `${p.name}: NLT ${p.minValue} ${p.unit || ''}`;
                }
                return `${p.name}: Report`;
            }).join('; ') || 'As per STP';

            return { testId, specification: defaultSpec };
        });

        setFormData(prev => {
            const currentTests = prev.tests || [];
            // Merge: avoid duplicates
            const merged = [...currentTests];
            newTests.forEach(nt => {
                if (!merged.some(m => m.testId === nt.testId)) {
                    merged.push(nt);
                }
            });
            return { ...prev, tests: merged };
        });

        if (missingTests.length > 0) {
            toast.warning(`Matched ${matchedTestIds.length} tests. Note: ${missingTests.join(', ')} were not found in your Lab Methods and should be created.`, {
                duration: 5000
            });
        } else {
            toast.success(`Successfully applied ICH Q1A guidelines for ${dosageForm}.`);
        }
    };

    const getStatusColor = (status: StabilityStatus) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800 border-green-300';
            case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Terminated': return 'bg-red-100 text-red-800 border-red-300';
            case 'Pending_Approval': return 'bg-amber-100 text-amber-800 border-amber-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (viewingProtocol) {
        return (
            <StabilityDetails
                protocol={viewingProtocol}
                onBack={() => setViewingProtocol(null)}
                onEdit={(p) => {
                    setViewingProtocol(null);
                    handleEdit(p);
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Stability Management</h1>
                    <p className="text-slate-500">Manage Stability Protocols, Studies, and Samples (ICH Q1A)</p>
                </div>
                <Button onClick={handleAdd} className="bg-indigo-600">
                    <Plus className="mr-2 h-4 w-4" />
                    New Protocol
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search protocols..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* ICH Regulatory Quick Reference Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-3 p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl overflow-hidden relative shadow-sm">
                    <div className="absolute right-0 top-0 opacity-10 p-4">
                        <FlaskConical className="h-24 w-24 text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-indigo-900">ICH Q1A/Q1B Stress Study Reference</h2>
                    </div>
                    <p className="text-xs text-indigo-700 font-medium mb-4">Standard requirements for Forced Degradation and Photostability monitoring.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-white/60 rounded-2xl border border-indigo-100 shadow-sm transition-transform hover:scale-[1.02]">
                            <p className="text-[9px] font-black uppercase text-indigo-500 mb-1">Acid Stress</p>
                            <p className="text-[10px] font-bold text-slate-700 italic leading-tight">0.1M HCl at 60°C for 24h</p>
                        </div>
                        <div className="p-3 bg-white/60 rounded-2xl border border-indigo-100 shadow-sm transition-transform hover:scale-[1.02]">
                            <p className="text-[9px] font-black uppercase text-indigo-500 mb-1">Base Stress</p>
                            <p className="text-[10px] font-bold text-slate-700 italic leading-tight">0.1M NaOH at 60°C for 24h</p>
                        </div>
                        <div className="p-3 bg-white/60 rounded-2xl border border-indigo-100 shadow-sm transition-transform hover:scale-[1.02]">
                            <p className="text-[9px] font-black uppercase text-indigo-500 mb-1">Oxidation</p>
                            <p className="text-[10px] font-bold text-slate-700 italic leading-tight">3% H2O2 at RT for 48h</p>
                        </div>
                        <div className="p-3 bg-white/60 rounded-2xl border border-indigo-100 shadow-sm transition-transform hover:scale-[1.02]">
                            <p className="text-[9px] font-black uppercase text-indigo-500 mb-1">Photo Stress</p>
                            <p className="text-[10px] font-bold text-slate-700 italic leading-tight">1.2M lux-h Vis + 200Wh/m2 UV</p>
                        </div>
                    </div>
                </div>
                <div className="bg-indigo-950 text-white border-none shadow-xl overflow-hidden relative flex flex-col justify-center items-center text-center p-6 rounded-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 opacity-50"></div>
                    <div className="relative z-10">
                        <Badge className="mb-2 bg-indigo-500 hover:bg-indigo-400 text-[9px] uppercase font-black px-3 py-1">Expert Mode</Badge>
                        <h3 className="text-xl font-black leading-tight mb-2 uppercase tracking-tighter italic text-indigo-100">Stability<br />Compliance</h3>
                        <p className="text-[10px] font-medium text-indigo-300">All reports auto-synchronized with ICH Stress narrations.</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                {/* Sidebar Filter */}
                <div className="w-64 flex flex-col gap-2 p-4 bg-slate-50/50 border border-slate-100 rounded-3xl sticky top-20 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2 flex items-center justify-between">
                        Study Stages
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    </h3>
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedStudyType(null)}
                        className={cn(
                            "justify-start gap-3 h-11 text-xs font-bold rounded-2xl transition-all",
                            !selectedStudyType ? "bg-white shadow-sm text-indigo-700 border border-indigo-50" : "hover:bg-white text-slate-600"
                        )}
                    >
                        <FlaskConical className="h-4 w-4" />
                        All Protocols
                        <Badge variant="secondary" className="ml-auto text-[9px] bg-indigo-100 border-none">{state.stabilityProtocols.length}</Badge>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedStudyType('Long_Term')}
                        className={cn(
                            "justify-start gap-3 h-11 text-xs font-bold rounded-2xl transition-all",
                            selectedStudyType === 'Long_Term' ? "bg-white shadow-sm text-indigo-700 border border-indigo-50" : "hover:bg-white text-slate-600"
                        )}
                    >
                        <Clock className="h-4 w-4 text-slate-400" />
                        Long Term
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedStudyType('Accelerated')}
                        className={cn(
                            "justify-start gap-3 h-11 text-xs font-bold rounded-2xl transition-all",
                            selectedStudyType === 'Accelerated' ? "bg-white shadow-sm text-indigo-700 border border-indigo-50" : "hover:bg-white text-slate-600"
                        )}
                    >
                        <Play className="h-4 w-4 text-slate-400" />
                        Accelerated
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedStudyType('Forced_Degradation')}
                        className={cn(
                            "justify-start gap-3 h-11 text-xs font-bold rounded-2xl transition-all",
                            selectedStudyType === 'Forced_Degradation' ? "bg-white shadow-sm text-indigo-700 border border-indigo-50" : "hover:bg-white text-slate-600"
                        )}
                    >
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        Forced Degradation
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedStudyType('Photo_Stability')}
                        className={cn(
                            "justify-start gap-3 h-11 text-xs font-bold rounded-2xl transition-all",
                            selectedStudyType === 'Photo_Stability' ? "bg-white shadow-sm text-indigo-700 border border-indigo-50" : "hover:bg-white text-slate-600"
                        )}
                    >
                        <Download className="h-4 w-4 text-slate-400" />
                        Photostability
                    </Button>
                    <div className="mt-8 p-4 bg-white/40 rounded-2xl border border-slate-100">
                        <p className="text-[9px] text-slate-400 leading-relaxed italic font-medium">Manage stability zones and time points following regulatory approval stages.</p>
                    </div>
                </div>

                {/* Protocol Table */}
                <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-900 border-b">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-black uppercase tracking-widest text-[10px] py-6 pl-8 text-slate-500">Protocol Info</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-500">Type</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-500">Schedule</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-500">Status</TableHead>
                                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] pr-8 text-slate-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProtocols.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center text-slate-400 font-medium bg-slate-50/20">
                                        <FileText className="h-10 w-10 mx-auto mb-4 opacity-10" />
                                        No stability protocols found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProtocols.map((protocol) => (
                                    <TableRow key={protocol.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                                        <TableCell className="py-6 pl-8">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{protocol.protocolNumber}</span>
                                                <span className="text-[11px] text-slate-400 font-black uppercase tracking-tight">Batch: {protocol.batchNumber}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={cn(
                                                "font-black uppercase tracking-tighter text-[9px] px-2.5 py-1 border-none",
                                                protocol.studyType === 'Forced_Degradation' ? "bg-amber-100 text-amber-700" :
                                                    protocol.studyType === 'Photo_Stability' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                                            )}>
                                                {protocol.studyType.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1.5 items-center">
                                                {protocol.timePoints.sort((a, b) => a.month - b.month).map((tp) => (
                                                    <div key={tp.id} className={cn(
                                                        "w-1.5 h-6 rounded-full transition-all group-hover:h-8",
                                                        tp.status === 'Completed' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" :
                                                            tp.status === 'Pulled' || tp.status === 'Testing' ? "bg-amber-500" : "bg-slate-200"
                                                    )} title={tp.label} />
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn('border-none font-black uppercase text-[9px] px-2.5 py-1 shadow-sm', getStatusColor(protocol.status))} variant="secondary">
                                                {protocol.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <Button variant="ghost" size="icon" onClick={() => handleView(protocol)} className="h-9 w-9 text-indigo-600 hover:bg-indigo-100 rounded-xl">
                                                    <Eye className="h-4.5 w-4.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(protocol)} className="h-9 w-9 text-slate-400 hover:bg-slate-100 rounded-xl">
                                                    <MoreHorizontal className="h-4.5 w-4.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(protocol.id)} className="h-9 w-9 text-red-400 hover:bg-red-100 rounded-xl">
                                                    <Trash2 className="h-4.5 w-4.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">{selectedProtocol ? 'Edit Protocol' : 'Create Stability Protocol'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-8 py-4">
                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 px-1">1. Material & Product Identification</h3>
                            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-bold text-slate-700">Product Designation</Label>
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-[10px] font-black uppercase text-indigo-600"
                                            onClick={() => {
                                                setIsCustomProduct(!isCustomProduct);
                                                setFormData({ ...formData, productId: '', productName: '', batchNumber: '' });
                                            }}
                                        >
                                            {isCustomProduct ? "Select Registered List" : "Direct Manual Entry"}
                                        </Button>
                                    </div>
                                    {isCustomProduct ? (
                                        <Input
                                            placeholder="Enter drug/product name"
                                            value={formData.productName || ''}
                                            className="h-11 rounded-xl"
                                            onChange={e => setFormData({ ...formData, productName: e.target.value, productId: 'CUSTOM' })}
                                        />
                                    ) : (
                                        <Select
                                            value={formData.productId}
                                            onValueChange={(val) => {
                                                const p = state.products.find(x => x.id === val);
                                                setFormData({ ...formData, productId: val, productName: p?.name, batchNumber: p?.batchNumber });
                                            }}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl">
                                                <SelectValue placeholder="Select from inventory" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {state.products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} - {p.batchNumber}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Batch Number</Label>
                                    <Input
                                        className="h-11 rounded-xl"
                                        placeholder="Auto-filled or manual entry"
                                        value={formData.batchNumber || ''}
                                        onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Protocol Reference Number</Label>
                                    <Input
                                        className="h-11 rounded-xl font-bold text-indigo-600"
                                        value={formData.protocolNumber || ''}
                                        onChange={e => setFormData({ ...formData, protocolNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Study Type / Stage</Label>
                                    <Select
                                        value={formData.studyType}
                                        onValueChange={(val: any) => setFormData({ ...formData, studyType: val })}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Long_Term">Long Term</SelectItem>
                                            <SelectItem value="Accelerated">Accelerated</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Photo_Stability">Photo Stability</SelectItem>
                                            <SelectItem value="Forced_Degradation">Forced Degradation</SelectItem>
                                            <SelectItem value="In_Use">In Use</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Storage & Timepoints Section */}
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 px-1">2. Storage Conditions</h3>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 min-h-[200px] flex flex-col">
                                    <div className="flex gap-2 mb-4">
                                        <Input
                                            placeholder="25°C / 60% RH"
                                            value={newCondition.condition}
                                            onChange={e => setNewCondition({ ...newCondition, condition: e.target.value })}
                                            className="h-9 text-xs rounded-xl"
                                        />
                                        <Input
                                            placeholder="Zone IVb"
                                            value={newCondition.zone}
                                            onChange={e => setNewCondition({ ...newCondition, zone: e.target.value })}
                                            className="h-9 text-xs w-24 rounded-xl"
                                        />
                                        <Button size="sm" onClick={addCondition} className="h-9 px-3 rounded-xl bg-slate-900">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {formData.storageConditions?.map(c => (
                                            <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 group">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{c.condition}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.zone}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => removeCondition(c.id)} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 rounded-lg">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 px-1">3. Study Duration (Time Points)</h3>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 min-h-[200px] flex flex-col">
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <Input
                                            type="number"
                                            placeholder="Mons"
                                            value={newTimePoint.month || ''}
                                            onChange={e => setNewTimePoint({ ...newTimePoint, month: parseInt(e.target.value) })}
                                            className="h-9 text-xs rounded-xl"
                                        />
                                        <Input
                                            placeholder="Label"
                                            value={newTimePoint.label}
                                            onChange={e => setNewTimePoint({ ...newTimePoint, label: e.target.value })}
                                            className="h-9 text-xs rounded-xl"
                                        />
                                        <Button size="sm" onClick={addTimePoint} className="h-9 px-3 rounded-xl bg-slate-900">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {formData.timePoints?.map(tp => (
                                            <div key={tp.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-5 w-5 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                        {tp.month}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{tp.label}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => removeTimePoint(tp.id)} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 rounded-lg">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quality Attributes Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500">4. Quality Attributes (Analytical Specs)</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={applyRegulatoryGuidelines}
                                    className="h-8 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl gap-1.5"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    Consult ICH Guidelines
                                </Button>
                            </div>
                            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/50 border-b">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-slate-500">Test Method & Conditions</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-slate-500">Protocol Limit / Specification</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {state.testMethods.map((method) => {
                                            const product = state.products.find(p => p.id === formData.productId);
                                            const dosageForm = product?.dosageForm || 'Other';
                                            const isSuggested = REGULATORY_TEST_TEMPLATES[dosageForm]?.some(t =>
                                                method.name.toLowerCase().replace(/[^a-z]/g, '').includes(t.toLowerCase().replace(/[^a-z]/g, ''))
                                            );
                                            const testConfig = formData.tests?.find(t => t.testId === method.id);
                                            const isSelected = !!testConfig;

                                            return (
                                                <TableRow key={method.id} className={cn(
                                                    "transition-colors group",
                                                    isSuggested ? "bg-indigo-50/10" : ""
                                                )}>
                                                    <TableCell className="py-4">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => {
                                                                setFormData(prev => {
                                                                    const currentTests = prev.tests || [];
                                                                    if (checked) {
                                                                        const defaultSpec = method.parameters?.map(p => {
                                                                            if (p.minValue !== undefined && p.maxValue !== undefined) {
                                                                                return `${p.name}: ${p.minValue} - ${p.maxValue} ${p.unit || ''}`;
                                                                            } else if (p.maxValue !== undefined) {
                                                                                return `${p.name}: NMT ${p.maxValue} ${p.unit || ''}`;
                                                                            } else if (p.minValue !== undefined) {
                                                                                return `${p.name}: NLT ${p.minValue} ${p.unit || ''}`;
                                                                            }
                                                                            return `${p.name}: Report`;
                                                                        }).join('; ') || 'As per STP';
                                                                        return { ...prev, tests: [...currentTests, { testId: method.id, specification: defaultSpec }] };
                                                                    } else {
                                                                        return { ...prev, tests: currentTests.filter(t => t.testId !== method.id) };
                                                                    }
                                                                });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{method.name}</span>
                                                                {isSuggested && (
                                                                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase px-2 py-0 border-none">Suggested</Badge>
                                                                )}
                                                                {method.procedureDetails && (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Info className="h-3 w-3 text-slate-400 cursor-help" />
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="max-w-xs text-[10px] p-3 rounded-xl shadow-xl border-none bg-slate-900 text-white">
                                                                                <p className="font-bold mb-1 uppercase text-indigo-400 tracking-widest text-[9px]">Stability Procedure:</p>
                                                                                <p className="font-medium text-slate-300 leading-relaxed">{method.procedureDetails}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </div>
                                                            {method.procedureDetails && (
                                                                <span className="text-[10px] text-indigo-600/70 font-bold italic leading-tight mt-0.5 line-clamp-1">
                                                                    {method.procedureDetails}
                                                                </span>
                                                            )}
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">{method.category}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        {isSelected ? (
                                                            <Input
                                                                className="h-9 text-xs font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl"
                                                                placeholder="Enter limit (e.g. 95.0% - 105.0%)"
                                                                value={testConfig?.specification || ''}
                                                                onChange={(e) => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        tests: prev.tests?.map(t =>
                                                                            t.testId === method.id ? { ...t, specification: e.target.value } : t
                                                                        )
                                                                    }));
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-[10px] text-slate-300 italic font-medium">Not included in protocol</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        {isSuggested && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="cursor-help opacity-40 group-hover:opacity-100 transition-opacity">
                                                                            <Sparkles className="h-4 w-4 text-indigo-400" />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="text-[10px] font-bold uppercase tracking-tight p-2 rounded-lg border-none bg-indigo-600 text-white">ICH Mandatory</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                            {state.testMethods.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                    <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500 opacity-50" />
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Analytical Library Depleted</p>
                                    <p className="text-[11px] text-slate-500 mb-6 px-12 max-w-sm mx-auto leading-relaxed">The ICH Advisor requires matched Laboratory STPs (Assay, Disso, etc.) to function. Please import standard methods.</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.href = '/testing'}
                                        className="text-xs font-black uppercase text-indigo-600 border-indigo-200 rounded-xl px-6"
                                    >
                                        Go to Testing Library
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="bg-slate-50/50 -mx-6 -mb-6 p-6 mt-6 rounded-b-3xl border-t border-slate-100 gap-3">
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl font-bold text-slate-500 px-6">Cancel</Button>
                        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold px-8 shadow-lg shadow-indigo-100">Save Protocol</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Dummy export to match original file structure if needed, but we are replacing the whole function structure.
