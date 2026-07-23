import React from 'react';
import { Link2, Clipboard, Trash2, Search, Zap, Cookie, MousePointerClick } from 'lucide-react';
import BentoCardWrapper from './BentoCardWrapper';
import ParticleButton from './ParticleButton';

export default function UrlInputCard({
  url,
  setUrl,
  cookieSource,
  setCookieSource,
  customCookieFile,
  onSelectCookieFile,
  onFetchMetadata,
  onQuickDownload,
  loadingMetadata,
  isDownloading
}) {
  const handlePaste = async () => {
    if (window.aetherGrab?.readClipboard) {
      const text = await window.aetherGrab.readClipboard();
      if (text) setUrl(text);
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  const cookieOptions = [
    { value: 'none', label: 'No Cookies (Public)' },
    { value: 'chrome', label: 'Google Chrome' },
    { value: 'edge', label: 'Microsoft Edge' },
    { value: 'firefox', label: 'Mozilla Firefox' },
    { value: 'brave', label: 'Brave Browser' },
    { value: 'opera', label: 'Opera' },
    { value: 'custom', label: customCookieFile ? `File: ${customCookieFile.split('\\').pop()}` : 'Custom cookies.txt...' }
  ];

  const handleCookieChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      onSelectCookieFile();
    } else {
      setCookieSource(val);
    }
  };

  return (
    <BentoCardWrapper>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Media Source URL
            </h2>
            <p className="text-[11px] text-neutral-400">YouTube, Shorts, Reels, TikTok & 1000+ sites</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-400 border border-neutral-700/50">
          Step 1
        </span>
      </div>

      {/* Main Input Box */}
      <div className="space-y-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste media link here (e.g. https://www.youtube.com/watch?v=...)"
            className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-blue-500/80 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 outline-none transition-all pr-20 shadow-inner"
          />
          <div className="absolute right-2 flex items-center space-x-1">
            {url && (
              <button
                onClick={handleClear}
                className="p-1 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 transition-colors"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handlePaste}
              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3 h-3" />
              <span>Paste</span>
            </button>
          </div>
        </div>

        {/* Cookie / Browser Session Bar */}
        <div className="flex items-center justify-between bg-neutral-950/40 p-2 rounded-lg border border-neutral-800/50 text-xs">
          <div className="flex items-center space-x-1.5 text-neutral-400 text-[11px]">
            <Cookie className="w-3.5 h-3.5 text-amber-400" />
            <span>Auth Cookies:</span>
          </div>
          <select
            value={cookieSource}
            onChange={handleCookieChange}
            className="bg-neutral-900 border border-neutral-700/60 text-neutral-200 text-[11px] rounded px-2 py-1 outline-none cursor-pointer hover:border-neutral-600 transition-colors"
          >
            {cookieOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={onFetchMetadata}
          disabled={!url || loadingMetadata || isDownloading}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs border border-neutral-700/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow-sm"
        >
          <Search className={`w-3.5 h-3.5 ${loadingMetadata ? 'animate-spin text-blue-400' : ''}`} />
          <span>{loadingMetadata ? 'Analyzing...' : 'Inspect Metadata'}</span>
        </button>

        <ParticleButton
          onClick={onQuickDownload}
          disabled={!url || loadingMetadata || isDownloading}
          className="w-full"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Quick Download</span>
          <MousePointerClick className="h-3.5 w-3.5 ml-0.5" />
        </ParticleButton>
      </div>
    </BentoCardWrapper>
  );
}

