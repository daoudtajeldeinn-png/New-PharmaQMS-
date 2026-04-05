<#
install-nvm-node.ps1
PowerShell helper to install nvm-windows and a Node version.

Usage (run as Administrator or approve UAC prompt when installer runs):
  powershell -ExecutionPolicy Bypass -File .\app\scripts\install-nvm-node.ps1 -NodeVersion 20.19.0

This script will:
 - Download nvm-windows installer from the official GitHub latest release
 - Run the installer (UAC prompt may appear)
 - Use `nvm` to install and select the specified Node version
 - Print `node -v` and `npm -v` for verification

Note: nvm-windows requires running the installer interactively for PATH setup.
#>
param(
    [string]
    $NodeVersion = "20.19.0",

    [switch]
    $Force
)

function Write-Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-ErrorAndExit($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }

# Check platform
if ($env:OS -notlike "*Windows*"){
    Write-ErrorAndExit "This script is intended for Windows." 
}

Write-Info "Target Node version: $NodeVersion"

# Check if nvm is already available
$null = Get-Command nvm -ErrorAction SilentlyContinue
if ($?) {
    Write-Info "Detected existing nvm. Skipping installer step."
} else {
    $installerUrl = 'https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.exe'
    $tempDir = Join-Path $env:TEMP "nvm-install"
    New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
    $installerPath = Join-Path $tempDir "nvm-setup.exe"

    Write-Info "Downloading nvm-windows installer..."
    try {
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
    } catch {
        Write-ErrorAndExit "Failed to download nvm installer: $_"
    }

    Write-Info "Launching nvm installer (UAC prompt may appear). Follow the install wizard and choose default options."
    try {
        Start-Process -FilePath $installerPath -Wait -Verb RunAs
    } catch {
        Write-ErrorAndExit "Installer failed or was cancelled: $_"
    }

    Write-Info "Installer finished. You may need to open a new terminal for nvm to be available."
}

# Refresh environment for this PowerShell session to pick up nvm path (common install location)
$possiblePaths = @(
    "$env:ProgramFiles\nvm",
    "$env:ProgramFiles(x86)\nvm",
    "$env:LocalAppData\nvm"
)

$found = $false
foreach ($p in $possiblePaths) {
    if (Test-Path $p) {
        $env:Path = "$p;$env:Path"
        $found = $true
        break
    }
}

# Fallback: attempt to locate nvm.exe via PATH
if (-not (Get-Command nvm -ErrorAction SilentlyContinue)){
    if (-not $found) {
        Write-Info "nvm not found in common locations. Trying to continue; if nvm isn't detected you may need to open a new terminal or add nvm to PATH manually."
    }
}

# Install and use the requested Node version
if (Get-Command nvm -ErrorAction SilentlyContinue) {
    Write-Info "Installing Node $NodeVersion via nvm..."
    & nvm install $NodeVersion
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorAndExit "nvm install failed with exit code $LASTEXITCODE"
    }
    Write-Info "Setting Node $NodeVersion as active..."
    & nvm use $NodeVersion
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorAndExit "nvm use failed with exit code $LASTEXITCODE"
    }
} else {
    Write-Info ("nvm not available in this session. Please open a new terminal and run: nvm install {0} then nvm use {0}" -f $NodeVersion)
    exit 0
}

# Verification
Write-Info "Verifying Node and npm versions:"
try {
    node -v
    npm -v
} catch {
    Write-ErrorAndExit "Failed to run node/npm in this session. Open a new terminal and run 'node -v'."
}

Write-Info "Done."
