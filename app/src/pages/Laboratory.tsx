import { useState, useMemo } from 'react';
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
import { Search, Beaker, FlaskConical, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { generateAnalyticalWorksheet } from '@/lib/coaExport';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useDelete } from '@/hooks/useDelete';
import { DeleteConfirmationDialog } from '@/components/security/DeleteConfirmationDialog';

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
  const { canModify, canDelete, user } = useRoleAccess();
  const { handleDelete } = useDelete();
  const now = useMemo(() => Date.now(), []);
  const [activeTab, setActiveTab] = useState('reagents');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isReagentFormOpen, setIsReagentFormOpen] = useState(false);
  const [isStandardFormOpen, setIsStandardFormOpen] = useState(false);
  const [reagentGrade, setReagentGrade] = useState('');
  const [reagentUnit, setReagentUnit] = useState('');
  
  // Reagent Registration Form States
  const [reagentName, setReagentName] = useState('');
  const [reagentCas, setReagentCas] = useState('');
  const [reagentManufacturer, setReagentManufacturer] = useState('');
  const [reagentQuantity, setReagentQuantity] = useState('');
  const [reagentExpiry, setReagentExpiry] = useState('');

  // Reference Standard Registration Form States
  const [stdName, setStdName] = useState('');
  const [stdLot, setStdLot] = useState('');
  const [stdPurity, setStdPurity] = useState('');
  const [stdExpiry, setStdExpiry] = useState('');

  // Edit / Delete State
  const [editingReagent, setEditingReagent] = useState<any>(null);
  const [editingStandard, setEditingStandard] = useState<any>(null);
  
  const [isReagentDeleteDialogOpen, setIsReagentDeleteDialogOpen] = useState(false);
  const [selectedReagentToDelete, setSelectedReagentToDelete] = useState<any>(null);

  const [isStandardDeleteDialogOpen, setIsStandardDeleteDialogOpen] = useState(false);
  const [selectedStandardToDelete, setSelectedStandardToDelete] = useState<any>(null);

  const handleEditReagentClick = (reagent: any) => {
    setEditingReagent(reagent);
    setReagentName(reagent.name);
    setReagentCas(reagent.casNumber || '');
    setReagentGrade(reagent.grade);
    setReagentManufacturer(reagent.manufacturer || reagent.supplier || '');
    setReagentQuantity(String(reagent.quantity));
    setReagentUnit(reagent.unit);
    const dateStr = typeof reagent.expiryDate === 'string' 
      ? reagent.expiryDate.split('T')[0]
      : new Date(reagent.expiryDate).toISOString().split('T')[0];
    setReagentExpiry(dateStr);
    setIsReagentFormOpen(true);
  };

  const handleEditStandardClick = (std: any) => {
    setEditingStandard(std);
    setStdName(std.name);
    setStdLot(std.lotNumber);
    setStdPurity(std.purity ? String(std.purity) : '');
    const dateStr = typeof std.expiryDate === 'string'
      ? std.expiryDate.split('T')[0]
      : new Date(std.expiryDate).toISOString().split('T')[0];
    setStdExpiry(dateStr);
    setIsStandardFormOpen(true);
  };

  const handleCloseReagentForm = () => {
    setIsReagentFormOpen(false);
    setEditingReagent(null);
    setReagentName('');
    setReagentCas('');
    setReagentGrade('');
    setReagentManufacturer('');
    setReagentQuantity('');
    setReagentUnit('');
    setReagentExpiry('');
  };

  const handleCloseStandardForm = () => {
    setIsStandardFormOpen(false);
    setEditingStandard(null);
    setStdName('');
    setStdLot('');
    setStdPurity('');
    setStdExpiry('');
  };

  const confirmDeleteReagent = async (reason: string) => {
    if (!selectedReagentToDelete) return;
    const success = await handleDelete(
      'chemicalReagents',
      selectedReagentToDelete.id,
      selectedReagentToDelete.name,
      () => {
        dispatch({ type: 'DELETE_CHEMICAL_REAGENT', payload: selectedReagentToDelete.id });
        dispatch({
          type: 'ADD_ACTIVITY',
          payload: {
            id: crypto.randomUUID(),
            type: 'Product_Updated',
            description: `[DELETE] Reagent: "${selectedReagentToDelete.name}" by ${user?.username || 'admin'}. Reason: ${reason}`,
            user: user?.name || 'Unknown',
            timestamp: new Date(),
          },
        });
      },
      reason
    );
    if (success) {
      setSelectedReagentToDelete(null);
      setIsReagentDeleteDialogOpen(false);
    }
  };

  const confirmDeleteStandard = async (reason: string) => {
    if (!selectedStandardToDelete) return;
    const success = await handleDelete(
      'referenceStandards',
      selectedStandardToDelete.id,
      selectedStandardToDelete.name,
      () => {
        dispatch({ type: 'DELETE_REFERENCE_STANDARD', payload: selectedStandardToDelete.id });
        dispatch({
          type: 'ADD_ACTIVITY',
          payload: {
            id: crypto.randomUUID(),
            type: 'Product_Updated',
            description: `[DELETE] Reference Standard: "${selectedStandardToDelete.name}" by ${user?.username || 'admin'}. Reason: ${reason}`,
            user: user?.name || 'Unknown',
            timestamp: new Date(),
          },
        });
      },
      reason
    );
    if (success) {
      setSelectedStandardToDelete(null);
      setIsStandardDeleteDialogOpen(false);
    }
  };

  const handleSaveStandard = () => {
    if (!stdName.trim()) {
      toast.error('Standard Name is required');
      return;
    }
    if (!stdLot.trim()) {
      toast.error('Lot Number is required');
      return;
    }
    if (!stdExpiry) {
      toast.error('Expiry Date is required');
      return;
    }
    const purity = parseFloat(stdPurity);
    const expiryDate = new Date(stdExpiry);
    const status = expiryDate.getTime() < Date.now() ? 'Expired' : 'Active';

    if (editingStandard) {
      const updated = {
        ...editingStandard,
        name: stdName.trim(),
        lotNumber: stdLot.trim(),
        purity: isNaN(purity) ? undefined : purity,
        expiryDate,
        status,
      };
      dispatch({ type: 'UPDATE_REFERENCE_STANDARD', payload: updated as any });
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: crypto.randomUUID(),
          type: 'Product_Updated',
          description: `[EDIT] Reference Standard: "${updated.name}" updated by ${user?.username || 'admin'}`,
          user: user?.name || 'Unknown',
          timestamp: new Date(),
        },
      });
      toast.success(`Standard updated: ${updated.name}`);
    } else {
      const newStandard = {
        id: `std-${Math.random().toString(36).substring(2, 9)}`,
        name: stdName.trim(),
        lotNumber: stdLot.trim(),
        purity: isNaN(purity) ? undefined : purity,
        expiryDate,
        dateReceived: new Date(),
        storageConditions: 'Refrigerated 2-8°C',
        status
      };
      dispatch({ type: 'ADD_REFERENCE_STANDARD', payload: newStandard as any });
      toast.success(`Successfully registered standard: ${newStandard.name}`);
    }

    handleCloseStandardForm();
  };

  const handleSaveReagent = () => {
    if (!reagentName.trim()) {
      toast.error('Reagent Name is required');
      return;
    }
    if (!reagentExpiry) {
      toast.error('Expiry Date is required');
      return;
    }
    const qty = parseFloat(reagentQuantity);
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid net quantity (0 or greater)');
      return;
    }

    const expiryDateObj = new Date(reagentExpiry);
    const isExpired = expiryDateObj.getTime() < Date.now();
    let status: 'Available' | 'Low_Stock' | 'Expired' | 'Depleted' = 'Available';

    if (qty === 0) {
      status = 'Depleted';
    } else if (isExpired) {
      status = 'Expired';
    } else if (qty < 5) {
      status = 'Low_Stock';
    }

    if (editingReagent) {
      // UPDATE existing reagent
      const updated = {
        ...editingReagent,
        name: reagentName.trim(),
        casNumber: reagentCas.trim() || undefined,
        grade: (reagentGrade || 'Reagent') as any,
        manufacturer: reagentManufacturer.trim() || editingReagent.manufacturer,
        supplier: reagentManufacturer.trim() || editingReagent.supplier,
        quantity: qty,
        unit: reagentUnit || editingReagent.unit,
        expiryDate: expiryDateObj,
        status,
      };
      dispatch({ type: 'UPDATE_CHEMICAL_REAGENT', payload: updated });
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: crypto.randomUUID(),
          type: 'Product_Updated',
          description: `[EDIT] Reagent: "${updated.name}" updated by ${user?.username || 'admin'}`,
          user: user?.name || 'Unknown',
          timestamp: new Date(),
        },
      });
      toast.success(`Reagent updated: ${updated.name}`);
    } else {
      // ADD new reagent
      const newReagent = {
        id: `reagent-${Math.random().toString(36).substring(2, 9)}`,
        name: reagentName.trim(),
        casNumber: reagentCas.trim() || undefined,
        grade: (reagentGrade || 'Reagent') as any,
        manufacturer: reagentManufacturer.trim() || 'Merck',
        supplier: reagentManufacturer.trim() || 'Merck',
        batchNumber: `BAT-${Math.floor(100000 + Math.random() * 900000)}`,
        quantity: qty,
        unit: reagentUnit || 'bottle',
        storageConditions: 'Room Temperature (20-25°C)',
        expiryDate: expiryDateObj,
        dateReceived: new Date(),
        location: 'Lab Shelf B',
        safetyInfo: { hazardStatements: [], precautionaryStatements: [] },
        status
      };
      dispatch({ type: 'ADD_CHEMICAL_REAGENT', payload: newReagent });
      toast.success(`Successfully registered reagent: ${newReagent.name}`);
    }

    handleCloseReagentForm();
  };

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReagents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 text-slate-400 italic">
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canModify && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                                onClick={() => handleEditReagentClick(reagent)}
                                title="Edit Reagent"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-500 hover:text-red-600"
                                onClick={() => {
                                  setSelectedReagentToDelete(reagent);
                                  setIsReagentDeleteDialogOpen(true);
                                }}
                                title="Delete Reagent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStandards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
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
                            {typeof std.expiryDate === 'object' ? (std.expiryDate as any).toLocaleDateString('en-GB') : new Date(std.expiryDate).toLocaleDateString('en-GB')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={std.status === 'Active' ? 'default' : 'destructive'} className="bg-indigo-100 text-indigo-800 border-none">
                            {std.status === 'Active' ? 'Active' : 'Expired'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canModify && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                                onClick={() => handleEditStandardClick(std)}
                                title="Edit Standard"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-500 hover:text-red-600"
                                onClick={() => {
                                  setSelectedStandardToDelete(std);
                                  setIsStandardDeleteDialogOpen(true);
                                }}
                                title="Delete Standard"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
                            <td className="p-2 font-medium text-slate-700">{test.name}</td>
                            <td className="p-2 text-slate-500">{test.spec}</td>
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
                        onClick={() => {
                          generateAnalyticalWorksheet(material as any);
                          toast.info('Worksheet generated successfully');
                        }}
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
      <Dialog open={isReagentFormOpen} onOpenChange={(open) => { if (!open) handleCloseReagentForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">
              {editingReagent ? 'Edit Reagent' : 'Register New Reagent'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reagent Name *</Label>
                <Input
                  placeholder="e.g. Acetonitrile HPLC Grade"
                  value={reagentName}
                  onChange={(e) => setReagentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>CAS Number Identification</Label>
                <Input
                  placeholder="e.g. 75-05-8"
                  value={reagentCas}
                  onChange={(e) => setReagentCas(e.target.value)}
                />
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
                <Input
                  placeholder="e.g. Merck / Sigma"
                  value={reagentManufacturer}
                  onChange={(e) => setReagentManufacturer(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Net Quantity</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={reagentQuantity}
                  onChange={(e) => setReagentQuantity(e.target.value)}
                />
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
                <Input
                  type="date"
                  value={reagentExpiry}
                  onChange={(e) => setReagentExpiry(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6 mt-4 border-t">
            <Button variant="outline" onClick={handleCloseReagentForm}>Cancel</Button>
            <Button onClick={handleSaveReagent} className="bg-indigo-600 px-8">
              {editingReagent ? 'Update Reagent' : 'Save Inventory'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reference Standard Form Dialog */}
      <Dialog open={isStandardFormOpen} onOpenChange={(open) => { if (!open) handleCloseStandardForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">
              {editingStandard ? 'Edit Reference Standard' : 'Register Reference Standard'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Standard Name *</Label>
                <Input
                  placeholder="e.g. Paracetamol Reference Standard"
                  value={stdName}
                  onChange={(e) => setStdName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Lot Number *</Label>
                <Input
                  placeholder="e.g. LOT-12345"
                  value={stdLot}
                  onChange={(e) => setStdLot(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purity/Potency (%)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 99.8"
                  value={stdPurity}
                  onChange={(e) => setStdPurity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Input
                  type="date"
                  value={stdExpiry}
                  onChange={(e) => setStdExpiry(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6 mt-4 border-t">
            <Button variant="outline" onClick={handleCloseStandardForm}>Cancel</Button>
            <Button onClick={handleSaveStandard} className="bg-indigo-600 px-8">
              {editingStandard ? 'Update Standard' : 'Save Standard'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Reagent Confirmation */}
      <DeleteConfirmationDialog
        open={isReagentDeleteDialogOpen}
        onClose={() => setIsReagentDeleteDialogOpen(false)}
        onConfirm={confirmDeleteReagent}
        recordLabel={selectedReagentToDelete?.name || ''}
        tableName="chemicalReagents"
      />

      {/* Delete Standard Confirmation */}
      <DeleteConfirmationDialog
        open={isStandardDeleteDialogOpen}
        onClose={() => setIsStandardDeleteDialogOpen(false)}
        onConfirm={confirmDeleteStandard}
        recordLabel={selectedStandardToDelete?.name || ''}
        tableName="referenceStandards"
      />
    </div>
  );
}
