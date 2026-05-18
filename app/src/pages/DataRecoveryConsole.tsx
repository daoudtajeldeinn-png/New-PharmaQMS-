/**
 * DataRecoveryConsole.tsx
 * 
 * Admin-only panel for viewing and recovering soft-deleted records.
 * Only visible to users with role 'it_admin' or 'qa_admin'.
 * 
 * Shows all tombstoned records with:
 *  - Which table / module they came from
 *  - Who deleted them and when
 *  - A "Restore" button that calls recoverRecord() and re-dispatches 
 *    the snapshot back into the store.
 */

import { useState, useEffect } from 'react';
import { ShieldAlert, RotateCcw, Trash2, Lock, History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useStore } from '@/hooks/useStore';
import {
  getAllTombstones,
  recoverRecord,
  type DeletedRecord,
} from '@/services/DeletedRecordsService';

// Map table names back to readable module labels
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
};

// Dispatch action type mappings (store actions for restoration)
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
};

export function DataRecoveryConsole() {
  const { canRecover, isAdminRole, user } = useRoleAccess();
  const { dispatch } = useStore();
  const [tombstones, setTombstones] = useState<DeletedRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'recovered'>('active');

  const refresh = () => {
    setTombstones(getAllTombstones());
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!isAdminRole) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
          <Lock className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-black text-red-700">Access Restricted</h2>
          <p className="text-sm text-red-500 mt-2">
            This console is restricted to IT Admin and QA Admin roles only.
          </p>
        </div>
      </div>
    );
  }

  const filtered = tombstones.filter(t => {
    if (filter === 'active') return !t.recovered;
    if (filter === 'recovered') return t.recovered;
    return true;
  });

  const handleRestore = async (tombstone: DeletedRecord) => {
    if (!canRecover) {
      toast.error('Access denied: you cannot recover records.');
      return;
    }
    if (!tombstone.snapshot) {
      toast.error('Cannot recover: no data snapshot was saved for this record.');
      return;
    }

    const actionType = RESTORE_ACTION_MAP[tombstone.tableName];
    if (!actionType) {
      toast.error(`Recovery not supported for table: ${tombstone.tableName}`);
      return;
    }

    try {
      // 1. Mark tombstone as recovered in local store + cloud
      await recoverRecord(tombstone.tableName, tombstone.id, user?.username || 'admin');

      // 2. Re-dispatch the snapshot back into the store
      dispatch({ type: actionType as any, payload: tombstone.snapshot });

      toast.success(`Record "${tombstone.id}" successfully restored to ${TABLE_LABELS[tombstone.tableName] || tombstone.tableName}.`);
      refresh();
    } catch (err) {
      console.error('Recovery failed:', err);
      toast.error('Recovery failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <History className="h-7 w-7 text-amber-600" />
            </div>
            Data Recovery Console
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Admin-only: Review and restore permanently deleted records.
            All actions are logged in the audit trail.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-none bg-red-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Pending Deletion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-700">
              {tombstones.filter(t => !t.recovered).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-emerald-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Recovered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700">
              {tombstones.filter(t => t.recovered).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-slate-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Deletions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-700">{tombstones.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['active', 'recovered', 'all'] as const).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === 'active' ? '🔴 Pending' : f === 'recovered' ? '✅ Recovered' : '📋 All'}
          </Button>
        ))}
      </div>

      {/* Tombstone List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No deleted records found</p>
          <p className="text-sm">All data is intact — no admin deletions have been recorded.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <Card key={`${t.tableName}__${t.id}`} className={`border ${t.recovered ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={t.recovered ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : 'text-red-700 border-red-300 bg-red-50'}>
                        {t.recovered ? '✅ Recovered' : '🔴 Deleted'}
                      </Badge>
                      <Badge variant="secondary" className="font-bold text-xs">
                        {TABLE_LABELS[t.tableName] || t.tableName}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mt-2 font-mono truncate">
                      Record ID: {t.id}
                    </p>
                    {t.snapshot?.productName && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        <strong>Name:</strong> {t.snapshot.productName || t.snapshot.name || '—'}
                      </p>
                    )}
                    {t.snapshot?.batchNumber && (
                      <p className="text-xs text-slate-500">
                        <strong>Batch:</strong> {t.snapshot.batchNumber}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Deleted by: <span className="text-red-500">{t.deletedBy}</span></span>
                      <span>•</span>
                      <span>{new Date(t.deletedAt).toLocaleString()}</span>
                      {t.reason && <><span>•</span><span>{t.reason}</span></>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {!t.recovered && t.snapshot && canRecover && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-xs font-bold"
                        onClick={() => handleRestore(t)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restore Record
                      </Button>
                    )}
                    {!t.snapshot && !t.recovered && (
                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                        <Trash2 className="h-3 w-3" /> No snapshot — permanent loss
                      </span>
                    )}
                    {t.recovered && (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        Record restored to system
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
