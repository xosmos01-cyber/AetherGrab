const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aetherGrab', {
  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Native Dialogs & System
  selectOutputFolder: (currentFolder) => ipcRenderer.invoke('dialog-select-folder', currentFolder),
  selectCookieFile: () => ipcRenderer.invoke('dialog-select-cookie-file'),
  openFile: (filePath) => ipcRenderer.invoke('system-open-file', filePath),
  openFolder: (filePath) => ipcRenderer.invoke('system-open-folder', filePath),
  getDefaultFolder: () => ipcRenderer.invoke('system-get-default-folder'),
  readClipboard: () => ipcRenderer.invoke('system-read-clipboard'),

  // Binary Manager & Updates
  getBinaryVersions: () => ipcRenderer.invoke('engine-get-versions'),
  updateYtDlp: () => ipcRenderer.invoke('engine-update-ytdlp'),
  onUpdateStatus: (callback) => {
    const handler = (event, msg) => callback(msg);
    ipcRenderer.on('update-status-event', handler);
    return () => ipcRenderer.removeListener('update-status-event', handler);
  },

  // Media Operations
  probeMetadata: (url, cookieSource, customCookieFile) => 
    ipcRenderer.invoke('media-probe-metadata', { url, cookieSource, customCookieFile }),
  
  startDownload: (downloadId, options) => 
    ipcRenderer.send('media-start-download', { downloadId, options }),

  cancelDownload: (downloadId) => 
    ipcRenderer.send('media-cancel-download', downloadId),

  // Real-time Event Listeners
  onDownloadOutput: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-output-event', handler);
    return () => ipcRenderer.removeListener('download-output-event', handler);
  },

  onDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-progress-event', handler);
    return () => ipcRenderer.removeListener('download-progress-event', handler);
  },

  onDownloadComplete: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-complete-event', handler);
    return () => ipcRenderer.removeListener('download-complete-event', handler);
  },

  onDownloadError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-error-event', handler);
    return () => ipcRenderer.removeListener('download-error-event', handler);
  },

  onDownloadCancelled: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-cancelled-event', handler);
    return () => ipcRenderer.removeListener('download-cancelled-event', handler);
  }
});
