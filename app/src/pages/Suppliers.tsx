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
import { Card, CardContent } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Plus, Search, Truck, Star, Calendar, FileText, CheckCircle, AlertTriangle, Phone, Mail, MapPin } from 'lucide-react';
import type { Supplier } from '@/types';
import { cn } from '@/lib/utils';

const qualificationStatusColors = {
  Approved: 'bg-green-100 text-green-800 border-green-300',
  Conditional: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Pending: 'bg-blue-100 text-blue-800 border-blue-300',
  Rejected: 'bg-red-100 text-red-800 border-red-300',
};

const qualificationStatusLabels = {
  Approved: 'Approved',
  Conditional: 'Conditional',
  Pending: 'Pending',
  Rejected: 'Rejected',
};

const supplierTypeLabels: Record<string, string> = {
  API: 'Active Ingredient',
  Excipient: 'Excipient / Inactive',
  Packaging: 'Packaging Material',
  Equipment: 'Equipment / Spares',
  Service: 'Service Provider',
  Laboratory: 'Calibration / Lab',
};

export function SuppliersPage() {
  const { state } = useStore();
  const now = useMemo(() => Date.now(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = state.suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || supplier.qualificationStatus === statusFilter;
    const matchesType = typeFilter === 'all' || supplier.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const totalSuppliers = state.suppliers.length;
  const approvedSuppliers = state.suppliers.filter(s => s.qualificationStatus === 'Approved').length;
  const pendingSuppliers = state.suppliers.filter(s => s.qualificationStatus === 'Pending').length;
  const avgRating = state.suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / totalSuppliers || 0;

  const getAuditStatus = (supplier: Supplier) => {
    if (!supplier.nextAuditDate) return null;
    const daysUntil = Math.ceil((new Date(supplier.nextAuditDate).getTime() - now) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return { label: 'Overdue', color: 'text-red-600' };
    if (daysUntil <= 30) return { label: `${daysUntil} days`, color: 'text-yellow-600' };
    return { label: `${daysUntil} days`, color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approved Suppliers List (ASL)</h1>
          <p className="text-slate-500">Managing Materials & Service Provider Qualifications</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600">
          <Plus className="mr-2 h-4 w-4" />
          Register New Supplier
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Suppliers</p>
                <p className="text-2xl font-bold">{totalSuppliers}</p>
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
                <p className="text-sm text-slate-500">Approved</p>
                <p className="text-2xl font-bold">{approvedSuppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold">{pendingSuppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg Compliance Score</p>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by company name or contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Qualification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Qualifications</SelectItem>
            {Object.entries(qualificationStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(supplierTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">Company Name</TableHead>
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold">Main Products</TableHead>
              <TableHead className="font-bold">Qualification</TableHead>
              <TableHead className="font-bold">Rating</TableHead>
              <TableHead className="font-bold text-center">Next Audit Due</TableHead>
              <TableHead className="font-bold text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                  No suppliers matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => {
                const auditStatus = getAuditStatus(supplier);
                return (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-slate-500">{supplier.contactPerson}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{supplierTypeLabels[supplier.type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {supplier.products.slice(0, 2).map((product, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{product}</Badge>
                        ))}
                        {supplier.products.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{supplier.products.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(qualificationStatusColors[supplier.qualificationStatus])}>
                        {qualificationStatusLabels[supplier.qualificationStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supplier.rating ? (
                        <div className="flex items-center gap-2">
                          <Progress value={supplier.rating} className="w-16 h-2" />
                          <span className="text-sm">{supplier.rating}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {auditStatus ? (
                        <span className={cn("text-sm", auditStatus.color)}>
                          {auditStatus.label}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={supplier.status === 'Active' ? 'default' : 'secondary'} className={supplier.status === 'Active' ? 'bg-indigo-100 text-indigo-700' : ''}>
                        {supplier.status === 'Active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Supplier Details Dialog */}
      <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {selectedSupplier?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Category:</span>
                  <Badge variant="outline" className="ml-2 bg-slate-50">
                    {supplierTypeLabels[selectedSupplier.type]}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-500">Qualification:</span>
                  <Badge variant="outline" className={cn("ml-2", qualificationStatusColors[selectedSupplier.qualificationStatus])}>
                    {qualificationStatusLabels[selectedSupplier.qualificationStatus]}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-slate-500 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Office Address:
                </span>
                <p className="font-medium">{selectedSupplier.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone / Contact:
                  </span>
                  <p>{selectedSupplier.phone}</p>
                </div>
                <div>
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Corporate Email:
                  </span>
                  <p>{selectedSupplier.email}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Approved Products List:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSupplier.products.map((product, idx) => (
                    <Badge key={idx} variant="secondary">{product}</Badge>
                  ))}
                </div>
              </div>

              {selectedSupplier.rating && (
                <div>
                  <span className="text-slate-500">Supplier Quality Rating:</span>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={selectedSupplier.rating} className="w-32 h-3" />
                    <span className="font-medium">{selectedSupplier.rating}/100</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedSupplier.auditDate && (
                  <div>
                    <span className="text-slate-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Last Audit Performed:
                    </span>
                    <p>{new Date(selectedSupplier.auditDate).toLocaleDateString('en-GB')}</p>
                  </div>
                )}
                {selectedSupplier.nextAuditDate && (
                  <div>
                    <span className="text-slate-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Next Re-Audit Due:
                    </span>
                    <p>{new Date(selectedSupplier.nextAuditDate).toLocaleDateString('en-GB')}</p>
                  </div>
                )}
              </div>

              {selectedSupplier.documents.length > 0 && (
                <div>
                  <span className="text-slate-500 font-bold underline">Certification & Documents:</span>
                  <div className="mt-2 space-y-2">
                    {selectedSupplier.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span>{doc.name}</span>
                        {doc.expiryDate && (
                          <span className="text-sm text-slate-500">
                            (Expires: {new Date(doc.expiryDate).toLocaleDateString('en-GB')})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Supplier Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">Register New Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input placeholder="Enter legal company name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category Category *</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="API">Active Ingredient</SelectItem>
                    <SelectItem value="Excipient">Excipient / Inactive</SelectItem>
                    <SelectItem value="Packaging">Packaging Material</SelectItem>
                    <SelectItem value="Equipment">Equipment / Spares</SelectItem>
                    <SelectItem value="Service">Service Provider</SelectItem>
                    <SelectItem value="Laboratory">Calibration / Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact Personnel</Label>
                <Input placeholder="e.g. Sales Manager" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Headquarters Address</Label>
              <Input placeholder="Enter full address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Corporate Email</Label>
                <Input type="email" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Primary Phone</Label>
                <Input placeholder="+XXX XXXXXXXX" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6 mt-4 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel Registration</Button>
            <Button onClick={() => setIsFormOpen(false)} className="bg-indigo-600 px-8">Save Record</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
