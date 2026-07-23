@echo off
title PharmaQMS - Portable Server
color 0b

echo.
echo ========================================================
echo    STARTING PHARMA-QMS ENTERPRISE (PORTABLE MODE)
echo ========================================================
echo.
echo [INFO] Initializing lightweight web server...
echo [INFO] This allows the app to run without installation.
echo.

:: Switch to the app/dist directory
cd app\dist

:: Start a simple HTTP server using PowerShell (compatible with Windows 10/11)
:: It serves the current folder on port 8080 and opens the browser
start "" http://localhost:8080
powershell -Command "$H=New-Object Net.HttpListener; $H.Prefixes.Add('http://localhost:8080/'); $H.Start(); while($H.IsListening) { $C=$H.GetContext(); $R=$C.Response; $F=Join-Path $PWD $C.Request.Url.LocalPath; if(-not (Test-Path $F) -or (Get-Item $F).PSIsContainer) { $F=Join-Path $F 'index.html' }; if(Test-Path $F) { $B=[IO.File]::ReadAllBytes($F); $R.ContentLength64=$B.Length; $R.OutputStream.Write($B,0,$B.Length) } else { $R.StatusCode=404 }; $R.Close() }"

pause
