import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Copy, Check, ZoomIn, ZoomOut, Maximize2, SplitSquareVertical, Columns } from 'lucide-react';
import { ImageItem } from '../types';
import { formatBytes } from '../utils/imageCompressor';
import { downloadBlob } from '../utils/zipExport';

interface ComparisonModalProps {
  item: ImageItem | null;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ item, onClose }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'sideBySide'>('split');
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item || !item.result) return null;

  const { result } = item;

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleDownload = () => {
    if (!result) return;
    let ext = 'jpg';
    if (result.format === 'image/png') ext = 'png';
    else if (result.format === 'image/webp') ext = 'webp';

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    downloadBlob(result.blob, `${baseName}_${Math.round(result.size / 1024)}KB.${ext}`);
  };

  const handleCopyToClipboard = async () => {
    try {
      if (!result) return;
      const pngBlob = result.format === 'image/png' ? result.blob : await convertBlobToPng(result.blob);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  };

  const convertBlobToPng = (blob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        c.toBlob((b) => resolve(b || blob), 'image/png');
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-100">
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[92vh] rounded-xl flex flex-col shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
        id="modal-comparison"
      >
        {/* Modal Header */}
        <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-900 text-indigo-200 border border-indigo-700">
              INSPECTION HUD
            </span>
            <div className="truncate">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-white truncate max-w-xs sm:max-w-md">
                {item.name}
              </h3>
            </div>
          </div>

          {/* Center View Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-0.5 rounded-md border border-slate-700">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded flex items-center gap-1 transition-colors ${
                viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              id="btn-view-split"
            >
              <SplitSquareVertical className="w-3 h-3" />
              スプリット比較
            </button>
            <button
              onClick={() => setViewMode('sideBySide')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded flex items-center gap-1 transition-colors ${
                viewMode === 'sideBySide' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              id="btn-view-sidebyside"
            >
              <Columns className="w-3 h-3" />
              並列比較
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
              id="btn-copy-compare-image"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors shadow-xs"
              id="btn-download-compare-image"
            >
              <Download className="w-3 h-3" />
              <span>EXPORT</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              id="btn-close-compare-modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comparison Viewer Main */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center select-none dot-pattern"
        >
          {viewMode === 'split' ? (
            /* Interactive Split Comparison */
            <div className="relative w-full h-full flex items-center justify-center p-3">
              <div
                className="relative max-w-full max-h-full flex items-center justify-center checkerboard-bg rounded-md overflow-hidden border border-slate-800 shadow-2xl"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.1s ease-out' }}
              >
                {/* Result / After Image (Background) */}
                <img
                  src={result.dataUrl}
                  alt="Compressed"
                  className="max-w-full max-h-[70vh] object-contain block"
                  draggable={false}
                />

                {/* Original / Before Image (Clipped Overlay) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={item.originalDataUrl}
                    alt="Original"
                    className="absolute top-0 left-0 max-w-none h-full object-contain"
                    style={{ width: containerRef.current?.querySelector('img')?.clientWidth || 'auto' }}
                    draggable={false}
                  />
                </div>

                {/* Divider Line & Handle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                >
                  <div className="w-6 h-6 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-indigo-600 text-[9px] font-bold">
                    ↔
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-200 border border-slate-700 pointer-events-none">
                  BEFORE: {formatBytes(item.originalSize)}
                </div>
                <div className="absolute top-2 right-2 bg-indigo-950/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-bold text-indigo-200 border border-indigo-700 pointer-events-none">
                  AFTER: {formatBytes(result.size)} (-{result.reductionPercent}%)
                </div>
              </div>
            </div>
          ) : (
            /* Side-by-Side View */
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
              <div className="flex flex-col items-center justify-center bg-slate-900/60 rounded-lg p-3 border border-slate-800 relative">
                <div className="absolute top-2 left-2 bg-slate-800/90 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 font-bold border border-slate-700">
                  ORIGINAL: {formatBytes(item.originalSize)} ({item.originalWidth}×{item.originalHeight})
                </div>
                <img
                  src={item.originalDataUrl}
                  alt="Original"
                  className="max-h-[62vh] max-w-full object-contain rounded"
                />
              </div>

              <div className="flex flex-col items-center justify-center bg-slate-900/60 rounded-lg p-3 border border-slate-800 relative">
                <div className="absolute top-2 left-2 bg-indigo-950/90 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-indigo-800">
                  OPTIMIZED: {formatBytes(result.size)} ({result.width}×{result.height})
                </div>
                <img
                  src={result.dataUrl}
                  alt="Compressed"
                  className="max-h-[62vh] max-w-full object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Zoom Toolbar */}
          <div className="absolute bottom-3 left-4 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs p-1 rounded border border-slate-800 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="縮小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-slate-300">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3.0, Math.round((z + 0.25) * 100) / 100))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="拡大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 ml-1"
            >
              100%
            </button>
          </div>
        </div>

        {/* Modal Footer Statistics */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">ORIGINAL SIZE</span>
            <span className="font-semibold text-slate-200">{formatBytes(item.originalSize)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">OPTIMIZED SIZE</span>
            <span className="font-bold text-emerald-400">
              {formatBytes(result.size)} ({result.reductionPercent > 0 ? `-${result.reductionPercent}%` : '0%'})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">DIMENSIONS (SCALE)</span>
            <span className="font-semibold text-slate-200">
              {item.originalWidth}×{item.originalHeight} → {result.width}×{result.height} ({result.scaleUsed}%)
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">QUALITY / FORMAT</span>
            <span className="font-semibold text-indigo-300">{result.qualityUsed}% / {result.format.replace('image/', '').toUpperCase()}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">BENCHMARK</span>
            <span className="text-slate-300">{result.processingTimeMs} ms ({result.iterations} iters)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

