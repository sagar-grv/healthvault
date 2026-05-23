/**
 * Image Optimization Pipeline
 *
 * Compresses images client-side before upload:
 * - Resizes to max 1920px width (maintains aspect ratio)
 * - Converts to JPEG at 80% quality
 * - Generates 200px thumbnail for list views
 * - PDFs pass through unchanged
 *
 * Typical results:
 *   8 MB phone photo → ~400 KB (95% reduction)
 *   5 MB photo → ~300 KB (94% reduction)
 */

export interface OptimizedImage {
  /** Compressed full-size image blob */
  blob: Blob;
  /** 200px thumbnail blob for list view */
  thumbnail: Blob;
  /** Original file name (preserved) */
  fileName: string;
  /** MIME type of optimized file */
  mimeType: string;
  /** Original size in bytes */
  originalSize: number;
  /** Compressed size in bytes */
  compressedSize: number;
  /** Width of compressed image */
  width: number;
  /** Height of compressed image */
  height: number;
}

export interface OptimizationOptions {
  /** Max width in px (default: 1920) */
  maxWidth?: number;
  /** Max height in px (default: 2560) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.8) */
  quality?: number;
  /** Thumbnail width in px (default: 200) */
  thumbnailWidth?: number;
}

const DEFAULT_OPTIONS: Required<OptimizationOptions> = {
  maxWidth: 1920,
  maxHeight: 2560,
  quality: 0.8,
  thumbnailWidth: 200,
};

/**
 * Check if a file is an image that can be optimized
 */
export function isOptimizableImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if a file is a PDF (passes through without optimization)
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize and compress an image using Canvas API
 */
function resizeImage(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let { width, height } = img;

    // Calculate new dimensions maintaining aspect ratio
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context unavailable'));
      return;
    }

    // Use better quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Image compression failed'));
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Generate a small thumbnail for list views
 */
function generateThumbnail(img: HTMLImageElement, thumbnailWidth: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const ratio = img.height / img.width;
    const width = thumbnailWidth;
    const height = Math.round(width * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context unavailable'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Thumbnail generation failed'));
      },
      'image/jpeg',
      0.6 // Lower quality for thumbnails — they're tiny
    );
  });
}

/**
 * Main optimization function
 *
 * Takes a File (image), returns compressed blob + thumbnail.
 * PDFs should not be passed here — check with isOptimizableImage() first.
 */
export async function optimizeImage(
  file: File,
  options: OptimizationOptions = {}
): Promise<OptimizedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const img = await loadImage(file);

  const [blob, thumbnail] = await Promise.all([
    resizeImage(img, opts.maxWidth, opts.maxHeight, opts.quality),
    generateThumbnail(img, opts.thumbnailWidth),
  ]);

  // Clean up object URL
  URL.revokeObjectURL(img.src);

  return {
    blob,
    thumbnail,
    fileName: file.name.replace(/\.[^/.]+$/, '.jpg'),
    mimeType: 'image/jpeg',
    originalSize: file.size,
    compressedSize: blob.size,
    width: Math.min(img.width, opts.maxWidth),
    height: Math.min(img.height, opts.maxHeight),
  };
}

/**
 * Upload a file with real progress tracking and retry logic
 *
 * Returns a promise that resolves when upload completes.
 * onProgress callback receives 0-100 percentage.
 */
export function uploadWithProgress(
  url: string,
  body: FormData | Blob,
  options: {
    headers?: Record<string, string>;
    onProgress?: (percent: number) => void;
    maxRetries?: number;
  } = {}
): Promise<Response> {
  const { headers = {}, onProgress, maxRetries = 3 } = options;

  const attempt = (retryCount: number): Promise<Response> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);

      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Real progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.response, { status: xhr.status }));
        } else if (retryCount < maxRetries && xhr.status >= 500) {
          // Retry on server errors with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => attempt(retryCount + 1).then(resolve, reject), delay);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        if (retryCount < maxRetries) {
          // Retry on network errors with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => attempt(retryCount + 1).then(resolve, reject), delay);
        } else {
          reject(new Error('Network error — upload failed after retries'));
        }
      };

      xhr.send(body);
    });
  };

  return attempt(0);
}

/**
 * Format bytes into human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
