import React, { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Plus, Copy, FileUp } from 'lucide-react';
import { createSampleImage } from '../utils/imageCompressor';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isLoadingSample: boolean;
  setIsLoadingSample: (loading: boolean) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  isLoadingSample,
  setIsLoadingSample,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support paste from clipboard anywhere
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        onFilesSelected(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles);
      }
      e.target.value = '';
    }
  };

  const loadSample = async (type: 'landscape' | 'graphic' | 'portrait') => {
    try {
      setIsLoadingSample(true);
      const sampleFile = await createSampleImage(type);
      onFilesSelected([sampleFile]);
    } catch (err) {
      console.error('Failed to generate sample image', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        id="dropzone-area"
        className={`relative border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all duration-150 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/80 scale-[1.002]'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Upload className="w-5 h-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              ここに画像をドラッグ＆ドロップ、またはクリックしてファイル選択
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              PNG / JPEG / WebP / GIF / BMP / AVIF（複数ファイル一括追加・クリップボード <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-slate-100 border border-slate-300 rounded text-slate-700">Ctrl+V</kbd> 貼り付け対応）
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-mono text-slate-400">TEST SAMPLES:</span>
            <button
              type="button"
              disabled={isLoadingSample}
              onClick={() => loadSample('landscape')}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors disabled:opacity-50"
              id="btn-sample-landscape"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              風景 (1920×1080)
            </button>
            <button
              type="button"
              disabled={isLoadingSample}
              onClick={() => loadSample('graphic')}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors disabled:opacity-50"
              id="btn-sample-graphic"
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              ベクター透過PNG
            </button>
            <button
              type="button"
              disabled={isLoadingSample}
              onClick={() => loadSample('portrait')}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors disabled:opacity-50"
              id="btn-sample-portrait"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              人物写真
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

