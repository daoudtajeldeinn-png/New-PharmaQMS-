import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSecurity } from '@/components/security/SecurityProvider';
import { useRoleAccess } from '@/hooks/useRoleAccess';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Wrench,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileDown,
  Award,
  Clock,
  FileCheck2,
  FileText,
} from 'lucide-react';
import type {
  Equipment,
  EquipmentQualification,
  OverallQualificationStatus,
  QualificationPhase,
  QualificationResult,
} from '@/types';
import { cn } from '@/lib/utils';
import { QualificationService } from '@/services/QualificationService';
import { generateQualificationCertificate } from '@/lib/coaExport';
import { SignatureModal } from '@/components/security/SignatureModal';
import { toast } from 'sonner';

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

const qualStatusConfig: Record<
  OverallQualificationStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  'Fully Qualified': {
    label: 'Fully Qualified',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle,
  },
  'Partially Qualified': {
    label: 'Partially Qualified',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  'Qualification Failed': {
    label: 'Qualification Failed',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: XCircle,
  },
  'Requalification Required': {
    label: 'Requal. Required',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-300',
    icon: Clock,
  },
  'Not Qualified': {
    label: 'Not Qualified',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: XCircle,
  },
};

export function EquipmentPage() {
  const { state, dispatch } = useStore();
  const { user } = useSecurity();
  const { canModify } = useRoleAccess();
  const now = useMemo(() => Date.now(), []);

  // State for filtering and UI
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const location = useLocation();
  const navigate = useNavigate();

  // Qualifications State
  const [allQualifications, setAllQualifications] = useState<EquipmentQualification[]>([]);
  const [isLoadingQuals, setIsLoadingQuals] = useState(false);

  const loadAllQualifications = async () => {
    setIsLoadingQuals(true);
    try {
      const data = await QualificationService.getAllQualifications();
      setAllQualifications(data);
    } catch (err) {
      console.error('Failed to load qualifications:', err);
    } finally {
      setIsLoadingQuals(false);
    }
  };

  useEffect(() => {
    loadAllQualifications();
  }, []);

  // Sync tab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/qualification')) setActiveTab('qualification');
    else if (path.includes('/calibration')) setActiveTab('calibration');
    else if (path.includes('/maintenance')) setActiveTab('maintenance');
    else setActiveTab('all');
  }, [location.pathname]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === 'all') navigate('/equipment');
    else navigate(`/equipment/${val}`);
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCalibrationDialogOpen, setIsCalibrationDialogOpen] = useState(false);
  const [selectedEquipmentForCalibration, setSelectedEquipmentForCalibration] = useState<Equipment | null>(null);
  const [nextCalibrationDate, setNextCalibrationDate] = useState('');
  const [calibrationNotes, setCalibrationNotes] = useState('');

  // Qualification Management Dialog State
  const [selectedEquipmentForQual, setSelectedEquipmentForQual] = useState<Equipment | null>(null);
  const [isQualDialogOpen, setIsQualDialogOpen] = useState(false);

  // Phase Edit / Add Dialog State
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<QualificationPhase>('DQ');
  const [phaseFormData, setPhaseFormData] = useState<{
    id?: string;
    protocol_number: string;
    qualification_date: string;
    performed_by: string;
    approved_by: string;
    result: QualificationResult;
    next_requalification_date: string;
    notes: string;
  }>({
    protocol_number: '',
    qualification_date: new Date().toISOString().split('T')[0],
    performed_by: '',
    approved_by: '',
    result: 'Pass',
    next_requalification_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  // 21 CFR Part 11 Electronic Signature Modal State
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [pendingSignedPhase, setPendingSignedPhase] = useState<EquipmentQualification | null>(null);

  // Form state for new equipment
  const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
    status: 'Active',
    qualificationStatus: { iq: false, oq: false, pq: false },
    calibrationSchedule: { frequency: 365, calibrationProcedure: 'SOP-CAL-001' },
    maintenanceSchedule: { preventiveFrequency: 90, maintenanceProcedure: 'SOP-MAINT-001' },
    documents: [],
  });

  const handleSaveRecord = () => {
    if (!canModify) {
      toast.error('Only authorized administrators can register equipment.');
      return;
    }
    if (!newEquipment.name || !newEquipment.assetTag) {
      toast.error('Name and Asset Tag are required');
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

    equipmentRecord.calibrationSchedule.nextCalibration = new Date(
      equipmentRecord.purchaseDate!.getTime() +
        equipmentRecord.calibrationSchedule.frequency * 24 * 60 * 60 * 1000
    );

    dispatch({ type: 'ADD_EQUIPMENT', payload: equipmentRecord });
    toast.success('New asset registered successfully');
    setIsFormOpen(false);

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
    const matchesTab =
      activeTab === 'all' ||
      activeTab === 'qualification' ||
      (activeTab === 'calibration' &&
        eq.calibrationSchedule.nextCalibration &&
        new Date(eq.calibrationSchedule.nextCalibration).getTime() <= now + 30 * 24 * 60 * 60 * 1000) ||
      (activeTab === 'maintenance' && eq.status === 'Under_Maintenance');

    return matchesSearch && matchesStatus && matchesTab;
  });

  const getCalibrationStatus = (eq: Equipment) => {
    if (!eq.calibrationSchedule.nextCalibration)
      return { label: 'Not Scheduled', color: 'text-gray-500' };
    const daysUntil = Math.ceil(
      (new Date(eq.calibrationSchedule.nextCalibration).getTime() - now) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return { label: 'Overdue', color: 'text-red-600' };
    if (daysUntil <= 7) return { label: `${daysUntil} days`, color: 'text-red-600' };
    if (daysUntil <= 30) return { label: `${daysUntil} days`, color: 'text-yellow-600' };
    return { label: `${daysUntil} days`, color: 'text-green-600' };
  };

  const getEquipmentQualifications = (equipmentId: string): EquipmentQualification[] => {
    return allQualifications.filter(
      (q) => (q.equipment_id === equipmentId || q.equipmentId === equipmentId) && !q.is_deleted
    );
  };

  const openQualificationManager = (eq: Equipment) => {
    setSelectedEquipmentForQual(eq);
    setIsQualDialogOpen(true);
  };

  const openPhaseForm = (phase: QualificationPhase, existing?: EquipmentQualification) => {
    setEditingPhase(phase);
    if (existing) {
      setPhaseFormData({
        id: existing.id,
        protocol_number: existing.protocol_number || existing.protocolNumber || '',
        qualification_date: existing.qualification_date
          ? String(existing.qualification_date).split('T')[0]
          : new Date().toISOString().split('T')[0],
        performed_by: existing.performed_by || existing.performedBy || user?.name || '',
        approved_by: existing.approved_by || existing.approvedBy || '',
        result: existing.result || 'Pass',
        next_requalification_date: existing.next_requalification_date
          ? String(existing.next_requalification_date).split('T')[0]
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: existing.notes || '',
      });
    } else {
      setPhaseFormData({
        protocol_number: `VAL-${selectedEquipmentForQual?.assetTag || 'EQ'}-${phase}-01`,
        qualification_date: new Date().toISOString().split('T')[0],
        performed_by: user?.name || '',
        approved_by: '',
        result: 'Pass',
        next_requalification_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        notes: '',
      });
    }
    setIsPhaseModalOpen(true);
  };

  const handleSavePhaseDirectly = async () => {
    if (!selectedEquipmentForQual) return;
    if (!canModify) {
      toast.error('Only authorized administrators can modify qualification records.');
      return;
    }

    const payload: EquipmentQualification = {
      id: phaseFormData.id || crypto.randomUUID(),
      equipment_id: selectedEquipmentForQual.id,
      equipmentId: selectedEquipmentForQual.id,
      phase: editingPhase,
      protocol_number: phaseFormData.protocol_number,
      protocolNumber: phaseFormData.protocol_number,
      qualification_date: phaseFormData.qualification_date,
      qualificationDate: phaseFormData.qualification_date,
      performed_by: phaseFormData.performed_by,
      performedBy: phaseFormData.performed_by,
      approved_by: phaseFormData.approved_by || user?.name || '',
      approvedBy: phaseFormData.approved_by || user?.name || '',
      result: phaseFormData.result,
      next_requalification_date: phaseFormData.next_requalification_date,
      nextRequalificationDate: phaseFormData.next_requalification_date,
      notes: phaseFormData.notes,
    };

    setPendingSignedPhase(payload);
    setIsSignatureModalOpen(true);
  };

  const handleSignatureConfirm = async (signatureData: {
    signerName: string;
    timestamp: Date;
    intent: string;
  }) => {
    if (!pendingSignedPhase) return;

    try {
      const finalPayload: EquipmentQualification = {
        ...pendingSignedPhase,
        approved_by: signatureData.signerName,
        approvedBy: signatureData.signerName,
      };

      await QualificationService.saveQualification(finalPayload, {
        id: user?.id || 'sys-admin',
        name: signatureData.signerName,
        role: user?.role || 'qa_admin',
      });

      await loadAllQualifications();
      toast.success(`${pendingSignedPhase.phase} Qualification recorded & signed under 21 CFR Part 11!`);
      setIsPhaseModalOpen(false);
      setPendingSignedPhase(null);
    } catch (err: any) {
      toast.error(`Failed to save qualification: ${err.message}`);
    }
  };

  const handleDownloadCertificate = async (eq: Equipment) => {
    const quals = getEquipmentQualifications(eq.id);
    try {
      await generateQualificationCertificate(eq, quals);
      toast.success(`Qualification Certificate generated for ${eq.name}`);
    } catch (err: any) {
      toast.error(`Failed to generate certificate: ${err.message}`);
    }
  };

  // Metrics for Qualification Tab
  const qualMetrics = useMemo(() => {
    const total = state.equipment?.length || 0;
    let fullyQualified = 0;
    let partiallyQualified = 0;
    let overdueAlerts = 0;
    let failed = 0;

    (state.equipment || []).forEach((eq) => {
      const quals = getEquipmentQualifications(eq.id);
      const status = QualificationService.calculateOverallStatus(quals);
      const alerts = QualificationService.getRequalificationAlerts(quals);

      if (status === 'Fully Qualified') fullyQualified++;
      else if (status === 'Partially Qualified') partiallyQualified++;
      else if (status === 'Qualification Failed') failed++;

      if (alerts.isOverdue || status === 'Requalification Required') overdueAlerts++;
    });

    return { total, fullyQualified, partiallyQualified, overdueAlerts, failed };
  }, [state.equipment, allQualifications]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment & Validation</h1>
          <p className="text-slate-500">
            Assets, Calibration, Maintenance, and EU GMP Annex 15 / 21 CFR 211.68 Qualifications
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          disabled={!canModify}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Equipment
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="qualification" className="relative">
            Qualification (DQ/IQ/OQ/PQ)
            {qualMetrics.overdueAlerts > 0 && (
              <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {qualMetrics.overdueAlerts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="calibration">Pending Calibration</TabsTrigger>
          <TabsTrigger value="maintenance">Under Maintenance</TabsTrigger>
        </TabsList>

        {/* TAB 1: ALL EQUIPMENT */}
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
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Equipment Details</TableHead>
                  <TableHead className="font-bold">Asset Tag</TableHead>
                  <TableHead className="font-bold">Location</TableHead>
                  <TableHead className="font-bold">Qualification Status</TableHead>
                  <TableHead className="font-bold">Calibration</TableHead>
                  <TableHead className="font-bold">Operational Status</TableHead>
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
                    const eqQuals = getEquipmentQualifications(eq.id);
                    const overallQual = QualificationService.calculateOverallStatus(eqQuals);
                    const alerts = QualificationService.getRequalificationAlerts(eqQuals);
                    const cfg = qualStatusConfig[overallQual];
                    const QualIcon = cfg.icon;

                    return (
                      <TableRow key={eq.id} className="hover:bg-slate-50/80">
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{eq.name}</p>
                            <p className="text-sm text-slate-500">{eq.model}</p>
                            <p className="text-xs text-slate-400">{eq.manufacturer}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono font-bold text-slate-700">
                            {eq.assetTag}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">{eq.location}</span>
                          <span className="block text-xs text-slate-400">{eq.department}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={cn('flex w-fit items-center gap-1.5 px-2.5 py-0.5 font-medium', cfg.bg, cfg.text, cfg.border)}
                            >
                              <QualIcon className="h-3.5 w-3.5" />
                              {cfg.label}
                            </Badge>
                            {alerts.isOverdue && (
                              <p className="text-[11px] font-bold text-rose-600">
                                ⚠ Overdue ({Math.abs(alerts.daysRemaining || 0)}d)
                              </p>
                            )}
                            {alerts.isDueSoon && (
                              <p className="text-[11px] font-semibold text-amber-600">
                                Due in {alerts.daysRemaining}d
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-sm font-medium', calStatus.color)}>{calStatus.label}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(statusColors[eq.status])}>
                            {statusLabels[eq.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openQualificationManager(eq)}
                              className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                              title="Qualification Lifecycle (DQ/IQ/OQ/PQ)"
                            >
                              <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                              Qual. Lifecycle
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadCertificate(eq)}
                              className="h-8 w-8 text-slate-600 hover:text-indigo-600"
                              title="Download Qualification Certificate PDF"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!canModify}
                              onClick={() => {
                                const newStatus =
                                  eq.status === 'Under_Maintenance' ? 'Active' : 'Under_Maintenance';
                                const updatedEq = { ...eq, status: newStatus as any };
                                if (newStatus === 'Under_Maintenance') {
                                  updatedEq.maintenanceSchedule.lastMaintenance = new Date();
                                }
                                dispatch({ type: 'UPDATE_EQUIPMENT', payload: updatedEq });
                                toast.success(
                                  `Equipment ${
                                    newStatus === 'Under_Maintenance'
                                      ? 'sent for maintenance'
                                      : 'returned from maintenance'
                                  }`
                                );
                              }}
                              className="h-8 w-8 text-slate-600 hover:text-amber-600"
                              title={
                                eq.status === 'Under_Maintenance'
                                  ? 'Complete Maintenance'
                                  : 'Start Maintenance'
                              }
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!canModify}
                              onClick={() => {
                                setSelectedEquipmentForCalibration(eq);
                                setNextCalibrationDate(
                                  eq.calibrationSchedule.nextCalibration
                                    ? new Date(eq.calibrationSchedule.nextCalibration)
                                        .toISOString()
                                        .split('T')[0]
                                    : ''
                                );
                                setCalibrationNotes('');
                                setIsCalibrationDialogOpen(true);
                              }}
                              className="h-8 w-8 text-slate-600 hover:text-blue-600"
                              title="Quick Schedule Calibration"
                            >
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

        {/* TAB 2: QUALIFICATION MODULE (DQ / IQ / OQ / PQ) */}
        <TabsContent value="qualification" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Fully Qualified
                  </p>
                  <p className="text-2xl font-bold text-emerald-950 mt-1">
                    {qualMetrics.fullyQualified}
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">All 4 phases (DQ, IQ, OQ, PQ) passed</p>
                </div>
                <Award className="h-8 w-8 text-emerald-500 opacity-80" />
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Partially Qualified
                  </p>
                  <p className="text-2xl font-bold text-amber-950 mt-1">
                    {qualMetrics.partiallyQualified}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">In-progress validation cycles</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500 opacity-80" />
              </CardContent>
            </Card>

            <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
                    Requal. Overdue / Due
                  </p>
                  <p className="text-2xl font-bold text-rose-950 mt-1">
                    {qualMetrics.overdueAlerts}
                  </p>
                  <p className="text-xs text-rose-600 mt-0.5">Annex 15 requalification needed</p>
                </div>
                <Clock className="h-8 w-8 text-rose-500 opacity-80" />
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Total Monitored
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{qualMetrics.total}</p>
                  <p className="text-xs text-slate-500 mt-0.5">EU GMP Annex 15 inventory</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-slate-400 opacity-80" />
              </CardContent>
            </Card>
          </div>

          {/* Qualification Table */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 bg-slate-50/50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    Equipment Qualification Lifecycle (EU GMP Annex 15 §10-§11 & 21 CFR 211.68)
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Track and verify Design, Installation, Operational, and Performance Qualification for every instrument.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Filter qualification assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 text-xs w-60"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-bold">Asset Name & Tag</TableHead>
                    <TableHead className="font-bold text-center">DQ</TableHead>
                    <TableHead className="font-bold text-center">IQ</TableHead>
                    <TableHead className="font-bold text-center">OQ</TableHead>
                    <TableHead className="font-bold text-center">PQ</TableHead>
                    <TableHead className="font-bold">Requalification Due</TableHead>
                    <TableHead className="font-bold">Overall Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-slate-400 italic">
                        No equipment records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEquipment.map((eq) => {
                      const eqQuals = getEquipmentQualifications(eq.id);
                      const overall = QualificationService.calculateOverallStatus(eqQuals);
                      const alerts = QualificationService.getRequalificationAlerts(eqQuals);
                      const cfg = qualStatusConfig[overall];

                      const getPhaseResult = (p: QualificationPhase) => {
                        const rec = eqQuals.find((item) => item.phase === p);
                        if (!rec) return null;
                        return rec.result;
                      };

                      const renderPhaseDot = (res: QualificationResult | null) => {
                        if (res === 'Pass') {
                          return (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold px-1.5 py-0">
                              PASS
                            </Badge>
                          );
                        }
                        if (res === 'Fail') {
                          return (
                            <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px] font-bold px-1.5 py-0">
                              FAIL
                            </Badge>
                          );
                        }
                        if (res === 'Pending') {
                          return (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold px-1.5 py-0">
                              PEND
                            </Badge>
                          );
                        }
                        return <span className="text-slate-300 text-xs font-mono">-</span>;
                      };

                      return (
                        <TableRow key={eq.id} className="hover:bg-slate-50/80">
                          <TableCell>
                            <p className="font-medium text-slate-900">{eq.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <code className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                {eq.assetTag}
                              </code>
                              <span className="text-xs text-slate-400">{eq.location}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{renderPhaseDot(getPhaseResult('DQ'))}</TableCell>
                          <TableCell className="text-center">{renderPhaseDot(getPhaseResult('IQ'))}</TableCell>
                          <TableCell className="text-center">{renderPhaseDot(getPhaseResult('OQ'))}</TableCell>
                          <TableCell className="text-center">{renderPhaseDot(getPhaseResult('PQ'))}</TableCell>
                          <TableCell>
                            {alerts.nextDate ? (
                              <div>
                                <p className="text-xs font-medium text-slate-800">
                                  {alerts.nextDate.toLocaleDateString('en-GB')}
                                </p>
                                {alerts.isOverdue ? (
                                  <span className="text-[10px] font-bold text-rose-600">
                                    Overdue by {Math.abs(alerts.daysRemaining || 0)}d
                                  </span>
                                ) : alerts.isDueSoon ? (
                                  <span className="text-[10px] font-semibold text-amber-600">
                                    Due in {alerts.daysRemaining}d
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-600">Valid</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Not scheduled</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn('text-xs font-medium px-2 py-0.5', cfg.bg, cfg.text, cfg.border)}
                            >
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openQualificationManager(eq)}
                                className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium"
                              >
                                <FileCheck2 className="mr-1 h-3 w-3" />
                                Manage Phases
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadCertificate(eq)}
                                className="h-7 text-xs text-slate-700 hover:text-indigo-600"
                                title="Download Qualification Certificate PDF"
                              >
                                <FileDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: CALIBRATION */}
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
                    {filteredEquipment
                      .filter((eq) => {
                        if (!eq.calibrationSchedule.nextCalibration) return false;
                        const daysUntil = Math.ceil(
                          (new Date(eq.calibrationSchedule.nextCalibration).getTime() - now) /
                            (1000 * 60 * 60 * 24)
                        );
                        return daysUntil <= 30;
                      })
                      .map((eq) => (
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
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canModify}
                              onClick={() => {
                                setSelectedEquipmentForCalibration(eq);
                                setNextCalibrationDate(
                                  eq.calibrationSchedule.nextCalibration
                                    ? new Date(eq.calibrationSchedule.nextCalibration)
                                        .toISOString()
                                        .split('T')[0]
                                    : ''
                                );
                                setCalibrationNotes('');
                                setIsCalibrationDialogOpen(true);
                              }}
                              className="text-indigo-600 border-indigo-200"
                            >
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

        {/* TAB 4: MAINTENANCE */}
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
                    {filteredEquipment
                      .filter((eq) => eq.status === 'Under_Maintenance')
                      .map((eq) => (
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
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800 border-amber-300"
                            >
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

      {/* DIALOG 1: QUALIFICATION LIFECYCLE MANAGER */}
      <Dialog open={isQualDialogOpen} onOpenChange={setIsQualDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  Equipment Qualification Lifecycle
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard: EU GMP Annex 15 §10-§11 & 21 CFR 211.68 Validation Protocol
                </p>
              </div>
              {selectedEquipmentForQual && (
                <Button
                  size="sm"
                  onClick={() => handleDownloadCertificate(selectedEquipmentForQual)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                >
                  <FileDown className="h-4 w-4" />
                  Download Certificate (PDF)
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedEquipmentForQual && (
            <div className="space-y-6 pt-2">
              {/* Asset Header Info */}
              <div className="bg-slate-50 border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Asset Name</span>
                  <span className="text-sm font-bold text-slate-800">{selectedEquipmentForQual.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Asset Tag</span>
                  <code className="text-xs font-bold text-indigo-700 font-mono">
                    {selectedEquipmentForQual.assetTag}
                  </code>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Location</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {selectedEquipmentForQual.location} ({selectedEquipmentForQual.department})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Current Status</span>
                  {(() => {
                    const quals = getEquipmentQualifications(selectedEquipmentForQual.id);
                    const overall = QualificationService.calculateOverallStatus(quals);
                    const cfg = qualStatusConfig[overall];
                    return (
                      <Badge variant="outline" className={cn('text-xs font-bold mt-0.5', cfg.bg, cfg.text, cfg.border)}>
                        {cfg.label}
                      </Badge>
                    );
                  })()}
                </div>
              </div>

              {/* Overdue / Due Soon Alert Banner */}
              {(() => {
                const quals = getEquipmentQualifications(selectedEquipmentForQual.id);
                const alerts = QualificationService.getRequalificationAlerts(quals);
                if (alerts.isOverdue) {
                  return (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold">
                      <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                      <div>
                        Requalification is overdue by {Math.abs(alerts.daysRemaining || 0)} day(s). Equipment operation may require QA deviation logging.
                      </div>
                    </div>
                  );
                }
                if (alerts.isDueSoon) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-xs font-semibold">
                      <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <div>
                        Requalification is due in {alerts.daysRemaining} day(s). Initiate protocol and schedule engineering qualification.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 4 Phases Grid: DQ / IQ / OQ / PQ */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Qualification Phases (Annex 15 Lifecycle)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    [
                      {
                        phase: 'DQ' as QualificationPhase,
                        title: 'Design Qualification (DQ)',
                        desc: 'Confirms design meets User Requirement Specifications (URS) and GMP standards.',
                      },
                      {
                        phase: 'IQ' as QualificationPhase,
                        title: 'Installation Qualification (IQ)',
                        desc: 'Verifies installation complies with engineering drawings, electrical & utility specs.',
                      },
                      {
                        phase: 'OQ' as QualificationPhase,
                        title: 'Operational Qualification (OQ)',
                        desc: 'Proves equipment operates correctly across all defined operating ranges & alarms.',
                      },
                      {
                        phase: 'PQ' as QualificationPhase,
                        title: 'Performance Qualification (PQ)',
                        desc: 'Demonstrates consistent, reproducible performance during actual production/testing batches.',
                      },
                    ] as const
                  ).map((item) => {
                    const quals = getEquipmentQualifications(selectedEquipmentForQual.id);
                    const record = quals.find((q) => q.phase === item.phase);

                    return (
                      <Card
                        key={item.phase}
                        className={cn(
                          'border transition-all',
                          record?.result === 'Pass'
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : record?.result === 'Fail'
                            ? 'border-rose-200 bg-rose-50/20'
                            : record?.result === 'Pending'
                            ? 'border-amber-200 bg-amber-50/20'
                            : 'border-slate-200 bg-slate-50/30'
                        )}
                      >
                        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                          <div>
                            <span className="text-xs font-bold text-indigo-700 font-mono tracking-wide">
                              PHASE: {item.phase}
                            </span>
                            <CardTitle className="text-sm font-bold text-slate-900 mt-0.5">
                              {item.title}
                            </CardTitle>
                          </div>
                          {record ? (
                            record.result === 'Pass' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold">
                                PASS
                              </Badge>
                            ) : record.result === 'Fail' ? (
                              <Badge className="bg-red-100 text-red-800 border-red-300 text-xs font-bold">
                                FAIL
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold">
                                PENDING
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="text-xs text-slate-400">
                              Not Initiated
                            </Badge>
                          )}
                        </CardHeader>

                        <CardContent className="p-4 pt-2 space-y-3">
                          <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>

                          {record ? (
                            <div className="bg-white border rounded p-2.5 space-y-1 text-xs text-slate-700">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Protocol #:</span>
                                <span className="font-semibold font-mono">
                                  {record.protocol_number || record.protocolNumber || '-'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Qual. Date:</span>
                                <span className="font-semibold">
                                  {record.qualification_date
                                    ? String(record.qualification_date).split('T')[0]
                                    : '-'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Approved By:</span>
                                <span className="font-semibold">
                                  {record.approved_by || record.approvedBy || '-'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Requal. Due:</span>
                                <span className="font-semibold text-indigo-700">
                                  {record.next_requalification_date
                                    ? String(record.next_requalification_date).split('T')[0]
                                    : '-'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-100/70 rounded p-2 text-center text-xs text-slate-400 italic">
                              No protocol executed for this phase yet.
                            </div>
                          )}

                          <Button
                            size="sm"
                            disabled={!canModify}
                            variant="outline"
                            onClick={() => openPhaseForm(item.phase, record)}
                            className="w-full text-xs font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                          >
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            {record ? `Update ${item.phase} Record` : `Record ${item.phase} Protocol`}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: RECORD / UPDATE PHASE MODAL */}
      <Dialog open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Record Qualification: {editingPhase} Phase
            </DialogTitle>
            <p className="text-xs text-slate-500">
              Complete qualification protocol parameters in compliance with 21 CFR 211.68 & Annex 15.
            </p>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Protocol Number *</Label>
                <Input
                  placeholder="e.g. VAL-HPLC-01-IQ"
                  value={phaseFormData.protocol_number}
                  onChange={(e) =>
                    setPhaseFormData({ ...phaseFormData, protocol_number: e.target.value })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Result *</Label>
                <Select
                  value={phaseFormData.result}
                  onValueChange={(val: any) =>
                    setPhaseFormData({ ...phaseFormData, result: val })
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pass">Pass (Meets Acceptance Criteria)</SelectItem>
                    <SelectItem value="Fail">Fail (Deviation / OOS)</SelectItem>
                    <SelectItem value="Pending">Pending (In Progress)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Qualification Date *</Label>
                <Input
                  type="date"
                  value={phaseFormData.qualification_date}
                  onChange={(e) =>
                    setPhaseFormData({ ...phaseFormData, qualification_date: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Next Requalification Due *</Label>
                <Input
                  type="date"
                  value={phaseFormData.next_requalification_date}
                  onChange={(e) =>
                    setPhaseFormData({
                      ...phaseFormData,
                      next_requalification_date: e.target.value,
                    })
                  }
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Performed By</Label>
                <Input
                  placeholder="Engineer / Specialist"
                  value={phaseFormData.performed_by}
                  onChange={(e) =>
                    setPhaseFormData({ ...phaseFormData, performed_by: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Approved By (QA/Validation)</Label>
                <Input
                  placeholder="QA Manager"
                  value={phaseFormData.approved_by}
                  onChange={(e) =>
                    setPhaseFormData({ ...phaseFormData, approved_by: e.target.value })
                  }
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes / Protocol Summary</Label>
              <Textarea
                placeholder="Document critical observations, acceptance criteria results, or deviations..."
                value={phaseFormData.notes}
                onChange={(e) => setPhaseFormData({ ...phaseFormData, notes: e.target.value })}
                className="text-xs min-h-[70px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPhaseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSavePhaseDirectly}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Sign & Approve Record (Part 11)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: 21 CFR PART 11 SIGNATURE MODAL */}
      <SignatureModal
        open={isSignatureModalOpen}
        onOpenChange={setIsSignatureModalOpen}
        onConfirm={handleSignatureConfirm}
        title={`Electronic Signature — ${editingPhase} Qualification Approval`}
        description={`By signing, you officially verify that ${editingPhase} qualification testing has been completed in compliance with EU GMP Annex 15 and 21 CFR Part 11.`}
        actionIntent={`I approve the ${editingPhase} qualification record and confirm all acceptance criteria have been satisfied.`}
      />

      {/* DIALOG 4: NEW ASSET FORM */}
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
                <Label>Manufacturer</Label>
                <Input
                  placeholder="e.g. Agilent Technologies"
                  value={newEquipment.manufacturer || ''}
                  onChange={(e) =>
                    setNewEquipment({ ...newEquipment, manufacturer: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input
                  placeholder="e.g. DE60555231"
                  value={newEquipment.serialNumber || ''}
                  onChange={(e) =>
                    setNewEquipment({ ...newEquipment, serialNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Asset Tag *</Label>
                <Input
                  placeholder="e.g. EQ-QC-001"
                  value={newEquipment.assetTag || ''}
                  onChange={(e) =>
                    setNewEquipment({ ...newEquipment, assetTag: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={newEquipment.department || 'QC'}
                  onValueChange={(val) => setNewEquipment({ ...newEquipment, department: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QC">Quality Control</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="R&D">R&D</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location / Room</Label>
                <Input
                  placeholder="e.g. Lab 102"
                  value={newEquipment.location || ''}
                  onChange={(e) =>
                    setNewEquipment({ ...newEquipment, location: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRecord} className="bg-indigo-600">
              Save Asset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: SCHEDULE CALIBRATION */}
      <Dialog
        open={isCalibrationDialogOpen}
        onOpenChange={(open) => {
          setIsCalibrationDialogOpen(open);
          if (!open) setSelectedEquipmentForCalibration(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Schedule Calibration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedEquipmentForCalibration ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-600">
                  <div>
                    <strong>Equipment:</strong> {selectedEquipmentForCalibration.name}
                  </div>
                  <div>
                    <strong>Asset Tag:</strong> {selectedEquipmentForCalibration.assetTag}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Next Calibration Date</Label>
                  <Input
                    type="date"
                    className="w-full"
                    value={nextCalibrationDate}
                    onChange={(e) => setNextCalibrationDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes / Reference</Label>
                  <Input
                    placeholder="Reference SOP or external service"
                    value={calibrationNotes}
                    onChange={(e) => setCalibrationNotes(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Select an equipment item before scheduling a calibration.
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCalibrationDialogOpen(false);
                setSelectedEquipmentForCalibration(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedEquipmentForCalibration) {
                  const updatedEquipment: Equipment = {
                    ...selectedEquipmentForCalibration,
                    calibrationSchedule: {
                      ...selectedEquipmentForCalibration.calibrationSchedule,
                      nextCalibration: nextCalibrationDate
                        ? new Date(nextCalibrationDate)
                        : selectedEquipmentForCalibration.calibrationSchedule.nextCalibration,
                      lastCalibration: new Date(),
                    },
                  };
                  dispatch({ type: 'UPDATE_EQUIPMENT', payload: updatedEquipment });
                  toast.success('Calibration scheduled successfully');
                }
                setIsCalibrationDialogOpen(false);
                setSelectedEquipmentForCalibration(null);
              }}
              className="bg-indigo-600"
            >
              Update Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
