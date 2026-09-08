import { useState, useMemo } from 'react';
import { FileText, TrendingUp, Calendar, Download, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GroceryProduct, MonthlyReport, InventoryReport } from '@/types/grocery';
import { generateMonthlyReport, generateInventoryReport } from '@/hooks/groceryStoreReducer';

interface InventoryReportsProps {
  products: GroceryProduct[];
  dailySales: any[];
}

export default function InventoryReports({ products, dailySales }: InventoryReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'inventory' | 'monthly'>('inventory');

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const inventoryReport = useMemo(() => {
    return generateInventoryReport(products);
  }, [products]);

  const monthlyReport = useMemo(() => {
    return generateMonthlyReport(dailySales, selectedMonth, selectedYear);
  }, [dailySales, selectedMonth, selectedYear]);

  const inventoryStats = useMemo(() => {
    const totalProducts = inventoryReport.length;
    const lowStock = inventoryReport.filter(r => r.stockStatus === 'low').length;
    const outOfStock = inventoryReport.filter(r => r.stockStatus === 'out_of_stock').length;
    const totalValue = inventoryReport.reduce((sum, r) => sum + r.totalPurchaseValue, 0);
    const totalSellingValue = inventoryReport.reduce((sum, r) => sum + r.totalSellingValue, 0);
    const potentialProfit = inventoryReport.reduce((sum, r) => sum + r.potentialProfit, 0);

    return { totalProducts, lowStock, outOfStock, totalValue, totalSellingValue, potentialProfit };
  }, [inventoryReport]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  const getStockStatusBadge = (status: 'normal' | 'low' | 'out_of_stock') => {
    switch (status) {
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="h-3 w-3 ml-1" />نفذ</Badge>;
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="h-3 w-3 ml-1" />منخفض</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 ml-1" />متوفر</Badge>;
    }
  };

  const handleExportReport = () => {
    // Simple CSV export
    let csv = '';
    
    if (reportType === 'inventory') {
      csv = 'المنتج,الكمية,الوحدة,سعر الشراء,سعر البيع,قيمة الشراء,قيمة البيع,الربح المحتمل,الحالة\n';
      inventoryReport.forEach(r => {
        csv += `"${r.productName}",${r.currentQuantity},${r.unit},${r.purchasePrice},${r.sellingPrice},${r.totalPurchaseValue},${r.totalSellingValue},${r.potentialProfit},${r.stockStatus}\n`;
      });
    } else {
      csv = `تقرير شهر ${months[selectedMonth]} ${selectedYear}\n`;
      csv += `المبيعات,${monthlyReport.totalSales}\n`;
      csv += `التكلفة,${monthlyReport.totalCost}\n`;
      csv += `مجمل الربح,${monthlyReport.grossProfit}\n`;
      csv += `المصروفات,${monthlyReport.expenses}\n`;
      csv += `صافي الربح,${monthlyReport.netProfit}\n`;
      csv += `هامش مجمل الربح,${monthlyReport.grossProfitMargin.toFixed(2)}%\n`;
      csv += `هامش صافي الربح,${monthlyReport.netProfitMargin.toFixed(2)}%\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${reportType}_${months[selectedMonth]}_${selectedYear}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">التقارير والجرد</h1>
          <p className="text-slate-500 text-sm">تقارير المخزون والمبيعات الشهرية</p>
        </div>
        <div className="flex gap-2">
          <Select value={reportType} onValueChange={(value: 'inventory' | 'monthly') => setReportType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inventory">تقرير المخزون</SelectItem>
              <SelectItem value="monthly">التقرير الشهري</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport} variant="outline">
            <Download className="h-4 w-4 ml-2" /> تصدير
          </Button>
        </div>
      </div>

      {reportType === 'inventory' ? (
        <>
          {/* Inventory Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-600">إجمالي المنتجات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{inventoryStats.totalProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">قيمة المخزون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-700">{formatCurrency(inventoryStats.totalValue)}</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-purple-600">قيمة البيع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-700">{formatCurrency(inventoryStats.totalSellingValue)}</div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-600">الربح المحتمل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-emerald-700">{formatCurrency(inventoryStats.potentialProfit)}</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-yellow-600">مخزون منخفض</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{inventoryStats.lowStock}</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600">نفذ من المخزون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{inventoryStats.outOfStock}</div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                تقرير المخزون الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-right p-3 text-sm font-semibold text-slate-700">المنتج</th>
                      <th className="text-right p-3 text-sm font-semibold text-slate-700">الكمية</th>
                      <th className="text-right p-3 text-sm font-semibold text-slate-700">الوحدة</th>
                      <th className="text-right p-3 text-sm font-semibold text-slate-700">سعر الشراء</th>
                      <th className="text-right p-3 text-sm font-semibold text-slate-700">سعر البيع</th>
                      <th className="text-right p-3 text-sm font-semibold text-slate-700">قيمة الشراء</th>
                      <th className="text-right p-3 text-sm font-semibold text-slate-700">قيمة البيع</th>
                      <th className="text-right p-3 text-sm font-semibold text-slate-700">الربح المحتمل</th>
                      <th className="text-right p-3 text-sm font-semibold text-slate-700">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryReport.map((report, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-semibold">{report.productName}</td>
                        <td className="p-3">{report.currentQuantity}</td>
                        <td className="p-3 text-sm">{report.unit}</td>
                        <td className="p-3 text-sm">{formatCurrency(report.purchasePrice)}</td>
                        <td className="p-3 text-sm">{formatCurrency(report.sellingPrice)}</td>
                        <td className="p-3 text-sm font-semibold">{formatCurrency(report.totalPurchaseValue)}</td>
                        <td className="p-3 text-sm font-semibold">{formatCurrency(report.totalSellingValue)}</td>
                        <td className="p-3 text-sm font-semibold text-green-600">{formatCurrency(report.potentialProfit)}</td>
                        <td className="p-3">{getStockStatusBadge(report.stockStatus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Month Selection */}
          <div className="flex gap-4">
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2025, 2026, 2027, 2028].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Report Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                التقرير الشهري - {months[selectedMonth]} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">المبيعات</div>
                  <div className="text-2xl font-bold text-blue-700">{formatCurrency(monthlyReport.totalSales)}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-red-600 mb-1">تكلفة المبيعات</div>
                  <div className="text-2xl font-bold text-red-700">{formatCurrency(monthlyReport.totalCost)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">مجمل الربح</div>
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(monthlyReport.grossProfit)}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1">صافي الربح</div>
                  <div className="text-2xl font-bold text-purple-700">{formatCurrency(monthlyReport.netProfit)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 mb-1">المصروفات</div>
                  <div className="text-2xl font-bold text-orange-700">{formatCurrency(monthlyReport.expenses)}</div>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <div className="text-sm text-teal-600 mb-1">هامش مجمل الربح</div>
                  <div className="text-2xl font-bold text-teal-700">{monthlyReport.grossProfitMargin.toFixed(2)}%</div>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <div className="text-sm text-cyan-600 mb-1">هامش صافي الربح</div>
                  <div className="text-2xl font-bold text-cyan-700">{monthlyReport.netProfitMargin.toFixed(2)}%</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">حالة</div>
                  <div className="text-2xl font-bold text-slate-700">
                    {monthlyReport.netProfit >= 0 ? (
                      <span className="text-green-600">إيجابي</span>
                    ) : (
                      <span className="text-red-600">سلبي</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Table */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">ملخص التقرير</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">المبيعات</td>
                      <td className="p-2 text-left font-semibold">{formatCurrency(monthlyReport.totalSales)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">تكلفة المبيعات</td>
                      <td className="p-2 text-left font-semibold">{formatCurrency(monthlyReport.totalCost)}</td>
                    </tr>
                    <tr className="border-b bg-green-50">
                      <td className="p-2 font-semibold">مجمل الربح</td>
                      <td className="p-2 text-left font-semibold text-green-700">{formatCurrency(monthlyReport.grossProfit)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">المصروفات</td>
                      <td className="p-2 text-left font-semibold">{formatCurrency(monthlyReport.expenses)}</td>
                    </tr>
                    <tr className="bg-purple-50">
                      <td className="p-2 font-bold">صافي الربح</td>
                      <td className="p-2 text-left font-bold text-purple-700">{formatCurrency(monthlyReport.netProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}