import React, { useState, useRef, useEffect } from 'react';
import { Activity, XCircle, Terminal, Copy, Check, Gauge, ArrowDown, Timer, AlertCircle } from 'lucide-react';
import BentoCardWrapper from './BentoCardWrapper';

export default function ProgressCard({
  activeDownload,
  progress,
  logs,
  onCancel,
  errorMsg
}) {
  const [showLog, setShowLog] = useState(false);
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (showLog && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLog]);

  const copyLog = () => {
    if (logs && navigator.clipboard) {
      navigator.clipboard.writeText(logs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pct = progress?.percent != null ? Math.min(100, Math.max(0, progress.percent)) : 0;

  return (
    <BentoCardWrapper>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Download Progress & Live Engine
            </h2>
            <p className="text-[11px] text-neutral-400">Real-time Stream Statistics</p>
          </div>
        </div>

        {activeDownload && (
          <button
            onClick={onCancel}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-medium transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Main Download Progress Status */}
      {activeDownload ? (
        <div className="space-y-3">
          {/* Status Label & Percentage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-medium text-neutral-200 truncate">
                {progress?.statusText || 'Downloading media...'}
              </span>
            </div>
            <span className="text-sm font-bold font-mono text-emerald-400 ml-2">
              {progress?.percent != null ? `${Math.round(pct)}%` : '...'}
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="relative w-full h-3.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 relative"
              style={{ width: `${pct}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse-subtle" />
            </div>
          </div>

          {/* Stats Badges Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-800 flex flex-col items-center">
              <div className="flex items-center space-x-1 text-neutral-400 text-[10px] uppercase font-semibold">
                <Gauge className="w-3 h-3 text-blue-400" />
                <span>Speed</span>
              </div>
              <span className="text-xs font-mono font-medium text-neutral-100 mt-0.5">
                {progress?.speed || '0.0 MB/s'}
              </span>
            </div>

            <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-800 flex flex-col items-center">
              <div className="flex items-center space-x-1 text-neutral-400 text-[10px] uppercase font-semibold">
                <ArrowDown className="w-3 h-3 text-emerald-400" />
                <span>Downloaded</span>
              </div>
              <span className="text-xs font-mono font-medium text-neutral-100 mt-0.5 truncate">
                {progress?.downloadedSize ? `${progress.downloadedSize}` : '0 MB'}
              </span>
            </div>

            <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-800 flex flex-col items-center">
              <div className="flex items-center space-x-1 text-neutral-400 text-[10px] uppercase font-semibold">
                <Timer className="w-3 h-3 text-amber-400" />
                <span>ETA</span>
              </div>
              <span className="text-xs font-mono font-medium text-neutral-100 mt-0.5">
                {progress?.eta || '--:--'}
              </span>
            </div>
          </div>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start space-x-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <div>
            <div className="font-semibold text-red-200">Download Failed</div>
            <div className="mt-0.5 text-[11px] text-red-300/90">{errorMsg}</div>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-950/40 p-4 rounded-xl border border-dashed border-neutral-800/80 text-center py-6">
          <p className="text-xs text-neutral-400 font-medium">No active download task</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Click 'Quick Download' or select format settings to start</p>
        </div>
      )}

      {/* Terminal Output Accordion */}
      <div className="border-t border-neutral-800/60 pt-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center space-x-1.5 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-neutral-500" />
            <span>Raw Terminal Console</span>
          </button>
          {logs && (
            <button
              onClick={copyLog}
              className="flex items-center space-x-1 text-[10px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Log'}</span>
            </button>
          )}
        </div>

        {showLog && (
          <div className="h-32 overflow-y-auto mt-2 p-2 bg-neutral-950 rounded-lg border border-neutral-800 font-mono text-[10px] text-neutral-300 leading-relaxed whitespace-pre-wrap select-text">
            {logs || 'Waiting for process stdout stream...'}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </BentoCardWrapper>
  );
}
