import { useState, useRef } from 'react';
import { useStore } from '@/hooks/useStore';
import { cn } from '@/lib/utils';
import type { IPQCCheck } from '@/types';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Factory,
  FileText,
  Printer,
} from 'lucide-react';
import { masterFormulas } from '@/data/mfrData';
import { useReactToPrint } from 'react-to-print';


const stageLabels: Record<string, string> = {
  Dispensing: 'Dispensing',
  Mixing: 'Mixing / Blending',
  Granulation: 'Granulation',
  Drying: 'Drying',
  Sifting: 'Sifting / Milling',
  Compression: 'Compression',
  Coating: 'Coating',
  Packaging: 'Packaging / Secondary',
};

// Comprehensive IPQC Test Matrix
const ipqcTestMatrix = [
  // Granulation & Powder Stages
  { test: 'Bulk Density', category: 'Physical', spec: '0.4 - 0.6 g/mL', sampleSize: 2, labels: ['Mass (g)', 'Bulk Vol (mL)'], type: 'ratio', forms: ['Powder', 'Granulation', 'Tablet', 'Capsule'] },
  { test: 'Tapped Density', category: 'Physical', spec: '0.5 - 0.7 g/mL', sampleSize: 2, labels: ['Mass (g)', 'Tapped Vol (mL)'], type: 'ratio', forms: ['Powder', 'Granulation', 'Tablet', 'Capsule'] },
  { test: 'Hausner Ratio', category: 'Flowability', spec: '1.00 - 1.11', sampleSize: 2, labels: ['Tapped Density', 'Bulk Density'], type: 'hausner', forms: ['Powder', 'Granulation', 'Tablet', 'Capsule'] },
  { test: 'Carr\'s Index', category: 'Flowability', spec: 'NMT 15%', sampleSize: 2, labels: ['Tapped Density', 'Bulk Density'], type: 'carrs', forms: ['Powder', 'Granulation', 'Tablet', 'Capsule'] },
  { test: 'Angle of Repose', category: 'Flowability', spec: '25° - 35°', sampleSize: 2, labels: ['Height (cm)', 'Radius (cm)'], type: 'angle', forms: ['Powder', 'Granulation', 'Tablet', 'Capsule'] },
  { test: 'Moisture Content (LOD)', category: 'Chemical', spec: 'NMT 2.0%', sampleSize: 2, labels: ['Initial Wt', 'Final Wt'], type: 'lod', forms: ['Powder', 'Granulation', 'Tablet', 'Capsule'] },
  { test: 'Sieve Analysis', category: 'Physical', spec: 'Complies with MFR', sampleSize: 1, forms: ['Granulation', 'Tablet', 'Capsule'] },

  // Compression & Encapsulation Stages
  { test: 'Average Weight', category: 'Weight Control', spec: 'Target ± 5%', sampleSize: 20, type: 'avg', forms: ['Tablet', 'Capsule'] },
  { test: 'Weight Variation', category: 'Statistical', spec: 'Complies BP/USP', sampleSize: 20, type: 'avg', forms: ['Tablet', 'Capsule'] },
  { test: 'Hardness', category: 'Physical', spec: '5.0 - 15.0 kp', sampleSize: 10, type: 'avg', forms: ['Tablet'] },
  { test: 'Friability', category: 'Physical', spec: 'NMT 1.0%', sampleSize: 10, labels: ['Initial Wt', 'Final Wt'], type: 'friability', forms: ['Tablet'] },
  { test: 'Thickness', category: 'Physical', spec: 'Target ± 0.2mm', sampleSize: 10, type: 'avg', forms: ['Tablet'] },
  { test: 'Diameter', category: 'Physical', spec: 'Target ± 0.1mm', sampleSize: 5, type: 'avg', forms: ['Tablet'] },
  { test: 'Disintegration Time', category: 'Physical', spec: 'NMT 15 min', sampleSize: 6, type: 'avg', forms: ['Tablet', 'Capsule'] },

  // Packaging & Liquids
  { test: 'Fill Volume', category: 'Physical', spec: 'Target ± 2%', sampleSize: 10, type: 'avg', forms: ['Liquid'] },
  { test: 'Specific Gravity', category: 'Physical', spec: '1.0 - 1.2 g/mL', sampleSize: 2, labels: ['Liquid Mass', 'Water Mass'], type: 'ratio', forms: ['Liquid'] },
  { test: 'pH Value', category: 'Chemical', spec: 'As per Monograph', sampleSize: 1, forms: ['Liquid', 'Powder'] },
  { test: 'Leak Test', category: 'Packaging', spec: 'Zero Leakage', sampleSize: 10, forms: ['Tablet', 'Capsule', 'Liquid'] },
  { test: 'Appearance', category: 'Identity', spec: 'Standard Texture', sampleSize: 1, forms: ['Tablet', 'Capsule', 'Liquid', 'Powder'] },
];

