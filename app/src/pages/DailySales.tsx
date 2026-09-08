import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Search, Calendar, DollarSign, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast, Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import type { DailySale, PaymentMethod, GroceryProduct } from '@/types/grocery';

interface DailySalesProps {
  products: GroceryProduct[];
  dailySales: DailySale[];
  onAddSale: (sale: DailySale) => void;
  onDeleteSale: (saleId: string) => void;
}

export default function DailySales({ products, dailySales, onAddSale, onDeleteSale }: DailySalesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const [saleForm, setSaleForm] = useState({
    productId: '',
    quantitySold: 0,
    paymentMethod: 'cash' as PaymentMethod,
    customerName: '',
    customerPhone: '',
    notes: '',
  });

  const filteredSales = useMemo(() => {
    return dailySales.filter(sale => {
      const saleDate = new Date(sale.date).toISOString().split('T')[0];
      const matchesDate = saleDate === selectedDate;
      const matchesSearch = searchTerm === '' || 
        sale.productName.includes(searchTerm) ||
        sale.customerName?.includes(searchTerm);
      return matchesDate && matchesSearch;
    });
  }, [dailySales, selectedDate, searchTerm]);

  const dailyStats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const cashSales = filteredSales
      .filter(sale => sale.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const bankTransferSales = filteredSales
      .filter(sale => sale.paymentMethod === 'bank_transfer')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTransactions = filteredSales.length;

    return { totalSales, cashSales, bankTransferSales, totalTransactions };
  }, [filteredSales]);

  const handleAddSale = () => {
    if (!saleForm.productId) {
      toast.error('يرجى اختيار المنتج');
      return;
    }

    if (saleForm.quantitySold <= 0) {
      toast.error('يرجى إدخال كمية صحيحة');
      return;
    }

    const product = products.find(p => p.id === saleForm.productId);
    if (!product) {
      toast.error('المنتج غير موجود');
      return;
    }

    if (saleForm.quantitySold > product.quantity) {
      toast.error('الكمية المطلوبة أكبر من المتوفر في المخزون');
      return;
    }

    const newSale: DailySale = {
      id: `SALE-${Date.now()}`,
      date: new Date(selectedDate),
      productId: product.id,
      productName: product.nameAr,
      quantitySold: saleForm.quantitySold,
      unit: product.unit,
      sellingPricePerUnit: product.sellingPrice,
      totalAmount: saleForm.quantitySold * product.sellingPrice,
      paymentMethod: saleForm.paymentMethod,
      customerName: saleForm.customerName || undefined,
      customerPhone: saleForm.customerPhone || undefined,
      notes: saleForm.notes || undefined,
      recordedBy: 'Admin',
      timestamp: new Date(),
    };

    onAddSale(newSale);
    setIsDialogOpen(false);
    setSaleForm({
      productId: '',
      quantitySold: 0,
      paymentMethod: 'cash',
      customerName: '',
      customerPhone: '',
      notes: '',
    });
    toast.success('تم تسجيل البيع بنجاح');
  };

  const handleDeleteSale = (saleId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا البيع؟')) {
      onDeleteSale(saleId);
      toast.success('تم حذف البيع بنجاح');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المبيعات اليومية</h1>
          <p className="text-slate-500 text-sm">تسجيل المبيعات اليومية (نقد وتحويل بنكي)</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-indigo-600">
          <Plus className="h-4 w-4 ml-2" /> تسجيل بيع جديد
        </Button>
      </div>

      {/* Date Selection and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">التاريخ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">إجمالي المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-700">{formatCurrency(dailyStats.totalSales)}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">مبيعات نقد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div className="text-xl font-bold text-blue-700">{formatCurrency(dailyStats.cashSales)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-600">تحويل بنكي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <div className="text-xl font-bold text-purple-700">{formatCurrency(dailyStats.bankTransferSales)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="بحث بالمنتج أو العميل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            مبيعات {formatDate(selectedDate)}
            <Badge variant="secondary">{dailyStats.totalTransactions} عملية</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              لا توجد مبيعات لهذا التاريخ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">المنتج</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">الكمية</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">الوحدة</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">سعر الوحدة</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">الإجمالي</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">طريقة الدفع</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">العميل</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">الوقت</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => (
                    <tr key={sale.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-semibold">{sale.productName}</td>
                      <td className="p-3">{sale.quantitySold}</td>
                      <td className="p-3 text-sm">{sale.unit}</td>
                      <td className="p-3 text-sm">{formatCurrency(sale.sellingPricePerUnit)}</td>
                      <td className="p-3 font-semibold text-green-600">{formatCurrency(sale.totalAmount)}</td>
                      <td className="p-3">
                        <Badge
                          variant={sale.paymentMethod === 'cash' ? 'default' : 'secondary'}
                          className={sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                        >
                          {sale.paymentMethod === 'cash' ? 'نقد' : 'تحويل بنكي'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">
                        {sale.customerName ? (
                          <div>
                            <div>{sale.customerName}</div>
                            {sale.customerPhone && <div className="text-slate-500">{sale.customerPhone}</div>}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(sale.timestamp).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Sale Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل بيع جديد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label>المنتج</Label>
              <Select
                value={saleForm.productId}
                onValueChange={(value) => setSaleForm({ ...saleForm, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنتج" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.quantity > 0).map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nameAr} - متوفر: {product.quantity} {product.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {saleForm.productId && (() => {
              const product = products.find(p => p.id === saleForm.productId);
              if (!product) return null;
              return (
                <div className="col-span-2 bg-slate-50 p-3 rounded-lg">
                  <div className="text-sm text-slate-600">
                    <div><strong>سعر البيع:</strong> {formatCurrency(product.sellingPrice)} / {product.unit}</div>
                    <div><strong>المتوفر:</strong> {product.quantity} {product.unit}</div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input
                type="number"
                value={saleForm.quantitySold}
                onChange={(e) => setSaleForm({ ...saleForm, quantitySold: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={saleForm.paymentMethod}
                onValueChange={(value: PaymentMethod) => setSaleForm({ ...saleForm, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقد</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>اسم العميل (اختياري)</Label>
              <Input
                value={saleForm.customerName}
                onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                placeholder="اسم العميل"
              />
            </div>

            <div className="space-y-2">
              <Label>رقم الهاتف (اختياري)</Label>
              <Input
                value={saleForm.customerPhone}
                onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                placeholder="رقم الهاتف"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>ملاحظات (اختياري)</Label>
              <Input
                value={saleForm.notes}
                onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>

            {saleForm.productId && saleForm.quantitySold > 0 && (() => {
              const product = products.find(p => p.id === saleForm.productId);
              if (!product) return null;
              const total = saleForm.quantitySold * product.sellingPrice;
              return (
                <div className="col-span-2 bg-green-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-green-700">
                    الإجمالي: {formatCurrency(total)}
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddSale} className="bg-indigo-600">
              تسجيل البيع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}