const { app, BrowserWindow, Menu, dialog, ipcMain, session } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

try {
  require('dotenv').config();
} catch (e) {
  // Ignore error if dotenv is missing in production
}

// ── Auto Updater ──────────────────────────────────────────────────────────────
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Try to attach electron-log for debug output
  try {
    const log = require('electron-log');
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
  } catch (_) {
    // electron-log not installed, skip
  }
} catch (e) {
  console.warn('electron-updater not available:', e.message);
}

// ── Machine ID ────────────────────────────────────────────────────────────────
function getMachineId() {
  try {
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

// ── Create Window ─────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: !isDev,
      additionalArguments: [`--machine-id=${MACHINE_ID}`]
    },
    icon: path.join(__dirname, 'public/favicon.ico'),
    autoHideMenuBar: false,
  });

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
        { role: 'resetzoom' }, { role: 'zoomin' }, { role: 'zoomout' }, { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  const VERCEL_URL = 'https://new-pharma-qms.vercel.app';

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // ── Clear PWA service worker & HTTP cache so we always load the latest Vercel build
    const ses = win.webContents.session;
    Promise.all([
      ses.clearCache(),
      ses.clearStorageData({ storages: ['serviceworkers', 'cachestorage'] })
    ]).then(() => {
      win.loadURL(VERCEL_URL);
    }).catch(() => {
      // If clearing fails, still try to load
      win.loadURL(VERCEL_URL);
    });
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (validatedURL === VERCEL_URL) {
        win.loadURL(`data:text/html,
          <html>
            <body style="background:#020617;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
              <div style="background:rgba(255,255,255,0.05);padding:40px;border-radius:40px;border:1px solid rgba(255,255,255,0.1);max-width:500px;">
                <h1 style="font-weight:900;letter-spacing:-0.05em;margin-bottom:20px;font-size:48px;">SYSTEM<br/>OFFLINE</h1>
                <p style="color:#64748b;font-weight:500;line-height:1.6;margin-bottom:30px;">
                  The Enterprise QMS environment could not be reached.<br/>
                  Please verify your network connection and retry.
                </p>
                <button onclick="window.location.reload()" style="background:#4f46e5;color:white;border:none;padding:15px 40px;border-radius:20px;font-weight:900;text-transform:uppercase;cursor:pointer;">Reconnect</button>
              </div>
            </body>
          </html>
        `);
      }
    });

    // ── Check for updates after window loads ─────────────────────────────────
    if (autoUpdater) {
      win.webContents.on('did-finish-load', () => {
        autoUpdater.checkForUpdates().catch(err => {
          console.warn('Update check failed:', err.message);
        });
      });

      autoUpdater.on('update-available', (info) => {
        dialog.showMessageBox(win, {
          type: 'info',
          title: 'PharmaQMS Update Available',
          message: `Version ${info.version} is available. Downloading automatically...`,
          buttons: ['OK']
        });
      });

      autoUpdater.on('update-downloaded', (info) => {
        dialog.showMessageBox(win, {
          type: 'info',
          title: 'Update Ready to Install',
          message: `Version ${info.version} has been downloaded.\nThe application will restart to install the update.`,
          buttons: ['Restart Now', 'Later']
        }).then(result => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
      });

      autoUpdater.on('error', (err) => {
        console.error('Auto-updater error:', err.message);
      });

      autoUpdater.on('update-not-available', () => {
        // Only show if manually triggered or we want to be verbose
        // For now, let's just log it or we could add a flag to show dialog
      });

      ipcMain.handle('check-for-updates', async () => {
        if (autoUpdater) {
          try {
            const result = await autoUpdater.checkForUpdates();
            return { success: true, info: result?.updateInfo };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
        return { success: false, error: 'Auto-updater not initialized' };
      });
    }
  }
}

// ── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

