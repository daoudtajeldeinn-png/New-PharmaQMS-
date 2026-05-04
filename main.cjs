const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Determine if we are in development
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Load environment variables only in development
if (isDev) {
  try {
    require('dotenv').config();
  } catch (e) {
    console.warn('dotenv not found, skipping environment file loading');
  }
}

function getMachineId() {
  try {
    let output = execSync('wmic csproduct get uuid').toString();
    let id = output.split('\n')[1]?.trim();
    if (!id || id === 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF') {
      output = execSync('wmic bios get serialnumber').toString();
      id = output.split('\n')[1]?.trim();
    }
    return id || 'UNKNOWN-DEVICE';
  } catch (e) {
    return 'UNKNOWN-DEVICE';
  }
}

const MACHINE_ID = getMachineId();

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: !isDev,           // Secure in production; relaxed only for dev
      additionalArguments: [`--machine-id=${MACHINE_ID}`],
      allowRunningInsecureContent: isDev  // Never allow in production
    },
    icon: path.join(__dirname, isDev ? 'public/icons/icon-512x512.png' : 'dist/favicon.ico'),
    autoHideMenuBar: false,
  });

  // DevTools: open only in development builds
  if (isDev) {
    win.webContents.openDevTools();
  }

  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
        label: 'View',
        submenu: [
          { role: 'reload' }, { role: 'toggledevtools' }, { type: 'separator' },
          { role: 'resetzoom' }, { role: 'zoomin' }, { role: 'zoomout' },
          { type: 'separator' }, { role: 'togglefullscreen' }
        ]
      }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // ROBUST PATH DISCOVERY
    const appPath = app.getAppPath();
    const indexPath = path.join(appPath, 'dist', 'index.html');
    
    console.log(`Initial App Path: ${appPath}`);
    console.log(`Searching for index at: ${indexPath}`);

    if (fs.existsSync(indexPath)) {
        win.loadFile(indexPath).catch(err => {
            dialog.showErrorBox('Load Error', `Failed to load index.html: ${err.message}`);
        });
    } else {
        // SECOND CHANCE: Check if dist is at root
        const fallbackPath = path.join(__dirname, 'dist', 'index.html');
        if (fs.existsSync(fallbackPath)) {
            win.loadFile(fallbackPath);
        } else {
            dialog.showErrorBox('Path Error', 
                `Could not find index.html!\n\nChecked:\n1. ${indexPath}\n2. ${fallbackPath}\n\nApp Path: ${appPath}\nDirName: ${__dirname}`
            );
        }
    }
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
