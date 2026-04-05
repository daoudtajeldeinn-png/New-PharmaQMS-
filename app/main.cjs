const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

function getMachineId() {
  try {
    // Try to get UUID first
    let output = execSync('wmic csproduct get uuid').toString();
    let id = output.split('\\n')[1]?.trim();

    // If UUID is invalid/generic, try BIOS Serial Number
    if (!id || id === 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF') {
      output = execSync('wmic bios get serialnumber').toString();
      id = output.split('\\n')[1]?.trim();
    }

    return id || 'UNKNOWN-DEVICE';
  } catch (e) {
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
