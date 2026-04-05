import { useState, useMemo } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  FlaskConical,
} from 'lucide-react';
import type { PharmaceuticalProduct, ProductStatus } from '@/types';
import { cn } from '@/lib/utils';

interface ProductTableProps {
  products: PharmaceuticalProduct[];
  onEdit: (product: PharmaceuticalProduct) => void;
  onDelete: (product: PharmaceuticalProduct) => void;
  onView: (product: PharmaceuticalProduct) => void;
  onTest: (product: PharmaceuticalProduct) => void;
}

const statusColors: Record<ProductStatus, string> = {
  Quarantine: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Approved: 'bg-green-100 text-green-800 border-green-300',
  Rejected: 'bg-red-100 text-red-800 border-red-300',
  Released: 'bg-blue-100 text-blue-800 border-blue-300',
  Blocked: 'bg-gray-100 text-gray-800 border-gray-300',
  Expired: 'bg-red-100 text-red-800 border-red-300',
  Under_Test: 'bg-purple-100 text-purple-800 border-purple-300',
};

const statusLabels: Record<ProductStatus, string> = {
  Quarantine: 'Quarantine',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Released: 'Released',
  Blocked: 'Blocked',
  Expired: 'Expired',
  Under_Test: 'Under Test',
};

const categoryLabels: Record<string, string> = {
  API: 'API / Raw Material',
  Finished_Product: 'Finished Product',
  Excipient: 'Excipient/Additive',
  Packaging_Material: 'Packaging Component',
  Intermediate: 'Process Intermediate',
  Biological: 'Biological Substance',
  Vaccine: 'Immunological/Vaccine',
  Herbal: 'Phytotherapeutical/Herbal',
  Radiopharmaceutical: 'Radiopharmaceutical',
  Other: 'Miscellaneous/Other',
};

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onView,
  onTest,
}: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const now = useMemo(() => Date.now(), []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getExpiryStatus = (expiryDate: Date) => {
    const daysUntil = Math.ceil(
      (new Date(expiryDate).getTime() - now) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return { label: 'Expired', color: 'text-red-600 font-bold' };
    if (daysUntil <= 30) return { label: `${daysUntil} days left`, color: 'text-red-500 font-medium' };
    if (daysUntil <= 90) return { label: `${daysUntil} days left`, color: 'text-amber-600' };
    return { label: `${daysUntil} days (Good)`, color: 'text-emerald-600' };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, batch, or manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 shadow-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dispositions</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Product Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="uppercase tracking-tighter text-[11px] font-black">
              <TableHead>Product Identity</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Batch ID</TableHead>
              <TableHead>Qty On Hand</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead>EXP Health</TableHead>
              <TableHead>Pharmacopeia</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400 italic">
                  No pharmaceutical materials found matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const expiryStatus = getExpiryStatus(product.expiryDate);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-slate-500">
                          {product.genericName}
                        </p>
                        {product.brandName && (
                          <p className="text-xs text-slate-400">
                            {product.brandName}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[product.category] || product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-slate-100 px-2 py-1 text-sm dark:bg-slate-800">
                        {product.batchNumber}
                      </code>
                    </TableCell>
                    <TableCell>
                      {product.quantity.toLocaleString()} {product.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-medium',
                          statusColors[product.status]
                        )}
                      >
                        {statusLabels[product.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-sm', expiryStatus.color)}>
                        {expiryStatus.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.pharmacopeiaStandard}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(product)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Specifications
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Records
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onTest(product)}>
                            <FlaskConical className="mr-2 h-4 w-4" />
                            Perform QC Test
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(product)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400 font-medium">
        <p>
          Showing {filteredProducts.length} of {products.length} cataloged items.
        </p>
      </div>
    </div>
  );
}
