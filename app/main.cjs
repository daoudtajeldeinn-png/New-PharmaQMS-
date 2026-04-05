const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

function getMachineId() {
  try {
    const { execSync } = require('child_process');
    // Method 1: Modern PowerShell (Recommended)
    let output = execSync('powershell -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID"').toString().trim();
    if (output && output !== '00000000-0000-0000-0000-000000000000' && output !== 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF') {
      return output;
    }

    // Method 2: Registry MachineGuid (Alternative)
    output = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid').toString();
    const match = output.match(/MachineGuid\s+REG_SZ\s+([A-Fa-f0-9-]+)/);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Method 3: BIOS Serial Number
    output = execSync('powershell -ExecutionPolicy Bypass -Command "(Get-CimInstance -ClassName Win32_BIOS).SerialNumber"').toString().trim();
    if (output && output !== 'None') {
      return output;
    }

    return 'UNKNOWN-DEVICE';
  } catch (e) {
    console.error("Machine ID retrieval error:", e);
    return 'UNKNOWN-DEVICE';
  }
}

const MACHINE_ID = getMachineId();
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: !isDev,
      additionalArguments: [`--machine-id=${MACHINE_ID}`]
    },
    icon: path.join(__dirname, 'public/favicon.ico'),
    autoHideMenuBar: false, // Show menu bar to allow copy/paste shortcuts
  });

  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'toggledevtools' },
          { type: 'separator' },
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.log('Load failed:', errorDescription, validatedURL);
    });
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
