#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار نظام إدارة البقالة
"""

from grocery_manager import GroceryManager
import os

def test_system():
    print("=== اختبار نظام إدارة البقالة ===\n")
    
    # إنشاء مجلد للاختبار
    test_dir = "test_grocery"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
    
    manager = GroceryManager(test_dir)
    
    # اختبار 1: إضافة منتجات
    print("1. اختبار إضافة منتجات...")
    manager.add_product("شاي", "مشروبات", "كيس", 1486.49, 2500, 37, 10)
    manager.add_product("سكر صغير", "مواد غذائية", "كيس", 6857.14, 7500, 14, 5)
    manager.add_product("قهوة", "مشروبات", "كيس", 3705.88, 4500, 17, 8)
    print("✓ تم إضافة 3 منتجات بنجاح")
    
    # اختبار 2: عرض تقرير المخزون
    print("\n2. اختبار تقرير المخزون...")
    report = manager.get_inventory_report()
    print(f"✓ إجمالي المنتجات: {report['total_products']}")
    print(f"✓ قيمة المخزون: {report['total_value']:,.2f} ج.م")
    print(f"✓ الربح المحتمل: {report['potential_profit']:,.2f} ج.م")
    
    # اختبار 3: تسجيل بيع
    print("\n3. اختبار تسجيل بيع...")
    success = manager.record_sale(
        product_name="شاي",
        quantity=2,
        unit="كيس",
        selling_price=2500,
        payment_method="نقد",
        customer_name="أحمد محمد",
        customer_phone="01012345678"
    )
    if success:
        print("✓ تم تسجيل البيع بنجاح")
    else:
        print("✗ فشل تسجيل البيع")
    
    # اختبار 4: تحديث الكمية
    print("\n4. اختبار تحديث الكمية...")
    success = manager.update_quantity(1, 35)  # تحديث كمية الشاي
    if success:
        print("✓ تم تحديث الكمية بنجاح")
    else:
        print("✗ فشل تحديث الكمية")
    
    # اختبار 5: تقرير المبيعات اليومية
    print("\n5. اختبار تقرير المبيعات اليومية...")
    sales_report = manager.get_daily_sales_report()
    print(f"✓ إجمالي المبيعات: {sales_report['total_sales']:,.2f} ج.م")
    print(f"✓ مبيعات نقد: {sales_report['cash_sales']:,.2f} ج.م")
    print(f"✓ عدد العمليات: {sales_report['total_transactions']}")
    
    # اختبار 6: التقرير الشهري
    print("\n6. اختبار التقرير الشهري...")
    from datetime import datetime
    current_month = datetime.now().month
    current_year = datetime.now().year
    monthly_report = manager.generate_monthly_report(current_month, current_year)
    print(f"✓ المبيعات الشهرية: {monthly_report['total_sales']:,.2f} ج.م")
    print(f"✓ مجمل الربح: {monthly_report['gross_profit']:,.2f} ج.م")
    print(f"✓ هامش الربح: {monthly_report['gross_profit_margin']:.2f}%")
    
    # عرض الملفات المُنشأة
    print("\n7. الملفات المُنشأة:")
    files = ['inventory.csv', 'daily_sales.csv', 'stock_adjustments.csv']
    for file in files:
        file_path = os.path.join(test_dir, file)
        if os.path.exists(file_path):
            print(f"✓ {file} تم إنشاؤه بنجاح")
        else:
            print(f"✗ {file} لم يتم إنشاؤه")
    
    print("\n=== انتهى الاختبار ===")
    print(f"الملفات موجودة في مجلد: {test_dir}")
    print("يمكنك فتح ملفات CSV في Excel")

if __name__ == "__main__":
    test_system()