import JSZip from 'jszip';
import { ImageItem } from '../types';

/**
 * Generate a ZIP file from multiple compressed images
 */
export async function createZipDownload(
  items: ImageItem[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('compressed_images') || zip;

  const validItems = items.filter((item) => item.status === 'done' && item.result);

  validItems.forEach((item, index) => {
    if (!item.result) return;
    
    // Determine extension
    let ext = 'jpg';
    if (item.result.format === 'image/png') ext = 'png';
    else if (item.result.format === 'image/webp') ext = 'webp';

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}_${Math.round(item.result.size / 1024)}KB.${ext}`;

    folder.file(fileName, item.result.blob);
  });

  return await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );
}

/**
 * Trigger browser download for a Blob with a specific filename
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
