const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const mediaEngine = require('./mediaEngine');
const binaryManager = require('./binaryManager');

// High-DPI and multi-monitor scaling switches
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

let mainWindow = null;
const activeDownloadMap = new Map(); // downloadId -> cancelFunction

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 680,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../public/icon.png'),
    backgroundMaterial: 'mica',
    backgroundColor: '#09090b',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Window Controls IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// System Dialogs & File Handlers
ipcMain.handle('dialog-select-folder', async (event, currentFolder) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: currentFolder || path.join(os.homedir(), 'Downloads', 'AetherGrab')
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog-select-cookie-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Cookies File', extensions: ['txt'] }]
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('system-open-file', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    return shell.openPath(filePath);
  }
  return 'File does not exist';
});

ipcMain.handle('system-open-folder', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('system-get-default-folder', () => {
  const defaultDir = path.join(os.homedir(), 'Downloads', 'AetherGrab');
  if (!fs.existsSync(defaultDir)) {
    try {
      fs.mkdirSync(defaultDir, { recursive: true });
    } catch (e) {}
  }
  return defaultDir;
});

ipcMain.handle('system-read-clipboard', () => {
  return clipboard.readText().trim();
});

// Binary Manager IPC
ipcMain.handle('engine-get-versions', () => {
  return binaryManager.getVersions();
});

ipcMain.handle('engine-update-ytdlp', async () => {
  return binaryManager.updateYtDlp((statusMsg) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status-event', statusMsg);
    }
  });
});

// Media Probe & Download IPC
ipcMain.handle('media-probe-metadata', async (event, { url, cookieSource, customCookieFile }) => {
  return mediaEngine.probeMetadata(url, cookieSource, customCookieFile);
});

ipcMain.on('media-start-download', (event, { downloadId, options }) => {
  try {
    const handle = mediaEngine.startDownload(downloadId, options, {
      onOutput: (text) => {
        if (mainWindow) mainWindow.webContents.send('download-output-event', { downloadId, text });
      },
      onProgress: (progressData) => {
        if (mainWindow) mainWindow.webContents.send('download-progress-event', { downloadId, progressData });
      },
      onError: (errorMessage) => {
        activeDownloadMap.delete(downloadId);
        if (mainWindow) mainWindow.webContents.send('download-error-event', { downloadId, errorMessage });
      },
      onCancelled: () => {
        activeDownloadMap.delete(downloadId);
        if (mainWindow) mainWindow.webContents.send('download-cancelled-event', { downloadId });
      },
      onSuccess: (resultData) => {
        activeDownloadMap.delete(downloadId);
        if (mainWindow) mainWindow.webContents.send('download-complete-event', { downloadId, resultData });
      }
    });

    activeDownloadMap.set(downloadId, handle.cancel);
  } catch (e) {
    if (mainWindow) mainWindow.webContents.send('download-error-event', { downloadId, errorMessage: e.message });
  }
});

ipcMain.on('media-cancel-download', (event, downloadId) => {
  const cancel = activeDownloadMap.get(downloadId);
  if (cancel) {
    cancel();
    activeDownloadMap.delete(downloadId);
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
