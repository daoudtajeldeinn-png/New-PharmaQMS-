@echo off
title PharmaQMS - Universal Launcher
color 0b

echo.
echo ========================================================
echo    STARTING PHARMA-QMS ENTERPRISE
echo ========================================================
echo.
echo [INFO] Resolving environment...

:: Navigate to app folder
cd app\dist

:: METHOD 1: try Python (Visual Studio Code / System Python)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Using Python Server...
    start "" http://localhost:8080
    python -m http.server 8080
    goto :EOF
)

:: METHOD 2: try Python 3 specific command
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Using Python 3 Server...
    start "" http://localhost:8080
    python3 -m http.server 8080
    goto :EOF
)

:: METHOD 3: try Node.js (http-server)
call npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Using Node.js Server...
    start "" http://localhost:8080
    call npx http-server -p 8080 -c-1
    goto :EOF
)

:: METHOD 4: Fallback to PowerShell (Built-in Windows)
echo [INFO] Using PowerShell Fallback...
start "" http://localhost:8080
powershell -Command "$H=New-Object Net.HttpListener; $H.Prefixes.Add('http://localhost:8080/'); $H.Start(); while($H.IsListening) { $C=$H.GetContext(); $R=$C.Response; $F=Join-Path $PWD $C.Request.Url.LocalPath; if(-not (Test-Path $F) -or (Get-Item $F).PSIsContainer) { $F=Join-Path $F 'index.html' }; if(Test-Path $F) { $B=[IO.File]::ReadAllBytes($F); $R.ContentLength64=$B.Length; $R.OutputStream.Write($B,0,$B.Length) } else { $R.StatusCode=404 }; $R.Close() }"

echo.
echo [ERROR] Could not start any web server.
echo Please ensure Python or Node.js is installed.
pause
