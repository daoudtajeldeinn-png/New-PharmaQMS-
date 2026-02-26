@echo off
setlocal
cd /d "%~dp0app"

:: Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    @echo msgbox "Error: Node.js is not installed or not in PATH. Please install Node.js to run PharmaQMS.", 16, "PharmaQMS Error" > %temp%\pqms_error.vbs
    wscript %temp%\pqms_error.vbs
    del %temp%\pqms_error.vbs
    exit /b 1
)

:: Just start the server. Vite --open will trigger the browser.
call npm run dev
