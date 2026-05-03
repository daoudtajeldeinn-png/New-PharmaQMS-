import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { toast, Toaster } from 'sonner';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Search, Beaker, FlaskConical, AlertTriangle } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

const reagentStatusColors = {
  Available: 'bg-green-100 text-green-800 border-green-300',
  Low_Stock: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Expired: 'bg-red-100 text-red-800 border-red-300',
  Depleted: 'bg-gray-100 text-gray-800 border-gray-300',
};

const reagentStatusLabels = {
  Available: 'Available',
  Low_Stock: 'Low Stock',
  Expired: 'Expired',
  Depleted: 'Depleted',
};

const gradeLabels: Record<string, string> = {
  ACS: 'ACS Grade',
  Reagent: 'Reagent Grade',
  Pharmaceutical: 'Pharmaceutical Grade',
  HPLC: 'HPLC Grade',
  GC: 'GC Grade',
  Spectrophotometric: 'Spectrophotometric Grade',
};

export function LaboratoryPage() {
  const { state, dispatch } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync tab with URL
  const getTabFromPath = () => {
    const path = location.pathname.split('/').pop();
    if (['reagents', 'standards', 'lab_operation'].includes(path || '')) {
      return path || 'reagents';
    }
    return 'reagents';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  useEffect(() => {
    const tab = getTabFromPath();
    setActiveTab(tab);
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Note: sidebar paths for lab are /lab/reagents and /lab/standards. 
    // lab_operation is a tab inside lab.
    navigate(`/lab/${value}`);
  };

  const now = useMemo(() => Date.now(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isReagentFormOpen, setIsReagentFormOpen] = useState(false);
  const [, setIsStandardFormOpen] = useState(false);
  const [reagentGrade, setReagentGrade] = useState('');
  const [reagentUnit, setReagentUnit] = useState('');

  const gradeOptions = [
    { value: 'ACS', label: 'ACS Grade' },
    { value: 'Reagent', label: 'Standard Reagent' },
    { value: 'Pharmaceutical', label: 'Pharmaceutical Grade' },
    { value: 'HPLC', label: 'HPLC Phase' },
    { value: 'GC', label: 'GC Specialized' },
    { value: 'Spectrophotometric', label: 'Spectrophotometric' },
  ];

  const unitOptions = [
    { value: 'L', label: 'Liters (L)' },
    { value: 'mL', label: 'Milliliters (mL)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'bottle', label: 'Original Bottle' },
  ];

  const filteredReagents = state.chemicalReagents.filter((reagent) => {
    const matchesSearch =
      reagent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reagent.casNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reagent.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || reagent.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredStandards = state.referenceStandards.filter((std) => {
    const matchesSearch =
      std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.lotNumber.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getExpiryStatus = (expiryDate: Date) => {
    const daysUntil = Math.ceil((new Date(expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return { label: 'Expired', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (daysUntil <= 30) return { label: `${daysUntil} days`, color: 'text-red-600', bgColor: 'bg-red-50' };
    if (daysUntil <= 90) return { label: `${daysUntil} days`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { label: `${daysUntil} days`, color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const handleUpdateTestResult = (materialId: string, testId: string, updates: any) => {
    const material = state.rawMaterials.find(m => m.id === materialId);
    if (!material) return;

    const updatedTests = (material.tests || []).map(t =>
      t.id === testId ? { ...t, ...updates, testedBy: 'Current User', testedAt: new Date() } : t
    );

    dispatch({
      type: 'UPDATE_RAW_MATERIAL',
      payload: { ...material, tests: updatedTests }
    });

    toast.success('Test status updated');
  };

  const handleReleaseMaterial = (materialId: string) => {
    const material = state.rawMaterials.find(m => m.id === materialId);
    if (!material) return;

    const allPassed = material.tests.every(t => t.status === 'Pass');
    const newStatus = allPassed ? 'Approved' : 'Rejected';

    dispatch({
      type: 'UPDATE_RAW_MATERIAL',
      payload: { ...material, status: newStatus }
    });

    toast.success(`Material ${material.name} ${newStatus.toLowerCase()} successfully`);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Management</h1>
          <p className="text-slate-500">Chemical Reagents & Reference Standards Database</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsReagentFormOpen(true)} variant="outline" className="border-indigo-200 text-indigo-700">
            <Beaker className="mr-2 h-4 w-4" />
            Add Reagent
          </Button>
          <Button onClick={() => setIsStandardFormOpen(true)} className="bg-indigo-600">
            <FlaskConical className="mr-2 h-4 w-4" />
            Add Ref Standard
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
          <TabsTrigger value="reagents">Chemical Reagents</TabsTrigger>
          <TabsTrigger value="standards">Reference Standards</TabsTrigger>
          <TabsTrigger value="lab_operation">Lab Operation</TabsTrigger>
        </TabsList>

        <TabsContent value="reagents" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, batch or CAS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(reagentStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Reagent Name</TableHead>
                  <TableHead className="font-bold text-slate-700">CAS Number</TableHead>
                  <TableHead className="font-bold text-slate-700">Grade</TableHead>
                  <TableHead className="font-bold text-slate-700">Batch #</TableHead>
                  <TableHead className="font-bold text-slate-700">Stock</TableHead>
                  <TableHead className="font-bold text-slate-700">Expiry Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReagents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                      No reagents found matching search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReagents.map((reagent) => {
                    const expiryStatus = getExpiryStatus(reagent.expiryDate);
                    return (
                      <TableRow key={reagent.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reagent.name}</p>
                            <p className="text-sm text-slate-500">{reagent.manufacturer}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{reagent.casNumber || '-'}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{gradeLabels[reagent.grade] || reagent.grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-slate-100 px-2 py-1 text-sm">{reagent.batchNumber}</code>
                        </TableCell>
                        <TableCell>
                          {reagent.quantity} {reagent.unit}
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-sm", expiryStatus.color)}>
                            {expiryStatus.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(reagentStatusColors[reagent.status])}>
                            {reagentStatusLabels[reagent.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Expiring Soon Alert */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-800 text-lg">
                <AlertTriangle className="h-5 w-5" />
                Expiring Reagents (Next 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredReagents
                  .filter(r => {
                    const daysUntil = Math.ceil((new Date(r.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
                    return daysUntil <= 30 && daysUntil >= 0;
                  })
                  .map(reagent => (
                    <div key={reagent.id} className="flex items-center justify-between p-2 bg-white rounded">
                      <span>{reagent.name}</span>
                      <Badge variant="destructive" className="font-mono">
                        {Math.ceil((new Date(reagent.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24))} Days
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standards" className="space-y-4">
          {/* ... existing standards content ... */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search reference standards lot or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Standard Name</TableHead>
                  <TableHead className="font-bold text-slate-700">Lot Number</TableHead>
                  <TableHead className="font-bold text-slate-700">Purity/Potency</TableHead>
                  <TableHead className="font-bold text-slate-700">Receipt Date</TableHead>
                  <TableHead className="font-bold text-slate-700">Expiry Date</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStandards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic">
                      No reference standards recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStandards.map((std) => {
                    const expiryStatus = getExpiryStatus(std.expiryDate);
                    return (
                      <TableRow key={std.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{std.name}</p>
                            <p className="text-sm text-slate-500">{std.storageConditions}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-slate-100 px-2 py-1 text-sm">{std.lotNumber}</code>
                        </TableCell>
                        <TableCell>
                          {std.purity ? `${std.purity}%` : std.potency ? `${std.potency}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(std.dateReceived).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-sm transition-colors", expiryStatus.color)}>
                            {new Date(std.expiryDate).toLocaleDateString('en-GB')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={std.status === 'Active' ? 'default' : 'destructive'} className="bg-indigo-100 text-indigo-800 border-none">
                            {std.status === 'Active' ? 'Active' : 'Expired'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="lab_operation" className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-indigo-600" />
              Laboratory Operations (Analytical Queue)
            </h3>

            <div className="space-y-4">
              {state.rawMaterials.filter(m => m.status === 'Quarantine' || m.status === 'Under_Test').map(material => (
                <Card key={material.id} className="border-indigo-100 overflow-hidden">
                  <div className="bg-indigo-50/50 p-3 border-b border-indigo-100 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900">{material.name}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="text-sm text-slate-600">Batch: {material.batchNumber}</span>
                    </div>
                    <Badge variant="outline" className="bg-white">{material.type}</Badge>
                  </div>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="text-left p-2 font-medium">Test Parameter</th>
                          <th className="text-left p-2 font-medium">Specification</th>
                          <th className="text-left p-2 font-medium">Status</th>
                          <th className="text-center p-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(material.tests || []).map(test => (
                          <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs font-medium border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent"
                                value={test.name}
                                onChange={(e) => handleUpdateTestResult(material.id, test.id, { name: e.target.value })}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent"
                                value={test.spec}
                                onChange={(e) => handleUpdateTestResult(material.id, test.id, { spec: e.target.value })}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                size={1}
                                className="h-8 text-xs w-32"
                                placeholder="Enter Value..."
                                value={test.result || ''}
                                onChange={(e) => handleUpdateTestResult(material.id, test.id, { result: e.target.value })}
                              />
                            </td>
                            <td className="p-2">
                              <Select
                                value={test.status}
                                onValueChange={(v) => handleUpdateTestResult(material.id, test.id, { status: v })}
                              >
                                <SelectTrigger className="h-8 text-xs w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Pass">Pass</SelectItem>
                                  <SelectItem value="Fail">Fail</SelectItem>
                                  <SelectItem value="OOS">OOS</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2 text-center">
                              <Badge
                                variant={test.status === 'Pass' ? 'default' : test.status === 'Pending' ? 'secondary' : 'destructive'}
                                className="text-[10px] py-0 h-5"
                              >
                                {test.status === 'Pass' ? 'Complies' : test.status === 'Pending' ? 'Pending' : 'Fails'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-3 bg-slate-50 border-t flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.info('Logbook generated for this analysis session')}
                      >
                        Print Worksheet
                      </Button>
                      <Button
                        size="sm"
                        className="bg-indigo-600"
                        onClick={() => handleReleaseMaterial(material.id)}
                        disabled={material.tests.some(t => t.status === 'Pending')}
                      >
                        Release Material
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {state.rawMaterials.filter(m => m.status === 'Quarantine' || m.status === 'Under_Test').length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Beaker className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-slate-400">No pending analyses found</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reagent Form Dialog */}
      <Dialog open={isReagentFormOpen} onOpenChange={setIsReagentFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">Register New Reagent</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reagent Name *</Label>
                <Input placeholder="e.g. Acetonitrile HPLC Grade" />
              </div>
              <div className="space-y-2">
                <Label>CAS Number Identification</Label>
                <Input placeholder="e.g. 75-05-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purity Grade</Label>
                <Combobox
                  options={gradeOptions}
                  value={reagentGrade}
                  onValueChange={setReagentGrade}
                  placeholder="Select or type grade"
                  searchPlaceholder="Search or type custom grade..."
                  emptyText="No matching grade"
                  allowCustom={true}
                />
              </div>
              <div className="space-y-2">
                <Label>Manufacturer / Supplier</Label>
                <Input placeholder="e.g. Merck / Sigma" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Net Quantity</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>UOM</Label>
                <Combobox
                  options={unitOptions}
                  value={reagentUnit}
                  onValueChange={setReagentUnit}
                  placeholder="Select or type unit"
                  searchPlaceholder="Search or type custom unit..."
                  emptyText="No matching unit"
                  allowCustom={true}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Input type="date" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6 mt-4 border-t">
            <Button variant="outline" onClick={() => setIsReagentFormOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsReagentFormOpen(false)} className="bg-indigo-600 px-8">Save Inventory</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
