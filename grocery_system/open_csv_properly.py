#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
فتح ملف CSV مع الترميز الصحيح
"""

import csv
import os
import subprocess

def open_csv_with_encoding(csv_file):
    """فتح ملف CSV مع الترميز الصحيح"""
    if not os.path.exists(csv_file):
        print(f"الملف {csv_file} غير موجود")
        return False
    
    try:
        # قراءة الملف للتأكد من المحتوى
        with open(csv_file, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            print(f"✓ الملف يحتوي على {len(lines)} سطر")
            print(f"✓ أول سطر: {lines[0][:100]}...")
        
        # فتح الملف باستخدام البرنامج الافتراضي
        os.startfile(csv_file)
        print(f"✓ تم فتح الملف: {csv_file}")
        return True
        
    except Exception as e:
        print(f"✗ حدث خطأ: {e}")
        return False

if __name__ == "__main__":
    csv_file = "inventory.csv"
    
    print("جاري فتح ملف CSV...")
    open_csv_with_encoding(csv_file)