import { useState, useEffect } from 'react';
import { ShieldAlert, RotateCcw, Trash2, Lock, History, RefreshCw, Search, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useStore } from '@/hooks/useStore';
import { SoftDeleteService } from '@/services/SoftDeleteService';
import { db } from '@/db/db';

const TABLE_LABELS: Record<string, string> = {
  batchRecords: 'Batch Records (BMR)',
  rawMaterials: 'Material Inventory',
  coaRecords: 'COA Records',
  masterFormulas: 'Master Formula (MFR)',
  products: 'Products',
  testMethods: 'Test Methods',
  testResults: 'Test Results',
  capas: 'CAPAs',
  deviations: 'Deviations',
  equipment: 'Equipment',
  chemicalReagents: 'Chemical Reagents',
  referenceStandards: 'Reference Standards',
  qualitySystems: 'Quality Systems',
  trainingRecords: 'Training Records',
  audits: 'Audits',
  suppliers: 'Suppliers',
  changeControls: 'Change Controls',
  marketComplaints: 'Market Complaints',
  productRecalls: 'Product Recalls',
  stabilityProtocols: 'Stability Protocols',
  ipqcChecks: 'IPQC Checks',
  materialMovements: 'Material Movements',
  reconciliationRecords: 'Reconciliation Records',
};

const RESTORE_ACTION_MAP: Record<string, string> = {
  batchRecords: 'ADD_BATCH_RECORD',
  rawMaterials: 'ADD_RAW_MATERIAL',
  coaRecords: 'ADD_COA_RECORD',
  masterFormulas: 'ADD_MFR',
  products: 'ADD_PRODUCT',
  testMethods: 'ADD_TEST_METHOD',
  testResults: 'ADD_TEST_RESULT',
  capas: 'ADD_CAPA',
  deviations: 'ADD_DEVIATION',
  equipment: 'ADD_EQUIPMENT',
  chemicalReagents: 'ADD_CHEMICAL_REAGENT',
  referenceStandards: 'ADD_REFERENCE_STANDARD',
  qualitySystems: 'ADD_QUALITY_SYSTEM',
  trainingRecords: 'ADD_TRAINING_RECORD',
  audits: 'ADD_AUDIT',
  suppliers: 'ADD_SUPPLIER',
  changeControls: 'ADD_CHANGE_CONTROL',
  marketComplaints: 'ADD_MARKET_COMPLAINT',
  productRecalls: 'ADD_PRODUCT_RECALL',
  stabilityProtocols: 'ADD_STABILITY_PROTOCOL',
  ipqcChecks: 'ADD_IPQC_CHECK',
  materialMovements: 'ADD_MATERIAL_MOVEMENT',
  reconciliationRecords: 'ADD_RECONCILIATION_RECORD',
};

