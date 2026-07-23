import React from 'react';
import { HardDrive, Folder, Play, ExternalLink, Trash2, FileVideo, FileAudio } from 'lucide-react';
import BentoCardWrapper from './BentoCardWrapper';

export default function LibraryCard({
  history,
  outputFolder,
  onSelectFolder,
  onOpenFile,
  onOpenFolder,
  onClearHistory
}) {
  const formatSize = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <BentoCardWrapper className="col-span-full">
      {/* Header & Path Section */}
      <div className="flex flex-col space-y-3 border-b border-neutral-800/60 pb-3.5">
        {/* Title & Icon */}
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200 truncate">
              Media Library & Download Location
            </h2>
            <p className="text-[11px] text-neutral-400 truncate">
              Manage Completed Media Files & Storage Destination
            </p>
          </div>
        </div>

        {/* Directory Picker Bar - Positioned Below Title & Description */}
        <div className="flex items-center justify-between space-x-3 bg-neutral-950/80 p-2.5 px-3.5 rounded-xl border border-neutral-800/80 text-xs w-full shadow-inner min-w-0">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <Folder className="w-4 h-4 text-blue-400 shrink-0" />
            <span
              className="text-neutral-300 font-mono text-[11px] truncate min-w-0 select-all"
              title={outputFolder || 'Default Downloads Directory'}
            >
              {outputFolder || 'Default Downloads Directory'}
            </span>
          </div>
          <button
            onClick={onSelectFolder}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 text-[11px] font-medium transition-all border border-neutral-700/60 shrink-0 shadow-sm flex items-center space-x-1"
          >
            <span>Change</span>
          </button>
        </div>
      </div>

      {/* History Grid / List Section */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400 mb-3">
          <span>Recent Downloads ({history.length}):</span>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-neutral-500 hover:text-red-400 transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-60 overflow-y-auto pr-1">
            {history.map((item, idx) => {
              const isAudio = /\.(mp3|m4a)$/i.test(item.fileName);
              return (
                <div
                  key={idx}
                  className="bg-neutral-950/90 hover:bg-neutral-900/90 p-3 rounded-xl border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col justify-between overflow-hidden shadow-sm"
                >
                  {/* File Metadata Header */}
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isAudio ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {isAudio ? <FileAudio className="w-4 h-4" /> : <FileVideo className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-neutral-100 truncate" title={item.fileName}>
                        {item.fileName}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-neutral-400 mt-1 flex-wrap">
                        <span className="font-mono">{formatSize(item.fileSize)}</span>
                        <span className="text-neutral-600">•</span>
                        <span className="uppercase text-blue-400 font-semibold px-1 rounded bg-blue-500/10 border border-blue-500/20">
                          {item.resolution || 'Media'}
                        </span>
                        <span className="text-neutral-600">•</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-2.5 mt-2.5 border-t border-neutral-900">
                    <button
                      onClick={() => onOpenFile(item.filePath)}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-200 text-[11px] font-medium transition-all border border-neutral-800 shadow-sm shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current text-emerald-400 shrink-0" />
                      <span className="truncate">Open File</span>
                    </button>
                    <button
                      onClick={() => onOpenFolder(item.filePath)}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-200 text-[11px] font-medium transition-all border border-neutral-800 shadow-sm shrink-0"
                    >
                      <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">Show Folder</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-neutral-950/40 p-4 rounded-xl border border-dashed border-neutral-800/80 text-center py-6">
            <p className="text-xs text-neutral-400 font-medium">No recent download history</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Your downloaded media files will be saved and accessible here</p>
          </div>
        )}
      </div>
    </BentoCardWrapper>
  );
}
