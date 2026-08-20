import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { TargetSizeControl } from './components/TargetSizeControl';
import { ImageCard } from './components/ImageCard';
import { ComparisonModal } from './components/ComparisonModal';
import { BatchSummaryBar } from './components/BatchSummaryBar';
import { HelpModal } from './components/HelpModal';
import { ImageItem, OutputFormat, CompressionPriority } from './types';
import { compressToTargetSize, loadImage } from './utils/imageCompressor';
import { Sparkles, Layers, ArrowUpDown, Filter, HelpCircle } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [globalTargetSizeKB, setGlobalTargetSizeKB] = useState<number>(200);
  const [globalOutputFormat, setGlobalOutputFormat] = useState<OutputFormat>('auto');
  const [globalPriority, setGlobalPriority] = useState<CompressionPriority>('balanced');
  
  const [activeCompareItem, setActiveCompareItem] = useState<ImageItem | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Keep a ref of items to prevent stale closures in async runners
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.originalDataUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.originalDataUrl);
        }
        if (item.result?.dataUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.result.dataUrl);
        }
      });
    };
  }, []);

  /**
   * Process compression for a single item
   */
  const processItem = useCallback(
    async (item: ImageItem, targetKB?: number, format?: OutputFormat, priority?: CompressionPriority) => {
      const currentTargetKB = targetKB ?? item.targetSizeKB;
      const currentFormat = format ?? item.outputFormat;
      const currentPriority = priority ?? item.priority;

      // Update status to processing
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'processing', progress: 0, error: undefined, targetSizeKB: currentTargetKB, outputFormat: currentFormat, priority: currentPriority }
            : i
        )
      );

      try {
        const img = await loadImage(item.originalDataUrl);
        const result = await compressToTargetSize(
          img,
          item.originalSize,
          currentTargetKB,
          currentFormat,
          currentPriority,
          item.originalFormat,
          (progress) => {
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress } : i))
            );
          }
        );

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'done',
                  progress: 100,
                  result,
                }
              : i
          )
        );

        // Update active compare item if it's currently open
        setActiveCompareItem((curr) => {
          if (curr && curr.id === item.id) {
            return {
              ...curr,
              status: 'done',
              result,
              targetSizeKB: currentTargetKB,
              outputFormat: currentFormat,
              priority: currentPriority,
            };
          }
          return curr;
        });
      } catch (err: any) {
        console.error('Compression error:', err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error',
                  progress: 0,
                  error: err?.message || '圧縮処理中にエラーが発生しました',
                }
              : i
          )
        );
      }
    },
    []
  );

  /**
   * Add newly selected files to queue and immediately start compression
   */
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const newItems: ImageItem[] = [];

      for (const file of files) {
        const id = 'img_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        const originalDataUrl = URL.createObjectURL(file);

        let width = 0;
        let height = 0;
        try {
          const img = await loadImage(originalDataUrl);
          width = img.naturalWidth || img.width;
          height = img.naturalHeight || img.height;
        } catch {
          width = 800;
          height = 600;
        }

        const newItem: ImageItem = {
          id,
          file,
          name: file.name,
          originalSize: file.size,
          originalWidth: width,
          originalHeight: height,
          originalFormat: file.type || 'image/png',
          originalDataUrl,
          targetSizeKB: globalTargetSizeKB,
          outputFormat: globalOutputFormat,
          priority: globalPriority,
          status: 'idle',
          progress: 0,
        };

        newItems.push(newItem);
      }

      setItems((prev) => [...prev, ...newItems]);

      // Process new items
      newItems.forEach((item) => {
        processItem(item, globalTargetSizeKB, globalOutputFormat, globalPriority);
      });
    },
    [globalTargetSizeKB, globalOutputFormat, globalPriority, processItem]
  );

  /**
   * Apply global target size and format to all items
   */
  const handleApplyToAll = useCallback(() => {
    items.forEach((item) => {
      processItem(item, globalTargetSizeKB, globalOutputFormat, globalPriority);
    });
  }, [items, globalTargetSizeKB, globalOutputFormat, globalPriority, processItem]);

  /**
   * Trigger recompression for all items
   */
  const handleCompressAll = useCallback(() => {
    items.forEach((item) => {
      processItem(item);
    });
  }, [items, processItem]);

  /**
   * Update per-image target size
   */
  const handleUpdateItemTargetSize = useCallback(
    (id: string, kb: number) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        processItem(item, kb);
      }
    },
    [items, processItem]
  );

  /**
   * Update per-image format
   */
  const handleUpdateItemFormat = useCallback(
    (id: string, format: OutputFormat) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        processItem(item, undefined, format);
      }
    },
    [items, processItem]
  );

  /**
   * Update per-image priority
   */
  const handleUpdateItemPriority = useCallback(
    (id: string, priority: CompressionPriority) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        processItem(item, undefined, undefined, priority);
      }
    },
    [items, processItem]
  );

  /**
   * Recompress single item
   */
  const handleRecompressItem = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        processItem(item);
      }
    },
    [items, processItem]
  );

  /**
   * Delete single item
   */
  const handleDeleteItem = useCallback((id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      const target = prev.find((i) => i.id === id);
      if (target) {
        if (target.originalDataUrl.startsWith('blob:')) URL.revokeObjectURL(target.originalDataUrl);
        if (target.result?.dataUrl.startsWith('blob:')) URL.revokeObjectURL(target.result.dataUrl);
      }
      return filtered;
    });
  }, []);

  /**
   * Clear all items
   */
  const handleClearAll = useCallback(() => {
    items.forEach((item) => {
      if (item.originalDataUrl.startsWith('blob:')) URL.revokeObjectURL(item.originalDataUrl);
      if (item.result?.dataUrl.startsWith('blob:')) URL.revokeObjectURL(item.result.dataUrl);
    });
    setItems([]);
    setActiveCompareItem(null);
  }, [items]);

  const isProcessingAny = items.some((i) => i.status === 'processing');

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        itemCount={items.length}
        onClearAll={handleClearAll}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Global Settings & Controls */}
        <TargetSizeControl
          targetSizeKB={globalTargetSizeKB}
          setTargetSizeKB={setGlobalTargetSizeKB}
          outputFormat={globalOutputFormat}
          setOutputFormat={setGlobalOutputFormat}
          priority={globalPriority}
          setPriority={setGlobalPriority}
          onApplyToAll={handleApplyToAll}
          hasItems={items.length > 0}
        />

        {/* Upload Dropzone */}
        <Dropzone
          onFilesSelected={handleFilesSelected}
          isLoadingSample={isLoadingSample}
          setIsLoadingSample={setIsLoadingSample}
        />

        {/* Image Queue List */}
        {items.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  OPTIMIZATION QUEUE ({items.length} FILES)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                サムネイルクリックで拡大・画質比較スプリットHUD表示
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  onUpdateTargetSize={handleUpdateItemTargetSize}
                  onUpdateFormat={handleUpdateItemFormat}
                  onUpdatePriority={handleUpdateItemPriority}
                  onRecompress={handleRecompressItem}
                  onDelete={handleDeleteItem}
                  onOpenCompare={(i) => setActiveCompareItem(i)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Bottom Action Bar */}
      <BatchSummaryBar
        items={items}
        onCompressAll={handleCompressAll}
        isProcessingAny={isProcessingAny}
      />

      {/* Interactive Compare Modal */}
      {activeCompareItem && (
        <ComparisonModal
          item={activeCompareItem}
          onClose={() => setActiveCompareItem(null)}
        />
      )}

      {/* Help & Details Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
