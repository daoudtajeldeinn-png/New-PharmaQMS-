import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Badge not used
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
// DatePicker removed - not used
import {
  FileText,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
  Printer,
  Share2,
  FileSpreadsheet,
  FileBarChart
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
// cn utility not used in this file

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

export function ReportsPage() {
  const { state } = useStore();
  const [reportType, setReportType] = useState('products');
  const [dateRange, setDateRange] = useState('month');

  // Product Status Data
  const productStatusData = Object.entries(state.dashboardStats.productsByStatus).map(([status, count]) => ({
    name: status === 'Quarantine' ? 'Quarantine' :
      status === 'Approved' ? 'Approved' :
        status === 'Rejected' ? 'Rejected' :
          status === 'Released' ? 'Released' :
            status === 'Blocked' ? 'Blocked' :
              status === 'Expired' ? 'Expired' : 'Testing',
    value: count,
  }));

  // Test Results Data
  const testResultsData = [
    { name: 'Pass', value: state.testResults.filter(r => r.overallResult === 'Pass').length },
    { name: 'OOS', value: state.testResults.filter(r => r.overallResult === 'OOS').length },
    { name: 'Pending', value: state.testResults.filter(r => r.overallResult === 'Pending').length },
  ];

  // CAPA Status Data
  const capaStatusData = [
    { name: 'Open', value: state.capas.filter(c => c.status === 'Open').length },
    { name: 'In Progress', value: state.capas.filter(c => c.status === 'In_Progress').length },
    { name: 'Closed', value: state.capas.filter(c => c.status === 'Closed').length },
  ];

  // Deviation Type Data
  const deviationTypeData = [
    { name: 'Critical', value: state.deviations.filter(d => d.type === 'Critical').length },
    { name: 'Major', value: state.deviations.filter(d => d.type === 'Major').length },
    { name: 'Minor', value: state.deviations.filter(d => d.type === 'Minor').length },
  ];

  // Monthly Trend Data (mock)
  const monthlyTrendData = [
    { month: 'Jan', tests: 45, oos: 2, deviations: 1 },
    { month: 'Feb', tests: 52, oos: 3, deviations: 2 },
    { month: 'Mar', tests: 48, oos: 1, deviations: 0 },
    { month: 'Apr', tests: 61, oos: 4, deviations: 3 },
    { month: 'May', tests: 55, oos: 2, deviations: 1 },
    { month: 'Jun', tests: 67, oos: 3, deviations: 2 },
  ];

  const reportTemplates = [
    { id: 'product-summary', name: 'Inventory Summary', icon: FileText, description: 'Comprehensive audit of product inventory and storage status.' },
    { id: 'test-results', name: 'QC Test Metrics', icon: BarChart3, description: 'Laboratory result distribution and OOS investigation trends.' },
    { id: 'capa-report', name: 'CAPA Efficacy', icon: TrendingUp, description: 'Corrective and Preventive Action lifecycle and resolution speed.' },
    { id: 'deviation-report', name: 'Non-Conformity Log', icon: PieChart, description: 'Detailed analysis of process deviations by severity/type.' },
    { id: 'equipment-report', name: 'Asset Compliance', icon: FileSpreadsheet, description: 'Maintenance and calibration schedules for lab equipment.' },
    { id: 'training-report', name: 'Competency Matrix', icon: FileBarChart, description: 'Personnel training logs and certification status.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Advanced Analytics & Reporting</h1>
          <p className="text-slate-500">Generate compliance dossiers and system performance distributions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-indigo-700 border-indigo-200">
            <Printer className="mr-2 h-4 w-4" />
            Hardcopy
          </Button>
          <Button variant="outline" className="text-indigo-700 border-indigo-200">
            <Share2 className="mr-2 h-4 w-4" />
            Distribute
          </Button>
          <Button className="bg-indigo-600">
            <Download className="mr-2 h-4 w-4" />
            Export Archive
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Dataset Category</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Data Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">Inventory</SelectItem>
                  <SelectItem value="testing">QC Labs</SelectItem>
                  <SelectItem value="capa">CAPA Hub</SelectItem>
                  <SelectItem value="deviations">Non-Conformities</SelectItem>
                  <SelectItem value="equipment">Assets</SelectItem>
                  <SelectItem value="training">Personnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temporal Window</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Choose Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Current Week</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Fiscal Quarter</SelectItem>
                  <SelectItem value="year">Annual Summary</SelectItem>
                  <SelectItem value="custom">Manual Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" />
                </div>
              </>
            )}
            <Button variant="outline" className="mb-0.5 border-slate-300">
              <Filter className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
          <TabsTrigger value="dashboard">Performance Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Reporting Dossiers</TabsTrigger>
          <TabsTrigger value="charts">Analytical Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Gross Inventory</p>
                <p className="text-3xl font-black text-slate-900">{state.dashboardStats.totalProducts}</p>
                <p className="text-xs text-green-600 mt-1">↑ 5% vs Prev Month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">QC Tests Executed</p>
                <p className="text-3xl font-black text-slate-900">{state.testResults.length}</p>
                <p className="text-xs text-green-600 mt-1">↑ 12% vs Prev Month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">OOS Alerts</p>
                <p className="text-3xl font-black text-red-600">{state.dashboardStats.oosCount}</p>
                <p className="text-xs text-red-600 mt-1">↑ 2 Critical Events</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Active CAPA Lifecycle</p>
                <p className="text-3xl font-black text-indigo-600">{state.dashboardStats.openCAPAs}</p>
                <p className="text-xs text-amber-600 mt-1">3 verification pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-widest">Inventory Health Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={productStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productStatusData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-widest">Analytical Conformity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={testResultsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-widest">Temporal Compliance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tests" name="Laboratory Assays" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="oos" name="OOS Findings" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="deviations" name="System Deviations" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="border-indigo-100 text-indigo-700">
                            <FileText className="mr-2 h-4 w-4" />
                            Preview
                          </Button>
                          <Button size="sm" className="bg-indigo-600">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-widest">CAPA Lifecycle State</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={capaStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-widest">Deviation Categorization Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={deviationTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      {deviationTypeData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
