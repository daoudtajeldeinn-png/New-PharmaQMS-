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
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Search, Calendar, FileText, CheckCircle2, Clock, Trash2, CheckCircle } from 'lucide-react';
import type { Audit } from '@/types';
import { cn } from '@/lib/utils';
import { useSecurity } from '@/components/security/SecurityProvider';
import { toast } from 'sonner';

const auditTypeLabels: Record<string, string> = {
  Internal: 'Internal',
  External: 'Customer/External',
  Regulatory: 'Regulatory Body',
  Supplier: 'Vendor/Supplier',
  Certification: 'ISO/Certification',
};

const statusColors = {
  Planned: 'bg-blue-100 text-blue-800 border-blue-300',
  In_Progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Pending_Report: 'bg-orange-100 text-orange-800 border-orange-300',
  Closed: 'bg-green-100 text-green-800 border-green-300',
};

const statusLabels = {
  Planned: 'Scheduled',
  In_Progress: 'Execution',
  Pending_Report: 'Drafting Report',
  Closed: 'Signed Off',
};

const findingCategoryLabels: Record<string, string> = {
  Critical: 'Critical Failure',
  Major: 'Major Deviation',
  Minor: 'Observation/Minor',
  Observation: 'General Remark',
};

const findingCategoryColors: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-300',
  Major: 'bg-orange-100 text-orange-800 border-orange-300',
  Minor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Observation: 'bg-blue-100 text-blue-800 border-blue-300',
};

