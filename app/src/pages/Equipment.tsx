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
import { Plus, Search, Wrench, Calendar, CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react';
import type { Equipment } from '@/types';
import { cn } from '@/lib/utils';

const statusColors = {
  Active: 'bg-green-100 text-green-800 border-green-300',
  Inactive: 'bg-gray-100 text-gray-800 border-gray-300',
  Under_Maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Out_Of_Service: 'bg-red-100 text-red-800 border-red-300',
  Retired: 'bg-slate-100 text-slate-800 border-slate-300',
};

const statusLabels = {
  Active: 'Active',
  Inactive: 'Inactive',
  Under_Maintenance: 'Under Maintenance',
  Out_Of_Service: 'Out Of Service',
  Retired: 'Retired',
};

export function EquipmentPage() {
  const { state, dispatch } = useStore();
  const now = useMemo(() => Date.now(), []);

  // State for filtering and UI
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCalibrationDialogOpen, setIsCalibrationDialogOpen] = useState(false);

  // Form state for new/editing equipment
  const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
    status: 'Active',
    qualificationStatus: { iq: false, oq: false, pq: false },
    calibrationSchedule: { frequency: 365, calibrationProcedure: 'SOP-CAL-001' },
    maintenanceSchedule: { preventiveFrequency: 90, maintenanceProcedure: 'SOP-MAINT-001' },
    documents: [],
  });

  const handleSaveRecord = () => {
    if (!newEquipment.name || !newEquipment.assetTag) {
      import('sonner').then(({ toast }) => toast.error('Name and Asset Tag are required'));
      return;
    }

    const equipmentRecord: Equipment = {
      id: Math.random().toString(36).substr(2, 9),
      name: newEquipment.name || '',
      model: newEquipment.model || '',
      manufacturer: newEquipment.manufacturer || '',
      serialNumber: newEquipment.serialNumber || '',
      assetTag: newEquipment.assetTag || '',
      location: newEquipment.location || '',
      department: newEquipment.department || '',
      status: (newEquipment.status as any) || 'Active',
      qualificationStatus: newEquipment.qualificationStatus || { iq: false, oq: false, pq: false },
      calibrationSchedule: newEquipment.calibrationSchedule || { frequency: 365, calibrationProcedure: '' },
      maintenanceSchedule: newEquipment.maintenanceSchedule || { preventiveFrequency: 90, maintenanceProcedure: '' },
      documents: [],
      purchaseDate: new Date(),
    };

    dispatch({ type: 'ADD_EQUIPMENT', payload: equipmentRecord });
    import('sonner').then(({ toast }) => toast.success('New asset registered successfully'));
    setIsFormOpen(false);
    // Reset form
    setNewEquipment({
      status: 'Active',
      qualificationStatus: { iq: false, oq: false, pq: false },
      calibrationSchedule: { frequency: 365, calibrationProcedure: 'SOP-CAL-001' },
      maintenanceSchedule: { preventiveFrequency: 90, maintenanceProcedure: 'SOP-MAINT-001' },
      documents: [],
    });
  };

  const filteredEquipment = (state.equipment || []).filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'calibration' && eq.calibrationSchedule.nextCalibration &&
        new Date(eq.calibrationSchedule.nextCalibration).getTime() <= now + 30 * 24 * 60 * 60 * 1000) ||
      (activeTab === 'maintenance' && eq.status === 'Under_Maintenance');

    return matchesSearch && matchesStatus && matchesTab;
  });

  const getCalibrationStatus = (eq: Equipment) => {
    if (!eq.calibrationSchedule.nextCalibration) return { label: 'Not Scheduled', color: 'text-gray-500' };
    const daysUntil = Math.ceil(
      (new Date(eq.calibrationSchedule.nextCalibration).getTime() - now) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return { label: 'Overdue', color: 'text-red-600' };
    if (daysUntil <= 7) return { label: `${daysUntil} days`, color: 'text-red-600' };
    if (daysUntil <= 30) return { label: `${daysUntil} days`, color: 'text-yellow-600' };
    return { label: `${daysUntil} days`, color: 'text-green-600' };
  };

  const getQualificationStatus = (eq: Equipment) => {
    const { iq, oq, pq } = eq.qualificationStatus;
    if (iq && oq && pq) return { label: 'Fully Qualified', color: 'text-green-600', icon: CheckCircle };
    if (iq || oq || pq) return { label: 'Partial Qualification', color: 'text-yellow-600', icon: AlertTriangle };
    return { label: 'Not Qualified', color: 'text-red-600', icon: XCircle };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment & Instruments</h1>
          <p className="text-slate-500">Managing Assets, Calibration, and Maintenance Schedules</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Add New Equipment
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Equipment</TabsTrigger>
          <TabsTrigger value="calibration">Pending Calibration</TabsTrigger>
          <TabsTrigger value="maintenance">Under Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search equipment tag, serial or name..."
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
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Equipment Details</TableHead>
                  <TableHead className="font-bold">Asset Tag</TableHead>
                  <TableHead className="font-bold">Location</TableHead>
                  <TableHead className="font-bold">IQ/OQ/PQ</TableHead>
                  <TableHead className="font-bold">Calibration</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                      No matching equipment found in current database.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipment.map((eq) => {
                    const calStatus = getCalibrationStatus(eq);
                    const qualStatus = getQualificationStatus(eq);
                    const QualIcon = qualStatus.icon;
                    return (
                      <TableRow key={eq.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{eq.name}</p>
                            <p className="text-sm text-slate-500">{eq.model}</p>
                            <p className="text-xs text-slate-400">{eq.manufacturer}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-slate-100 px-2 py-1 text-sm">{eq.assetTag}</code>
                        </TableCell>
                        <TableCell>{eq.location}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <QualIcon className={cn("h-4 w-4", qualStatus.color)} />
                            <span className={cn("text-sm", qualStatus.color)}>{qualStatus.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-sm", calStatus.color)}>{calStatus.label}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(statusColors[eq.status])}>
                            {statusLabels[eq.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => { }} title="View Maintenance History">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsCalibrationDialogOpen(true)} title="Quick Schedule Calibration">
                              <Calendar className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="calibration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Equipment Requiring Calibration (Within 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold">Asset Description</TableHead>
                      <TableHead className="font-bold">Last Calibration</TableHead>
                      <TableHead className="font-bold">Due Date</TableHead>
                      <TableHead className="font-bold text-right">GMP Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.filter(eq => {
                      if (!eq.calibrationSchedule.nextCalibration) return false;
                      const daysUntil = Math.ceil(
                        (new Date(eq.calibrationSchedule.nextCalibration).getTime() - now) / (1000 * 60 * 60 * 24)
                      );
                      return daysUntil <= 30;
                    }).map((eq) => (
                      <TableRow key={eq.id}>
                        <TableCell>
                          <p className="font-medium">{eq.name}</p>
                          <p className="text-sm text-slate-500">{eq.assetTag}</p>
                        </TableCell>
                        <TableCell>
                          {eq.calibrationSchedule.lastCalibration
                            ? new Date(eq.calibrationSchedule.lastCalibration).toLocaleDateString('en-GB')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {eq.calibrationSchedule.nextCalibration
                            ? new Date(eq.calibrationSchedule.nextCalibration).toLocaleDateString('en-GB')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200">
                            <Wrench className="mr-2 h-4 w-4" />
                            Schedule Calibration
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Wrench className="h-5 w-5 text-amber-600" />
                Active Maintenance Log (Down Time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold">Asset Details</TableHead>
                      <TableHead className="font-bold">Previous PM</TableHead>
                      <TableHead className="font-bold">Next Planned PM</TableHead>
                      <TableHead className="font-bold">Maintenance Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.filter(eq => eq.status === 'Under_Maintenance').map((eq) => (
                      <TableRow key={eq.id}>
                        <TableCell>
                          <p className="font-medium">{eq.name}</p>
                          <p className="text-sm text-slate-500">{eq.assetTag}</p>
                        </TableCell>
                        <TableCell>
                          {eq.maintenanceSchedule.lastMaintenance
                            ? new Date(eq.maintenanceSchedule.lastMaintenance).toLocaleDateString('en-GB')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {eq.maintenanceSchedule.nextMaintenance
                            ? new Date(eq.maintenanceSchedule.nextMaintenance).toLocaleDateString('en-GB')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                            Maintenance Mode
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Equipment Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">REGISTER NEW ASSET</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset Name *</Label>
                <Input
                  placeholder="e.g. HPLC System"
                  value={newEquipment.name || ''}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Model / Version</Label>
                <Input
                  placeholder="e.g. Agilent 1260"
                  value={newEquipment.model || ''}
                  onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manufacturer / OEM</Label>
                <Input
                  placeholder="e.g. Agilent Technologies"
                  value={newEquipment.manufacturer || ''}
                  onChange={(e) => setNewEquipment({ ...newEquipment, manufacturer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input
                  placeholder="Serial Number"
                  value={newEquipment.serialNumber || ''}
                  onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unique Asset Tag *</Label>
                <Input
                  placeholder="e.g. EQ-HPLC-001"
                  value={newEquipment.assetTag || ''}
                  onChange={(e) => setNewEquipment({ ...newEquipment, assetTag: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Physical Location</Label>
                <Input
                  placeholder="e.g. QC Lab - Room 101"
                  value={newEquipment.location || ''}
                  onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department Assignment</Label>
                <Select
                  value={newEquipment.department || ''}
                  onValueChange={(val) => setNewEquipment({ ...newEquipment, department: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QC">QC Laboratory</SelectItem>
                    <SelectItem value="QA">Quality Assurance</SelectItem>
                    <SelectItem value="Production">Manufacturing</SelectItem>
                    <SelectItem value="Warehouse">Storage / Logistics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operating Status</Label>
                <Select
                  value={newEquipment.status || 'Active'}
                  onValueChange={(val) => setNewEquipment({ ...newEquipment, status: val as any })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Under_Maintenance">Maintenance Mode</SelectItem>
                    <SelectItem value="Out_Of_Service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6 mt-4 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Discard</Button>
            <Button onClick={handleSaveRecord} className="bg-indigo-600 px-8">Save Record</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Calibration Dialog */}
      <Dialog open={isCalibrationDialogOpen} onOpenChange={setIsCalibrationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Schedule Calibration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Next Calibration Date</Label>
              <Input type="date" className="w-full" />
            </div>
            <div className="space-y-2">
              <Label>Notes / Reference</Label>
              <Input placeholder="Reference SOP or external service" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsCalibrationDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              import('sonner').then(({ toast }) => toast.success('Calibration scheduled successfully'));
              setIsCalibrationDialogOpen(false);
            }} className="bg-indigo-600">Update Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
