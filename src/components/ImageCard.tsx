import React, { useState } from 'react';
import {
   Download,
   Eye,
   Trash2,
   RefreshCw,
   CheckCircle2,
   AlertCircle,
   ArrowRight,
   Sparkles,
   Sliders,
   Copy,
   Check,
   ChevronDown,
   ChevronUp,
 } from 'lucide-react';
 import { ImageItem, OutputFormat, CompressionPriority } from '../types';
 import { formatBytes } from '../utils/imageCompressor';
 import { downloadBlob } from '../utils/zipExport';

interface ImageCardProps {
  item: ImageItem;
  onUpdateTargetSize: (id: string, kb: number) => void;
  onUpdateFormat: (id: string, format: OutputFormat) => void;
  onUpdatePriority: (id: string, priority: CompressionPriority) => void;
  onRecompress: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenCompare: (item: ImageItem) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  onUpdateTargetSize,
  onUpdateFormat,
  onUpdatePriority,
  onRecompress,
  onDelete,
  onOpenCompare,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    if (!item.result) return;
    let ext = 'jpg';
    if (item.result.format === 'image/png') ext = 'png';
    else if (item.result.format === 'image/webp') ext = 'webp';

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    downloadBlob(item.result.blob, `${baseName}_${Math.round(item.result.size / 1024)}KB.${ext}`);
  };

  const handleCopy = async () => {
    if (!item.result) return;
    try {
      let blob = item.result.blob;
      if (item.result.format !== 'image/png') {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await new Promise((r) => (img.onload = r));
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/png'));
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write error', err);
    }
  };

  const isUnderTarget = item.result ? item.result.size <= item.targetSizeKB * 1024 : true;

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-150 overflow-hidden shadow-xs hover:border-slate-300 ${
        item.status === 'processing'
          ? 'border-indigo-500 ring-1 ring-indigo-500'
          : 'border-slate-200'
      }`}
      id={`image-card-${item.id}`}
    >
      <div className="p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Thumbnail & Base Meta */}
        <div className="flex items-center gap-3 min-w-0 w-full md:w-5/12">
          {/* Thumbnail */}
          <div
            onClick={() => item.result && onOpenCompare(item)}
            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 cursor-pointer group checkerboard-bg`}
          >
            <img
              src={item.result ? item.result.dataUrl : item.originalDataUrl}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
            />
            {item.result && (
              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Eye className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Name and Basic Specs */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate font-mono" title={item.name}>
                {item.name}
              </h3>
              <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {item.originalFormat.replace('image/', '')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-mono text-slate-500 mt-0.5">
              <span>元: <strong className="text-slate-700">{formatBytes(item.originalSize)}</strong></span>
              <span className="text-slate-300">•</span>
              <span>{item.originalWidth}×{item.originalHeight}</span>
            </div>

            {/* Target Size Badge / Edit button */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-600 font-mono">
                目標: <strong className="text-indigo-600 font-bold">{item.targetSizeKB} KB</strong>
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[10px] text-indigo-700 hover:text-indigo-900 font-medium underline flex items-center gap-0.5"
                id={`btn-edit-target-${item.id}`}
              >
                <Sliders className="w-2.5 h-2.5" />
                {isEditing ? '設定閉じる' : '個別設定'}
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Compression Result Metrics */}
        <div className="w-full md:w-4/12 flex flex-col justify-center px-0 md:px-3 border-t md:border-t-0 md:border-l md:border-r border-slate-100 pt-2.5 md:pt-0">
          {item.status === 'processing' ? (
            <div className="space-y-1 py-0.5">
              <div className="flex justify-between text-xs font-mono font-semibold text-indigo-600">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  OPTIMIZING...
                </span>
                <span>{item.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-150"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ) : item.status === 'done' && item.result ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-emerald-600 font-mono">
                  {formatBytes(item.result.size)}
                </span>
                {item.result.reductionPercent > 0 ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                    -{item.result.reductionPercent}%
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                    0%
                  </span>
                )}
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-x-1.5">
                <span>{item.result.width}×{item.result.height}</span>
                <span className="text-slate-300">•</span>
                <span>品質:{item.result.qualityUsed}%</span>
                <span className="text-slate-300">•</span>
                <span>{item.result.format.replace('image/', '').toUpperCase()}</span>
              </div>

              {isUnderTarget ? (
                <div className="text-[10px] font-mono font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  PASS (≤ {item.targetSizeKB} KB)
                </div>
              ) : (
                <div className="text-[10px] font-mono font-medium text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  OVER TARGET
                </div>
              )}
            </div>
          ) : item.status === 'error' ? (
            <div className="text-xs text-rose-600 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{item.error || 'ERROR'}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-mono">
              <span>QUEUED - TARGET: {item.targetSizeKB} KB</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 w-full md:w-3/12 justify-end">
          {item.result && (
            <>
              <button
                onClick={() => onOpenCompare(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-md border border-slate-200 transition-colors"
                title="圧縮前後の画質を比較"
                id={`btn-compare-${item.id}`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">比較</span>
              </button>

              <button
                onClick={handleCopy}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors border border-slate-200"
                title="クリップボードにコピー"
                id={`btn-copy-${item.id}`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-all shadow-xs"
                title="この画像を保存"
                id={`btn-download-${item.id}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>保存</span>
              </button>
            </>
          )}

          <button
            onClick={() => onRecompress(item.id)}
            disabled={item.status === 'processing'}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-40 border border-transparent hover:border-slate-200"
            title="再最適化を実行"
            id={`btn-recompress-${item.id}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${item.status === 'processing' ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent hover:border-rose-100"
            title="削除"
            id={`btn-delete-${item.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Accordion: Individual Target Size & Format Override */}
      {isEditing && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1 text-[10px] uppercase font-mono">個別の目標容量 (KB)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="5"
                max="50000"
                value={item.targetSizeKB}
                onChange={(e) => onUpdateTargetSize(item.id, Math.max(5, parseInt(e.target.value, 10) || 5))}
                className="w-full px-2 py-1 font-bold font-mono bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                id={`input-target-kb-${item.id}`}
              />
              <span className="font-mono text-slate-500 font-bold text-xs">KB</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 text-[10px] uppercase font-mono">出力フォーマット</label>
            <select
              value={item.outputFormat}
              onChange={(e) => onUpdateFormat(item.id, e.target.value as OutputFormat)}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-800 text-xs"
              id={`select-format-${item.id}`}
            >
              <option value="auto">自動最適化 (WebP/JPEG)</option>
              <option value="original">元形式維持 ({item.originalFormat.replace('image/', '')})</option>
              <option value="image/png">PNG形式</option>
              <option value="image/jpeg">JPEG形式</option>
              <option value="image/webp">WebP形式</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 text-[10px] uppercase font-mono">優先方針</label>
            <select
              value={item.priority}
              onChange={(e) => onUpdatePriority(item.id, e.target.value as CompressionPriority)}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-800 text-xs"
              id={`select-priority-${item.id}`}
            >
              <option value="balanced">バランス (画質+リサイズ)</option>
              <option value="quality">画質最優先 (リサイズ優先)</option>
              <option value="resolution">解像度最優先 (圧縮率優先)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

