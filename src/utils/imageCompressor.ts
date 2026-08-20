import { ImageResult, OutputFormat, CompressionPriority } from '../types';

/**
 * Format bytes to readable string (KB, MB, Bytes)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Normalize and detect MIME type from mime string and optional filename
 */
export function getNormalizedMimeType(mimeType?: string, filename?: string): string {
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('png')) return 'image/png';
  if (mime.includes('jpeg') || mime.includes('jpg') || mime.includes('pjpeg')) return 'image/jpeg';
  if (mime.includes('webp')) return 'image/webp';
  if (mime.includes('gif')) return 'image/png';
  if (mime.includes('bmp')) return 'image/png';
  if (mime.includes('avif')) return 'image/webp';

  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'png') return 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'gif' || ext === 'bmp') return 'image/png';
    if (ext === 'avif') return 'image/webp';
  }

  return 'image/jpeg';
}

/**
 * Helper to load an image source into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = src;
  });
}

/**
 * Check if an image contains transparency (alpha channel)
 */
export function checkHasAlpha(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const sampleWidth = Math.min(width, 100);
    const sampleHeight = Math.min(height, 100);
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Quantize colors for PNG palette reduction (improves PNG compression)
 */
function applyColorQuantization(ctx: CanvasRenderingContext2D, width: number, height: number, levels: number = 16) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const factor = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i] / factor) * factor);
    data[i + 1] = Math.round(Math.round(data[i + 1] / factor) * factor);
    data[i + 2] = Math.round(Math.round(data[i + 2] / factor) * factor);
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convert canvas to Blob with specified format and quality
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Canvas to Blob failed for ${mimeType}`));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Main compression & target size search algorithm
 */
export async function compressToTargetSize(
  img: HTMLImageElement,
  originalSize: number,
  targetSizeKB: number,
  formatOption: OutputFormat,
  priority: CompressionPriority,
  originalMimeType: string,
  onProgress?: (progress: number) => void
): Promise<ImageResult> {
  const startTime = performance.now();
  const targetSizeBytes = targetSizeKB * 1024;
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  // Determine output MIME type strictly based on formatOption and original MIME
  const normOriginal = getNormalizedMimeType(originalMimeType);
  let mimeType: string;

  if (formatOption === 'image/jpeg') {
    mimeType = 'image/jpeg';
  } else if (formatOption === 'image/png') {
    mimeType = 'image/png';
  } else if (formatOption === 'image/webp') {
    mimeType = 'image/webp';
  } else if (formatOption === 'original') {
    mimeType = normOriginal;
  } else if (formatOption === 'auto') {
    // In auto mode, preserve PNG for lossless/alpha, WebP if original is WebP, and JPEG for standard photos
    mimeType = normOriginal;
  } else {
    mimeType = normOriginal;
  }

  // Create working canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D Canvas Context not supported');

  let bestBlob: Blob | null = null;
  let bestScale = 1.0;
  let bestQuality = 0.92;
  let iterations = 0;

  // Render helper to handle transparency when outputting JPEG
  const drawImageOnCanvas = (targetW: number, targetH: number) => {
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If exporting to JPEG, fill canvas with white so transparent areas don't turn black
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    ctx.drawImage(img, 0, 0, targetW, targetH);
  };

  // If format is PNG (lossless, canvas ignores quality parameter)
  // We search the resolution scale & optional quantization
  if (mimeType === 'image/png') {
    let minScale = 0.05;
    let maxScale = 1.0;
    let currentScale = 1.0;

    for (let i = 0; i < 9; i++) {
      iterations++;
      onProgress?.(Math.min(95, Math.round((i / 9) * 100)));

      const targetW = Math.max(1, Math.round(origWidth * currentScale));
      const targetH = Math.max(1, Math.round(origHeight * currentScale));
      drawImageOnCanvas(targetW, targetH);

      const blob = await canvasToBlob(canvas, 'image/png');
      const size = blob.size;

      if (size <= targetSizeBytes) {
        bestBlob = blob;
        bestScale = currentScale;
        bestQuality = 1.0;

        minScale = currentScale;
        currentScale = (currentScale + maxScale) / 2;
      } else {
        maxScale = currentScale;
        currentScale = (minScale + currentScale) / 2;
      }

      if (Math.abs(maxScale - minScale) < 0.03) {
        break;
      }
    }

    // Fallback if even small PNG exceeds
    if (!bestBlob) {
      const targetW = Math.max(1, Math.round(origWidth * 0.25));
      const targetH = Math.max(1, Math.round(origHeight * 0.25));
      drawImageOnCanvas(targetW, targetH);
      applyColorQuantization(ctx, targetW, targetH, 16);
      bestBlob = await canvasToBlob(canvas, 'image/png');
      bestScale = 0.25;
      bestQuality = 0.8;
    }
  } else {
    // Lossy formats: JPEG or WebP
    let scale = 1.0;

    if (priority === 'resolution') {
      let minQ = 0.05;
      let maxQ = 0.98;
      let q = 0.85;

      const targetW = origWidth;
      const targetH = origHeight;
      drawImageOnCanvas(targetW, targetH);

      for (let i = 0; i < 8; i++) {
        iterations++;
        onProgress?.(Math.min(90, Math.round((i / 12) * 100)));
        const blob = await canvasToBlob(canvas, mimeType, q);
        
        if (blob.size <= targetSizeBytes) {
          bestBlob = blob;
          bestQuality = q;
          bestScale = 1.0;
          minQ = q;
          q = (q + maxQ) / 2;
        } else {
          maxQ = q;
          q = (minQ + q) / 2;
        }

        if (Math.abs(maxQ - minQ) < 0.03) break;
      }

      if (!bestBlob || bestBlob.size > targetSizeBytes) {
        let minScale = 0.1;
        let maxScale = 1.0;
        scale = 0.8;

        for (let j = 0; j < 7; j++) {
          iterations++;
          const curW = Math.max(1, Math.round(origWidth * scale));
          const curH = Math.max(1, Math.round(origHeight * scale));
          drawImageOnCanvas(curW, curH);

          const blob = await canvasToBlob(canvas, mimeType, 0.4);
          if (blob.size <= targetSizeBytes) {
            bestBlob = blob;
            bestScale = scale;
            bestQuality = 0.4;
            minScale = scale;
            scale = (scale + maxScale) / 2;
          } else {
            maxScale = scale;
            scale = (minScale + scale) / 2;
          }
          if (Math.abs(maxScale - minScale) < 0.05) break;
        }
      }
    } else if (priority === 'quality') {
      let minScale = 0.1;
      let maxScale = 1.0;
      scale = 1.0;
      const targetQuality = 0.88;

      for (let i = 0; i < 8; i++) {
        iterations++;
        onProgress?.(Math.min(90, Math.round((i / 10) * 100)));

        const targetW = Math.max(1, Math.round(origWidth * scale));
        const targetH = Math.max(1, Math.round(origHeight * scale));
        drawImageOnCanvas(targetW, targetH);

        const blob = await canvasToBlob(canvas, mimeType, targetQuality);
        if (blob.size <= targetSizeBytes) {
          bestBlob = blob;
          bestScale = scale;
          bestQuality = targetQuality;
          minScale = scale;
          scale = (scale + maxScale) / 2;
        } else {
          maxScale = scale;
          scale = (minScale + scale) / 2;
        }
        if (Math.abs(maxScale - minScale) < 0.04) break;
      }

      if (bestBlob && bestBlob.size < targetSizeBytes * 0.85) {
        const fineW = Math.max(1, Math.round(origWidth * bestScale));
        const fineH = Math.max(1, Math.round(origHeight * bestScale));
        drawImageOnCanvas(fineW, fineH);
        const finerBlob = await canvasToBlob(canvas, mimeType, 0.95);
        if (finerBlob.size <= targetSizeBytes) {
          bestBlob = finerBlob;
          bestQuality = 0.95;
        }
      }
    } else {
      // Balanced mode
      drawImageOnCanvas(origWidth, origHeight);
      const testBlob = await canvasToBlob(canvas, mimeType, 0.82);
      iterations++;

      if (testBlob.size <= targetSizeBytes) {
        let minQ = 0.82;
        let maxQ = 0.98;
        let q = 0.92;
        bestBlob = testBlob;
        bestQuality = 0.82;
        bestScale = 1.0;

        for (let i = 0; i < 5; i++) {
          iterations++;
          const blob = await canvasToBlob(canvas, mimeType, q);
          if (blob.size <= targetSizeBytes) {
            bestBlob = blob;
            bestQuality = q;
            minQ = q;
            q = (q + maxQ) / 2;
          } else {
            maxQ = q;
            q = (minQ + q) / 2;
          }
        }
      } else {
        let minScale = 0.1;
        let maxScale = 1.0;
        scale = Math.min(1.0, Math.sqrt(targetSizeBytes / testBlob.size) * 1.05);

        for (let i = 0; i < 7; i++) {
          iterations++;
          onProgress?.(Math.min(92, Math.round((i / 8) * 100)));
          const curW = Math.max(1, Math.round(origWidth * scale));
          const curH = Math.max(1, Math.round(origHeight * scale));
          drawImageOnCanvas(curW, curH);

          const blob = await canvasToBlob(canvas, mimeType, 0.78);
          if (blob.size <= targetSizeBytes) {
            bestBlob = blob;
            bestScale = scale;
            bestQuality = 0.78;
            minScale = scale;
            scale = (scale + maxScale) / 2;
          } else {
            maxScale = scale;
            scale = (minScale + scale) / 2;
          }
          if (Math.abs(maxScale - minScale) < 0.04) break;
        }

        if (bestBlob && bestBlob.size < targetSizeBytes * 0.85) {
          const fineW = Math.max(1, Math.round(origWidth * bestScale));
          const fineH = Math.max(1, Math.round(origHeight * bestScale));
          drawImageOnCanvas(fineW, fineH);
          const higherBlob = await canvasToBlob(canvas, mimeType, 0.88);
          if (higherBlob.size <= targetSizeBytes) {
            bestBlob = higherBlob;
            bestQuality = 0.88;
          }
        }
      }
    }

    if (!bestBlob) {
      const curW = Math.max(1, Math.round(origWidth * 0.3));
      const curH = Math.max(1, Math.round(origHeight * 0.3));
      drawImageOnCanvas(curW, curH);
      bestBlob = await canvasToBlob(canvas, mimeType, 0.3);
      bestScale = 0.3;
      bestQuality = 0.3;
    }
  }

  onProgress?.(100);
  const endTime = performance.now();
  const resultDataUrl = URL.createObjectURL(bestBlob);
  const finalW = Math.max(1, Math.round(origWidth * bestScale));
  const finalH = Math.max(1, Math.round(origHeight * bestScale));
  const reductionPercent = Math.round(((originalSize - bestBlob.size) / originalSize) * 100);

  return {
    blob: bestBlob,
    dataUrl: resultDataUrl,
    size: bestBlob.size,
    width: finalW,
    height: finalH,
    format: mimeType,
    qualityUsed: Math.round(bestQuality * 100),
    scaleUsed: Math.round(bestScale * 100),
    reductionPercent,
    iterations,
    processingTimeMs: Math.round(endTime - startTime),
  };
}

/**
 * Generate quick sample images for immediate testing
 */
export function createSampleImage(type: 'landscape' | 'portrait' | 'graphic'): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    if (type === 'landscape') {
      canvas.width = 1920;
      canvas.height = 1080;

      // Sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, 600);
      skyGradient.addColorStop(0, '#0f172a');
      skyGradient.addColorStop(0.4, '#1e3a8a');
      skyGradient.addColorStop(0.7, '#f97316');
      skyGradient.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, 1920, 1080);

      // Sun
      ctx.beginPath();
      ctx.arc(960, 520, 90, 0, Math.PI * 2);
      ctx.fillStyle = '#ffedd5';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 40;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Mountains
      ctx.beginPath();
      ctx.moveTo(0, 800);
      ctx.lineTo(400, 480);
      ctx.lineTo(850, 750);
      ctx.lineTo(1300, 420);
      ctx.lineTo(1700, 700);
      ctx.lineTo(1920, 600);
      ctx.lineTo(1920, 1080);
      ctx.lineTo(0, 1080);
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();

      // Foreground Hills
      ctx.beginPath();
      ctx.moveTo(0, 920);
      ctx.quadraticCurveTo(500, 750, 1000, 880);
      ctx.quadraticCurveTo(1500, 980, 1920, 840);
      ctx.lineTo(1920, 1080);
      ctx.lineTo(0, 1080);
      ctx.fillStyle = '#09090b';
      ctx.fill();

      // Stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * 1920;
        const y = Math.random() * 450;
        const r = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Title badge
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('Sample Ultra-HD Landscape (1920x1080)', 60, 90);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'sample_landscape_hd.png', { type: 'image/png' }));
        }
      }, 'image/png');
    } else if (type === 'graphic') {
      canvas.width = 1200;
      canvas.height = 1200;

      // Abstract geometric art
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 1200);
      bgGrad.addColorStop(0, '#065f46');
      bgGrad.addColorStop(0.5, '#047857');
      bgGrad.addColorStop(1, '#0f766e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 1200);

      // Circles & Patterns
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.arc(600 + Math.sin(i) * 300, 600 + Math.cos(i) * 300, 50 + i * 20, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + i * 0.04})`;
        ctx.lineWidth = 4 + i;
        ctx.stroke();
      }

      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('Sample Vector Illustration (PNG)', 600, 600);
      ctx.font = '24px sans-serif';
      ctx.fillText('Target Size Optimizer Demo', 600, 650);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'sample_graphic_vector.png', { type: 'image/png' }));
        }
      }, 'image/png');
    } else {
      // Portrait / Photo style
      canvas.width = 1000;
      canvas.height = 1300;

      const grad = ctx.createRadialGradient(500, 500, 50, 500, 650, 700);
      grad.addColorStop(0, '#7c2d12');
      grad.addColorStop(1, '#1c1917');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1000, 1300);

      // Stylized portrait silhouette
      ctx.beginPath();
      ctx.arc(500, 480, 180, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(500, 950, 320, Math.PI, Math.PI * 2);
      ctx.fillStyle = '#ea580c';
      ctx.fill();

      ctx.font = 'bold 40px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('Sample Portrait Card (1000x1300)', 500, 1200);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'sample_portrait_photo.jpg', { type: 'image/jpeg' }));
        }
      }, 'image/jpeg', 0.95);
    }
  });
}
