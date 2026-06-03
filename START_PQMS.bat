@echo off
setlocal
cd /d "%~dp0"
title PharmaQMS Smart Launcher
color 0f

echo ========================================================
echo   PHARMA QMS - SMART SYSTEM LAUNCHER
echo ========================================================
echo.

cd app

:: Check if node_modules exists (Installation Check)
if exist "node_modules\" (
    echo [INFO] System detected ready. Starting application...
    echo.
) else (
    echo [WARN] First time setup detected. Installing system dependencies...
    echo [INFO] This might take 1-5 minutes depending on internet speed.
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0c
        echo.
        echo [ERROR] Installation failed. Please check internet connection.
        pause
        exit /b
    )
    echo.
    echo [SUCCESS] Installation complete!
)

:: Start the Application
echo [INFO] Starting Local Server...
echo [HINT] Keep this black window OPEN while using the app.
echo.
call npm run dev

pause
