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
import { Progress } from '@/components/ui/progress';
import { Plus, Search, GraduationCap, Award, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
// TrainingRecord type not used
import { cn } from '@/lib/utils';

const trainingTypeLabels: Record<string, string> = {
  Onboarding: 'Onboarding / Induction',
  SOP: 'SOP Training',
  Technical: 'Technical Skills',
  Safety: 'Health & Safety',
  Quality: 'Quality & GMP',
  Regulatory: 'Regulatory Compliance',
  Refresher: 'Annual Refresher',
};

const statusColors = {
  Scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  In_Progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Completed: 'bg-green-100 text-green-800 border-green-300',
  Overdue: 'bg-red-100 text-red-800 border-red-300',
  Cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusLabels = {
  Scheduled: 'Scheduled',
  In_Progress: 'In Progress',
  Completed: 'Completed',
  Overdue: 'Overdue',
  Cancelled: 'Cancelled',
};

export function TrainingPage() {
  const { state } = useStore();
  const now = useMemo(() => Date.now(), []);
  const [activeTab, setActiveTab] = useState('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    department: 'QC',
    trainingType: 'SOP',
    trainingTitle: '',
    trainingDate: '',
    score: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { dispatch } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.employeeName || !formData.trainingTitle) {
      return;
    }

    const newRecord = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      department: formData.department,
      trainingTitle: formData.trainingTitle,
      trainingType: formData.trainingType as any,
      description: `Training session for ${formData.trainingTitle}`,
      conductedBy: 'System Administrator',
      trainingDate: new Date(formData.trainingDate || Date.now()),
      completionDate: new Date(formData.trainingDate || Date.now()),
      expiryDate: new Date(new Date(formData.trainingDate || Date.now()).setFullYear(new Date().getFullYear() + 1)), // 1 year expiry
      status: 'Completed' as const,
      score: parseInt(formData.score) || 0,
      competencyVerified: parseInt(formData.score) >= 80,
    };

    dispatch({ type: 'ADD_TRAINING_RECORD', payload: newRecord });
    setIsFormOpen(false);
    setFormData({
      employeeId: '',
      employeeName: '',
      department: 'QC',
      trainingType: 'SOP',
      trainingTitle: '',
      trainingDate: '',
      score: '',
    });
  };

  const filteredRecords = state.trainingRecords.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.trainingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalEmployees = new Set(state.trainingRecords.map(r => r.employeeId)).size;
  const completedTrainings = state.trainingRecords.filter(r => r.status === 'Completed').length;
  const overdueTrainings = state.trainingRecords.filter(r => r.status === 'Overdue').length;
  const competencyVerified = state.trainingRecords.filter(r => r.competencyVerified).length;

  const getExpiryStatus = (expiryDate?: Date) => {
    if (!expiryDate) return null;
    const daysUntil = Math.ceil((new Date(expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return { label: 'Expired', color: 'text-red-600' };
    if (daysUntil <= 30) return { label: `${daysUntil} days`, color: 'text-yellow-600' };
    return { label: `${daysUntil} days`, color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training & Competency Matrix</h1>
          <p className="text-slate-500">Managing Employee Training Records & SOP Compliance</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600">
          <Plus className="mr-2 h-4 w-4" />
          Assign New Training
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Personnel</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
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
                <p className="text-sm text-slate-500">Sessions Completed</p>
                <p className="text-2xl font-bold">{completedTrainings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Overdue Tasks</p>
                <p className="text-2xl font-bold">{overdueTrainings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Competency Level</p>
                <p className="text-2xl font-bold">{competencyVerified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
          <TabsTrigger value="records">Training Logs</TabsTrigger>
          <TabsTrigger value="competency">Competency Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, title or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Completion Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
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
                  <TableHead className="font-bold">Personnel</TableHead>
                  <TableHead className="font-bold">Department</TableHead>
                  <TableHead className="font-bold">Training Title</TableHead>
                  <TableHead className="font-bold">Classification</TableHead>
                  <TableHead className="font-bold">Session Date</TableHead>
                  <TableHead className="font-bold">Assessment</TableHead>
                  <TableHead className="font-bold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                      No training logs found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => {
                    const expiryStatus = getExpiryStatus(record.expiryDate);
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.employeeName}</p>
                            <p className="text-sm text-slate-500">{record.employeeId}</p>
                          </div>
                        </TableCell>
                        <TableCell>{record.department}</TableCell>
                        <TableCell>{record.trainingTitle}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trainingTypeLabels[record.trainingType]}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(record.trainingDate).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          {record.score ? (
                            <div className="flex items-center gap-2">
                              <Progress value={record.score} className="w-16 h-2" />
                              <span className="text-sm">{record.score}%</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className={cn("font-bold", statusColors[record.status])}>
                              {statusLabels[record.status]}
                            </Badge>
                            {expiryStatus && (
                              <span className={cn("text-[10px] font-bold", expiryStatus.color)}>
                                Expires: {expiryStatus.label}
                              </span>
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

        <TabsContent value="competency">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Award className="h-5 w-5 text-indigo-600" />
                Competency & Authorization Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold">Employee</TableHead>
                      <TableHead className="font-bold">SOP / Protocol</TableHead>
                      <TableHead className="font-bold">Mastery Level</TableHead>
                      <TableHead className="font-bold">Authorization</TableHead>
                      <TableHead className="font-bold text-right">Certificate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords
                      .filter(r => r.status === 'Completed')
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <p className="font-medium">{record.employeeName}</p>
                            <p className="text-sm text-slate-500">{record.department}</p>
                          </TableCell>
                          <TableCell>{record.trainingTitle}</TableCell>
                          <TableCell>
                            {record.score ? (
                              <div className="flex items-center gap-2">
                                <Progress value={record.score} className="w-20 h-2" />
                                <span className="text-sm font-medium">{record.score}%</span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {record.competencyVerified ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending Review
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {record.certificate ? (
                              <Button variant="ghost" size="icon" className="text-indigo-600 hover:bg-indigo-50">
                                <FileText className="h-4 w-4" />
                              </Button>
                            ) : (
                              '-'
                            )}
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

      {/* Training Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 uppercase">Acknowledge Training Session</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee ID *</Label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    placeholder="e.g. EMP-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Personnel Name *</Label>
                  <Input
                    value={formData.employeeName}
                    onChange={(e) => handleInputChange('employeeName', e.target.value)}
                    placeholder="Legal name as per HR"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Functional Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(v: string) => handleInputChange('department', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QC">Quality Control</SelectItem>
                      <SelectItem value="QA">Quality Assurance</SelectItem>
                      <SelectItem value="Production">Manufacturing</SelectItem>
                      <SelectItem value="Warehouse">Logistics / WH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Training Category</Label>
                  <Select
                    value={formData.trainingType}
                    onValueChange={(v: string) => handleInputChange('trainingType', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarding">Induction</SelectItem>
                      <SelectItem value="SOP">Standard Operation</SelectItem>
                      <SelectItem value="Technical">Module Specific</SelectItem>
                      <SelectItem value="Safety">EHS Protocol</SelectItem>
                      <SelectItem value="Quality">GMP Foundation</SelectItem>
                      <SelectItem value="Regulatory">Legal Compliance</SelectItem>
                      <SelectItem value="Refresher">Annual Renewal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Training Title / SOP # *</Label>
                <Input
                  value={formData.trainingTitle}
                  onChange={(e) => handleInputChange('trainingTitle', e.target.value)}
                  placeholder="e.g. SOP-QC-001: HPLC Operation"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Date</Label>
                  <Input
                    type="date"
                    value={formData.trainingDate}
                    onChange={(e) => handleInputChange('trainingDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assessment Score (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => handleInputChange('score', e.target.value)}
                    placeholder="0-100"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6 mt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Discard</Button>
              <Button type="submit" className="bg-indigo-600 px-8">Confirm Submission</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
