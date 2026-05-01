import { useState, useMemo } from 'react';
import { Package, Plus, FileText, Search, Trash2, PlusCircle, ArrowDownToLine, Beaker, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast, Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStore';
import { MATERIAL_TYPES, PHARMACOPEIA_TESTS } from '@/lib/constants';
import { g1Monographs } from '@/data/g1Data';
import { generateCOA, generateCOAPDF, generateInventoryReportPDF } from '@/lib/coaExport';
import type { RawMaterial, MaterialTest, MaterialMovement } from '@/types';

export default function MaterialInventory() {
  const { state, dispatch } = useStore();
  const materials = state.rawMaterials;
  const [isNewMaterialOpen, setIsNewMaterialOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDispenseDialogOpen, setIsDispenseDialogOpen] = useState(false);
  const [dispenseForm, setDispenseForm] = useState({
    quantity: 0,
    batchId: '', // Link to production batch
    type: 'Dispensing' as MaterialMovement['type'],
    operator: 'Main Store Keeper',
  });

const [materialForm, setMaterialForm] = useState({
    name: '',
    type: 'API' as RawMaterial['type'],
    supplier: '',
    batchNumber: '',
    pharmacopeia: 'BP' as RawMaterial['pharmacopeia'],
    quantity: 0,
    unit: 'kg',
    receivedDate: new Date().toISOString().split('T')[0],
    productionDate: '',
    manufacturingDate: '',
    analysisDate: '',
    analysisNo: '',
    issueDate: '',
    expiryDate: '',
    location: '',
  });

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const typeMatch = filterType === 'all' || m.type === filterType;
      const statusMatch = filterStatus === 'all' || m.status === filterStatus;
      const searchMatch = searchTerm === '' ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && statusMatch && searchMatch;
    });
  }, [materials, filterType, filterStatus, searchTerm]);

  const stats = useMemo(() => ({
    total: materials.length,
    approved: materials.filter(m => m.status === 'Approved').length,
    underTest: materials.filter(m => m.status === 'Under_Test' || m.status === 'Quarantine').length,
    rejected: materials.filter(m => m.status === 'Rejected').length,
  }), [materials]);

  const handleCreateMaterial = () => {
    if (!materialForm.name || !materialForm.batchNumber) {
      toast.error('Please enter material name and batch number');
      return;
    }

    const tests = PHARMACOPEIA_TESTS[materialForm.type].map(test => ({
      ...test,
      result: undefined,
      testedBy: '',
      testedAt: undefined,
      status: 'Pending' as const,
      remarks: '',
    }));

    const newMaterial: RawMaterial = {
      id: `MAT-${Date.now()}`,
      ...materialForm,
      tests,
      status: 'Quarantine',
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_RAW_MATERIAL', payload: newMaterial });
    toast.success(`Registered material: ${materialForm.name} with ${tests.length} tests`);

    setIsNewMaterialOpen(false);
    setMaterialForm({
      name: '',
      type: 'API',
      supplier: '',
      batchNumber: '',
      pharmacopeia: 'BP',
      quantity: 0,
      unit: 'kg',
      receivedDate: new Date().toISOString().split('T')[0],
      productionDate: '',
      manufacturingDate: '',
      analysisDate: '',
      analysisNo: '',
      issueDate: '',
      expiryDate: '',
      location: '',
    });
  };

  const handleUpdateTestResult = (materialId: string, testId: string, updates: Partial<MaterialTest>) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const updatedTests = material.tests.map(t =>
      t.id === testId ? { ...t, ...updates, testedAt: new Date(), testedBy: 'Chief Analyst' } : t
    );

    const allCompleted = updatedTests.every(t => t.status !== 'Pending');
    const hasFailed = updatedTests.some(t => t.status === 'Fail' || t.status === 'OOS');

    let newStatus = material.status;
    if (allCompleted) {
      newStatus = hasFailed ? 'Rejected' : 'Approved';
    }

    const updatedMaterial = {
      ...material,
      tests: updatedTests,
      status: newStatus,
    };

    dispatch({ type: 'UPDATE_RAW_MATERIAL', payload: updatedMaterial });

    if (selectedMaterial && selectedMaterial.id === materialId) {
      setSelectedMaterial(updatedMaterial);
    }
    toast.success('Test result updated');
  };

  const handleAddTest = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const newTest: MaterialTest = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Test',
      spec: '98.0-102.0%',
      type: 'quantitative',
      method: 'HPLC',
      status: 'Pending',
      result: ''
    };

    const updatedMaterial = {
      ...material,
      tests: [...material.tests, newTest]
    };

    dispatch({ type: 'UPDATE_RAW_MATERIAL', payload: updatedMaterial });
    if (selectedMaterial && selectedMaterial.id === materialId) setSelectedMaterial(updatedMaterial);
  };

  const handleDeleteTest = (materialId: string, testId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const updatedMaterial = {
      ...material,
      tests: material.tests.filter(t => t.id !== testId)
    };

    dispatch({ type: 'UPDATE_RAW_MATERIAL', payload: updatedMaterial });
    if (selectedMaterial && selectedMaterial.id === materialId) setSelectedMaterial(updatedMaterial);
  };

  const handleAddPharmacopeiaTests = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    // Try to find a matching monograph by name (fuzzy match)
    const monographKey = Object.keys(g1Monographs).find(key =>
      g1Monographs[key].name.toLowerCase().includes(material.name.toLowerCase()) ||
      material.name.toLowerCase().includes(g1Monographs[key].name.toLowerCase())
    );

    const monograph = monographKey ? g1Monographs[monographKey] : null;

    if (!monograph) {
      toast.error(`No official monograph found for "${material.name}". Please add tests manually.`);
      return;
    }

    const newTests = monograph.tests.map(t => ({
      id: Math.random().toString(36).substr(2, 9),
      name: t.test,
      spec: t.specification,
      type: 'quantitative' as const,
      method: 'Pharmacopeia Method',
      status: 'Pending' as const,
      result: ''
    }));

    const updatedMaterial = {
      ...material,
      tests: [...(material.tests || []), ...newTests]
    };

    dispatch({ type: 'UPDATE_RAW_MATERIAL', payload: updatedMaterial });
    if (selectedMaterial && selectedMaterial.id === materialId) setSelectedMaterial(updatedMaterial);

    toast.success(`Applied ${monograph.standard} monograph: ${monograph.name}`);
  };

  const handleDispense = () => {
    if (!selectedMaterial || dispenseForm.quantity <= 0) return;
    if (dispenseForm.quantity > selectedMaterial.quantity) {
      toast.error('Requested quantity exceeds store stock');
      return;
    }

    const movement: MaterialMovement = {
      id: `MOV-${Date.now()}`,
      materialId: selectedMaterial.id,
      batchId: dispenseForm.batchId,
      type: dispenseForm.type,
      quantity: dispenseForm.quantity,
      unit: selectedMaterial.unit,
      operator: dispenseForm.operator,
      timestamp: new Date(),
    };

    const updatedMaterial = {
      ...selectedMaterial,
      quantity: selectedMaterial.quantity - dispenseForm.quantity,
    };

    dispatch({ type: 'ADD_MATERIAL_MOVEMENT', payload: movement });
    dispatch({ type: 'UPDATE_RAW_MATERIAL', payload: updatedMaterial });
    setSelectedMaterial(updatedMaterial);
    setIsDispenseDialogOpen(false);
    setDispenseForm({ ...dispenseForm, quantity: 0, batchId: '' });
    toast.success(`Recorded ${dispenseForm.type === 'Dispensing' ? 'dispensing' : 'movement'} of ${dispenseForm.quantity} ${selectedMaterial.unit}`);
  };

  const materialMovements = useMemo(() => {
    if (!selectedMaterial) return [];
    return state.materialMovements
      .filter(m => m.materialId === selectedMaterial.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [state.materialMovements, selectedMaterial]);

  // ── Issue COA for Raw Material ──────────────────────────────────────────
  const handleIssueCOA = (material: RawMaterial) => {
    if (material.status !== 'Approved') {
      toast.error('Only APPROVED materials can receive a Certificate of Analysis.');
      return;
    }

    // Check if a COA already exists for this batch
    const alreadyIssued = state.coaRecords.some(
      r => r.batchNumber === material.batchNumber && r.type === 'Raw Material'
    );
    if (alreadyIssued) {
      toast.warning(`A COA for batch ${material.batchNumber} already exists in COA Foundry.`);
      return;
    }

    const coaNumber = `COA-RM-${material.batchNumber}-${Date.now().toString().slice(-5)}`;
    const today = new Date().toISOString().split('T')[0];

    const testResults = (material.tests || []).map(t => ({
      test: t.name,
      specification: t.spec || '',
      result: t.result || '',
      status: (t.status === 'Pass' ? 'Pass' : t.status === 'Fail' ? 'Fail' : 'Pending') as 'Pass' | 'Fail' | 'Pending' | 'N/A',
    }));

    const newCOA = {
      id: `coa-rm-${material.id}-${Date.now()}`,
      type: 'Raw Material' as const,
      coaNumber,
      analysisNo: material.analysisNo || `AN-${material.batchNumber}`,
      productName: material.name,
      strength: '',
      dosageForm: material.type,
      batchNumber: material.batchNumber,
      batchSize: `${material.quantity} ${material.unit}`,
      manufacturingDate: material.manufacturingDate || material.receivedDate || '',
      receivingDate: material.receivedDate || '',
      analysisDate: material.analysisDate || today,
      issueDate: today,
      expiryDate: material.expiryDate || '',
      manufacturer: material.supplier,
      address: 'Industrial Zone, Phase 2, Pharmaceutical District',
      testResults,
      marketComplaintStatus: 'Verified and Compliant',
      analyzedBy: 'Chief Analyst',
      checkedBy: 'QC Supervisor',
      approvedBy: 'QA Manager',
      status: 'Released' as const,
    };

    dispatch({ type: 'ADD_COA_RECORD', payload: newCOA });
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: Math.random().toString(36).substr(2, 9),
        type: 'Document_Approved',
        description: `COA issued for Raw Material: ${material.name} (Batch: ${material.batchNumber})`,
        user: 'QA Department',
        timestamp: new Date(),
        relatedId: newCOA.id,
      },
    });

    toast.success(
      `✅ COA ${coaNumber} issued and sent to COA Foundry (Raw Materials tab)!`,
      { duration: 5000 }
    );
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB');
  };

  return (
    <div className="space-y-6 p-4">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Raw Material Inventory</h1>
          <p className="text-slate-500 text-sm">Register and analyze materials per BP/USP/EP</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generateInventoryReportPDF(materials)} variant="outline">
            <FileText className="h-4 w-4 mr-2" /> Export Inventory Report
          </Button>
          <Button onClick={() => setIsNewMaterialOpen(true)} className="bg-indigo-600">
            <Plus className="h-4 w-4 mr-2" /> Register New Material
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">Approved (Released)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600">Quarantine/Under Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">{stats.underTest}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">Rejected (OOS)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, batch, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Material Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {MATERIAL_TYPES.map(type => (
              <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Quality Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Quarantine">Quarantine</SelectItem>
            <SelectItem value="Under_Test">Under Test</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.map(material => (
          <Card
            key={material.id}
            className={cn(
              "hover:shadow-md transition-all cursor-pointer",
              selectedMaterial?.id === material.id && "ring-2 ring-indigo-500"
            )}
            onClick={() => setSelectedMaterial(material)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Package className="h-4 w-4 text-slate-600" />
                  </div>
                  <CardTitle className="text-base font-bold">{material.name}</CardTitle>
                </div>
                <Badge
                  variant={material.status === 'Approved' ? 'default' : material.status === 'Rejected' ? 'destructive' : 'secondary'}
                >
                  {material.status === 'Approved' ? 'Released' :
                    material.status === 'Rejected' ? 'Rejected' :
                      material.status === 'Quarantine' ? 'Quarantine' : 'Analyzing'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span>{MATERIAL_TYPES.find(t => t.key === material.type)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch ID:</span>
                  <span className="font-mono">{material.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المورد:</span>
                  <span>{material.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity:</span>
                  <span>{material.quantity} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الموقع:</span>
                  <span>{material.location || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاريخ الانتهاء:</span>
                  <span className={new Date(material.expiryDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                    {material.expiryDate}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Tests:</span>
                  <span className="font-medium">
                    {material.tests && material.tests.length > 0 ? (
                      <>
                        {formatDate(material.tests.find(t => t.testedAt)?.testedAt)} {material.tests.filter(t => t.status === 'Pass').length}/{material.tests.length} Complete
                      </>
                    ) : (
                      'No tests defined'
                    )}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{
                      width: material.tests && material.tests.length > 0
                        ? `${(material.tests.filter(t => t.status === 'Pass').length / material.tests.length) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No materials found matching search criteria.</p>
        </div>
      )}

      <Dialog open={isNewMaterialOpen} onOpenChange={setIsNewMaterialOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Raw Material Entry</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={materialForm.name}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Paracetamol BP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Material Category *</Label>
              <Select
                value={materialForm.type}
                onValueChange={(v) => setMaterialForm(prev => ({ ...prev, type: v as RawMaterial['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map(type => (
                    <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch/Lot Number *</Label>
              <Input
                id="batchNumber"
                value={materialForm.batchNumber}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="LOT-2026-X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier / Manufacturer *</Label>
              <Input
                id="supplier"
                value={materialForm.supplier}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacopeia">Standards (Pharmacopeia)</Label>
              <Select
                value={materialForm.pharmacopeia}
                onValueChange={(v) => setMaterialForm(prev => ({ ...prev, pharmacopeia: v as RawMaterial['pharmacopeia'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BP">British Pharmacopeia (BP)</SelectItem>
                  <SelectItem value="USP">United States Pharmacopeia (USP)</SelectItem>
                  <SelectItem value="EP">European Pharmacopeia (EP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  value={materialForm.quantity}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="flex-1"
                />
                <Select
                  value={materialForm.unit}
                  onValueChange={(v) => setMaterialForm(prev => ({ ...prev, unit: v }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                    <SelectItem value="units">Units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receivedDate">Receipt Date</Label>
              <Input
                id="receivedDate"
                type="date"
                value={materialForm.receivedDate}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, receivedDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productionDate">Production Date</Label>
              <Input
                id="productionDate"
                type="date"
                value={materialForm.productionDate || ''}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, productionDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
              <Input
                id="manufacturingDate"
                type="date"
                value={materialForm.manufacturingDate || ''}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, manufacturingDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="analysisDate">Analysis Date</Label>
              <Input
                id="analysisDate"
                type="date"
                value={materialForm.analysisDate || ''}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, analysisDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="analysisNo">Analysis Number</Label>
              <Input
                id="analysisNo"
                value={materialForm.analysisNo || ''}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, analysisNo: e.target.value }))}
                placeholder="e.g. AN-2026-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={materialForm.issueDate || ''}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={materialForm.expiryDate}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                value={materialForm.location}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Warehouse A - Shelf 2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMaterialOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMaterial} className="bg-indigo-600">
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        {selectedMaterial && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl">{selectedMaterial.name}</DialogTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedMaterial.batchNumber} | {MATERIAL_TYPES.find(t => t.key === selectedMaterial.type)?.label}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {selectedMaterial.status === 'Approved' && (
                    <Button
                      size="sm"
                      id="btn-issue-coa"
                      onClick={() => handleIssueCOA(selectedMaterial)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md shadow-green-200 font-bold gap-1 px-4"
                    >
                      <Award className="h-4 w-4" />
                      Issue Certificate of Analysis
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateCOAPDF(selectedMaterial)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                  <Badge
                    className="text-lg px-3 py-1"
                    variant={selectedMaterial.status === 'Approved' ? 'default' : selectedMaterial.status === 'Rejected' ? 'destructive' : 'secondary'}
                  >
                    {selectedMaterial.status === 'Approved' ? 'Released' :
                      selectedMaterial.status === 'Rejected' ? 'Rejected' :
                        selectedMaterial.status === 'Quarantine' ? 'Quarantine' : 'Analyzing'}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">General Info</TabsTrigger>
                <TabsTrigger value="tests">Analytical Tests ({selectedMaterial?.tests?.length || 0})</TabsTrigger>
                <TabsTrigger value="movements">Inventory Movements</TabsTrigger>
                <TabsTrigger value="history">Audit Log</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-500">Material Specification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Supplier:</span>
                        <span className="font-medium">{selectedMaterial.supplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Standard:</span>
                        <span className="font-medium">{selectedMaterial.pharmacopeia}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available Stock:</span>
                        <span className="font-medium">{selectedMaterial.quantity} {selectedMaterial.unit}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-500">Retention & Expiry</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Receipt Date:</span>
                        <span>{selectedMaterial.receivedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Expiry Date:</span>
                        <span className={new Date(selectedMaterial.expiryDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                          {selectedMaterial.expiryDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Location:</span>
                        <span>{selectedMaterial.location || 'Not Specified'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="tests" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Analytical Test Protocols</h3>
                  <div className="flex gap-2">
                    <Select onValueChange={() => handleAddPharmacopeiaTests(selectedMaterial.id)}>
                      <SelectTrigger className="h-8 text-xs w-[180px]">
                        <PlusCircle className="h-3 w-3 ml-1" />
                        Recall Pharmacopeia
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="API">Active (API)</SelectItem>
                        <SelectItem value="Excipient">Excipient</SelectItem>
                        <SelectItem value="Packaging">Packaging</SelectItem>
                        <SelectItem value="Solvent">Solvent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleAddTest(selectedMaterial.id)}>
                      <Plus className="h-3 w-3 ml-1" />
                      Add Custom Test
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {(selectedMaterial?.tests || []).map((test) => (
                    <Card key={test.id} className={cn(
                      "border-l-4",
                      test.status === 'Pass' ? 'border-l-green-500' :
                        test.status === 'Fail' ? 'border-l-red-500' :
                          test.status === 'OOS' ? 'border-l-orange-500' :
                            'border-l-slate-300'
                    )}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-4 space-y-2">
                            <Label className="text-[10px] text-slate-400">Test Parameter</Label>
                            <Input
                              value={test.name}
                              onChange={(e) => handleUpdateTestResult(selectedMaterial!.id, test.id, { name: e.target.value })}
                              className="h-8 text-sm font-semibold"
                            />
                          </div>

                          <div className="col-span-3 space-y-2">
                            <Label className="text-[10px] text-slate-400">Specification (Limit)</Label>
                            <Input
                              value={test.spec}
                              onChange={(e) => handleUpdateTestResult(selectedMaterial!.id, test.id, { spec: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>

                          <div className="col-span-3 space-y-2">
                            <Label className="text-[10px] text-slate-400">Observed Result</Label>
                            <Input
                              value={test.result}
                              onChange={(e) => handleUpdateTestResult(selectedMaterial!.id, test.id, { result: e.target.value })}
                              className="h-8 text-sm font-medium"
                              placeholder="أدخل النتيجة..."
                            />
                          </div>

                          <div className="col-span-2 flex flex-col justify-end gap-2">
                            <div className="flex gap-1">
                              <Select
                                value={test.status}
                                onValueChange={(v) => handleUpdateTestResult(selectedMaterial!.id, test.id, { status: v as any })}
                              >
                                <SelectTrigger className="h-8 text-xs flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending Analysis</SelectItem>
                                  <SelectItem value="Pass">Pass</SelectItem>
                                  <SelectItem value="Fail">Fail</SelectItem>
                                  <SelectItem value="OOS">OOS</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteTest(selectedMaterial!.id, test.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {test.testedBy && (
                          <div className="mt-2 text-[10px] text-slate-400 flex justify-end">
                            By {test.testedBy} on {formatDate(test.testedAt)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(!selectedMaterial?.tests || selectedMaterial.tests.length === 0) && (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed">
                      <Beaker className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p>No analytical tests registered for this material batch.</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 text-indigo-600"
                        onClick={() => handleAddPharmacopeiaTests(selectedMaterial!.id)}
                      >
                        Apply Pharmacopeia Protocol
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="movements" className="mt-4 space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                  <div>
                    <span className="text-sm text-slate-500">Current Stock Balance:</span>
                    <div className="text-2xl font-bold text-indigo-700">
                      {selectedMaterial.quantity} {selectedMaterial.unit}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => setIsDispenseDialogOpen(true)}
                      disabled={selectedMaterial.status !== 'Approved' || selectedMaterial.quantity <= 0}
                    >
                      <ArrowDownToLine className="h-4 w-4 ml-2" />
                      Dispense to Production
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDispenseForm(prev => ({ ...prev, type: 'Return' }));
                        setIsDispenseDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      Returns / Adjustments
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Movement Type</th>
                        <th className="px-4 py-2 text-left">Quantity</th>
                        <th className="px-4 py-2 text-left">Ref Batch ID</th>
                        <th className="px-4 py-2 text-left">Officer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {materialMovements.map(mov => (
                        <tr key={mov.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2">{formatDate(mov.timestamp)}</td>
                          <td className="px-4 py-2">
                            <Badge variant={mov.type === 'Dispensing' ? 'secondary' : 'outline'}>
                              {mov.type === 'Dispensing' ? 'Dispensing' :
                                mov.type === 'Return' ? 'Return' :
                                  mov.type === 'Sample' ? 'Sampling' : 'Receipt'}
                            </Badge>
                          </td>
                          <td className={cn(
                            "px-4 py-2 font-mono font-bold",
                            mov.type === 'Dispensing' || mov.type === 'Sample' ? 'text-red-600' : 'text-green-600'
                          )}>
                            {mov.type === 'Dispensing' || mov.type === 'Sample' ? '-' : '+'}{mov.quantity} {mov.unit}
                          </td>
                          <td className="px-4 py-2 text-slate-500">{mov.batchId || '-'}</td>
                          <td className="px-4 py-2 text-xs">{mov.operator}</td>
                        </tr>
                      ))}
                      {materialMovements.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                            No movements recorded for this material yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-slate-500 w-32">{formatDate(selectedMaterial.createdAt)}</span>
                        <span>Material received and moved to Quarantine</span>
                      </div>
                      {selectedMaterial.tests.some(t => t.status !== 'Pending') && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-slate-500 w-32">
                            {formatDate(selectedMaterial.tests.find(t => t.testedAt)?.testedAt)}
                          </span>
                          <span>Analytical testing initiated</span>
                        </div>
                      )}
                      {selectedMaterial.status === 'Approved' && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-600 rounded-full" />
                          <span className="text-slate-500 w-32">{formatDate(new Date())}</span>
                          <span>Material approved for use</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={isDispenseDialogOpen} onOpenChange={setIsDispenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dispenseForm.type === 'Dispensing' ? 'صرف مادة للإنتاج' : 'تعديل رصيد المخزن'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكمية ({selectedMaterial?.unit})</Label>
                <Input
                  type="number"
                  value={dispenseForm.quantity}
                  onChange={(e) => setDispenseForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>رقم تشغيلة المنتج (Batch ID)</Label>
                <Input
                  placeholder="مثال: PM-2026-001"
                  value={dispenseForm.batchId}
                  onChange={(e) => setDispenseForm(prev => ({ ...prev, batchId: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>نوع العملية</Label>
              <Select
                value={dispenseForm.type}
                onValueChange={(v) => setDispenseForm(prev => ({ ...prev, type: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dispensing">صرف للإنتاج</SelectItem>
                  <SelectItem value="Return">مرتجع من الإنتاج</SelectItem>
                  <SelectItem value="Sample">سحب عينة (QC)</SelectItem>
                  <SelectItem value="Adjustment">تعديل رصيد (جرد)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المسؤول عن الحركة</Label>
              <Input
                value={dispenseForm.operator}
                onChange={(e) => setDispenseForm(prev => ({ ...prev, operator: e.target.value }))}
              />
            </div>

            {selectedMaterial && (
              <div className="bg-slate-50 p-2 rounded text-xs text-slate-500">
                الرصيد المتبقي المتوقع: <span className="font-bold">{selectedMaterial.quantity - dispenseForm.quantity}</span> {selectedMaterial.unit}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDispenseDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleDispense} className="bg-indigo-600">تأكيد وإتمام الحركة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
