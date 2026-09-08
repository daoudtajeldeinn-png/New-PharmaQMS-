import { groceryDb } from '../db/groceryDb';
import type {
  GroceryProduct,
  DailySale,
  StockAdjustment,
  InventoryReport,
  DailySalesReport,
  MonthlyReport,
} from '@/types/grocery';

// ==================== State Interface ====================
export interface GroceryState {
  products: GroceryProduct[];
  dailySales: DailySale[];
  stockAdjustments: StockAdjustment[];
  isLoading: boolean;
  error: string | null;
}

// ==================== Initial State ====================
export const initialGroceryState: GroceryState = {
  products: [],
  dailySales: [],
  stockAdjustments: [],
  isLoading: true,
  error: null,
};

// ==================== Action Types ====================
export type GroceryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_DB_DATA'; payload: Partial<GroceryState> }
  | { type: 'SET_PRODUCTS'; payload: GroceryProduct[] }
  | { type: 'ADD_PRODUCT'; payload: GroceryProduct }
  | { type: 'UPDATE_PRODUCT'; payload: GroceryProduct }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_DAILY_SALES'; payload: DailySale[] }
  | { type: 'ADD_DAILY_SALE'; payload: DailySale }
  | { type: 'UPDATE_DAILY_SALE'; payload: DailySale }
  | { type: 'DELETE_DAILY_SALE'; payload: string }
  | { type: 'SET_STOCK_ADJUSTMENTS'; payload: StockAdjustment[] }
  | { type: 'ADD_STOCK_ADJUSTMENT'; payload: StockAdjustment }
  | { type: 'DELETE_STOCK_ADJUSTMENT'; payload: string };

// ==================== Reducer ====================
export function groceryReducer(state: GroceryState, action: GroceryAction): GroceryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_DB_DATA':
      return { ...state, ...action.payload, isLoading: false };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map((p) => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter((p) => p.id !== action.payload) };
    case 'SET_DAILY_SALES':
      return { ...state, dailySales: action.payload };
    case 'ADD_DAILY_SALE':
      return { ...state, dailySales: [action.payload, ...state.dailySales] };
    case 'UPDATE_DAILY_SALE':
      return { ...state, dailySales: state.dailySales.map((s) => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_DAILY_SALE':
      return { ...state, dailySales: state.dailySales.filter((s) => s.id !== action.payload) };
    case 'SET_STOCK_ADJUSTMENTS':
      return { ...state, stockAdjustments: action.payload };
    case 'ADD_STOCK_ADJUSTMENT':
      return { ...state, stockAdjustments: [action.payload, ...state.stockAdjustments] };
    case 'DELETE_STOCK_ADJUSTMENT':
      return { ...state, stockAdjustments: state.stockAdjustments.filter((a) => a.id !== action.payload) };
    default:
      return state;
  }
}

// ==================== Reducer with DB Persistence ====================
export function groceryReducerWithPersistence(state: GroceryState, action: GroceryAction): GroceryState {
  const newState = groceryReducer(state, action);

  try {
    switch (action.type) {
      case 'ADD_PRODUCT':
      case 'UPDATE_PRODUCT':
        groceryDb.products.put(action.payload);
        break;
      case 'DELETE_PRODUCT':
        groceryDb.products.delete(action.payload);
        break;
      case 'ADD_DAILY_SALE':
      case 'UPDATE_DAILY_SALE':
        groceryDb.dailySales.put(action.payload);
        break;
      case 'DELETE_DAILY_SALE':
        groceryDb.dailySales.delete(action.payload);
        break;
      case 'ADD_STOCK_ADJUSTMENT':
        groceryDb.stockAdjustments.put(action.payload);
        break;
      case 'DELETE_STOCK_ADJUSTMENT':
        groceryDb.stockAdjustments.delete(action.payload);
        break;
    }
  } catch (error) {
    console.error('❌ Error saving to IndexedDB:', error);
  }

  return newState;
}

// ==================== Helper Functions ====================
export async function loadGroceryData(): Promise<Partial<GroceryState>> {
  try {
    const [products, dailySales, stockAdjustments] = await Promise.all([
      groceryDb.products.toArray(),
      groceryDb.dailySales.toArray(),
      groceryDb.stockAdjustments.toArray(),
    ]);

    return {
      products,
      dailySales,
      stockAdjustments,
    };
  } catch (error) {
    console.error('❌ Error loading grocery data:', error);
    return {};
  }
}

export function generateInventoryReport(products: GroceryProduct[]): InventoryReport[] {
  return products.map(product => {
    const totalPurchaseValue = product.quantity * product.purchasePrice;
    const totalSellingValue = product.quantity * product.sellingPrice;
    const potentialProfit = totalSellingValue - totalPurchaseValue;
    
    let stockStatus: 'normal' | 'low' | 'out_of_stock' = 'normal';
    if (product.quantity === 0) {
      stockStatus = 'out_of_stock';
    } else if (product.quantity <= product.minimumStock) {
      stockStatus = 'low';
    }

    return {
      productId: product.id,
      productName: product.nameAr,
      currentQuantity: product.quantity,
      unit: product.unit,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      totalPurchaseValue,
      totalSellingValue,
      potentialProfit,
      stockStatus,
    };
  });
}

export function generateDailySalesReport(dailySales: DailySale[], date: Date): DailySalesReport {
  const salesForDate = dailySales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate.toDateString() === date.toDateString();
  });

  const totalSales = salesForDate.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCost = salesForDate.reduce((sum, sale) => {
    const productCost = sale.quantitySold * (sale.sellingPricePerUnit * 0.7); // تقدير التكلفة
    return sum + productCost;
  }, 0);
  const totalProfit = totalSales - totalCost;
  
  const cashSales = salesForDate
    .filter(sale => sale.paymentMethod === 'cash')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);
  
  const bankTransferSales = salesForDate
    .filter(sale => sale.paymentMethod === 'bank_transfer')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  const productsSold = salesForDate.reduce((acc, sale) => {
    const existing = acc.find(p => p.productId === sale.productId);
    if (existing) {
      existing.quantity += sale.quantitySold;
      existing.totalAmount += sale.totalAmount;
    } else {
      acc.push({
        productId: sale.productId,
        productName: sale.productName,
        quantity: sale.quantitySold,
        totalAmount: sale.totalAmount,
      });
    }
    return acc;
  }, [] as Array<{ productId: string; productName: string; quantity: number; totalAmount: number }>);

  return {
    date,
    totalSales,
    totalCost,
    totalProfit,
    cashSales,
    bankTransferSales,
    totalTransactions: salesForDate.length,
    productsSold,
  };
}

export function generateMonthlyReport(dailySales: DailySale[], month: number, year: number): MonthlyReport {
  const salesForMonth = dailySales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate.getMonth() === month && saleDate.getFullYear() === year;
  });

  const totalSales = salesForMonth.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCost = salesForMonth.reduce((sum, sale) => {
    const productCost = sale.quantitySold * (sale.sellingPricePerUnit * 0.7); // تقدير التكلفة
    return sum + productCost;
  }, 0);
  const grossProfit = totalSales - totalCost;
  const expenses = 0; // يمكن إضافة المصروفات لاحقاً
  const netProfit = grossProfit - expenses;
  
  const grossProfitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
  const netProfitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

  return {
    month: monthNames[month],
    year,
    totalSales,
    totalCost,
    grossProfit,
    expenses,
    netProfit,
    grossProfitMargin,
    netProfitMargin,
  };
}