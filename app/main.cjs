const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { autoUpdater } = require('electron-updater');

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
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Load environment variables only in development
if (isDev) {
  try {
    require('dotenv').config();
  } catch (e) {
    console.warn('dotenv not found, skipping environment file loading');
  }
}

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
    icon: path.join(__dirname, isDev ? 'public/icons/icon-512x512.png' : 'dist/favicon.ico'),
    autoHideMenuBar: false, // Show menu bar to allow copy/paste shortcuts
  });

  // DevTools: open only in development builds
  if (isDev) {
    win.webContents.openDevTools();
  }

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
    // ROBUST PATH DISCOVERY
    const appPath = app.getAppPath();
    const indexPath = path.join(appPath, 'dist', 'index.html');
    
    if (fs.existsSync(indexPath)) {
        win.loadFile(indexPath).catch(err => {
            dialog.showErrorBox('Load Error', `Failed to load index.html: ${err.message}`);
        });
    } else {
        const fallbackPath = path.join(__dirname, 'dist', 'index.html');
        if (fs.existsSync(fallbackPath)) {
            win.loadFile(fallbackPath);
        } else {
            dialog.showErrorBox('Path Error', 
                `Could not find index.html!\n\nChecked:\n1. ${indexPath}\n2. ${fallbackPath}`
            );
        }
    }
  }
}

app.whenReady().then(() => {
  createWindow();
  
  // Check for updates
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new version of PharmaQMS Enterprise is available. Downloading now...'
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The application will restart to install the update.',
    buttons: ['Restart Now', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater: ', err);
});

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