export function IPQCPage() {
  const { state, dispatch } = useStore();
  const checks = state.ipqcChecks || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedBatchForReport, setSelectedBatchForReport] = useState<string>('');

  const [newCheck, setNewCheck] = useState<Partial<IPQCCheck>>({
    status: 'Pass',
    stage: 'Mixing',
    dosageForm: 'Tablet',
    samples: []
  });

  const [sampleInputs, setSampleInputs] = useState<string[]>([]);

  const calculateResults = (samples: number[]) => {
    if (samples.length === 0) return '0';
    const test = ipqcTestMatrix.find(t => t.test === newCheck.checkType);
    if (!test) return (samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(3);

    const s = samples;
    switch (test.type) {
      case 'ratio': // Density (Mass / Volume)
        return s[1] ? (s[0] / s[1]).toFixed(3) : '0';
      case 'hausner': // Tapped / Bulk
        return s[1] ? (s[0] / s[1]).toFixed(2) : '0';
      case 'carrs': // 100 * (Tapped - Bulk) / Tapped
        return s[0] ? (100 * (s[0] - s[1]) / s[0]).toFixed(2) + '%' : '0%';
      case 'angle': // tan(theta) = h/r
        return s[1] ? (Math.atan(s[0] / s[1]) * (180 / Math.PI)).toFixed(1) + '°' : '0°';
      case 'lod': // 100 * (Initial - Final) / Initial
        return s[0] ? (100 * (s[0] - s[1]) / s[0]).toFixed(2) + '%' : '0%';
      case 'friability': // 100 * (Initial - Final) / Initial
        return s[0] ? (100 * (s[0] - s[1]) / s[0]).toFixed(3) + '%' : '0%';
      case 'avg':
      default:
        return (samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(3);
    }
  };

  const reportRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
  });

  const handleSave = () => {
    if (!newCheck.batchNumber || !newCheck.productName || !newCheck.checkType || !newCheck.result) {
      alert('Please fill all required fields');
      return;
    }

    const check: IPQCCheck = {
      id: Math.random().toString(36).substr(2, 9),
      batchNumber: newCheck.batchNumber!.toUpperCase(),
      productName: newCheck.productName!,
      dosageForm: newCheck.dosageForm || 'Tablet',
      stage: (newCheck.stage as any) || 'Mixing',
      checkType: newCheck.checkType!,
      parameter: newCheck.parameter || newCheck.checkType!,
      specification: newCheck.specification || 'N/A',
      result: newCheck.result || calculateResults(sampleInputs.map(Number).filter(v => !isNaN(v))),
      samples: sampleInputs.map(Number).filter(v => !isNaN(v)),
      status: (newCheck.status as any) || 'Pass',
      checkedBy: newCheck.checkedBy || 'QA Inspector',
      reviewedBy: newCheck.reviewedBy,
      checkedAt: new Date(),
      notes: newCheck.notes,
    };

    dispatch({ type: 'ADD_IPQC_CHECK', payload: check });
    dispatch({
      type: 'ADD_ACTIVITY', payload: {
        id: Math.random().toString(36).substr(2, 9),
        type: 'Test_Completed',
        description: `IPQC Check completed for Batch ${check.batchNumber} (${check.checkType})`,
        user: check.checkedBy,
        timestamp: new Date(),
        relatedId: check.id
      }
    });
    setIsFormOpen(false);
    setNewCheck({ status: 'Pass', stage: 'Mixing', dosageForm: 'Tablet', samples: [] });
    setSampleInputs([]);
  };

  const filteredChecks = checks.filter((check: IPQCCheck) => {
    const matchesSearch =
      check.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.checkType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || check.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const uniqueBatches = Array.from(new Set(checks.map(c => c.batchNumber)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Factory className="h-8 w-8 text-indigo-600" />
            IN-PROCESS QUALITY CONTROL (IPQC)
          </h1>
          <p className="text-slate-500 mt-1">Real-time Batch Monitoring during Manufacturing Stages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsReportOpen(true)} className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
            <FileText className="h-4 w-4" />
            Batch Stage Summary
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md">
            <Plus className="h-4 w-4" />
            Add IPQC Check
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-indigo-50/50 border-indigo-100 shadow-sm"><CardHeader className="pb-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Recorded Tests</CardHeader><CardContent><div className="text-4xl font-black text-indigo-900">{checks.length}</div></CardContent></Card>
        <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm"><CardHeader className="pb-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Quality Compliance</CardHeader><CardContent><div className="text-4xl font-black text-emerald-700">{checks.length > 0 ? Math.round((checks.filter(c => c.status === 'Pass').length / checks.length) * 100) : 100}%</div></CardContent></Card>
        <Card className="bg-blue-50/50 border-blue-100 shadow-sm"><CardHeader className="pb-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider">Active Batch Pool</CardHeader><CardContent><div className="text-4xl font-black text-blue-900">{uniqueBatches.length}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search batch, product or test..." className="pl-9 ring-0 focus-visible:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[200px] border-slate-200"><SelectValue placeholder="Processing Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Manufacturing Stages</SelectItem>
            {Object.entries(stageLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="border rounded-xl bg-white overflow-hidden shadow-md">
        <Table>
          <TableHeader className="bg-slate-50 border-b">
            <TableRow>
              <TableHead className="font-bold text-indigo-900">Batch #</TableHead>
              <TableHead className="font-bold text-indigo-900">Stage</TableHead>
              <TableHead className="font-bold text-indigo-900">Product (Bulk/Intermediate)</TableHead>
              <TableHead className="font-bold text-indigo-900">Test Parameter</TableHead>
              <TableHead className="font-bold text-center text-indigo-900">Result vs Specification</TableHead>
              <TableHead className="font-bold text-right text-indigo-900">Compliance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChecks.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 italic">No IPQC entries matched your criteria.</TableCell></TableRow>
            ) : (
              filteredChecks.map((check: IPQCCheck) => (
                <TableRow key={check.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-black font-mono text-slate-900">{check.batchNumber}</TableCell>
                  <TableCell><Badge variant="outline" className="bg-slate-50 text-[10px] font-bold">{check.stage}</Badge></TableCell>
                  <TableCell className="font-bold text-slate-700">{check.productName}</TableCell>
                  <TableCell>
                    <div className="font-bold text-indigo-900">{check.checkType}</div>
                    <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">{check.parameter}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-black text-slate-900 text-lg">
                      {check.result}
                      {check.samples && check.samples.length > 0 && (
                        <span className="text-[9px] text-indigo-400 block font-bold uppercase">Avg (n={check.samples.length})</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Std: {check.specification}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={cn("px-3 py-1 text-xs font-bold shadow-sm", check.status === 'Pass' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-red-500 text-white hover:bg-red-600')}>
                      {check.status === 'Pass' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {check.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Entry Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(v) => { setIsFormOpen(v); if (!v) { setNewCheck({ status: 'Pass', stage: 'Mixing', dosageForm: 'Tablet' }); setSampleInputs([]); } }}>
        <DialogContent className="max-w-3xl border-indigo-100 overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-2xl font-black text-indigo-900 tracking-tight text-center">GMP IN-PROCESS DATA ENTRY</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Batch Number *</Label>
                <Input placeholder="BN-000" className="uppercase font-bold" value={newCheck.batchNumber || ''} onChange={e => setNewCheck({ ...newCheck, batchNumber: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Dosage Form</Label>
                <Select value={newCheck.dosageForm} onValueChange={(val) => setNewCheck({ ...newCheck, dosageForm: val as any, checkType: undefined })}>
                  <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Capsule">Capsule</SelectItem>
                    <SelectItem value="Liquid">Liquid / Syrup</SelectItem>
                    <SelectItem value="Powder">Granules / Powder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">MFR Reference</Label>
                <Select value={newCheck.productName} onValueChange={(val) => setNewCheck({ ...newCheck, productName: val })}>
                  <SelectTrigger className="font-bold text-indigo-900"><SelectValue placeholder="Select Product..." /></SelectTrigger>
                  <SelectContent>
                    {Object.values(masterFormulas).map(m => <SelectItem key={m.id} value={m.productName} className="font-bold">{m.productName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Stage</Label>
                <Select value={newCheck.stage} onValueChange={(val) => setNewCheck({ ...newCheck, stage: val as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(stageLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    <SelectItem value="Filling">Filling / Tube Filling</SelectItem>
                    <SelectItem value="Sealing">Sealing / Induction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">IPQC Test Type</Label>
                  <Select value={newCheck.checkType} onValueChange={(val) => {
                    const t = ipqcTestMatrix.find(x => x.test === val);
                    if (t) {
                      setNewCheck({ ...newCheck, checkType: t.test, parameter: t.category, specification: t.spec });
                      setSampleInputs(new Array(t.sampleSize).fill(''));
                    }
                  }}>
                    <SelectTrigger className="font-bold border-indigo-200"><SelectValue placeholder="Select Test..." /></SelectTrigger>
                    <SelectContent>
                      {ipqcTestMatrix.filter(t => t.forms.includes(newCheck.dosageForm || 'Tablet')).map(t => (
                        <SelectItem key={t.test} value={t.test}>{t.test}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Control Specification</Label>
                  <Input disabled value={newCheck.specification || ''} className="bg-slate-50 font-medium" />
                </div>
              </div>

              {sampleInputs.length > 0 && (
                <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-[10px] font-black uppercase text-indigo-600">Sample Data Entry ({sampleInputs.length} Units)</Label>
                    <div className="text-[10px] font-bold bg-white px-2 py-1 rounded border shadow-sm">
                      Avg: <span className="text-indigo-700">{calculateResults(sampleInputs.map(Number).filter(v => !isNaN(v)))}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {sampleInputs.map((val, idx) => {
                      const test = ipqcTestMatrix.find(t => t.test === newCheck.checkType);
                      const label = test?.labels?.[idx] || `#${idx + 1}`;
                      return (
                        <div key={idx} className="space-y-1">
                          <Label className="text-[8px] font-bold text-slate-400 block truncate">{label}</Label>
                          <Input
                            placeholder={`#${idx + 1}`}
                            className="h-8 text-xs font-bold text-center"
                            value={val}
                            onChange={e => {
                              const next = [...sampleInputs];
                              next[idx] = e.target.value;
                              setSampleInputs(next);
                              setNewCheck({ ...newCheck, result: calculateResults(next.map(Number).filter(v => !isNaN(v))) });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 overflow-visible">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Final Result / Remarks</Label>
                  <Input
                    placeholder="Enter result..."
                    className="font-black text-lg h-12 border-indigo-300"
                    value={newCheck.result || ''}
                    onChange={e => setNewCheck({ ...newCheck, result: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Compliance Decision</Label>
                  <Select value={newCheck.status} onValueChange={(val) => setNewCheck({ ...newCheck, status: val as any })}>
                    <SelectTrigger className={cn("h-12 font-black text-lg", newCheck.status === 'Pass' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]" position="item-aligned">
                      <SelectItem value="Pass" className="font-bold text-emerald-600">COMPLIES (PASS)</SelectItem>
                      <SelectItem value="Fail" className="font-bold text-red-600">NON-COMPLIANCE (FAIL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Analyst Mark</Label>
              <Input placeholder="Signature Name" className="font-medium" value={newCheck.checkedBy || ''} onChange={e => setNewCheck({ ...newCheck, checkedBy: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-4 border-t gap-3 rounded-b-lg">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="font-bold">Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 px-10 font-bold shadow-lg shadow-indigo-200">Submit GMP Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Batch Stage Summary Report</DialogTitle>
            <div className="flex gap-2">
              <Select value={selectedBatchForReport} onValueChange={setSelectedBatchForReport}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Select Batch to Review..." /></SelectTrigger>
                <SelectContent>
                  {uniqueBatches.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => handlePrint()} disabled={!selectedBatchForReport} variant="default" className="gap-2 bg-indigo-600 text-white">
                <Printer className="h-4 w-4" /> Print Dossier
              </Button>
            </div>
          </DialogHeader>

          {!selectedBatchForReport ? (
            <div className="py-20 text-center text-slate-400 font-medium border-2 border-dashed rounded-xl mt-4">
              Select a Batch Number above to compile the IPQC Report.
            </div>
          ) : (
            <div ref={reportRef} className="bg-white p-10 border rounded shadow-sm mt-4 print:shadow-none">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">IPQC Batch Dossier</h2>
                  <div className="flex gap-4 mt-2">
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase">Batch Number:</span><div className="font-black text-xl">{selectedBatchForReport}</div></div>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase">Product:</span><div className="font-black text-xl text-indigo-700">{checks.find(c => c.batchNumber === selectedBatchForReport)?.productName}</div></div>
                  </div>
                </div>
              </div>

              {Object.keys(stageLabels).map((stage: string) => {
                const testsInStage = checks.filter((c: IPQCCheck) => c.batchNumber === selectedBatchForReport && c.stage === stage);
                if (testsInStage.length === 0) return null;
                return (
                  <div key={stage} className="mb-10">
                    <h3 className="bg-slate-100 px-4 py-2 font-black text-slate-700 text-sm mb-4 border-l-4 border-slate-900 uppercase">{stage} Stage Control</h3>
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold text-[10px]">Test Parameter</TableHead>
                          <TableHead className="font-bold text-[10px]">Specification</TableHead>
                          <TableHead className="font-bold text-[10px]">Actual Result</TableHead>
                          <TableHead className="font-bold text-[10px]">Decision</TableHead>
                          <TableHead className="font-bold text-[10px]">Analyst</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testsInStage.map((test: IPQCCheck) => (
                          <TableRow key={test.id}>
                            <TableCell className="font-bold py-3 text-sm">{test.checkType}</TableCell>
                            <TableCell className="text-xs text-slate-500">{test.specification}</TableCell>
                            <TableCell className="font-black text-slate-900">
                              {test.result}
                              {test.samples && test.samples.length > 0 && (
                                <span className="text-[9px] text-slate-400 block font-normal">
                                  Avg of {test.samples.length} units
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={cn("font-black text-[10px] px-2 py-0.5 rounded", test.status === 'Pass' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50')}>
                                {test.status.toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-400">{test.checkedBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}

              <div className="mt-20 flex justify-between pt-10 border-t border-slate-200">
                <div className="text-center">
                  <div className="w-40 border-b border-slate-900 mb-2"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Production Supervisor</span>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-900 mb-2"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">QA Assurance Officer</span>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-900 mb-2"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">QA Manager Approval</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

