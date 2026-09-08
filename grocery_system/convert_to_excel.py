#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تحويل ملف CSV إلى Excel لتحسين القراءة
"""

import pandas as pd
import os

def convert_csv_to_excel(csv_file, excel_file):
    """تحويل ملف CSV إلى Excel"""
    try:
        # قراءة ملف CSV
        df = pd.read_csv(csv_file, encoding='utf-8')
        
        # حفظ كملف Excel
        df.to_excel(excel_file, index=False, engine='openpyxl')
        
        print(f"✓ تم التحويل بنجاح: {excel_file}")
        return True
    except Exception as e:
        print(f"✗ حدث خطأ: {e}")
        return False

if __name__ == "__main__":
    csv_file = "inventory.csv"
    excel_file = "inventory.xlsx"
    
    if os.path.exists(csv_file):
        print("جاري تحويل ملف CSV إلى Excel...")
        convert_csv_to_excel(csv_file, excel_file)
        
        # فتح الملف
        os.startfile(excel_file)
    else:
        print(f"الملف {csv_file} غير موجود")