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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, AlertTriangle, CheckCircle2, RefreshCcw, FileWarning, ExternalLink, History, ScrollText, CheckCircle, Trash2, Send } from 'lucide-react';
import type { ProductRecall, RecallUpdate } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSecurity } from '@/components/security/SecurityProvider';

const classificationColors = {
    Class_I: 'bg-red-600 text-white border-red-700',
    Class_II: 'bg-orange-500 text-white border-orange-600',
    Class_III: 'bg-yellow-500 text-white border-yellow-600',
};

const statusColors = {
    Draft: 'bg-gray-100 text-gray-800 border-gray-300',
    In_Progress: 'bg-blue-100 text-blue-800 border-blue-300',
    Completed: 'bg-green-100 text-green-800 border-green-300',
    Terminated: 'bg-red-100 text-red-800 border-red-300',
    Follow_Up: 'bg-cyan-100 text-cyan-800 border-cyan-300',
};

export function RecallsPage() {
    const { state, dispatch } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newRecall, setNewRecall] = useState<Partial<ProductRecall>>({
        status: 'Draft',
        recallClassification: 'Class_II',
        initiationDate: new Date(),
        regulatoryNotified: false,
        pressReleaseRequired: false,
        updates: [],
    });
    const [selectedRecall, setSelectedRecall] = useState<ProductRecall | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [newUpdate, setNewUpdate] = useState('');
    const { user } = useSecurity();

    const handleCloseRecall = (recall: ProductRecall) => {
        dispatch({
            type: 'UPDATE_PRODUCT_RECALL',
            payload: { ...recall, status: 'Completed', closureDate: new Date() }
        });
        toast.success(`Recall action ${recall.recallNumber} has been closed and archived.`);
    };


    const handleAddUpdate = () => {
        if (!newUpdate.trim() || !selectedRecall) return;

        const update: RecallUpdate = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date(),
            content: newUpdate,
            user: user?.username || 'Quality Manager',
        };

        const updatedRecall = {
            ...selectedRecall,
            updates: [...(selectedRecall.updates || []), update],
        };

        handleUpdateRecall(updatedRecall);
        setNewUpdate('');
        toast.success('Recommendation/Update added to recall file');
    };

    const filteredRecalls = (state.productRecalls || []).filter((recall) => {
        const matchesSearch =
            recall.recallNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recall.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recall.batchNumbers.some(b => b.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || recall.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleSaveRecall = () => {
        if (!newRecall.productName || !newRecall.reasonForRecall) {
            toast.error('Product name and reason for recall are required');
            return;
        }

        const recallRecord: ProductRecall = {
            id: Math.random().toString(36).substr(2, 9),
            recallNumber: `REC-${new Date().getFullYear()}-${(state.productRecalls?.length || 0) + 1}`.padStart(15, '0'),
            initiationDate: new Date(newRecall.initiationDate || new Date()),
            productName: newRecall.productName || '',
            batchNumbers: newRecall.batchNumbers || [],
            recallClassification: newRecall.recallClassification as any || 'Class_II',
            recallStrategy: newRecall.recallStrategy || '',
            reasonForRecall: newRecall.reasonForRecall || '',
            sourceOfIssue: (newRecall.sourceOfIssue as any) || 'Internal_Audit',
            totalQuantityDistributed: Number(newRecall.totalQuantityDistributed) || 0,
            totalQuantityRecovered: 0,
            healthHazardAssessment: newRecall.healthHazardAssessment || '',
            pressReleaseRequired: !!newRecall.pressReleaseRequired,
            regulatoryNotified: !!newRecall.regulatoryNotified,
            status: 'In_Progress',
            updates: [],
        };

        dispatch({ type: 'ADD_PRODUCT_RECALL', payload: recallRecord });
        toast.success('Product recall operation initiated successfully');
        setIsFormOpen(false);
    };

    const handleUpdateRecall = (updatedRecall: ProductRecall) => {
        dispatch({ type: 'UPDATE_PRODUCT_RECALL', payload: updatedRecall });
        setSelectedRecall(updatedRecall);
        toast.success('Recall record updated successfully');
    };


    const handleSaveRecommendations = (recommendations: string) => {
        if (!selectedRecall) return;
        handleUpdateRecall({ ...selectedRecall, recommendations });
    };

    const handleDeleteRecall = (id: string) => {
        if (window.confirm('CRITICAL ACTION: Are you sure you want to purge this recall record? This will be logged in the audit trail.')) {
            dispatch({ type: 'DELETE_PRODUCT_RECALL', payload: id });
            toast.warning('Recall record purged from registry.');
        }
    };

    const handleCompleteRecall = () => {
        if (!selectedRecall) return;
        const updatedRecall: ProductRecall = {
            ...selectedRecall,
            status: 'Completed',
            closureDate: new Date(),
        };
        handleUpdateRecall(updatedRecall);
        setIsDetailsOpen(false);
        toast.success('Product recall action marked as completed');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 italic">Product Recall Operations</h1>
                    <p className="text-slate-500">Managing Critical Product Withdrawals and Regulatory Compliance</p>
                </div>
                <Button onClick={() => setIsFormOpen(true)} className="bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-200">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Initiate Recall Action
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-red-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-red-600 uppercase flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Active Recalls
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{state.productRecalls?.filter(r => r.status === 'In_Progress').length || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Actions currently being monitored</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-blue-600 uppercase flex items-center gap-2">
                            <RefreshCcw className="h-4 w-4" />
                            Recovery Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                            {state.productRecalls?.length ?
                                Math.round((state.productRecalls.reduce((acc, r) => acc + r.totalQuantityRecovered, 0) /
                                    state.productRecalls.reduce((acc, r) => acc + r.totalQuantityDistributed, 0)) * 100) : 0}%
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Overall average of product recovery</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-emerald-600 uppercase flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Completed (2024)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{state.productRecalls?.filter(r => r.status === 'Completed').length || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Actions closed with final reports</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by recall #, product, or batch ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-slate-200 focus:border-red-400"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-white border-slate-200">
                        <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Every Status</SelectItem>
                        <SelectItem value="Draft">Draft Mode</SelectItem>
                        <SelectItem value="In_Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
                        <SelectItem value="Follow_Up">Follow-up Phase</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-xl border bg-white shadow-xl overflow-hidden border-slate-200">
                <Table>
                    <TableHeader className="bg-slate-900">
                        <TableRow>
                            <TableHead className="font-bold text-white">Recall & Date</TableHead>
                            <TableHead className="font-bold text-white">Product Scope</TableHead>
                            <TableHead className="font-bold text-white">Severity Level</TableHead>
                            <TableHead className="font-bold text-white">Recovery Progress</TableHead>
                            <TableHead className="font-bold text-white">Action Status</TableHead>
                            <TableHead className="font-bold text-white text-right">Operations</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRecalls.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-24 text-slate-400 italic">
                                    No active recall records found in the current environment.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRecalls.map((recall) => (
                                <TableRow key={recall.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                    <TableCell>
                                        <div>
                                            <p className="font-black text-red-600 text-sm">{recall.recallNumber}</p>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                Initiated: {new Date(recall.initiationDate).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-bold text-slate-800">{recall.productName}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {recall.batchNumbers.map(b => (
                                                <code key={b} className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600">{b}</code>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("rounded-sm px-2 py-0.5 text-[10px] font-black uppercase", classificationColors[recall.recallClassification])}>
                                            {recall.recallClassification.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-full space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span>{recall.totalQuantityRecovered} / {recall.totalQuantityDistributed} Unit</span>
                                                <span>{Math.round((recall.totalQuantityRecovered / recall.totalQuantityDistributed) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                                <div
                                                    className="bg-red-500 h-full transition-all duration-500"
                                                    style={{ width: `${(recall.totalQuantityRecovered / recall.totalQuantityDistributed) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-tighter", statusColors[recall.status])}>
                                            {recall.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                title="Full Details / Recommendations"
                                                onClick={() => {
                                                    setSelectedRecall(recall);
                                                    setIsDetailsOpen(true);
                                                }}
                                            >
                                                <FileWarning className="h-4 w-4" />
                                            </Button>

                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="External Notifications">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>

                                            {recall.status !== 'Completed' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Close Recall"
                                                    className="text-emerald-600 h-8 w-8 hover:bg-emerald-50"
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        handleCloseRecall(recall);
                                                    }}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}

                                            {user?.role === 'admin' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Delete Record"
                                                    className="text-rose-600 h-8 w-8 hover:bg-rose-50"
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        handleDeleteRecall(recall.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader className="bg-red-50 -mx-6 -mt-6 p-6 border-b border-red-200">
                        <DialogTitle className="text-2xl font-black text-red-900 tracking-tighter uppercase flex items-center gap-3">
                            <FileWarning className="h-8 w-8 text-red-600" />
                            Recall Action Portal
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-6 border-b border-slate-100">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase text-slate-500 tracking-widest">Target Brand *</Label>
                                <Input
                                    placeholder="Official product name as per registration"
                                    className="rounded-sm border-slate-200 focus:ring-red-500 focus:border-red-500"
                                    value={newRecall.productName || ''}
                                    onChange={(e) => setNewRecall({ ...newRecall, productName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase text-slate-500 tracking-widest">Effected Batches (Comma Separated)</Label>
                                <Input
                                    placeholder="B-001, B-002..."
                                    className="rounded-sm border-slate-200 focus:ring-red-500"
                                    onChange={(e) => setNewRecall({ ...newRecall, batchNumbers: e.target.value.split(',').map(s => s.trim()) })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase text-slate-500 tracking-widest">Severity Classification</Label>
                                <Select
                                    value={newRecall.recallClassification}
                                    onValueChange={(val) => setNewRecall({ ...newRecall, recallClassification: val as any })}
                                >
                                    <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Class_I">Class I (Critical - High Danger)</SelectItem>
                                        <SelectItem value="Class_II">Class II (Major - Health Risk)</SelectItem>
                                        <SelectItem value="Class_III">Class III (Minor - Low Risk)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase text-slate-500 tracking-widest">Incident Root Source</Label>
                                <Select
                                    value={newRecall.sourceOfIssue}
                                    onValueChange={(val) => setNewRecall({ ...newRecall, sourceOfIssue: val as any })}
                                >
                                    <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Complaint">Customer Complaint</SelectItem>
                                        <SelectItem value="Regulatory">Regulatory Mandate</SelectItem>
                                        <SelectItem value="Internal_Audit">Internal Audit Finding</SelectItem>
                                        <SelectItem value="Stability_Failure">Stability Failure</SelectItem>
                                        <SelectItem value="OOS">Laboratory OOS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase text-slate-500 tracking-widest">Distribution Size</Label>
                                <Input
                                    type="number"
                                    placeholder="Total units in market"
                                    className="rounded-sm"
                                    value={newRecall.totalQuantityDistributed || ''}
                                    onChange={(e) => setNewRecall({ ...newRecall, totalQuantityDistributed: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase text-slate-500 tracking-widest">Recall Justification / Trigger</Label>
                            <textarea
                                placeholder="Explain why this recall is necessary as per GxP guidelines..."
                                className="w-full h-32 p-3 rounded-sm border border-slate-200 focus:ring-red-500 focus:border-red-500 text-sm bg-slate-50"
                                value={newRecall.reasonForRecall || ''}
                                onChange={(e) => setNewRecall({ ...newRecall, reasonForRecall: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase text-red-500 tracking-widest italic leading-none">External Policy</p>
                                    <p className="text-sm font-bold text-white">Public Press Release Needed?</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="w-6 h-6 rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500"
                                    checked={newRecall.pressReleaseRequired}
                                    onChange={(e) => setNewRecall({ ...newRecall, pressReleaseRequired: e.target.checked })}
                                />
                            </div>
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest italic leading-none">Compliance</p>
                                    <p className="text-sm font-bold text-white">Authorities Notified (Ministry/FDA)?</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="w-6 h-6 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                                    checked={newRecall.regulatoryNotified}
                                    onChange={(e) => setNewRecall({ ...newRecall, regulatoryNotified: e.target.checked })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="uppercase font-black text-slate-400 text-xs py-6">Discard Entry</Button>
                        <Button onClick={handleSaveRecall} className="bg-red-600 hover:bg-black text-white font-black uppercase py-6 px-10 rounded-sm italic tracking-tighter transition-all">
                            Execute Action Plan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedRecall && (
                        <>
                            <DialogHeader className="bg-slate-900 -mx-6 -mt-6 p-6 border-b border-white/10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={cn("rounded-sm px-2 py-0.5 text-[10px] font-black uppercase", classificationColors[selectedRecall.recallClassification])}>
                                                {selectedRecall.recallClassification.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-white/40 text-xs font-mono">{selectedRecall.recallNumber}</span>
                                        </div>
                                        <DialogTitle className="text-2xl font-black text-white tracking-tighter uppercase truncate max-w-md">
                                            {selectedRecall.productName}
                                        </DialogTitle>
                                    </div>
                                    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-tighter", statusColors[selectedRecall.status])}>
                                        {selectedRecall.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </DialogHeader>

                            <div className="py-6 space-y-8">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Initiated</p>
                                        <p className="text-sm font-black text-slate-900">{new Date(selectedRecall.initiationDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Distributed</p>
                                        <p className="text-sm font-black text-slate-900">{selectedRecall.totalQuantityDistributed.toLocaleString()} Units</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Recovered</p>
                                        <p className="text-sm font-black text-red-600">{selectedRecall.totalQuantityRecovered.toLocaleString()} Units</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Source</p>
                                        <p className="text-sm font-black text-slate-900">{selectedRecall.sourceOfIssue.replace('_', ' ')}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-sm tracking-tight border-b pb-2 border-slate-100">
                                        <ScrollText className="h-4 w-4 text-red-600" />
                                        Case Implementation & Recommendations
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason for Recall</Label>
                                            <div className="p-4 bg-red-50/30 rounded border border-red-100 text-sm text-slate-700 min-h-[120px]">
                                                {selectedRecall.reasonForRecall}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommendations & CAPA</Label>
                                            <textarea
                                                className="w-full h-[120px] p-4 bg-slate-50 rounded border border-slate-200 text-sm text-slate-700 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                                placeholder="Enter final recommendations for this recall case..."
                                                defaultValue={selectedRecall.recommendations || ''}
                                                onBlur={(e) => handleSaveRecommendations(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-sm tracking-tight border-b pb-2 border-slate-100">
                                        <History className="h-4 w-4 text-blue-600" />
                                        Operations Update Timeline
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Document latest action or progress update..."
                                                    value={newUpdate}
                                                    onChange={(e) => setNewUpdate(e.target.value)}
                                                    className="border-slate-200 focus:border-blue-400"
                                                />
                                            </div>
                                            <Button onClick={handleAddUpdate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                                                <Send className="h-4 w-4 mr-2" />
                                                Log Update
                                            </Button>
                                        </div>

                                        <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                            {(!selectedRecall.updates || selectedRecall.updates.length === 0) ? (
                                                <div className="pl-10 py-6 text-slate-400 italic text-sm">
                                                    No operational updates logged for this recall action yet.
                                                </div>
                                            ) : (
                                                selectedRecall.updates.map((update) => (
                                                    <div key={update.id} className="relative pl-10">
                                                        <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white" />
                                                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-[10px] font-black text-blue-600 uppercase italic tracking-widest">{update.user}</span>
                                                                <span className="text-[10px] font-bold text-slate-400">{new Date(update.date).toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-700 leading-relaxed">{update.content}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", selectedRecall.regulatoryNotified ? "bg-green-500" : "bg-slate-300")} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Regulatory Notified</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", selectedRecall.pressReleaseRequired ? "bg-red-500" : "bg-slate-300")} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Press Release</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="uppercase font-black text-slate-400 text-xs tracking-widest px-8">
                                        Close Portal
                                    </Button>
                                    {selectedRecall.status !== 'Completed' && (
                                        <Button
                                            onClick={handleCompleteRecall}
                                            className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest px-8"
                                        >
                                            Complete Recall Action
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
