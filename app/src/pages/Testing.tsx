import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { TestMethodForm } from '@/components/testing/TestMethodForm';
import { TestResultForm } from '@/components/testing/TestResultForm';
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
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, FlaskConical, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { TestMethod, TestResult } from '@/types';
import { cn } from '@/lib/utils';
import { useSecurity } from '@/components/security/SecurityProvider';
import { toast } from 'sonner';
import { Trash2, Download } from 'lucide-react';
import { STANDARD_PHARMA_TESTS } from '@/data/standardTests';
import { DataTableActions } from '@/components/ui/data-table-actions';

export function Testing() {
  const { state, dispatch } = useStore();
  const [activeTab, setActiveTab] = useState('results');
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const product = (state.products || []).find(p => p.id === productId) || null;
  const preSelectedProductId = productId || '';
  const isProductView = !!productId;
  const [isMethodFormOpen, setIsMethodFormOpen] = useState(false);
  const [isResultFormOpen, setIsResultFormOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<TestMethod | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const location = useLocation();
  const navigate = useNavigate();

  // Sync tab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/results')) setActiveTab('results');
    else if (path.includes('/methods')) setActiveTab('methods');
    else if (path.includes('/oos')) setActiveTab('oos');
    else if (path.includes('/pharmacopeia')) setActiveTab('pharmacopeia');
    else if (activeTab === '') setActiveTab('results');
  }, [location.pathname]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    navigate(`/testing/${val}`);
  };

  const { user } = useSecurity();

  const handleCloseOOS = (result: TestResult) => {
    dispatch({
      type: 'UPDATE_TEST_RESULT',
      payload: { ...result, status: 'Completed', completionDate: new Date() },
    });
    toast.success(`OOS investigation for batch ${result.batchNumber} closed.`);
  };

  const handleDeleteOOS = (id: string) => {
    if (window.confirm('Are you sure you want to delete this OOS record?')) {
      dispatch({ type: 'DELETE_TEST_RESULT', payload: id });
      toast.success('OOS record deleted.');
    }
  };

  const handleAddMethod = () => {
    setSelectedMethod(null);
    setIsMethodFormOpen(true);
  };

  const handleEditMethod = (method: TestMethod) => {
    setSelectedMethod(method);
    setIsMethodFormOpen(true);
  };

  const handleSubmitMethod = (method: Partial<TestMethod>) => {
    if (selectedMethod) {
      dispatch({
        type: 'UPDATE_TEST_METHOD',
        payload: method as TestMethod,
      });
    } else {
      dispatch({
        type: 'ADD_TEST_METHOD',
        payload: method as TestMethod,
      });
    }
    setIsMethodFormOpen(false);
  };

  const handleSeedMethods = () => {
    let addCount = 0;
    STANDARD_PHARMA_TESTS.forEach(method => {
      const exists = state.testMethods.some(m => m.name === method.name);
      if (!exists) {
        dispatch({
          type: 'ADD_TEST_METHOD',
          payload: {
            ...method,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as TestMethod
        });
        addCount++;
      }
    });

    if (addCount > 0) {
      toast.success(`Successfully imported ${addCount} standard test methods.`);
    } else {
      toast.info('Standard methods are already in your library.');
    }
  };

  const handleSubmitResult = (result: Partial<TestResult>) => {
    dispatch({
      type: 'ADD_TEST_RESULT',
      payload: result as TestResult,
    });
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: crypto.randomUUID(),
        type: result.overallResult === 'OOS' ? 'OOS_Investigation' : 'Test_Completed',
        description: `Test completed for batch ${result.batchNumber}: ${result.overallResult}`,
        user: 'System',
        timestamp: new Date(),
      },
    });
    setIsResultFormOpen(false);
    dispatch({ type: 'UPDATE_DASHBOARD_STATS' });
  };

  const filteredResults = (state.testResults || []).filter((result) => {
    const matchesSearch =
      (result.batchNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (result.sampleId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || result.overallResult === statusFilter;

    const productMatch = !isProductView || result.productId === productId;

    return matchesSearch && matchesStatus && productMatch;
  });

  const resultStatusColors = {
    Pass: 'bg-green-100 text-green-800 border-green-300',
    Fail: 'bg-red-100 text-red-800 border-red-300',
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    OOS: 'bg-red-100 text-red-800 border-red-300',
  };

  const resultStatusLabels = {
    Pass: 'Complies',
    Fail: 'Non-Compliant',
    Pending: 'Pending',
    OOS: 'OOS',
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            {isProductView ? (
              <>
                <h1 className="text-2xl font-bold text-slate-900">
                  QC Tests: {product?.name || 'Product'}
                </h1>
                <p className="text-slate-500">
                  {product?.genericName} • Batch context: Testing & Analysis
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Laboratory Testing & Analysis</h1>
                <p className="text-slate-500">Managing Analytical Test Results & Validation Methods</p>
              </>
            )}
          </div>
          {!isProductView && (
            <Button onClick={() => setIsResultFormOpen(true)} className="bg-indigo-600">
              <Plus className="mr-2 h-4 w-4" />
              Log New Result
            </Button>
          )}
        </div>
        {isProductView && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-indigo-800">
              Viewing tests for <span className="font-bold">{product?.name}</span>. 
              Use "Log New Result" to add QC data for this product.
            </p>
          </div>
        )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1">
          <TabsTrigger value="results">Test Records</TabsTrigger>
          <TabsTrigger value="methods">STP Methods</TabsTrigger>
          <TabsTrigger value="oos">OOS Investigations</TabsTrigger>
          <TabsTrigger value="pharmacopeia">Pharmacopeia</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by batch or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Decision Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Judgements</SelectItem>
                  <SelectItem value="Pass">Pass/Complies</SelectItem>
                  <SelectItem value="Fail">Fail/Failed</SelectItem>
                  <SelectItem value="OOS">OOS Log</SelectItem>
                  <SelectItem value="Pending">Pending Evaluation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsResultFormOpen(true)} className="bg-indigo-600">
              <Plus className="mr-2 h-4 w-4" />
              Log New Result
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Batch Number</TableHead>
                  <TableHead className="font-bold">Sample ID</TableHead>
                  <TableHead className="font-bold">Test Protocol</TableHead>
                  <TableHead className="font-bold">Analyst</TableHead>
                  <TableHead className="font-bold">Analysis Date</TableHead>
                  <TableHead className="font-bold">Conformance</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.length === 0 ? (
                  <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                    {isProductView ? (
                      <>
                        <div className="mb-4">
                          <FlaskConical className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{product?.name || 'Selected Product'}</h3>
                        </div>
                        No test results recorded for this product yet.
                        <p className="text-sm mt-2">Log your first analytical result below.</p>
                      </>
                    ) : (
                      'No analytical records found.'
                    )}
                  </TableCell>
                  </TableRow>
                ) : (
                  (filteredResults || []).map((result) => {
                    const testMethod = (state.testMethods || []).find(
                      (t) => t.id === result.testMethodId
                    );
                    return (
                      <TableRow key={result.id}>
                        <TableCell>
                          <code className="rounded bg-slate-100 px-2 py-1 text-sm">
                            {result.batchNumber}
                          </code>
                        </TableCell>
                        <TableCell>{result.sampleId}</TableCell>
                        <TableCell>{testMethod?.name || (result.testMethodId?.startsWith('custom:') ? result.testMethodId.slice(7) : (result.testMethodId || 'Unknown'))}</TableCell>
                        <TableCell>{result.analystId}</TableCell>
                        <TableCell>
                          {new Date(result.testDate).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(resultStatusColors[result.overallResult])}
                          >
                            {result.overallResult === 'Pass' && (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            {result.overallResult === 'Fail' && (
                              <XCircle className="mr-1 h-3 w-3" />
                            )}
                            {result.overallResult === 'OOS' && (
                              <AlertTriangle className="mr-1 h-3 w-3" />
                            )}
                            {resultStatusLabels[result.overallResult]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{result.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                        <DataTableActions<TestResult>
                            item={result}
                            onEdit={(_item) => {
                              // Open edit form - implement TestResultEditForm later
                              toast.info('Edit functionality ready - form to be added');
                            }}
                            onDelete={(id) => dispatch({ type: 'DELETE_TEST_RESULT', payload: id })}
                            onView={() => toast.info(`Viewing test results`)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search protocols..." className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSeedMethods} variant="outline" className="border-indigo-200 text-indigo-700">
                <Download className="mr-2 h-4 w-4" />
                Import Standard Methods
              </Button>
              <Button onClick={handleAddMethod} className="bg-indigo-600">
                <Plus className="mr-2 h-4 w-4" />
                New Method
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(state.testMethods || []).map((method) => (
              <Card key={method.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <FlaskConical className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{method.name}</h3>
                        <p className="text-sm text-slate-500">{method.standardProcedure}</p>
                      </div>
                    </div>
                    <Badge variant={method.status === 'Active' ? 'default' : 'secondary'} className={cn(method.status === 'Active' ? 'bg-green-100 text-green-800' : '')}>
                      {method.status === 'Active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Classification:</span>
                      <span className="font-medium">{method.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Parameters:</span>
                      <span className="font-medium">{method.parameters.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Ref Std / USP:</span>
                      <span className="font-medium">{method.pharmacopeiaReference || '-'}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => handleEditMethod(method)}
                  >
                    Manage Method Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="oos" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-red-50">
                <TableRow>
                  <TableHead className="font-bold text-red-900">Batch ID</TableHead>
                  <TableHead className="font-bold text-red-900">Product Name</TableHead>
                  <TableHead className="font-bold text-red-900">Failed Method</TableHead>
                  <TableHead className="font-bold text-red-900">Discovery Date</TableHead>
                  <TableHead className="font-bold text-red-900">Decision</TableHead>
                  <TableHead className="font-bold text-red-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(state.testResults || [])
                  .filter((r) => r.overallResult === 'OOS')
                  .map((result) => {
                    const product = (state.products || []).find((p) => p.id === result.productId);
                    const testMethod = (state.testMethods || []).find(
                      (t) => t.id === result.testMethodId
                    );
                    return (
                      <TableRow key={result.id}>
                        <TableCell>
                          <code className="rounded bg-slate-100 px-2 py-1 text-sm">
                            {result.batchNumber}
                          </code>
                        </TableCell>
                        <TableCell>{product?.name || result.productId}</TableCell>
                        <TableCell>{testMethod?.name || (result.testMethodId?.startsWith('custom:') ? result.testMethodId.slice(7) : (result.testMethodId || 'Unknown'))}</TableCell>
                        <TableCell>
                          {new Date(result.testDate).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">OOS</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {result.status !== 'Completed' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Close OOS"
                                className="text-emerald-600 h-8 w-8 hover:bg-emerald-50"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleCloseOOS(result);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {user?.role === 'admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete Record"
                                className="text-rose-600 h-8 w-8 hover:bg-rose-50"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleDeleteOOS(result.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pharmacopeia">
          <div className="rounded-md border p-8 text-center">
            <FlaskConical className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium">Pharmacopeial Standards Library</h3>
            <p className="text-slate-500 mt-2">
              Access latest monograph specifications from BP, USP, EP and JP.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isMethodFormOpen} onOpenChange={setIsMethodFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">
              {selectedMethod ? 'Edit Specification Method' : 'Register New STP Protocol'}
            </DialogTitle>
          </DialogHeader>
          <TestMethodForm
            testMethod={selectedMethod || undefined}
            onSubmit={handleSubmitMethod}
            onCancel={() => setIsMethodFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isResultFormOpen} onOpenChange={setIsResultFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">Record Analytical Deviation / Result</DialogTitle>
          </DialogHeader>
          <TestResultForm
            products={state.products ?? []}
            testMethods={state.testMethods ?? []}
            preSelectedProductId={preSelectedProductId}
            onSubmit={handleSubmitResult}
            onCancel={() => setIsResultFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
