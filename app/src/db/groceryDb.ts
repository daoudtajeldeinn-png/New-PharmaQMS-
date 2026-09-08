import Dexie, { type Table } from 'dexie';
import type {
  GroceryProduct,
  DailySale,
  StockAdjustment,
} from '@/types/grocery';

export class GroceryDB extends Dexie {
  products!: Table<GroceryProduct, string>;
  dailySales!: Table<DailySale, string>;
  stockAdjustments!: Table<StockAdjustment, string>;

  constructor() {
    super('GroceryInventoryDB');

    this.version(1).stores({
      products: 'id, name, nameAr, category, unit, quantity, createdAt, updatedAt',
      dailySales: 'id, date, productId, productName, paymentMethod, timestamp',
      stockAdjustments: 'id, productId, productName, adjustmentType, timestamp',
    });
  }
}

export const groceryDb = new GroceryDB();