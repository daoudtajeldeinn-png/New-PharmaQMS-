@echo off
title PharmaQMS - Key Generator Tool
color 0b

echo.
echo ========================================================
echo    PHARMA-QMS ENTERPRISE - LICENSE GENERATOR
echo ========================================================
echo.
set /p expiry="Enter Expiry Date (YYYY-MM-DD): "
echo.
node MasterKeyGen.js %expiry%
pause
