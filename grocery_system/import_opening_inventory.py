#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
استيراد بيانات الجرد الافتتاحي من CSV الأصلي
"""

from grocery_manager import GroceryManager
import csv

def import_opening_inventory():
    print("=== استيراد بيانات الجرد الافتتاحي ===\n")
    
    manager = GroceryManager()
    
    # قراءة ملف الجرد الافتتاحي الأصلي
    opening_file = "opening_inventory.csv"
    
    if not os.path.exists(opening_file):
        print(f"ملف {opening_file} غير موجود")
        return
    
    imported_count = 0
    
    with open(opening_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                # استخراج البيانات
                name = row['اسم المنتج']
                purchase_price = float(row['سعر الدراوج']) if row['سعر الدراوج'] else 0
                selling_price = float(row['سعر البيوع']) if row['سعر البيوع'] else 0
                quantity = float(row['الكمية']) if row['الكمية'] else 0
                
                # تخطي الأسطر الفارغة أو غير الصالحة
                if not name or quantity == 0:
                    continue
                
                # تحديد الوحدة والتصنيف بناءً على اسم المنتج
                unit = "قطعة"  # افتراضي
                category = "عام"
                
                # تحسين التصنيف بناءً على الاسم
                if any(word in name for word in ['شاي', 'قهوة', 'بيض', 'حليب', 'سمنة', 'زيت']):
                    category = "مواد غذائية"
                    if 'شاي' in name or 'قهوة' in name:
                        unit = "كيس"
                    elif 'حليب' in name or 'زيت' in name:
                        unit = "لتر"
                    elif 'بيض' in name:
                        unit = "كرتونة"
                    elif 'سمنة' in name:
                        unit = "علبة"
                elif 'سكر' in name or 'أرز' in name or 'معجون' in name:
                    category = "مواد غذائية"
                    unit = "كيس"
                
                # إضافة المنتج
                manager.add_product(
                    name=name,
                    category=category,
                    unit=unit,
                    purchase_price=purchase_price,
                    selling_price=selling_price,
                    quantity=quantity,
                    min_stock=5,  # حد أدنى افتراضي
                    notes="مستورد من الجرد الافتتاحي"
                )
                
                imported_count += 1
                print(f"✓ تم استيراد: {name} ({quantity} {unit})")
                
            except Exception as e:
                print(f"✗ خطأ في استيراد: {name} - {e}")
                continue
    
    print(f"\n=== انتهى الاستيراد ===")
    print(f"تم استيراد {imported_count} منتج بنجاح")
    
    # عرض تقرير المخزون
    report = manager.get_inventory_report()
    print(f"\nتقرير المخزون:")
    print(f"إجمالي المنتجات: {report['total_products']}")
    print(f"قيمة المخزون: {report['total_value']:,.2f} ج.م")
    print(f"الربح المحتمل: {report['potential_profit']:,.2f} ج.م")
    print(f"منخفض المخزون: {report['low_stock']}")
    print(f"نفذ من المخزون: {report['out_of_stock']}")

if __name__ == "__main__":
    import os
    import_opening_inventory()