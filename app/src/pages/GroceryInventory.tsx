import { useState, useMemo, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast, Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import type { GroceryProduct, ProductUnit } from '@/types/grocery';

interface GroceryInventoryProps {
  products: GroceryProduct[];
  onProductsChange?: (products: GroceryProduct[]) => void;
}

const PRODUCT_UNITS: { value: ProductUnit; label: string; labelAr: string }[] = [
  { value: 'kg', label: 'Kilogram', labelAr: 'كيلوغرام' },
  { value: 'gram', label: 'Gram', labelAr: 'غرام' },
  { value: 'liter', label: 'Liter', labelAr: 'لتر' },
  { value: 'ml', label: 'Milliliter', labelAr: 'مليلتر' },
  { value: 'piece', label: 'Piece', labelAr: 'قطعة' },
  { value: 'box', label: 'Box', labelAr: 'صندوق' },
  { value: 'bag', label: 'Bag', labelAr: 'كيس' },
  { value: 'carton', label: 'Carton', labelAr: 'كرتونة' },
  { value: 'pack', label: 'Pack', labelAr: 'عبوة' },
  { value: 'bottle', label: 'Bottle', labelAr: 'زجاجة' },
  { value: 'jar', label: 'Jar', labelAr: 'جرة' },
  { value: 'Other', label: 'Other', labelAr: 'أخرى' },
];

export default function GroceryInventory({ products: initialProducts, onProductsChange }: GroceryInventoryProps) {
  const [products, setProducts] = useState<GroceryProduct[]>(initialProducts);
  
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GroceryProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [productForm, setProductForm] = useState({
    name: '',
    nameAr: '',
    category: '',
    unit: 'piece' as ProductUnit,
    purchasePrice: 0,
    sellingPrice: 0,
    quantity: 0,
    minimumStock: 0,
    notes: '',
  });

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.nameAr.includes(searchTerm);
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).filter(Boolean);
  }, [products]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.quantity <= p.minimumStock && p.quantity > 0).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
    const potentialProfit = products.reduce((sum, p) => {
      return sum + (p.quantity * (p.sellingPrice - p.purchasePrice));
    }, 0);

    return { totalProducts, lowStock, outOfStock, totalValue, potentialProfit };
  }, [products]);

  const handleOpenDialog = (product?: GroceryProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        nameAr: product.nameAr,
        category: product.category,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        quantity: product.quantity,
        minimumStock: product.minimumStock,
        notes: product.notes || '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        nameAr: '',
        category: '',
        unit: 'piece',
        purchasePrice: 0,
        sellingPrice: 0,
        quantity: 0,
        minimumStock: 0,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.nameAr) {
      toast.error('يرجى إدخال اسم المنتج بالعربية والإنجليزية');
      return;
    }

    if (productForm.purchasePrice <= 0 || productForm.sellingPrice <= 0) {
      toast.error('يرجى إدخال أسعار صحيحة');
      return;
    }

    if (editingProduct) {
      // Update existing product
      const updatedProduct: GroceryProduct = {
        ...editingProduct,
        ...productForm,
        updatedAt: new Date(),
      };
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      toast.success('تم تحديث المنتج بنجاح');
    } else {
      // Add new product
      const newProduct: GroceryProduct = {
        id: `PROD-${Date.now()}`,
        ...productForm,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProducts([...products, newProduct]);
      toast.success('تم إضافة المنتج بنجاح');
    }

    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setProducts(products.filter(p => p.id !== productId));
      toast.success('تم حذف المنتج بنجاح');
    }
  };

  const getStockStatus = (product: GroceryProduct) => {
    if (product.quantity === 0) return { status: 'out', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' };
    if (product.quantity <= product.minimumStock) return { status: 'low', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'normal', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة المخزون</h1>
          <p className="text-slate-500 text-sm">إدارة المنتجات والأسعار والكميات</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-indigo-600">
          <Plus className="h-4 w-4 ml-2" /> إضافة منتج جديد
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">إجمالي المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">قيمة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-700">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-600">الربح المحتمل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-700">{formatCurrency(stats.potentialProfit)}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600">مخزون منخفض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">نفذ من المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.outOfStock}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="بحث بالاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التصنيفات</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">المنتج</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">التصنيف</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">الوحدة</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">سعر الشراء</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">سعر البيع</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">الكمية</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">الحالة</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">الإجمالي</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const stockStatus = getStockStatus(product);
                  const StatusIcon = stockStatus.icon;
                  const totalValue = product.quantity * product.purchasePrice;

                  return (
                    <tr key={product.id} className="border-b hover:bg-slate-50">
                      <td className="p-3">
                        <div>
                          <div className="font-semibold">{product.nameAr}</div>
                          <div className="text-sm text-slate-500">{product.name}</div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{product.category || '-'}</td>
                      <td className="p-3 text-sm">
                        {PRODUCT_UNITS.find(u => u.value === product.unit)?.labelAr || product.unit}
                      </td>
                      <td className="p-3 text-sm font-semibold">{formatCurrency(product.purchasePrice)}</td>
                      <td className="p-3 text-sm font-semibold text-green-600">{formatCurrency(product.sellingPrice)}</td>
                      <td className="p-3 text-sm font-semibold">{product.quantity}</td>
                      <td className="p-3">
                        <Badge className={cn(stockStatus.bg, stockStatus.color)}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {stockStatus.status === 'out' ? 'نفذ' : stockStatus.status === 'low' ? 'منخفض' : 'متوفر'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm font-semibold">{formatCurrency(totalValue)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>اسم المنتج (عربي)</Label>
              <Input
                value={productForm.nameAr}
                onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                placeholder="مثال: شاي"
              />
            </div>
            <div className="space-y-2">
              <Label>اسم المنتج (إنجليزي)</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="مثال: Tea"
              />
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Input
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="مثال: مشروبات"
              />
            </div>
            <div className="space-y-2">
              <Label>الوحدة</Label>
              <Select
                value={productForm.unit}
                onValueChange={(value: ProductUnit) => setProductForm({ ...productForm, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>سعر الشراء (سعر الدراوج)</Label>
              <Input
                type="number"
                value={productForm.purchasePrice}
                onChange={(e) => setProductForm({ ...productForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>سعر البيع (سعر البيوع)</Label>
              <Input
                type="number"
                value={productForm.sellingPrice}
                onChange={(e) => setProductForm({ ...productForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>الكمية الحالية</Label>
              <Input
                type="number"
                value={productForm.quantity}
                onChange={(e) => setProductForm({ ...productForm, quantity: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>الحد الأدنى للمخزون</Label>
              <Input
                type="number"
                value={productForm.minimumStock}
                onChange={(e) => setProductForm({ ...productForm, minimumStock: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>ملاحظات</Label>
              <Input
                value={productForm.notes}
                onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveProduct} className="bg-indigo-600">
              {editingProduct ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}