import React from 'react';
import { Film, Music, Eye, ThumbsUp, Settings2, Sliders } from 'lucide-react';
import BentoCardWrapper from './BentoCardWrapper';

export default function MetadataCard({
  metadata,
  quality,
  setQuality,
  formatMode,
  setFormatMode,
  exactFormatId,
  setExactFormatId
}) {
  const presets = [
    { id: 'best', label: 'Best Available' },
    { id: '2160', label: '4K (2160p)' },
    { id: '1440', label: '2K (1440p)' },
    { id: '1080', label: 'FHD (1080p)' },
    { id: '720', label: 'HD (720p)' },
    { id: '480', label: 'SD (480p)' },
    { id: 'audio', label: 'Audio Only (MP3)' }
  ];

  const modes = [
    { id: 'video+audio', label: 'Video + Audio', icon: Film },
    { id: 'audio', label: 'Audio Only', icon: Music },
    { id: 'video', label: 'Video Only', icon: Settings2 }
  ];

  const handlePresetSelect = (pId) => {
    setQuality(pId);
    setExactFormatId('');
    if (pId === 'audio') {
      setFormatMode('audio');
    } else if (formatMode === 'audio') {
      setFormatMode('video+audio');
    }
  };

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    if (val.startsWith('preset-')) {
      const pId = val.replace('preset-', '');
      handlePresetSelect(pId);
    } else if (val.startsWith('format-')) {
      const fId = val.replace('format-', '');
      setExactFormatId(fId);
    }
  };

  const currentValue = exactFormatId ? `format-${exactFormatId}` : `preset-${quality}`;

  return (
    <BentoCardWrapper>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Media & Target Format
            </h2>
            <p className="text-[11px] text-neutral-400">Resolution, Mode & Codecs</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-400 border border-neutral-700/50">
          Step 2
        </span>
      </div>

      {/* Metadata Preview Box */}
      {metadata ? (
        <div className="flex gap-3 bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
          {/* Thumbnail */}
          <div className="relative w-32 h-20 rounded-lg overflow-hidden shrink-0 bg-neutral-900 border border-neutral-800">
            {metadata.thumbnail ? (
              <img
                src={metadata.thumbnail}
                alt={metadata.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-600">
                <Film className="w-8 h-8" />
              </div>
            )}
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              {metadata.formattedDuration}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between min-w-0 flex-1">
            <div>
              <h3 className="text-xs font-semibold text-neutral-100 truncate line-clamp-2" title={metadata.title}>
                {metadata.title}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {metadata.uploader}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-[10px] text-neutral-400 pt-1">
              <span className="flex items-center space-x-1">
                <Eye className="w-3 h-3 text-neutral-400" />
                <span>{metadata.viewCount ? metadata.viewCount.toLocaleString() : 'N/A'}</span>
              </span>
              {metadata.likeCount > 0 && (
                <span className="flex items-center space-x-1">
                  <ThumbsUp className="w-3 h-3 text-neutral-400" />
                  <span>{metadata.likeCount.toLocaleString()}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-950/40 p-3 rounded-xl border border-dashed border-neutral-800/80 text-center py-4">
          <p className="text-xs text-neutral-400 font-medium">No media metadata fetched yet</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Enter a URL and click 'Inspect Metadata' to unlock custom stream formats</p>
        </div>
      )}

      {/* Mode Switcher */}
      <div>
        <div className="text-[11px] font-medium text-neutral-400 mb-1.5">Download Mode:</div>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950/80 rounded-xl border border-neutral-800">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = formatMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setFormatMode(m.id)}
                className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                  active
                    ? 'bg-blue-600/90 text-white shadow-glow-sm border border-blue-400/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stream Inspector Dropdown Menu */}
      <div className="border-t border-neutral-800/60 pt-2.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-neutral-300 mb-1.5">
          <span className="flex items-center space-x-1">
            <Sliders className="w-3 h-3 text-purple-400" />
            <span>Format Stream Selector</span>
          </span>
          {exactFormatId && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Format ID: [{exactFormatId}]
            </span>
          )}
        </div>

        <select
          value={currentValue}
          onChange={handleDropdownChange}
          className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500/80 rounded-xl px-3 py-2 text-xs font-medium text-neutral-100 outline-none cursor-pointer hover:border-neutral-700 transition-colors shadow-inner"
        >
          <optgroup label="Quality Presets">
            {presets.map((p) => (
              <option key={p.id} value={`preset-${p.id}`} className="bg-neutral-900 text-neutral-100 py-1">
                {p.label}
              </option>
            ))}
          </optgroup>

          {metadata?.formats && metadata.formats.length > 0 ? (
            <optgroup label="Additional fetched presets - if quality presets are not working">
              {metadata.formats.map((f) => (
                <option key={f.id} value={`format-${f.id}`} className="bg-neutral-900 text-neutral-100 py-1 font-mono">
                  [{f.id}] {f.description}
                </option>
              ))}
            </optgroup>
          ) : (
            <optgroup label="Inspect Metadata to get the additional presets">
              <option disabled value="" className="bg-neutral-900 text-neutral-500 italic">
                (Click 'Inspect Metadata' above to load additional stream formats)
              </option>
            </optgroup>
          )}
        </select>
      </div>
    </BentoCardWrapper>
  );
}
