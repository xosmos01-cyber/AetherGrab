import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Download, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';
import appLogo from '../assets/icon.png';

export default function Titlebar({ engineStatus, onUpdateYtdlp, updating }) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.aetherGrab && window.aetherGrab.isMaximized) {
      window.aetherGrab.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    if (window.aetherGrab) window.aetherGrab.minimizeWindow();
  };

  const handleMaximize = () => {
    if (window.aetherGrab) {
      window.aetherGrab.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.aetherGrab) window.aetherGrab.closeWindow();
  };

  return (
    <div className="h-10 w-full bg-[#09090b]/90 backdrop-blur-md border-b border-neutral-800/60 flex items-center justify-between px-3 select-none drag-region z-50">
      {/* Left Branding */}
      <div className="flex items-center space-x-2.5">
        <div className="h-6 w-6 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-white/10 shadow-glow-sm bg-neutral-900">
          <img src={appLogo} alt="AetherGrab Logo" className="w-full h-full object-cover" />
        </div>
        <span className="text-sm font-semibold tracking-wide bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
          AetherGrab
        </span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          PRO v2.5
        </span>
      </div>

      {/* Center Status Pill */}
      <div className="hidden md:flex items-center space-x-3 no-drag">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300">
          <Cpu className="w-3 h-3 text-blue-400" />
          <span>yt-dlp {engineStatus?.ytdlp || 'Ready'}</span>
          <span className="text-neutral-600">•</span>
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>FFmpeg: {engineStatus?.ffmpeg ? 'Active' : 'Missing'}</span>
          <span className="text-neutral-600">•</span>
          <span className="text-purple-400 font-mono text-[10px]">Deno: {engineStatus?.deno ? 'Prepacked' : 'Available'}</span>
        </div>

        <button
          onClick={onUpdateYtdlp}
          disabled={updating}
          className="flex items-center space-x-1 px-2 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
          title="Update yt-dlp binary"
        >
          <RefreshCw className={`w-3 h-3 ${updating ? 'animate-spin text-blue-400' : ''}`} />
          <span>{updating ? 'Updating...' : 'Update Core'}</span>
        </button>
      </div>

      {/* Right Window Control Buttons */}
      <div className="flex items-center no-drag">
        <button
          onClick={handleMinimize}
          className="w-9 h-7 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-9 h-7 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? <Copy className="w-3 h-3 rotate-180" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          onClick={handleClose}
          className="w-9 h-7 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-red-600/90 transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
