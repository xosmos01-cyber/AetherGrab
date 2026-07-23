import React from 'react';
import { Download, RefreshCw, X, Sparkles, ArrowRight, Gauge, CheckCircle2, ShieldAlert } from 'lucide-react';
import ParticleButton from './ParticleButton';

export default function UpdateModal({
  isOpen,
  onClose,
  currentVersion = '2.5.0',
  updateInfo,
  isDownloading,
  downloadProgress,
  isUpdateReady,
  onStartDownload,
  onRestartAndInstall
}) {
  if (!isOpen || !updateInfo) return null;

  const newVersion = updateInfo.version || '2.6.0';
  const releaseNotes = updateInfo.releaseNotes || 'Includes performance improvements, bug fixes, and stability enhancements.';

  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const pct = downloadProgress?.percent != null ? Math.min(100, Math.max(0, downloadProgress.percent)) : 0;
  const speed = downloadProgress?.bytesPerSecond
    ? `${(downloadProgress.bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
    : '0 MB/s';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-b from-neutral-900/95 via-neutral-900/90 to-neutral-950/95 p-6 shadow-[0_0_50px_rgba(59,130,246,0.25)] backdrop-blur-xl">
        
        {/* Header Ambient Glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        {!isDownloading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors z-10"
            title="Dismiss update"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Icon & Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-glow-sm shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide text-neutral-100 flex items-center gap-2">
              <span>New Update Available</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PRO Upgrade
              </span>
            </h2>
            <p className="text-xs text-neutral-400">An update for AetherGrab is ready to install.</p>
          </div>
        </div>

        {/* Version Badge Box */}
        <div className="flex items-center justify-between bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 mb-4 shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-neutral-400">Current:</span>
            <span className="font-mono text-xs font-semibold text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              v{currentVersion}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-400" />
          <div className="flex items-center space-x-2">
            <span className="text-xs text-neutral-400">New Version:</span>
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              v{newVersion}
            </span>
          </div>
        </div>

        {/* Release Notes Box */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
            What's New in v{newVersion}:
          </div>
          <div className="max-h-36 overflow-y-auto bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 text-xs text-neutral-300 font-sans leading-relaxed whitespace-pre-wrap select-text">
            {releaseNotes}
          </div>
        </div>

        {/* Dynamic State UI */}
        {isUpdateReady ? (
          /* State 3: Download Complete -> Restart to Update */
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center space-x-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-emerald-200">Update Downloaded & Verified</div>
                <div className="text-[11px] text-emerald-300/80">Restart the application now to apply update v{newVersion}.</div>
              </div>
            </div>

            <button
              onClick={onRestartAndInstall}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs border border-emerald-400/30 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>Restart to Update</span>
            </button>
          </div>
        ) : isDownloading ? (
          /* State 2: Downloading Progress */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-neutral-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>Downloading update binaries...</span>
              </span>
              <span className="font-mono font-bold text-blue-400">{Math.round(pct)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pt-1">
              <span className="flex items-center space-x-1">
                <Gauge className="w-3 h-3 text-blue-400" />
                <span>{speed}</span>
              </span>
              <span>
                {formatBytes(downloadProgress?.transferred)} / {formatBytes(downloadProgress?.total)}
              </span>
            </div>
          </div>
        ) : (
          /* State 1: Initial Available State -> Download Button */
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium border border-neutral-700/60 transition-colors"
            >
              Remind Me Later
            </button>

            <ParticleButton
              onClick={onStartDownload}
              className="py-2.5 px-5"
            >
              <Download className="w-4 h-4" />
              <span className="font-bold">Download Update</span>
            </ParticleButton>
          </div>
        )}
      </div>
    </div>
  );
}
