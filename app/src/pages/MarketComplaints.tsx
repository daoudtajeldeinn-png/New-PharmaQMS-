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
import { Plus, Search, AlertCircle, FileText, Filter, Trash2, CheckCircle } from 'lucide-react';
import type { MarketComplaint } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSecurity } from '@/components/security/SecurityProvider';

const severityColors = {
    Critical: 'bg-red-100 text-red-800 border-red-300',
    Major: 'bg-orange-100 text-orange-800 border-orange-300',
    Minor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const statusColors = {
    Open: 'bg-blue-100 text-blue-800 border-blue-300',
    Under_Investigation: 'bg-purple-100 text-purple-800 border-purple-300',
    Responded: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    Closed: 'bg-green-100 text-green-800 border-green-300',
    Invalid: 'bg-gray-100 text-gray-800 border-gray-300',
};

export function MarketComplaintsPage() {
    const { state, dispatch } = useStore();
    const { user } = useSecurity();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newComplaint, setNewComplaint] = useState<Partial<MarketComplaint>>({
        status: 'Open',
        severity: 'Major',
        complaintType: 'Quality',
        receivedDate: new Date(),
        sampleReceived: false,
        capaRequired: false,
    });

    const filteredComplaints = (state.marketComplaints || []).filter((complaint) => {
        const matchesSearch =
            complaint.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            complaint.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            complaint.complainantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            complaint.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleCloseComplaint = (complaint: MarketComplaint) => {
        dispatch({
            type: 'UPDATE_MARKET_COMPLAINT',
            payload: {
                ...complaint,
                status: 'Closed',
                closedDate: new Date(),
                closedBy: user?.username || 'Admin'
            }
        });
        toast.success('Complaint closed successfully');
    };

    const handleDeleteComplaint = (id: string) => {
        if (window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
            dispatch({ type: 'DELETE_MARKET_COMPLAINT', payload: id });
            toast.success('Complaint deleted from system');
        }
    };

    const handleSaveComplaint = () => {
        if (!newComplaint.productName || !newComplaint.complainantName || !newComplaint.batchNumber) {
            toast.error('Please fill in all required fields');
            return;
        }

        const complaintRecord: MarketComplaint = {
            id: Math.random().toString(36).substr(2, 9),
            complaintNumber: `COMP-${new Date().getFullYear()}-${(state.marketComplaints?.length || 0) + 1}`.padStart(15, '0'),
            receivedDate: new Date(newComplaint.receivedDate || new Date()),
            complainantName: newComplaint.complainantName || '',
            complainantContact: newComplaint.complainantContact || '',
            productName: newComplaint.productName || '',
            batchNumber: newComplaint.batchNumber || '',
            expiryDate: new Date(), // Sample expiry
            complaintType: newComplaint.complaintType as any || 'Quality',
            description: newComplaint.description || '',
            severity: newComplaint.severity as any || 'Major',
            sampleReceived: !!newComplaint.sampleReceived,
            capaRequired: !!newComplaint.capaRequired,
            disposition: '',
            status: 'Open',
        };

        dispatch({ type: 'ADD_MARKET_COMPLAINT', payload: complaintRecord });
        toast.success('Market complaint recorded successfully');
        setIsFormOpen(false);
        setNewComplaint({
            status: 'Open',
            severity: 'Major',
            complaintType: 'Quality',
            receivedDate: new Date(),
            sampleReceived: false,
            capaRequired: false,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Market Complaints</h1>
                    <p className="text-slate-500">Managing Post-Market Surveillance and Customer Concerns</p>
                </div>
                <Button onClick={() => setIsFormOpen(true)} className="bg-rose-600 hover:bg-rose-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Log New Complaint
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600">Total Complaints</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{state.marketComplaints?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600">Under Investigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900">
                            {state.marketComplaints?.filter(c => c.status === 'Under_Investigation' || c.status === 'Open').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600">Closed (2024)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900">
                            {state.marketComplaints?.filter(c => c.status === 'Closed').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-rose-600">Critical Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-900">
                            {state.marketComplaints?.filter(c => c.severity === 'Critical').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by complaint #, product, or batch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Under_Investigation">Under Investigation</SelectItem>
                        <SelectItem value="Responded">Responded</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Invalid">Invalid</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold">Complaint Details</TableHead>
                            <TableHead className="font-bold">Product / Batch</TableHead>
                            <TableHead className="font-bold">Reporter</TableHead>
                            <TableHead className="font-bold">Severity</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredComplaints.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic">
                                    No market complaints found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredComplaints.map((complaint) => (
                                <TableRow key={complaint.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-blue-700">{complaint.complaintNumber}</p>
                                            <p className="text-xs text-slate-500">{new Date(complaint.receivedDate).toLocaleDateString('en-GB')}</p>
                                            <p className="text-sm mt-1 line-clamp-1 text-slate-600">{complaint.description}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{complaint.productName}</p>
                                        <code className="text-xs text-slate-500 bg-slate-100 px-1 rounded">{complaint.batchNumber}</code>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm">{complaint.complainantName}</p>
                                        <p className="text-xs text-slate-400">{complaint.complainantContact}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(severityColors[complaint.severity])}>
                                            {complaint.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(statusColors[complaint.status])}>
                                            {complaint.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" title="View Investigation">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                            {complaint.status !== 'Closed' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Close Complaint"
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => handleCloseComplaint(complaint)}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {user?.role === 'admin' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Delete Record"
                                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                    onClick={() => handleDeleteComplaint(complaint.id)}
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-600" />
                            RECORD MARKET COMPLAINT
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Product Name *</Label>
                                <Input
                                    placeholder="e.g. Paracetamol 500mg"
                                    value={newComplaint.productName || ''}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, productName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Batch Number *</Label>
                                <Input
                                    placeholder="e.g. B2024-X"
                                    value={newComplaint.batchNumber || ''}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, batchNumber: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Complainant Name *</Label>
                                <Input
                                    placeholder="Person or Institution"
                                    value={newComplaint.complainantName || ''}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, complainantName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Details</Label>
                                <Input
                                    placeholder="Phone or Email"
                                    value={newComplaint.complainantContact || ''}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, complainantContact: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Complaint Type</Label>
                                <Select
                                    value={newComplaint.complaintType}
                                    onValueChange={(val) => setNewComplaint({ ...newComplaint, complaintType: val as any })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Quality">Quality Issue</SelectItem>
                                        <SelectItem value="Safety">Adverse Event</SelectItem>
                                        <SelectItem value="Efficacy">Lack of Efficacy</SelectItem>
                                        <SelectItem value="Packaging">Packaging Issue</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Severity</Label>
                                <Select
                                    value={newComplaint.severity}
                                    onValueChange={(val) => setNewComplaint({ ...newComplaint, severity: val as any })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                        <SelectItem value="Major">Major</SelectItem>
                                        <SelectItem value="Minor">Minor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Received Date</Label>
                                <Input
                                    type="date"
                                    value={newComplaint.receivedDate instanceof Date ? newComplaint.receivedDate.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, receivedDate: new Date(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description of Complaint</Label>
                            <Input
                                placeholder="Detailed description of the issue reported"
                                value={newComplaint.description || ''}
                                onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-md border">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="sampleReceived"
                                    checked={newComplaint.sampleReceived}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, sampleReceived: e.target.checked })}
                                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                />
                                <Label htmlFor="sampleReceived" className="cursor-pointer">Sample Received?</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="capaRequired"
                                    checked={newComplaint.capaRequired}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, capaRequired: e.target.checked })}
                                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                />
                                <Label htmlFor="capaRequired" className="cursor-pointer text-amber-700 font-bold">CAPA Triggered?</Label>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveComplaint} className="bg-rose-600 px-8">Save Record</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
