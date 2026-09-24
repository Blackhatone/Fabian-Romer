/**
 * Utility to compress and resize images on the client side before saving to
 * LocalStorage or Cloud Firestore.
 * 
 * Ensures images are crisp, optimized for web/mobile, and fit comfortably within
 * Firestore's 1MB document limit and LocalStorage's 5MB origin limit.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 900,
  maxHeight: 900,
  quality: 0.78,
  mimeType: 'image/jpeg',
};

/**
 * Compresses an image File or Blob to an optimized base64 Data URL.
 */
export async function compressImageFile(
  file: File | Blob,
  customOptions?: CompressOptions
): Promise<string> {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  // If it's an SVG, compression is not needed
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const compressed = resizeAndEncode(img, options);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen seleccionada.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses an existing Base64 Data URL or remote image if needed.
 */
export async function compressBase64Image(
  dataUrl: string,
  customOptions?: CompressOptions
): Promise<string> {
  // If it's a small URL or not a base64 string, return as is
  if (!dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  // If it's already under 120KB, no urgent need to re-compress unless requested
  if (dataUrl.length < 120 * 1024 && !customOptions) {
    return dataUrl;
  }

  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const compressed = resizeAndEncode(img, options);
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

function resizeAndEncode(img: HTMLImageElement, options: CompressOptions): string {
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

  // Smooth scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw on white background in case of transparent PNG converting to JPEG
  if (options.mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  let quality = options.quality ?? 0.78;
  let result = canvas.toDataURL(options.mimeType, quality);

  // If the output exceeds ~350KB, reduce quality one step
  if (result.length > 350 * 1024 && quality > 0.5) {
    quality = 0.6;
    result = canvas.toDataURL(options.mimeType, quality);
  }

  return result;
}
