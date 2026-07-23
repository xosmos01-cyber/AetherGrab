import React from 'react';
import { Scissors, Clock } from 'lucide-react';
import BentoCardWrapper from './BentoCardWrapper';

export default function TimecodeCard({
  trimEnabled,
  setTrimEnabled,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  preciseCut,
  setPreciseCut,
  duration
}) {
  const quickPresets = [
    { label: 'First 30s', start: '00:00:00', end: '00:00:30' },
    { label: 'First 1m', start: '00:00:00', end: '00:01:00' },
    { label: 'First 3m', start: '00:00:00', end: '00:03:00' },
    { label: 'Reset', start: '', end: '' }
  ];

  const applyPreset = (start, end) => {
    setTrimEnabled(true);
    setStartTime(start);
    setEndTime(end);
  };

  return (
    <BentoCardWrapper>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Custom Timecode Trimmer
            </h2>
            <p className="text-[11px] text-neutral-400">FFmpeg Segment Extraction</p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={trimEnabled}
            onChange={(e) => setTrimEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {/* Main Time Inputs */}
      <div className={`space-y-3 transition-opacity ${trimEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <div className="grid grid-cols-2 gap-3">
          {/* Start Time */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Start Timestamp:
            </label>
            <div className="relative">
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="00:00:00 or 1:30"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 outline-none transition-all"
              />
              <Clock className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              End Timestamp:
            </label>
            <div className="relative">
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="00:02:45 or 4:15"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 outline-none transition-all"
              />
              <Clock className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Precise Cut Checkbox */}
        <div className="flex items-center space-x-2 bg-neutral-950/40 p-2 rounded-lg border border-neutral-800/50">
          <input
            type="checkbox"
            id="preciseCut"
            checked={preciseCut}
            onChange={(e) => setPreciseCut(e.target.checked)}
            className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500 bg-neutral-900"
          />
          <label htmlFor="preciseCut" className="text-[11px] text-neutral-300 cursor-pointer select-none">
            Precise Keyframe Cuts (<span className="font-mono text-amber-400/90">--force-keyframes-at-cuts</span>)
          </label>
        </div>

        {/* Quick Range Presets */}
        <div>
          <div className="text-[11px] font-medium text-neutral-400 mb-1.5">Quick Presets:</div>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(p.start, p.end)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800 text-[11px] flex items-center justify-between">
        <span className="text-neutral-400">Trim Segment:</span>
        <span className="font-mono font-medium text-amber-400">
          {trimEnabled
            ? `${startTime || '0:00'}  ➔  ${endTime || 'End of Video'}`
            : 'Disabled (Full Download)'}
        </span>
      </div>
    </BentoCardWrapper>
  );
}
