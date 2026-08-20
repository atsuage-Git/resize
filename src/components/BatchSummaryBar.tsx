import React, { useState } from 'react';
import { Download, RefreshCw, Archive, CheckCircle, Sparkles, Database } from 'lucide-react';
import { ImageItem } from '../types';
import { formatBytes } from '../utils/imageCompressor';
import { createZipDownload, downloadBlob } from '../utils/zipExport';

interface BatchSummaryBarProps {
  items: ImageItem[];
  onCompressAll: () => void;
  isProcessingAny: boolean;
}

export const BatchSummaryBar: React.FC<BatchSummaryBarProps> = ({
  items,
  onCompressAll,
  isProcessingAny,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const doneItems = items.filter((item) => item.status === 'done' && item.result);
  const totalOriginalSize = items.reduce((acc, item) => acc + item.originalSize, 0);
  const totalResultSize = doneItems.reduce((acc, item) => acc + (item.result?.size || 0), 0);

  const totalSaved = Math.max(0, totalOriginalSize - totalResultSize);
  const totalSavedPercent =
    totalOriginalSize > 0 && doneItems.length === items.length
      ? Math.round((totalSaved / totalOriginalSize) * 100)
      : 0;

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      setZipProgress(0);
      const zipBlob = await createZipDownload(items, (progress) => {
        setZipProgress(progress);
      });
      downloadBlob(zipBlob, `compressed_images_${items.length}files.zip`);
    } catch (err) {
      console.error('ZIP generation failed', err);
    } finally {
      setIsZipping(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="sticky bottom-3 z-20 max-w-7xl w-full mx-auto px-3 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto bg-slate-900 text-white rounded-xl p-3 sm:p-4 shadow-xl border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-md">
        {/* Left: Summary Metrics */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">QUEUE STATUS</span>
            <span className="font-bold text-white font-mono text-xs sm:text-sm">
              {doneItems.length} / {items.length} COMPLETED
            </span>
          </div>

          <div className="h-6 w-px bg-slate-700 hidden sm:block" />

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">TOTAL BYTES</span>
            <span className="font-mono text-slate-300 text-xs sm:text-sm">
              {formatBytes(totalOriginalSize)} →{' '}
              <strong className="text-emerald-400 font-bold">
                {doneItems.length > 0 ? formatBytes(totalResultSize) : '--'}
              </strong>
            </span>
          </div>

          {doneItems.length > 0 && totalSavedPercent > 0 && (
            <>
              <div className="h-6 w-px bg-slate-700 hidden sm:block" />
              <div className="hidden lg:block">
                <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">SAVINGS</span>
                <span className="text-emerald-400 font-bold font-mono text-xs sm:text-sm">
                  {formatBytes(totalSaved)} (-{totalSavedPercent}%)
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onCompressAll}
            disabled={isProcessingAny}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors disabled:opacity-50"
            id="btn-batch-recompress-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessingAny ? 'animate-spin text-indigo-400' : ''}`} />
            <span>一括再最適化</span>
          </button>

          {doneItems.length > 0 && (
            <button
              onClick={handleDownloadZip}
              disabled={isZipping || doneItems.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40 transition-all disabled:opacity-50"
              id="btn-batch-download-zip"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isZipping ? `ZIP作成中 (${zipProgress}%)...` : `ZIP一括保存 (${doneItems.length}件)`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

