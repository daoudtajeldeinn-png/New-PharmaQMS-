// أنواع البيانات لنظام البقالة والمخزون

export type ProductUnit = 'kg' | 'gram' | 'liter' | 'ml' | 'piece' | 'box' | 'bag' | 'carton' | 'pack' | 'bottle' | 'jar' | 'Other'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'other'

export interface GroceryProduct {
  id: string
  name: string
  nameAr: string
  category: string
  unit: ProductUnit
  purchasePrice: number // سعر الدراوج (سعر الشراء)
  sellingPrice: number // سعر البيوع (سعر البيع)
  quantity: number // الكمية الحالية
  minimumStock: number // الحد الأدنى للمخزون
  createdAt: Date
  updatedAt: Date
  notes?: string
}

export interface DailySale {
  id: string
  date: Date
  productId: string
  productName: string
  quantitySold: number
  unit: ProductUnit
  sellingPricePerUnit: number
  totalAmount: number
  paymentMethod: PaymentMethod
  customerName?: string
  customerPhone?: string
  notes?: string
  recordedBy: string
  timestamp: Date
}

export interface StockAdjustment {
  id: string
  productId: string
  productName: string
  adjustmentType: 'add' | 'subtract' | 'set'
  previousQuantity: number
  newQuantity: number
  adjustmentAmount: number
  reason: string
  performedBy: string
  timestamp: Date
}

export interface InventoryReport {
  productId: string
  productName: string
  currentQuantity: number
  unit: ProductUnit
  purchasePrice: number
  sellingPrice: number
  totalPurchaseValue: number
  totalSellingValue: number
  potentialProfit: number
  stockStatus: 'normal' | 'low' | 'out_of_stock'
}

export interface DailySalesReport {
  date: Date
  totalSales: number
  totalCost: number
  totalProfit: number
  cashSales: number
  bankTransferSales: number
  totalTransactions: number
  productsSold: Array<{
    productId: string
    productName: string
    quantity: number
    totalAmount: number
  }>
}

export interface MonthlyReport {
  month: string
  year: number
  totalSales: number
  totalCost: number
  grossProfit: number
  expenses: number
  netProfit: number
  grossProfitMargin: number
  netProfitMargin: number
}