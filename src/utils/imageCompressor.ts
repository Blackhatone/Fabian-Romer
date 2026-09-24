/**
 * Utility to compress and resize images on the client side before saving to
 * LocalStorage or Cloud Firestore.
 * 
 * CRITICAL: Preserves 100% transparent backgrounds for PNGs, SVGs, and WebPs.
 * NEVER paints a white background over transparent images.
 * Keeps candidate portrait cutouts and transparent campaign logos crisp and clean.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  mimeType?: 'image/webp' | 'image/png' | 'image/jpeg';
  preserveTransparency?: boolean;
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 900,
  maxHeight: 900,
  quality: 0.82,
  mimeType: 'image/webp', // WebP supports transparency and has superior compression
  preserveTransparency: true,
};

/**
 * Checks whether an image drawn on a canvas has any transparent/alpha pixels.
 */
function hasAlphaTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    // Step across pixels for fast evaluation
    const step = Math.max(1, Math.floor(imgData.length / (4 * 25000))) * 4;
    for (let i = 3; i < imgData.length; i += step) {
      if (imgData[i] < 245) {
        return true;
      }
    }
  } catch {
    // If CORS prevents reading imageData, assume it might be transparent to be safe
    return true;
  }
  return false;
}

/**
 * Compresses an image File or Blob to an optimized base64 Data URL while
 * guaranteeing transparent backgrounds are preserved.
 */
export async function compressImageFile(
  file: File | Blob,
  customOptions?: CompressOptions
): Promise<string> {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  // If it's an SVG, compression is not needed and preserves vector transparency
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // If user selected PNG or WebP, ensure we respect transparency
  const isOriginallyPngOrWebp = file.type === 'image/png' || file.type === 'image/webp';

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const compressed = resizeAndEncode(img, options, isOriginallyPngOrWebp);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen seleccionada.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses an existing Base64 Data URL or remote image if needed.
 * Guarantees transparency is NEVER lost.
 */
export async function compressBase64Image(
  dataUrl: string,
  customOptions?: CompressOptions
): Promise<string> {
  // If it's not a base64 data url, return as is
  if (!dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  // If it's already under 120KB, no urgent need to re-compress unless requested
  if (dataUrl.length < 120 * 1024 && !customOptions) {
    return dataUrl;
  }

  const isPngOrWebp = dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/webp');
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const compressed = resizeAndEncode(img, options, isPngOrWebp);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Resizes and encodes the image into an optimized Data URL.
 * NEVER paints a white background over transparent pixels!
 */
function resizeAndEncode(
  img: HTMLImageElement,
  options: CompressOptions,
  hintHasTransparency: boolean = false
): string {
  const maxWidth = options.maxWidth || 900;
  const maxHeight = options.maxHeight || 900;

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width <= 0 || height <= 0) {
    throw new Error('Dimensiones de imagen inválidas');
  }

  // Calculate new dimensions preserving aspect ratio
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Ensure transparent canvas background
  ctx.clearRect(0, 0, width, height);

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image directly onto the transparent canvas
  ctx.drawImage(img, 0, 0, width, height);

  // Check if image actually has transparency
  const hasAlpha = hintHasTransparency || hasAlphaTransparency(ctx, width, height);

  // Select output mimeType:
  // If the image has alpha transparency, NEVER use image/jpeg (which would turn it black or white).
  // Use image/webp or image/png to retain 100% transparency!
  let outputMimeType = options.mimeType || 'image/webp';
  if (hasAlpha && outputMimeType === 'image/jpeg') {
    outputMimeType = 'image/webp';
  }

  let quality = options.quality ?? 0.82;
  let result = canvas.toDataURL(outputMimeType, quality);

  // If the browser does not support WebP export (very rare, fallback returns PNG)
  // or if result size is still over ~380KB, adjust quality
  if (result.length > 380 * 1024 && quality > 0.6) {
    quality = 0.68;
    result = canvas.toDataURL(outputMimeType, quality);
  }

  return result;
}

/**
 * Intelligent utility to remove white/off-white studio backgrounds from
 * candidate photos or logos and turn them transparent.
 * Uses edge-based flood fill so internal white clothing or teeth are preserved!
 */
export async function removeWhiteBackground(
  imageSource: string,
  tolerance: number = 25
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas no disponible');
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Flood fill from outer edges (all 4 borders)
        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        // Helper to check if a pixel is near white
        const isWhitePixel = (idx: number): boolean => {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a < 50) return true; // already transparent
          // Near white threshold with neutral color balance check
          const threshold = 255 - tolerance;
          const isBright = r >= threshold && g >= threshold && b >= threshold;
          const isNeutral = Math.abs(r - g) <= 18 && Math.abs(r - b) <= 18;
          return isBright && isNeutral;
        };

        // Seed outer border pixels
        for (let x = 0; x < width; x++) {
          // Top edge
          const topIdx = (0 * width + x) * 4;
          if (isWhitePixel(topIdx)) {
            visited[0 * width + x] = 1;
            queue.push(x, 0);
          }
          // Bottom edge
          const botIdx = ((height - 1) * width + x) * 4;
          if (isWhitePixel(botIdx)) {
            visited[(height - 1) * width + x] = 1;
            queue.push(x, height - 1);
          }
        }

        for (let y = 0; y < height; y++) {
          // Left edge
          const leftIdx = (y * width + 0) * 4;
          if (isWhitePixel(leftIdx) && !visited[y * width]) {
            visited[y * width] = 1;
            queue.push(0, y);
          }
          // Right edge
          const rightIdx = (y * width + (width - 1)) * 4;
          if (isWhitePixel(rightIdx) && !visited[y * width + (width - 1)]) {
            visited[y * width + (width - 1)] = 1;
            queue.push(width - 1, y);
          }
        }

        // BFS traversal for background flood fill
        let qIdx = 0;
        while (qIdx < queue.length) {
          const px = queue[qIdx++];
          const py = queue[qIdx++];
          const pIndex = (py * width + px) * 4;

          // Set this background pixel transparent
          data[pIndex + 3] = 0;

          // Check 4 neighbors
          const neighbors = [
            [px + 1, py],
            [px - 1, py],
            [px, py + 1],
            [px, py - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nVisIdx = ny * width + nx;
              if (!visited[nVisIdx]) {
                const nDataIdx = nVisIdx * 4;
                if (isWhitePixel(nDataIdx)) {
                  visited[nVisIdx] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        // Export with full transparency preserved as WebP
        const transparentResult = canvas.toDataURL('image/webp', 0.88);
        resolve(transparentResult);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('No se pudo procesar la imagen para remover el fondo'));
    };

    img.src = imageSource;
  });
}

