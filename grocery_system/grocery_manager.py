#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
نظام بسيط لإدارة البقالة والمخزون
يعمل مع ملفات CSV ويمكن فتحها في Excel
"""

import csv
import os
from datetime import datetime
from typing import List, Dict, Optional

class GroceryManager:
    def __init__(self, base_dir: str = "."):
        self.base_dir = base_dir
        self.inventory_file = os.path.join(base_dir, "inventory.csv")
        self.sales_file = os.path.join(base_dir, "daily_sales.csv")
        self.adjustments_file = os.path.join(base_dir, "stock_adjustments.csv")
        
    def load_inventory(self) -> List[Dict]:
        """تحميل بيانات المخزون من ملف CSV"""
        if not os.path.exists(self.inventory_file):
            return []
        
        inventory = []
        with open(self.inventory_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # تحويل القيم الرقمية
                if row.get('سعر الشراء'):
                    row['سعر الشراء'] = float(row['سعر الشراء'])
                if row.get('سعر البيع'):
                    row['سعر البيع'] = float(row['سعر البيع'])
                if row.get('الكمية'):
                    row['الكمية'] = float(row['الكمية'])
                if row.get('الحد الأدنى'):
                    row['الحد الأدنى'] = float(row['الحد الأدنى'])
                if row.get('الإجمالي'):
                    row['الإجمالي'] = float(row['الإجمالي'])
                inventory.append(row)
        return inventory
    
    def save_inventory(self, inventory: List[Dict]):
        """حفظ بيانات المخزون إلى ملف CSV"""
        if not inventory:
            return
            
        fieldnames = ['رقم', 'اسم المنتج', 'التصنيف', 'الوحدة', 'سعر الشراء', 'سعر البيع', 
                     'الكمية', 'الحد الأدنى', 'الإجمالي', 'الحالة', 'ملاحظات']
        
        with open(self.inventory_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(inventory)
    
    def add_product(self, name: str, category: str, unit: str, 
                   purchase_price: float, selling_price: float, 
                   quantity: float, min_stock: float = 5, notes: str = "") -> bool:
        """إضافة منتج جديد للمخزون"""
        inventory = self.load_inventory()
        
        # إنشاء رقم جديد
        new_number = len(inventory) + 1 if inventory else 1
        
        # حساب الإجمالي
        total = quantity * purchase_price
        
        # تحديد الحالة
        status = "متوفر"
        if quantity == 0:
            status = "نفذ"
        elif quantity <= min_stock:
            status = "منخفض"
        
        new_product = {
            'رقم': new_number,
            'اسم المنتج': name,
            'التصنيف': category,
            'الوحدة': unit,
            'سعر الشراء': purchase_price,
            'سعر البيع': selling_price,
            'الكمية': quantity,
            'الحد الأدنى': min_stock,
            'الإجمالي': total,
            'الحالة': status,
            'ملاحظات': notes
        }
        
        inventory.append(new_product)
        self.save_inventory(inventory)
        return True
    
    def update_quantity(self, product_number: int, new_quantity: float) -> bool:
        """تحديث كمية منتج"""
        inventory = self.load_inventory()
        
        for product in inventory:
            if int(product['رقم']) == product_number:
                old_quantity = product['الكمية']
                product['الكمية'] = new_quantity
                product['الإجمالي'] = new_quantity * product['سعر الشراء']
                
                # تحديث الحالة
                if new_quantity == 0:
                    product['الحالة'] = "نفذ"
                elif new_quantity <= product['الحد الأدنى']:
                    product['الحالة'] = "منخفض"
                else:
                    product['الحالة'] = "متوفر"
                
                self.save_inventory(inventory)
                
                # تسجيل التعديل
                self.record_adjustment(product['اسم المنتج'], old_quantity, new_quantity, "تعديل يدوي")
                return True
        
        return False
    
    def record_sale(self, product_name: str, quantity: float, unit: str, 
                   selling_price: float, payment_method: str, 
                   customer_name: str = "", customer_phone: str = "", 
                   notes: str = "") -> bool:
        """تسجيل عملية بيع"""
        inventory = self.load_inventory()
        
        # البحث عن المنتج وتحديث الكمية
        for product in inventory:
            if product['اسم المنتج'] == product_name:
                if product['الكمية'] < quantity:
                    print(f"خطأ: الكمية المطلوبة ({quantity}) أكبر من المتوفر ({product['الكمية']})")
                    return False
                
                product['الكمية'] -= quantity
                product['الإجمالي'] = product['الكمية'] * product['سعر الشراء']
                
                # تحديث الحالة
                if product['الكمية'] == 0:
                    product['الحالة'] = "نفذ"
                elif product['الكمية'] <= product['الحد الأدنى']:
                    product['الحالة'] = "منخفض"
                
                self.save_inventory(inventory)
                break
        
        # تسجيل البيع
        total = quantity * selling_price
        sale_number = f"SALE-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        sales = []
        if os.path.exists(self.sales_file):
            with open(self.sales_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                sales = list(reader)
        
        new_sale = {
            'التاريخ': datetime.now().strftime('%Y-%m-%d'),
            'رقم البيع': sale_number,
            'اسم المنتج': product_name,
            'الكمية': quantity,
            'الوحدة': unit,
            'سعر الوحدة': selling_price,
            'الإجمالي': total,
            'طريقة الدفع': payment_method,
            'اسم العميل': customer_name,
            'رقم الهاتف': customer_phone,
            'ملاحظات': notes
        }
        
        fieldnames = ['التاريخ', 'رقم البيع', 'اسم المنتج', 'الكمية', 'الوحدة', 
                     'سعر الوحدة', 'الإجمالي', 'طريقة الدفع', 'اسم العميل', 'رقم الهاتف', 'ملاحظات']
        
        with open(self.sales_file, 'a', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if not sales:  # إذا كان الملف فارغاً
                writer.writeheader()
            writer.writerow(new_sale)
        
        return True
    
    def record_adjustment(self, product_name: str, old_quantity: float, 
                        new_quantity: float, reason: str):
        """تسجيل تعديل في المخزون"""
        adjustments = []
        if os.path.exists(self.adjustments_file):
            with open(self.adjustments_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                adjustments = list(reader)
        
        new_adjustment = {
            'التاريخ': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'اسم المنتج': product_name,
            'الكمية القديمة': old_quantity,
            'الكمية الجديدة': new_quantity,
            'الفرق': new_quantity - old_quantity,
            'السبب': reason
        }
        
        fieldnames = ['التاريخ', 'اسم المنتج', 'الكمية القديمة', 'الكمية الجديدة', 'الفرق', 'السبب']
        
        with open(self.adjustments_file, 'a', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if not adjustments:
                writer.writeheader()
            writer.writerow(new_adjustment)
    
    def get_inventory_report(self) -> Dict:
        """إنشاء تقرير المخزون"""
        inventory = self.load_inventory()
        
        total_products = len(inventory)
        total_value = sum(p['الإجمالي'] for p in inventory)
        total_selling_value = sum(p['الكمية'] * p['سعر البيع'] for p in inventory)
        potential_profit = total_selling_value - total_value
        
        low_stock = sum(1 for p in inventory if p['الحالة'] == 'منخفض')
        out_of_stock = sum(1 for p in inventory if p['الحالة'] == 'نفذ')
        
        return {
            'total_products': total_products,
            'total_value': total_value,
            'total_selling_value': total_selling_value,
            'potential_profit': potential_profit,
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
            'products': inventory
        }
    
    def get_daily_sales_report(self, date: str = None) -> Dict:
        """إنشاء تقرير المبيعات اليومية"""
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        if not os.path.exists(self.sales_file):
            return {
                'date': date,
                'total_sales': 0,
                'cash_sales': 0,
                'bank_sales': 0,
                'total_transactions': 0,
                'sales': []
            }
        
        sales = []
        with open(self.sales_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['التاريخ'] == date:
                    sales.append(row)
        
        total_sales = sum(float(s['الإجمالي']) for s in sales)
        cash_sales = sum(float(s['الإجمالي']) for s in sales if s['طريقة الدفع'] == 'نقد')
        bank_sales = sum(float(s['الإجمالي']) for s in sales if s['طريقة الدفع'] == 'تحويل بنكي')
        
        return {
            'date': date,
            'total_sales': total_sales,
            'cash_sales': cash_sales,
            'bank_sales': bank_sales,
            'total_transactions': len(sales),
            'sales': sales
        }
    
    def generate_monthly_report(self, month: int, year: int) -> Dict:
        """إنشاء تقرير شهري"""
        if not os.path.exists(self.sales_file):
            return {
                'month': month,
                'year': year,
                'total_sales': 0,
                'total_cost': 0,
                'gross_profit': 0,
                'net_profit': 0
            }
        
        sales = []
        with open(self.sales_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sale_date = datetime.strptime(row['التاريخ'], '%Y-%m-%d')
                if sale_date.month == month and sale_date.year == year:
                    sales.append(row)
        
        total_sales = sum(float(s['الإجمالي']) for s in sales)
        
        # تقدير التكلفة (70% من سعر البيع)
        total_cost = total_sales * 0.7
        gross_profit = total_sales - total_cost
        net_profit = gross_profit  # يمكن إضافة المصروفات لاحقاً
        
        return {
            'month': month,
            'year': year,
            'total_sales': total_sales,
            'total_cost': total_cost,
            'gross_profit': gross_profit,
            'net_profit': net_profit,
            'gross_profit_margin': (gross_profit / total_sales * 100) if total_sales > 0 else 0,
            'net_profit_margin': (net_profit / total_sales * 100) if total_sales > 0 else 0
        }


def main():
    """واجهة سطر الأوامر البسيطة"""
    print("=== نظام إدارة البقالة ===")
    print("يمكنك أيضاً فتح ملفات CSV مباشرة في Excel")
    print()
    
    manager = GroceryManager()
    
    while True:
        print("\nالخيارات:")
        print("1. عرض تقرير المخزون")
        print("2. إضافة منتج جديد")
        print("3. تسجيل بيع")
        print("4. تحديث كمية منتج")
        print("5. تقرير المبيعات اليومية")
        print("6. تقرير شهري")
        print("7. خروج")
        
        choice = input("\nاختر رقم (1-7): ")
        
        if choice == '1':
            report = manager.get_inventory_report()
            print(f"\n=== تقرير المخزون ===")
            print(f"إجمالي المنتجات: {report['total_products']}")
            print(f"قيمة المخزون: {report['total_value']:,.2f} ج.م")
            print(f"قيمة البيع: {report['total_selling_value']:,.2f} ج.م")
            print(f"الربح المحتمل: {report['potential_profit']:,.2f} ج.م")
            print(f"منخفض المخزون: {report['low_stock']}")
            print(f"نفذ من المخزون: {report['out_of_stock']}")
            
        elif choice == '2':
            print("\n=== إضافة منتج جديد ===")
            name = input("اسم المنتج: ")
            category = input("التصنيف: ")
            unit = input("الوحدة (كيس/لتر/كرتونة/إلخ): ")
            purchase_price = float(input("سعر الشراء: "))
            selling_price = float(input("سعر البيع: "))
            quantity = float(input("الكمية: "))
            min_stock = float(input("الحد الأدنى للمخزون: "))
            notes = input("ملاحظات (اختياري): ")
            
            if manager.add_product(name, category, unit, purchase_price, selling_price, quantity, min_stock, notes):
                print("✓ تم إضافة المنتج بنجاح")
            else:
                print("✓ حدث خطأ")
                
        elif choice == '3':
            print("\n=== تسجيل بيع ===")
            product_name = input("اسم المنتج: ")
            quantity = float(input("الكمية: "))
            unit = input("الوحدة: ")
            selling_price = float(input("سعر البيع: "))
            payment_method = input("طريقة الدفع (نقد/تحويل بنكي): ")
            customer_name = input("اسم العميل (اختياري): ")
            customer_phone = input("رقم الهاتف (اختياري): ")
            notes = input("ملاحظات (اختياري): ")
            
            if manager.record_sale(product_name, quantity, unit, selling_price, payment_method, customer_name, customer_phone, notes):
                print("✓ تم تسجيل البيع بنجاح")
            else:
                print("✓ حدث خطأ")
                
        elif choice == '4':
            print("\n=== تحديث كمية منتج ===")
            product_number = int(input("رقم المنتج: "))
            new_quantity = float(input("الكمية الجديدة: "))
            
            if manager.update_quantity(product_number, new_quantity):
                print("✓ تم تحديث الكمية بنجاح")
            else:
                print("✓ المنتج غير موجود")
                
        elif choice == '5':
            date = input("التاريخ (YYYY-MM-DD) أو اضغط Enter لليوم: ")
            if not date:
                date = None
            report = manager.get_daily_sales_report(date)
            print(f"\n=== تقرير المبيعات ليوم {report['date']} ===")
            print(f"إجمالي المبيعات: {report['total_sales']:,.2f} ج.م")
            print(f"مبيعات نقد: {report['cash_sales']:,.2f} ج.م")
            print(f"تحويل بنكي: {report['bank_sales']:,.2f} ج.م")
            print(f"عدد العمليات: {report['total_transactions']}")
            
        elif choice == '6':
            month = int(input("الشهر (1-12): "))
            year = int(input("السنة: "))
            report = manager.generate_monthly_report(month, year)
            print(f"\n=== التقرير الشهري ===")
            print(f"المبيعات: {report['total_sales']:,.2f} ج.م")
            print(f"التكلفة: {report['total_cost']:,.2f} ج.م")
            print(f"مجمل الربح: {report['gross_profit']:,.2f} ج.م")
            print(f"صافي الربح: {report['net_profit']:,.2f} ج.م")
            print(f"هامش مجمل الربح: {report['gross_profit_margin']:.2f}%")
            print(f"هامش صافي الربح: {report['net_profit_margin']:.2f}%")
            
        elif choice == '7':
            print("شكراً لاستخدام النظام!")
            break
            
        else:
            print("اختيار غير صحيح")


if __name__ == "__main__":
    main()