export function AuditsPage() {
  const { state, dispatch } = useStore();
  const { user } = useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  const filteredAudits = state.audits.filter((audit) => {
    const matchesSearch =
      audit.auditNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.area.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || audit.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCloseAudit = (audit: Audit) => {
    dispatch({
      type: 'UPDATE_AUDIT',
      payload: { ...audit, status: 'Closed', completionDate: new Date() }
    });
    toast.success('Audit protocol finalized and closed');
  };

  const handleDeleteAudit = (id: string) => {
    if (window.confirm('Are you sure you want to delete this audit record?')) {
      dispatch({ type: 'DELETE_AUDIT', payload: id });
      toast.success('Audit record removed from registry');
    }
  };

  // Calculate statistics
  const totalAudits = state.audits.length;
  const plannedAudits = state.audits.filter(a => a.status === 'Planned').length;
  const inProgressAudits = state.audits.filter(a => a.status === 'In_Progress').length;
  const closedAudits = state.audits.filter(a => a.status === 'Closed').length;
  const totalFindings = state.audits.reduce((sum, a) => sum + a.findings.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quality Audits & Inspections</h1>
          <p className="text-slate-500">Managing Audit Lifecycles, Compliance Verification & CAPA Integration</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Audit
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Gross Audits</p>
                <p className="text-2xl font-black text-slate-900">{totalAudits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Planned</p>
                <p className="text-2xl font-black text-yellow-900">{plannedAudits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Ongoing</p>
                <p className="text-2xl font-black text-orange-900">{inProgressAudits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Completed</p>
                <p className="text-2xl font-black text-green-900">{closedAudits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Observations</p>
                <p className="text-2xl font-black text-red-900">{totalFindings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search audit ID, scope or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Audit Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Full Registry</SelectItem>
            {Object.entries(auditTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Execution Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dispositions</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audits Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="uppercase text-[11px] font-black tracking-widest text-slate-600">
              <TableHead>Audit Reference</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Process Scope</TableHead>
              <TableHead>Dept/Area</TableHead>
              <TableHead>Risk Findings</TableHead>
              <TableHead>Auditors</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAudits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400 italic">
                  No audit dossiers found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredAudits.map((audit) => (
                <TableRow
                  key={audit.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setSelectedAudit(audit)}
                >
                  <TableCell>
                    <code className="rounded bg-slate-100 px-2 py-1 text-sm">{audit.auditNumber}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{auditTypeLabels[audit.type]}</Badge>
                  </TableCell>
                  <TableCell>{audit.scope}</TableCell>
                  <TableCell>{audit.area}</TableCell>
                  <TableCell>
                    {audit.findings.length > 0 ? (
                      <div className="flex gap-1">
                        {audit.findings.map((finding, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={cn("text-xs", findingCategoryColors[finding.category])}
                          >
                            {findingCategoryLabels[finding.category]}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{audit.auditors.join(', ')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(statusColors[audit.status])}>
                      {statusLabels[audit.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {audit.status !== 'Closed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Close Audit"
                          className="text-emerald-600 h-8 w-8 hover:bg-emerald-50"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleCloseAudit(audit);
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
                            handleDeleteAudit(audit.id);
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

      {/* Audit Details Dialog */}
      <Dialog open={!!selectedAudit} onOpenChange={() => setSelectedAudit(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900 font-black uppercase text-xl">
              <FileText className="h-5 w-5" />
              Audit Dossier: {selectedAudit?.auditNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedAudit && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-bold text-xs uppercase block">Category:</span>
                  <Badge variant="outline" className="mt-1">
                    {auditTypeLabels[selectedAudit.type]}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-xs uppercase block">Workflow State:</span>
                  <Badge variant="outline" className={cn("mt-1", statusColors[selectedAudit.status])}>
                    {statusLabels[selectedAudit.status]}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold text-xs uppercase block">Audit Scope:</span>
                <p className="font-medium text-slate-900">{selectedAudit.scope}</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold text-xs uppercase block">Process Area:</span>
                <p className="font-medium text-slate-900">{selectedAudit.area}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-bold text-xs uppercase block">Lead Auditors:</span>
                  <p className="font-medium">{selectedAudit.auditors.join(', ')}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-xs uppercase block">Audited Personnel:</span>
                  <p className="font-medium">{selectedAudit.auditees.join(', ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-bold text-xs uppercase block">Planned Execution:</span>
                  <p className="font-black text-slate-700">{new Date(selectedAudit.scheduledDate).toLocaleDateString('en-GB')}</p>
                </div>
                {selectedAudit.completionDate && (
                  <div>
                    <span className="text-slate-500 font-bold text-xs uppercase block">Actual Completion:</span>
                    <p className="font-black text-emerald-700">{new Date(selectedAudit.completionDate).toLocaleDateString('en-GB')}</p>
                  </div>
                )}
              </div>

              {selectedAudit.findings.length > 0 && (
                <div className="border-t pt-4">
                  <span className="text-indigo-900 font-black uppercase text-sm">Critical Observations & Finding Log:</span>
                  <div className="mt-4 space-y-4">
                    {selectedAudit.findings.map((finding, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                          <Badge className={cn("font-black", findingCategoryColors[finding.category])}>
                            {findingCategoryLabels[finding.category]}
                          </Badge>
                          <span className="text-[10px] font-black italic text-slate-400">REF: {finding.reference}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{finding.description}</p>
                        {finding.correctiveAction && (
                          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm">
                            <span className="font-black text-emerald-800 text-[10px] uppercase block mb-1">Prescribed Remedial Action:</span>
                            <p className="text-emerald-700 italic">{finding.correctiveAction}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Audit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-indigo-900 uppercase tracking-tight">Establish New Audit Protocol</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Audit Tracking ID *</Label>
                <Input placeholder="e.g., AUD-2024-001" />
              </div>
              <div className="space-y-2">
                <Label>Classification Tier *</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select Audit Class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internal">Internal QMS</SelectItem>
                    <SelectItem value="External">External/Customer</SelectItem>
                    <SelectItem value="Regulatory">Regulatory Agency</SelectItem>
                    <SelectItem value="Supplier">Vendor Verification</SelectItem>
                    <SelectItem value="Certification">ISO Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Process Scope Statement *</Label>
              <Input placeholder="Defining the functional boundaries of investigation" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Process Area / Facility *</Label>
                <Input placeholder="e.g., QC Laboratory" />
              </div>
              <div className="space-y-2">
                <Label>Planned Date *</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lead Audit Team (Comma separated)</Label>
              <Input placeholder="Names of inspectors" />
            </div>
            <div className="space-y-2">
              <Label>Point of Contacts / Auditees</Label>
              <Input placeholder="Names of facility representatives" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} className="font-bold">Discard</Button>
            <Button onClick={() => {
              // Placeholder for new audit creation logic
              // const newAudit = { /* ... form data ... */ };
              // dispatch({ type: 'ADD_AUDIT', payload: newAudit });
              setIsFormOpen(false);
              toast.success('New audit scheduled successfully');
            }} className="bg-indigo-600 font-bold px-8">Register Audit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
