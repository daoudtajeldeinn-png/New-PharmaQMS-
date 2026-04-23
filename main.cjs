const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
try {
  require('dotenv').config();
} catch (e) {
  // Ignore error if dotenv is missing in production
}

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

  const VERCEL_URL = 'https://new-pharma-qms.vercel.app';

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.log('Load failed:', errorDescription, validatedURL);
    });
  } else {
    // Thin Client Architecture: Load from Vercel
    win.loadURL(VERCEL_URL);

    // Offline / Connection Failure Handler
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (validatedURL === VERCEL_URL) {
        win.loadURL(`data:text/html,
          <html>
            <body style="background: #020617; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; padding: 20px;">
              <div style="background: rgba(255, 255, 255, 0.05); padding: 40px; border-radius: 40px; border: 1px solid rgba(255, 255, 255, 0.1); max-width: 500px;">
                <h1 style="font-weight: 900; letter-spacing: -0.05em; margin-bottom: 20px; font-size: 48px;">SYSTEM<br/>OFFLINE</h1>
                <p style="color: #64748b; font-weight: 500; line-height: 1.6; margin-bottom: 30px;">
                  The Enterprise QMS environment could not be reached.<br/> 
                  Please verify your network connection and retry.
                </p>
                <button onclick="window.location.reload()" style="background: #4f46e5; color: white; border: none; padding: 15px 40px; border-radius: 20px; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: all 0.2s;"> Reconnect </button>
              </div>
            </body>
          </html>
        `);
      }
    });
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
