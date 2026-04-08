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
import { Plus, Search, AlertTriangle, AlertCircle, Info, Trash2, CheckCircle } from 'lucide-react';
import type { Deviation } from '@/types';
import { cn } from '@/lib/utils';
import { useSecurity } from '@/components/security/SecurityProvider';
import { SignatureModal } from '@/components/security/SignatureModal';
import { toast } from 'sonner';

export function DeviationsPage() {
  const { state, dispatch } = useStore();
  const { user } = useSecurity();
  // Local state for immediate feedback
  const [localDeviations, setLocalDeviations] = useState<Deviation[]>(state.deviations);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [pendingCloseDeviation, setPendingCloseDeviation] = useState<Deviation | null>(null);

  const filteredDeviations = localDeviations.filter((deviation) => {
    const matchesSearch =
      deviation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deviation.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || deviation.status === statusFilter;
    const matchesType = typeFilter === 'all' || deviation.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCloseDeviation = (deviation: Deviation) => {
    setPendingCloseDeviation(deviation);
    setIsSignatureOpen(true);
  };

  const handleSignatureConfirm = (sigData: any) => {
    if (pendingCloseDeviation) {
      dispatch({
        type: 'UPDATE_DEVIATION',
        payload: {
          ...pendingCloseDeviation,
          status: 'Closed',
          closureDate: new Date(),
          closedBy: sigData.signerName,
          signatureIntent: sigData.intent
        }
      });
      setLocalDeviations(prev => prev.map(d => d.id === pendingCloseDeviation.id ? { ...d, status: 'Closed' } : d));

      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: Math.random().toString(36).substr(2, 9),
          type: 'Document_Approved',
          description: `Deviation ${pendingCloseDeviation.id} closed and signed by ${sigData.signerName}`,
          user: sigData.signerName,
          timestamp: sigData.timestamp,
          relatedId: pendingCloseDeviation.id
        }
      });

      setPendingCloseDeviation(null);
      toast.success('Deviation record signed and closed');
    }
  };

  const handleDeleteDeviation = (id: string) => {
    if (window.confirm('Are you sure you want to delete this deviation record?')) {
      dispatch({ type: 'DELETE_DEVIATION', payload: id });
      setLocalDeviations(prev => prev.filter(d => d.id !== id));
      toast.success('Deviation record purged from system');
    }
  };

  const handleSaveDeviation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newDeviation: Deviation = {
      id: `DEV-${new Date().getFullYear()}-${localDeviations.length + 100}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as any,
      category: 'Process', // Default
      status: 'Open',
      occurrenceDate: new Date(formData.get('occurrenceDate') as string || new Date().toISOString()),
      discoveryDate: new Date(),
      discoveredBy: user?.name || 'Current User',
      affectedProduct: formData.get('affectedProduct') as string,
      affectedBatch: formData.get('affectedBatch') as string,
      immediateAction: formData.get('immediateAction') as string,
      rootCause: '',
      impactAssessment: '',
      capaRequired: false
    };

    setLocalDeviations([newDeviation, ...localDeviations]);
    dispatch({ type: 'ADD_DEVIATION', payload: newDeviation });
    setIsFormOpen(false);
    toast.success('New deviation record logged');
  };

  const typeColors = {
    Critical: 'bg-red-100 text-red-800 border-red-300',
    Major: 'bg-orange-100 text-orange-800 border-orange-300',
    Minor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  const typeLabels = {
    Critical: 'Critical',
    Major: 'Major',
    Minor: 'Minor',
  };

  const statusColors = {
    Open: 'bg-red-100 text-red-800 border-red-300',
    Under_Investigation: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Pending_CAPA: 'bg-blue-100 text-blue-800 border-blue-300',
    Pending_Approval: 'bg-purple-100 text-purple-800 border-purple-300',
    Closed: 'bg-green-100 text-green-800 border-green-300',
  };

  const statusLabels = {
    Open: 'Open',
    Under_Investigation: 'Investigation',
    Pending_CAPA: 'Pending CAPA',
    Pending_Approval: 'Awaiting Sign-off',
    Closed: 'Closed',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Process Deviations & Non-Conformities</h1>
          <p className="text-slate-500">Managing System Deviations, Root Cause Analysis & Lifecycle</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-red-600 hover:bg-red-700 animate-pulse">
          <Plus className="mr-2 h-4 w-4" />
          Log New Deviation
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by title, description or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Deviation Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lifecycles</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Severity Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
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
            <TableRow className="bg-slate-50 uppercase text-[11px] font-black tracking-widest">
              <TableHead>Deviation Summary</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Catalog</TableHead>
              <TableHead>Incident Date</TableHead>
              <TableHead>Affected Batch</TableHead>
              <TableHead>Workstream Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeviations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                  No deviation logs found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredDeviations.map((deviation) => (
                <TableRow
                  key={deviation.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedDeviation(deviation)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-blue-600">{deviation.title}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {deviation.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(typeColors[deviation.type])}
                    >
                      {deviation.type === 'Critical' && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {deviation.type === 'Major' && <AlertCircle className="mr-1 h-3 w-3" />}
                      {deviation.type === 'Minor' && <Info className="mr-1 h-3 w-3" />}
                      {typeLabels[deviation.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{deviation.category}</TableCell>
                  <TableCell>
                    {new Date(deviation.occurrenceDate).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell>
                    {deviation.affectedProduct ? (
                      <div>
                        <p className="text-sm font-medium">{deviation.affectedProduct}</p>
                        {deviation.affectedBatch && (
                          <code className="text-xs bg-slate-100 px-1 rounded border">
                            {deviation.affectedBatch}
                          </code>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(statusColors[deviation.status])}
                    >
                      {statusLabels[deviation.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {deviation.status !== 'Closed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Close Deviation"
                          className="text-emerald-600 h-8 w-8 hover:bg-emerald-50"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleCloseDeviation(deviation);
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
                            handleDeleteDeviation(deviation.id);
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
      <Dialog open={!!selectedDeviation} onOpenChange={() => setSelectedDeviation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDeviation?.title}</DialogTitle>
          </DialogHeader>
          {selectedDeviation && (
            <div className="space-y-4">
              <div>
                <span className="text-slate-500 font-semibold">Narrative Description:</span>
                <p className="mt-1 p-3 bg-slate-50 border rounded text-sm italic">{selectedDeviation.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-semibold">Remedial Action (Immediate):</span>
                  <p className="font-medium p-2 bg-green-50 rounded border border-green-100 text-green-800 text-sm">{selectedDeviation.immediateAction}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Root Cause Investigation:</span>
                  <p className="font-medium text-sm">{selectedDeviation.rootCause || 'Under RCA Review...'}</p>
                </div>
              </div>

              {/* Other details omitted for brevity */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Creation Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-red-900 uppercase">Raise Formal Quality Deviation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDeviation} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Incident Headline *</Label>
              <Input name="title" required placeholder="Concise title for the event" />
            </div>
            <div className="space-y-2">
              <Label>Comprehensive Narrative *</Label>
              <Textarea name="description" required placeholder="Who, what, where, when and immediate impact." className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Affected Product/Material</Label>
                <Select name="affectedProduct">
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {state.products.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    {state.rawMaterials.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input name="affectedBatch" placeholder="Enter batch ID" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Risk Categorization</Label>
                <Select name="type" defaultValue="Minor">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical (High Systemic Risk)</SelectItem>
                    <SelectItem value="Major">Major (GMP Impact)</SelectItem>
                    <SelectItem value="Minor">Minor (Isolated Event)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Incident Date</Label>
                <Input name="occurrenceDate" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remedial Execution (Immediate Action)</Label>
              <Textarea name="immediateAction" placeholder="What actions were taken at the point of discovery to contain the risk?" />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Discard</Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-black uppercase">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Submit Formal Deviation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SignatureModal
        open={isSignatureOpen}
        onOpenChange={setIsSignatureOpen}
        onConfirm={handleSignatureConfirm}
        actionIntent={`I certify that the investigation for Deviation ${pendingCloseDeviation?.id} is complete and all impact assessments have been finalized.`}
      />
    </div>
  );
}
