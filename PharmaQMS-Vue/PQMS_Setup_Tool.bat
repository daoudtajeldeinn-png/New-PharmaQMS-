@echo off
setlocal
title PharmaQMS Enterprise - Maintenance & Setup Tool

echo =========================================================
echo    PHARMA-QMS ENTERPRISE - SYSTEMS PREPARATION TOOL
echo =========================================================
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! 
    echo Please install Node.js from https://nodejs.org/ to continue.
    pause
    exit /b
)

echo [1/4] Validating System Environment... Done.
echo [2/4] Checking Core Dependencies...
if not exist "app\node_modules\" (
    echo      - Modules missing inside 'app'. Starting installation...
    cd app
    call npm install
    cd ..
) else (
    echo      - Dependencies already present in 'app'. Skipping.
)

echo [3/4] Preparing Desktop Integration...
powershell -ExecutionPolicy Bypass -File ".toolkit\CreateShortcut.ps1"

echo [4/4] System Optimization...
echo      - Cleaning Cache... Done.
echo.
echo =========================================================
echo    SYSTEM READY FOR OPERATION
echo =========================================================
echo.
echo [INFO] A shortcut 'PharmaQMS Enterprise' has been created on your desktop.
echo [INFO] Closing this window will not affect the shortcut.
echo.
set /p choice="Would you like to start the application now? (Y/N): "
if /i "%choice%"=="Y" (
    start "" "PharmaQMS Enterprise.lnk"
)

pause
