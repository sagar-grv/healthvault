/**
 * Document edge detection and perspective correction
 *
 * Lightweight Canvas-based implementation (~40KB no external deps).
 * Detects document corners in an image, returns 4 corner points,
 * and provides perspective warp to produce a clean flat document image.
 */

export interface Point {
  x: number;
  y: number;
}

export interface DocumentCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

/**
 * Detect document corners in an image using Canvas edge detection.
 *
 * Algorithm:
 * 1. Grayscale + Gaussian blur
 * 2. Canny-like edge detection (Sobel operators)
 * 3. Find outermost edge points in each quadrant
 * 4. Return as document corners
 *
 * Returns null if no document detected (falls back to full image).
 */
export function detectDocumentCorners(canvas: HTMLCanvasElement): DocumentCorners | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Step 1: Grayscale
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // Step 2: Simple Gaussian blur (3x3)
  const blurred = new Uint8Array(width * height);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += gray[(y + ky) * width + (x + kx)] * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      blurred[y * width + x] = sum >> 4; // divide by 16
    }
  }

  // Step 3: Sobel edge detection
  const edges = new Uint8Array(width * height);
  let maxEdge = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx =
        -blurred[(y - 1) * width + (x - 1)] +
        blurred[(y - 1) * width + (x + 1)] +
        -2 * blurred[y * width + (x - 1)] +
        2 * blurred[y * width + (x + 1)] +
        -blurred[(y + 1) * width + (x - 1)] +
        blurred[(y + 1) * width + (x + 1)];

      const gy =
        -blurred[(y - 1) * width + (x - 1)] +
        -2 * blurred[(y - 1) * width + x] +
        -blurred[(y - 1) * width + (x + 1)] +
        blurred[(y + 1) * width + (x - 1)] +
        2 * blurred[(y + 1) * width + x] +
        blurred[(y + 1) * width + (x + 1)];

      const mag = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = Math.min(255, mag);
      if (mag > maxEdge) maxEdge = mag;
    }
  }

  // Threshold — only keep strong edges
  const threshold = maxEdge * 0.25;
  const strong = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    strong[i] = edges[i] > threshold ? 1 : 0;
  }

  // Step 4: Find extreme points in each quadrant
  const midX = width / 2;
  const midY = height / 2;

  // Best candidate for each corner (closest to actual corner)
  let topLeft = { x: midX, y: midY };
  let topRight = { x: midX, y: midY };
  let bottomLeft = { x: midX, y: midY };
  let bottomRight = { x: midX, y: midY };

  let minTL = Infinity,
    minTR = Infinity,
    minBL = Infinity,
    minBR = Infinity;

  // Margin: ignore outer 5% (camera noise at edges)
  const margin = Math.min(width, height) * 0.05;

  for (let y = margin; y < height - margin; y++) {
    for (let x = margin; x < width - margin; x++) {
      if (!strong[Math.round(y) * width + Math.round(x)]) continue;

      // Distance from each corner
      const dTL = x + y;
      const dTR = width - x + y;
      const dBL = x + (height - y);
      const dBR = width - x + (height - y);

      if (dTL < minTL) {
        minTL = dTL;
        topLeft = { x, y };
      }
      if (dTR < minTR) {
        minTR = dTR;
        topRight = { x, y };
      }
      if (dBL < minBL) {
        minBL = dBL;
        bottomLeft = { x, y };
      }
      if (dBR < minBR) {
        minBR = dBR;
        bottomRight = { x, y };
      }
    }
  }

  // Sanity check: corners should form a reasonable quadrilateral
  const docWidth = Math.max(
    Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y),
    Math.hypot(bottomRight.x - bottomLeft.x, bottomRight.y - bottomLeft.y)
  );
  const docHeight = Math.max(
    Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y),
    Math.hypot(bottomRight.x - topRight.x, bottomRight.y - topRight.y)
  );

  // Document must be at least 20% of image in each dimension
  if (docWidth < width * 0.2 || docHeight < height * 0.2) {
    return null;
  }

  return { topLeft, topRight, bottomRight, bottomLeft };
}

/**
 * Apply perspective transform to crop a document from an image.
 *
 * Uses bilinear interpolation to map source quadrilateral to
 * output rectangle.
 *
 * @param sourceCanvas - The source image canvas
 * @param corners - The 4 detected document corners
 * @returns A new canvas with the perspective-corrected document
 */
export function perspectiveCrop(
  sourceCanvas: HTMLCanvasElement,
  corners: DocumentCorners
): HTMLCanvasElement {
  const { topLeft, topRight, bottomRight, bottomLeft } = corners;

  // Calculate output dimensions
  const widthTop = Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y);
  const widthBottom = Math.hypot(bottomRight.x - bottomLeft.x, bottomRight.y - bottomLeft.y);
  const heightLeft = Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y);
  const heightRight = Math.hypot(bottomRight.x - topRight.x, bottomRight.y - topRight.y);

  const outWidth = Math.round(Math.max(widthTop, widthBottom));
  const outHeight = Math.round(Math.max(heightLeft, heightRight));

  const output = document.createElement('canvas');
  output.width = outWidth;
  output.height = outHeight;
  const ctx = output.getContext('2d')!;

  const srcCtx = sourceCanvas.getContext('2d')!;
  const srcData = srcCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const outData = ctx.createImageData(outWidth, outHeight);

  // Inverse bilinear interpolation: for each output pixel, find source pixel
  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      const u = x / outWidth;
      const v = y / outHeight;

      // Bilinear interpolation of source coordinates
      const srcX =
        (1 - u) * (1 - v) * topLeft.x +
        u * (1 - v) * topRight.x +
        u * v * bottomRight.x +
        (1 - u) * v * bottomLeft.x;

      const srcY =
        (1 - u) * (1 - v) * topLeft.y +
        u * (1 - v) * topRight.y +
        u * v * bottomRight.y +
        (1 - u) * v * bottomLeft.y;

      const sx = Math.floor(Math.max(0, Math.min(sourceCanvas.width - 1, srcX)));
      const sy = Math.floor(Math.max(0, Math.min(sourceCanvas.height - 1, srcY)));

      const srcIdx = (sy * sourceCanvas.width + sx) * 4;
      const outIdx = (y * outWidth + x) * 4;

      outData.data[outIdx] = srcData.data[srcIdx];
      outData.data[outIdx + 1] = srcData.data[srcIdx + 1];
      outData.data[outIdx + 2] = srcData.data[srcIdx + 2];
      outData.data[outIdx + 3] = 255;
    }
  }

  ctx.putImageData(outData, 0, 0);
  return output;
}

/**
 * Get default corners (full image) as fallback when detection fails
 */
export function getDefaultCorners(width: number, height: number): DocumentCorners {
  const margin = Math.min(width, height) * 0.05;
  return {
    topLeft: { x: margin, y: margin },
    topRight: { x: width - margin, y: margin },
    bottomRight: { x: width - margin, y: height - margin },
    bottomLeft: { x: margin, y: height - margin },
  };
}
