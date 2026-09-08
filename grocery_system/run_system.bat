@echo off
chcp 65001 >nul
title نظام إدارة البقالة
cd /d "%~dp0"
python grocery_manager.py
pause