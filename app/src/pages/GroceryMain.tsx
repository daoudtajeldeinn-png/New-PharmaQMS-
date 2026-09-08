import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import GroceryInventory from './GroceryInventory';
import DailySales from './DailySales';
import InventoryReports from './InventoryReports';
import { initialGroceryState, groceryReducerWithPersistence, loadGroceryData } from '@/hooks/groceryStoreReducer';
import type { GroceryProduct, DailySale } from '@/types/grocery';

type View = 'dashboard' | 'inventory' | 'sales' | 'reports';

export default function GroceryMain() {
  const [state, setState] = useState(initialGroceryState);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await loadGroceryData();
    setState({ ...state, ...data, isLoading: false });
  };

  const handleAddSale = (sale: DailySale) => {
    const action = { type: 'ADD_DAILY_SALE' as const, payload: sale };
    const newState = groceryReducerWithPersistence(state, action);
    setState(newState);
  };

  const handleDeleteSale = (saleId: string) => {
    const action = { type: 'DELETE_DAILY_SALE' as const, payload: saleId };
    const newState = groceryReducerWithPersistence(state, action);
    setState(newState);
  };

  const handleProductChange = (newProducts: GroceryProduct[]) => {
    setState({ ...state, products: newProducts });
  };

  const SidebarItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <Button
      variant={currentView === view ? 'default' : 'ghost'}
      className={cn(
        'w-full justify-start gap-3',
        currentView === view ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
      )}
      onClick={() => setCurrentView(view)}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Button>
  );

  const DashboardContent = () => {
    const totalProducts = state.products.length;
    const totalValue = state.products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
    const todaySales = state.dailySales
      .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const lowStock = state.products.filter(p => p.quantity <= p.minimumStock).length;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
    };

    return (
      <div className="space-y-6" dir="rtl">
        <h2 className="text-2xl font-bold">لوحة التحكم</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-600 mb-1">إجمالي المنتجات</div>
                  <div className="text-3xl font-bold text-blue-700">{totalProducts}</div>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-600 mb-1">قيمة المخزون</div>
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(totalValue)}</div>
                </div>
                <LayoutDashboard className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-600 mb-1">مبيعات اليوم</div>
                  <div className="text-2xl font-bold text-purple-700">{formatCurrency(todaySales)}</div>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-yellow-600 mb-1">تنبيهات المخزون</div>
                  <div className="text-3xl font-bold text-yellow-700">{lowStock}</div>
                </div>
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">منتجات منخفضة المخزون</h3>
            {state.products.filter(p => p.quantity <= p.minimumStock).length === 0 ? (
              <div className="text-center text-slate-500 py-4">لا توجد منتجات منخفضة المخزون</div>
            ) : (
              <div className="space-y-2">
                {state.products
                  .filter(p => p.quantity <= p.minimumStock)
                  .slice(0, 5)
                  .map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-semibold">{product.nameAr}</div>
                        <div className="text-sm text-slate-600">متوفر: {product.quantity} {product.unit}</div>
                      </div>
                      <div className="text-yellow-600 font-semibold">
                        {product.quantity === 0 ? 'نفذ' : 'منخفض'}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-l border-slate-200 p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-indigo-600">نظام البقالة</h1>
          <p className="text-sm text-slate-500">إدارة المخزون والمبيعات</p>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem view="dashboard" icon={LayoutDashboard} label="لوحة التحكم" />
          <SidebarItem view="inventory" icon={Package} label="إدارة المخزون" />
          <SidebarItem view="sales" icon={ShoppingCart} label="المبيعات اليومية" />
          <SidebarItem view="reports" icon={FileText} label="التقارير" />
        </nav>

        <div className="pt-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700">
            <LogOut className="h-5 w-5" />
            خروج
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {currentView === 'dashboard' && <DashboardContent />}
          {currentView === 'inventory' && (
            <GroceryInventory 
              products={state.products}
              onProductsChange={handleProductChange}
            />
          )}
          {currentView === 'sales' && (
            <DailySales
              products={state.products}
              dailySales={state.dailySales}
              onAddSale={handleAddSale}
              onDeleteSale={handleDeleteSale}
            />
          )}
          {currentView === 'reports' && (
            <InventoryReports
              products={state.products}
              dailySales={state.dailySales}
            />
          )}
        </div>
      </div>
    </div>
  );
}