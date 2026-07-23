import React, { useState, useEffect } from 'react';
import Titlebar from './components/Titlebar';
import UrlInputCard from './components/UrlInputCard';
import MetadataCard from './components/MetadataCard';
import TimecodeCard from './components/TimecodeCard';
import ProgressCard from './components/ProgressCard';
import LibraryCard from './components/LibraryCard';
import UpdateModal from './components/UpdateModal';

const HISTORY_STORAGE_KEY = 'aethergrab_media_history_v1';

export default function App() {
  // Input & Cookie State
  const [url, setUrl] = useState('');
  const [cookieSource, setCookieSource] = useState('none');
  const [customCookieFile, setCustomCookieFile] = useState('');

  // Metadata & Format State
  const [metadata, setMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [quality, setQuality] = useState('1080');
  const [formatMode, setFormatMode] = useState('video+audio');
  const [exactFormatId, setExactFormatId] = useState('');

  // Timecode Trimmer State
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [preciseCut, setPreciseCut] = useState(true);

  // Active Download State
  const [activeDownloadId, setActiveDownloadId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadLogs, setDownloadLogs] = useState('');
  const [downloadError, setDownloadError] = useState('');

  // System & Output Folder State
  const [outputFolder, setOutputFolder] = useState('');
  const [history, setHistory] = useState([]);
  const [engineStatus, setEngineStatus] = useState(null);
  const [updatingYtdlp, setUpdatingYtdlp] = useState(false);
  const [statusNotification, setStatusNotification] = useState('');

  // App Auto-Updater State
  const [appVersion, setAppVersion] = useState('2.5.0');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [appUpdateProgress, setAppUpdateProgress] = useState(null);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [checkingAppUpdate, setCheckingAppUpdate] = useState(false);

  // Load Saved State & History on Mount
  useEffect(() => {
    if (window.aetherGrab) {
      window.aetherGrab.getDefaultFolder().then(setOutputFolder);
      window.aetherGrab.getBinaryVersions().then(setEngineStatus);
      if (window.aetherGrab.getAppVersion) {
        window.aetherGrab.getAppVersion().then(setAppVersion);
      }

      // Listen for stdout and download events
      const removeOutput = window.aetherGrab.onDownloadOutput(({ downloadId, text }) => {
        setDownloadLogs((prev) => prev + text);
      });

      const removeProgress = window.aetherGrab.onDownloadProgress(({ downloadId, progressData }) => {
        setDownloadProgress(progressData);
      });

      const removeError = window.aetherGrab.onDownloadError(({ downloadId, errorMessage }) => {
        setActiveDownloadId(null);
        setDownloadError(errorMessage);
      });

      const removeCancelled = window.aetherGrab.onDownloadCancelled(({ downloadId }) => {
        setActiveDownloadId(null);
        setDownloadProgress(null);
        showNotification('Download cancelled by user.');
      });

      const removeComplete = window.aetherGrab.onDownloadComplete(({ downloadId, resultData }) => {
        setActiveDownloadId(null);
        setDownloadProgress({ percent: 100, statusText: 'Download Complete!' });
        showNotification(`Download finished: ${resultData.fileName}`);

        // Add to history
        const newEntry = {
          fileName: resultData.fileName,
          filePath: resultData.filePath,
          fileSize: resultData.fileSize,
          resolution: resultData.resolution,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setHistory((prev) => {
          const updated = [newEntry, ...prev.slice(0, 19)];
          try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      });

      const removeUpdateStatus = window.aetherGrab.onUpdateStatus((msg) => {
        showNotification(msg);
      });

      // App Auto-Updater Event Listeners
      const removeAppUpdateAvailable = window.aetherGrab.onAppUpdateAvailable((info) => {
        setUpdateInfo(info);
        setShowUpdateModal(true);
        showNotification(`New update available: v${info.version}`);
      });

      const removeAppUpdateProgress = window.aetherGrab.onAppUpdateProgress((progress) => {
        setIsDownloadingUpdate(true);
        setAppUpdateProgress(progress);
      });

      const removeAppUpdateDownloaded = window.aetherGrab.onAppUpdateDownloaded((info) => {
        setIsDownloadingUpdate(false);
        setIsUpdateReady(true);
        showNotification(`Update v${info.version || '2.6.0'} ready to install!`);
      });

      const removeAppUpdateError = window.aetherGrab.onAppUpdateError((errMsg) => {
        setIsDownloadingUpdate(false);
        setCheckingAppUpdate(false);
      });

      // Automatic update check 3 seconds after load
      const autoCheckTimer = setTimeout(() => {
        if (window.aetherGrab.checkForAppUpdates) {
          window.aetherGrab.checkForAppUpdates().catch(() => {});
        }
      }, 3000);

      return () => {
        removeOutput();
        removeProgress();
        removeError();
        removeCancelled();
        removeComplete();
        removeUpdateStatus();
        removeAppUpdateAvailable();
        removeAppUpdateProgress();
        removeAppUpdateDownloaded();
        removeAppUpdateError();
        clearTimeout(autoCheckTimer);
      };
    }
  }, []);

  // Load LocalStorage History
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const showNotification = (msg) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(''), 5000);
  };

  // Actions
  const handleSelectCookieFile = async () => {
    if (window.aetherGrab) {
      const file = await window.aetherGrab.selectCookieFile();
      if (file) {
        setCustomCookieFile(file);
        setCookieSource('custom');
      }
    }
  };

  const handleSelectFolder = async () => {
    if (window.aetherGrab) {
      const folder = await window.aetherGrab.selectOutputFolder(outputFolder);
      if (folder) setOutputFolder(folder);
    }
  };

  const handleFetchMetadata = async () => {
    if (!url || !window.aetherGrab) return;
    setLoadingMetadata(true);
    setDownloadError('');
    try {
      const data = await window.aetherGrab.probeMetadata(url, cookieSource, customCookieFile);
      setMetadata(data);
      showNotification(`Metadata loaded: ${data.title}`);
    } catch (e) {
      setDownloadError(e.message);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleStartDownload = (overrideOptions = {}) => {
    if (!url || !window.aetherGrab) return;

    let timecodeData = null;
    if (trimEnabled) {
      try {
        timecodeData = {
          argument: `*${startTime || 0}-${endTime || 'inf'}`,
          precise: preciseCut,
          fileTag: `${startTime || '0'}-${endTime || 'end'}`
        };
      } catch (e) {
        return setDownloadError(e.message);
      }
    }

    const downloadId = 'dl_' + Date.now();
    setActiveDownloadId(downloadId);
    setDownloadProgress({ percent: 0, statusText: 'Initializing download process...' });
    setDownloadLogs('');
    setDownloadError('');

    const options = {
      url,
      quality,
      formatMode,
      exactFormatId,
      outputFolder: outputFolder || 'C:\\Downloads',
      cookieSource,
      customCookieFile,
      timecode: timecodeData,
      metadataId: metadata?.id || '',
      ...overrideOptions
    };

    window.aetherGrab.startDownload(downloadId, options);
  };

  const handleCancelDownload = () => {
    if (activeDownloadId && window.aetherGrab) {
      window.aetherGrab.cancelDownload(activeDownloadId);
    }
  };

  const handleUpdateYtdlp = async () => {
    if (!window.aetherGrab || updatingYtdlp) return;
    setUpdatingYtdlp(true);
    try {
      const res = await window.aetherGrab.updateYtDlp();
      showNotification(res.message);
      const updatedVersions = await window.aetherGrab.getBinaryVersions();
      setEngineStatus(updatedVersions);
    } catch (e) {
      showNotification('Update error: ' + e.message);
    } finally {
      setUpdatingYtdlp(false);
    }
  };

  const handleOpenFile = (filePath) => {
    if (window.aetherGrab) window.aetherGrab.openFile(filePath);
  };

  const handleOpenFolder = (filePath) => {
    if (window.aetherGrab) window.aetherGrab.openFolder(filePath);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  const handleCheckAppUpdate = async () => {
    if (!window.aetherGrab || checkingAppUpdate) return;
    setCheckingAppUpdate(true);
    try {
      const res = await window.aetherGrab.checkForAppUpdates();
      if (res && res.devNotice) {
        await window.aetherGrab.simulateAppUpdate('2.6.0');
      } else if (!res) {
        showNotification('AetherGrab is up to date.');
      }
    } catch (e) {
      showNotification('Update check error: ' + e.message);
    } finally {
      setCheckingAppUpdate(false);
    }
  };

  const handleStartDownloadAppUpdate = async () => {
    if (!window.aetherGrab) return;
    setIsDownloadingUpdate(true);
    setAppUpdateProgress({ percent: 0 });
    try {
      await window.aetherGrab.downloadAppUpdate();
    } catch (e) {
      setIsDownloadingUpdate(false);
      showNotification('Failed to start update download: ' + e.message);
    }
  };

  const handleRestartAndInstall = () => {
    if (window.aetherGrab) {
      window.aetherGrab.restartAndInstall();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-neutral-100 overflow-hidden font-sans">
      {/* Titlebar Header */}
      <Titlebar
        engineStatus={engineStatus}
        onUpdateYtdlp={handleUpdateYtdlp}
        updating={updatingYtdlp}
        appVersion={appVersion}
        onCheckAppUpdate={handleCheckAppUpdate}
        checkingAppUpdate={checkingAppUpdate}
        updateAvailableInfo={updateInfo}
        onOpenUpdateModal={() => setShowUpdateModal(true)}
      />

      {/* Notification Toast */}
      {statusNotification && (
        <div className="bg-blue-600/90 text-white text-xs px-4 py-2 flex items-center justify-between border-b border-blue-400/30 backdrop-blur-md transition-all shadow-glow-sm">
          <span>{statusNotification}</span>
          <button onClick={() => setStatusNotification('')} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Bento Grid Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {/* Card 1: URL Input & Actions */}
          <UrlInputCard
            url={url}
            setUrl={setUrl}
            cookieSource={cookieSource}
            setCookieSource={setCookieSource}
            customCookieFile={customCookieFile}
            onSelectCookieFile={handleSelectCookieFile}
            onFetchMetadata={handleFetchMetadata}
            onQuickDownload={() => handleStartDownload()}
            loadingMetadata={loadingMetadata}
            isDownloading={!!activeDownloadId}
          />

          {/* Card 2: Media Metadata & Format Selector */}
          <MetadataCard
            metadata={metadata}
            quality={quality}
            setQuality={setQuality}
            formatMode={formatMode}
            setFormatMode={setFormatMode}
            exactFormatId={exactFormatId}
            setExactFormatId={setExactFormatId}
          />

          {/* Card 3: Custom Timecode Trimmer */}
          <TimecodeCard
            trimEnabled={trimEnabled}
            setTrimEnabled={setTrimEnabled}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            preciseCut={preciseCut}
            setPreciseCut={setPreciseCut}
            duration={metadata?.duration}
          />

          {/* Card 4: Download Queue & Progress Tracker (Spans 2 cols on lg) */}
          <div className="lg:col-span-2">
            <ProgressCard
              activeDownload={activeDownloadId}
              progress={downloadProgress}
              logs={downloadLogs}
              onCancel={handleCancelDownload}
              errorMsg={downloadError}
            />
          </div>

          {/* Card 5: Media Library & History (Spans full width) */}
          <LibraryCard
            history={history}
            outputFolder={outputFolder}
            onSelectFolder={handleSelectFolder}
            onOpenFile={handleOpenFile}
            onOpenFolder={handleOpenFolder}
            onClearHistory={handleClearHistory}
          />
        </div>
      </div>

      {/* In-App Auto-Update Modal Popup */}
      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        currentVersion={appVersion}
        updateInfo={updateInfo}
        isDownloading={isDownloadingUpdate}
        downloadProgress={appUpdateProgress}
        isUpdateReady={isUpdateReady}
        onStartDownload={handleStartDownloadAppUpdate}
        onRestartAndInstall={handleRestartAndInstall}
      />
    </div>
  );
}
