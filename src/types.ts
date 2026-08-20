export type OutputFormat = 'original' | 'image/jpeg' | 'image/png' | 'image/webp' | 'auto';
export type CompressionPriority = 'quality' | 'resolution' | 'balanced';

export interface ImageResult {
  blob: Blob;
  dataUrl: string;
  size: number;
  width: number;
  height: number;
  format: string;
  qualityUsed: number;
  scaleUsed: number;
  reductionPercent: number;
  iterations: number;
  processingTimeMs: number;
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  originalDataUrl: string;
  targetSizeKB: number;
  outputFormat: OutputFormat;
  priority: CompressionPriority;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  error?: string;
  result?: ImageResult;
}

export interface PresetSize {
  label: string;
  sizeKB: number;
  category: 'web' | 'sns' | 'doc' | 'custom';
  description: string;
  icon?: string;
}