export function DataRecoveryConsole() {
  const { canRecover, isAdminRole, user } = useRoleAccess();
  const { dispatch } = useStore();
  const [deletedRecords, setDeletedRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);

  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchDeleted = async () => {
    setIsLoading(true);
    try {
      const { getAllTombstones } = await import('@/services/DeletedRecordsService');
      const records = getAllTombstones();
      // Only display records that are soft-deleted and not yet recovered
      setDeletedRecords(records.filter((t: any) => !t.recovered));
    } catch (err) {
      console.error(err);
      toast.error('Failed to query soft-deleted records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminRole) {
      fetchDeleted();
    }
  }, [isAdminRole]);

  if (!isAdminRole) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="p-8 bg-red-50/50 border border-red-100 rounded-3xl max-w-md shadow-lg">
          <Lock className="h-14 w-14 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            This console is restricted to IT Admin and QA Admin roles only. Standard accounts lack the regulatory credentials to access deleted records or recover state.
          </p>
        </div>
      </div>
    );
  }

  // Filter records
  const filtered = deletedRecords.filter((r) => {
    const snap = r.snapshot || {};
    const label = (snap.name || snap.title || snap.coaNumber || snap.batchNumber || r.id || '').toLowerCase();
    const matchesSearch = label.includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTable = selectedTable === 'all' || r.tableName === selectedTable;
    return matchesSearch && matchesTable;
  });

  // Get unique tables currently containing deleted records
  const uniqueTables = Array.from(new Set(deletedRecords.map((r) => r.tableName)));

  const handleRestoreClick = (record: any) => {
    setSelectedRecord(record);
    setActionReason('');
    setActionError('');
    setIsRestoreOpen(true);
  };

  const handleHardDeleteClick = (record: any) => {
    setSelectedRecord(record);
    setActionReason('');
    setActionError('');
    setIsHardDeleteOpen(true);
  };

  const executeRestore = async () => {
    if (!selectedRecord) return;
    if (!actionReason || actionReason.trim().length < 8) {
      setActionError('Please provide a detailed recovery reason (minimum 8 characters).');
      return;
    }

    try {
      const tableName = selectedRecord.tableName;
      const recordId = selectedRecord.id;

      const result = await SoftDeleteService.recover(
        tableName,
        recordId,
        user?.id || 'admin-recovery',
        user?.username || user?.name || 'admin',
        user?.role || 'admin',
        actionReason
      );

      if (!result.success) {
        toast.error(result.error || 'Failed to restore record.');
        return;
      }

      // Re-dispatch the record to the React context store
      const actionType = RESTORE_ACTION_MAP[tableName];
      if (actionType) {
        const table = (db as any)[tableName];
        const restoredData = await table.get(recordId);
        if (restoredData) {
          dispatch({ type: actionType as any, payload: restoredData });
        }
      }

      toast.success(`Successfully restored record to ${TABLE_LABELS[tableName] || tableName}.`);
      setIsRestoreOpen(false);
      setSelectedRecord(null);
      fetchDeleted();
    } catch (err: any) {
      console.error(err);
      toast.error('Recovery procedure encountered an error: ' + err.message);
    }
  };

  const executeHardDelete = async () => {
    if (!selectedRecord) return;
    if (!actionReason || actionReason.trim().length < 8) {
      setActionError('Please provide a detailed justification for purging this record.');
      return;
    }

    try {
      const tableName = selectedRecord.tableName;
      const recordId = selectedRecord.id;

      const result = await SoftDeleteService.hardDelete(
        tableName,
        recordId,
        user?.id || 'admin-harddelete',
        user?.username || user?.name || 'admin',
        user?.role || 'admin',
        actionReason
      );

      if (!result.success) {
        toast.error(result.error || 'Failed to permanently delete record.');
        return;
      }

      toast.success(`Record has been permanently deleted from systems.`);
      setIsHardDeleteOpen(false);
      setSelectedRecord(null);
      fetchDeleted();
    } catch (err: any) {
      console.error(err);
      toast.error('Hard delete procedure failed: ' + err.message);
    }
  };

  const getRecordLabel = (r: any) => {
    const snap = r.snapshot || {};
    return snap.name || snap.title || snap.coaNumber || snap.batchNumber || r.id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <History className="h-6 w-6" />
            </div>
            Data Recovery Console
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Regulatory Recovery Module (21 CFR Part 11 / EU Annex 11 compliance). Restore soft-deleted data or authorize permanent purging.
          </p>
        </div>
        <Button onClick={fetchDeleted} disabled={isLoading} variant="outline" className="gap-2 h-11 rounded-xl">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none bg-slate-50 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Total Soft-Deleted Records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{deletedRecords.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-rose-50/70 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-rose-600 uppercase tracking-widest">
              Awaiting Action / Audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-700">{filtered.length} matching filters</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-indigo-50/70 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Regulatory Scope
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-700">{uniqueTables.length} Active Modules</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by record ID, batch, title or name..."
            className="pl-10 h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="h-11 border border-slate-200 rounded-xl text-sm font-medium px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            <option value="all">All Modules</option>
            {uniqueTables.map((tbl) => (
              <option key={tbl} value={tbl}>
                {TABLE_LABELS[tbl] || tbl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deleted Registry list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 border border-dashed rounded-3xl text-slate-400">
            <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-slate-600">No soft-deleted records match criteria</p>
            <p className="text-xs mt-1">If files were deleted recently, make sure to sync with the cloud or refresh.</p>
          </div>
        ) : (
          filtered.map((record) => (
            <Card key={record.id} className="border border-slate-100 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-slate-100 text-slate-800 border-none font-bold text-[10px] rounded-lg">
                      {TABLE_LABELS[record.tableName] || record.tableName}
                    </Badge>
                    <Badge className="bg-red-50 text-red-700 border-none font-bold text-[10px] rounded-lg">
                      Soft-Deleted
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {record.id}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-800">
                    {getRecordLabel(record)}
                  </h3>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Deleted By: <strong className="text-slate-600">{record.deletedBy || 'Unknown'}</strong></span>
                    <span>•</span>
                    <span>Date: <strong className="text-slate-600">{new Date(record.deletedAt).toLocaleString()}</strong></span>
                    {record.reason && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium normal-case">
                          Reason: {record.reason}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 rounded-xl gap-2 font-bold text-xs"
                    onClick={() => {
                      setSelectedRecord(record);
                      setIsViewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" /> Inspect
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-xl gap-2 font-bold text-xs"
                    onClick={() => handleRestoreClick(record)}
                  >
                    <RotateCcw className="h-4 w-4" /> Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 h-10 rounded-xl gap-2 font-bold text-xs"
                    onClick={() => handleHardDeleteClick(record)}
                  >
                    <Trash2 className="h-4 w-4" /> Purge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Inspect Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl p-6 border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
              Inspect Deleted Record JSON Snapshot
            </DialogTitle>
          </DialogHeader>
          <div className="my-4">
            <div className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-auto max-h-[350px]">
              <pre>{JSON.stringify(selectedRecord, null, 2)}</pre>
            </div>
          </div>
          <DialogFooter>
            <Button className="rounded-xl" onClick={() => setIsViewOpen(false)}>Close Inspector</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Modal */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
              Authorize Record Recovery
            </DialogTitle>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
              21 CFR Part 11 Audit logging required
            </p>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Restoring will clear the soft-delete tags and put this record back into active queues. All workstations will synchronise this state.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Justification for Recovery *</Label>
              <Textarea
                placeholder="e.g. Audit correction, accidental deletion recovery, QA authorization..."
                value={actionReason}
                onChange={(e) => {
                  setActionReason(e.target.value);
                  if (actionError) setActionError('');
                }}
                className="min-h-[80px] rounded-xl text-xs"
              />
              {actionError && <p className="text-xs font-bold text-red-500 animate-pulse">{actionError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsRestoreOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold" onClick={executeRestore}>
              Confirm Recovery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete / Purge Modal */}
      <Dialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border shadow-2xl border-red-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-red-600 tracking-tight">
              Permanent Record Purge (Hard Delete)
            </DialogTitle>
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
              Warning: Non-recoverable action
            </p>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 leading-relaxed font-medium">
              This will permanently purge this record from local IndexedDB storage and from Supabase cloud database. Recovery will not be possible.
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Regulatory Justification for Purging *</Label>
              <Textarea
                placeholder="e.g. Obsolete testing trial data, system maintenance purge, certified cleanup..."
                value={actionReason}
                onChange={(e) => {
                  setActionReason(e.target.value);
                  if (actionError) setActionError('');
                }}
                className="min-h-[80px] rounded-xl text-xs border-red-200 focus:border-red-500 focus:ring-red-500"
              />
              {actionError && <p className="text-xs font-bold text-red-500 animate-pulse">{actionError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsHardDeleteOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200" onClick={executeHardDelete}>
              Confirm Permanent Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
