import { useState, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Search, Save, Trash2, CheckCircle } from 'lucide-react';
import type { CAPA } from '@/types';
import { cn } from '@/lib/utils';
import { g2CAPARecords } from '@/data/g2Data';
import { useSecurity } from '@/components/security/SecurityProvider';
import { SignatureModal } from '@/components/security/SignatureModal';
import { toast } from 'sonner';

export function CAPAPage() {
  const { state, dispatch } = useStore();
  const { user } = useSecurity();

  // Map G2 data to CAPA interface
  const initialCAPAs: CAPA[] = g2CAPARecords.map(g2 => ({
    id: g2.id,
    title: g2.title,
    description: g2.description,
    source: 'OOS', // Default
    priority: 'High', // Default
    category: 'Other',
    rootCause: g2.rootCause,
    correctiveActions: [{ id: '1', description: g2.action, assignedTo: g2.responsible, dueDate: new Date(g2.targetDate), status: 'In_Progress' }],
    preventiveActions: [],
    effectivenessCheck: { description: 'To be determined', result: g2.effectiveness as any },
    initiatedBy: g2.createdBy,
    initiationDate: new Date(g2.created),
    dueDate: new Date(g2.targetDate),
    status: g2.status === 'Completed' ? 'Closed' : 'Open',
    department: g2.responsible,
    linkedDocuments: []
  }));

  const now = useMemo(() => Date.now(), []);
  // Local state for demo purposes to allow immediate feedback
  const [localCAPAs, setLocalCAPAs] = useState<CAPA[]>(state.capas.length > 0 ? state.capas : initialCAPAs);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCAPA, setSelectedCAPA] = useState<CAPA | null>(null);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [pendingCloseCAPA, setPendingCloseCAPA] = useState<CAPA | null>(null);

  const filteredCAPAs = localCAPAs.filter((capa) => {
    const matchesSearch =
      capa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capa.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || capa.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || capa.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCloseCAPA = (capa: CAPA) => {
    setPendingCloseCAPA(capa);
    setIsSignatureOpen(true);
  };

  const handleSignatureConfirm = (sigData: any) => {
    if (pendingCloseCAPA) {
      dispatch({
        type: 'UPDATE_CAPA',
        payload: {
          ...pendingCloseCAPA,
          status: 'Closed',
          completionDate: new Date(),
          closedBy: sigData.signerName
        }
      });
      // Update local state for immediate feedback
      setLocalCAPAs(prev => prev.map(c => c.id === pendingCloseCAPA.id ? { ...c, status: 'Closed' } : c));

      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: Math.random().toString(36).substr(2, 9),
          type: 'Document_Approved',
          description: `CAPA ${pendingCloseCAPA.id} closed and signed by ${sigData.signerName}`,
          user: sigData.signerName,
          timestamp: sigData.timestamp,
          relatedId: pendingCloseCAPA.id
        }
      });

      setPendingCloseCAPA(null);
      toast.success('CAPA record signed and closed');
    }
  };

  const handleDeleteCAPA = (id: string) => {
    if (window.confirm('Are you sure you want to delete this CAPA record?')) {
      dispatch({ type: 'DELETE_CAPA', payload: id });
      setLocalCAPAs(prev => prev.filter(c => c.id !== id));
      toast.success('CAPA record deleted');
    }
  };

  const handleSaveNewCAPA = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newCAPA: CAPA = {
      id: `CAPA-${new Date().getFullYear()}-${localCAPAs.length + 100}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      source: formData.get('source') as any,
      priority: formData.get('priority') as any,
      category: 'Other', // Default
      status: 'Open',
      initiationDate: new Date(),
      dueDate: new Date(now + 30 * 24 * 60 * 60 * 1000), // +30 days
      department: formData.get('department') as string,
      rootCause: '', // To be investigated
      correctiveActions: [],
      preventiveActions: [],
      effectivenessCheck: { description: 'To be determined', result: 'Pending' },
      linkedDocuments: [],
      initiatedBy: 'Admin'
    };

    setLocalCAPAs([newCAPA, ...localCAPAs]);
    dispatch({ type: 'ADD_CAPA', payload: newCAPA });
    setIsFormOpen(false);
    toast.success('CAPA record initialized');
  };

  const priorityColors = {
    Critical: 'bg-red-100 text-red-800 border-red-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Low: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const priorityLabels = {
    Critical: 'Critical',
    High: 'High',
    Medium: 'Medium',
    Low: 'Low',
  };

  const statusColors = {
    Open: 'bg-red-100 text-red-800 border-red-300',
    In_Progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Pending_Verification: 'bg-blue-100 text-blue-800 border-blue-300',
    Closed: 'bg-green-100 text-green-800 border-green-300',
    Cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const statusLabels = {
    Open: 'Open',
    In_Progress: 'In Progress',
    Pending_Verification: 'Pending Verification',
    Closed: 'Closed',
    Cancelled: 'Cancelled',
  };

  const sourceLabels = {
    OOS: 'OOS',
    OOT: 'OOT',
    Deviation: 'Deviation',
    Audit: 'Audit',
    Complaint: 'Complaint',
    Risk_Assessment: 'Risk Assessment',
    Management_Review: 'Management Review',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">CAPA Records - Corrective & Preventive Actions</h1>
          <p className="text-slate-500">Managing systemic issues and prevention strategies</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600">
          <Plus className="mr-2 h-4 w-4" />
          Register new CAPA
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by title, root cause or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Records</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priority Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100 uppercase tracking-tighter text-[11px]">
              <TableHead className="font-black">Subject Title</TableHead>
              <TableHead className="font-black">Source</TableHead>
              <TableHead className="font-black">Priority</TableHead>
              <TableHead className="font-black">Owner Dept</TableHead>
              <TableHead className="font-black">Initiated</TableHead>
              <TableHead className="font-black">Target Date</TableHead>
              <TableHead className="font-black">Status</TableHead>
              <TableHead className="font-black text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCAPAs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic font-medium">
                  No CAPA records found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredCAPAs.map((capa) => (
                <TableRow
                  key={capa.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedCAPA(capa)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-blue-600">{capa.title}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {capa.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {sourceLabels[capa.source]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(priorityColors[capa.priority])}
                    >
                      {priorityLabels[capa.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>{capa.department || 'QA'}</TableCell>
                  <TableCell>
                    {new Date(capa.initiationDate).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell>
                    {new Date(capa.dueDate).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("font-bold", statusColors[capa.status])}
                    >
                      {statusLabels[capa.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {capa.status !== 'Closed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Close CAPA"
                          className="text-emerald-600 h-8 w-8 hover:bg-emerald-50"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleCloseCAPA(capa);
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
                            handleDeleteCAPA(capa.id);
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

      {/* Details Dialog */}
      <Dialog open={!!selectedCAPA} onOpenChange={() => setSelectedCAPA(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCAPA?.title}</DialogTitle>
          </DialogHeader>
          {selectedCAPA && (
            <div className="space-y-4">
              <div>
                <span className="text-slate-500 font-semibold">Detailed Description:</span>
                <p className="mt-1 p-2 bg-slate-50 rounded border">{selectedCAPA.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-semibold">Identified Root Cause:</span>
                  <p className="font-medium">{selectedCAPA.rootCause || 'Under Investigation'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Responsibility:</span>
                  <p className="font-medium">{selectedCAPA.department}</p>
                </div>
              </div>

              {/* Actions lists would go here */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Creation Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 uppercase">Raise New CAPA Investigation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveNewCAPA} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CAPA Title *</Label>
              <Input name="title" required placeholder="Short summary of the issue" />
            </div>
            <div className="space-y-2">
              <Label>Statement of Problem *</Label>
              <Textarea name="description" required placeholder="Explain the non-conformance in detail..." className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Occurrence Source</Label>
                <Select name="source" defaultValue="Deviation">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deviation">Internal Deviation</SelectItem>
                    <SelectItem value="OOS">OOS Out of Spec</SelectItem>
                    <SelectItem value="Audit">External/Internal Audit</SelectItem>
                    <SelectItem value="Complaint">Customer Complaint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select name="priority" defaultValue="Medium">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical Issue</SelectItem>
                    <SelectItem value="High">High Impact</SelectItem>
                    <SelectItem value="Medium">Medium Priority</SelectItem>
                    <SelectItem value="Low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsible Dept</Label>
                <Input name="department" placeholder="e.g. Production" defaultValue="Production" />
              </div>
            </div>
            <DialogFooter className="mt-6 bg-slate-50 -mx-6 -mb-6 p-6 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Discard</Button>
              <Button type="submit" className="bg-indigo-600 px-8">
                <Save className="w-4 h-4 mr-2" />
                Commit & Start Investigation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SignatureModal
        open={isSignatureOpen}
        onOpenChange={setIsSignatureOpen}
        onConfirm={handleSignatureConfirm}
        actionIntent={`I certify that the investigation for CAPA ${pendingCloseCAPA?.id} is complete and all corrective/preventive actions have been verified for effectiveness.`}
      />
    </div>
  );
}
