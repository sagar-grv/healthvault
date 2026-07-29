import { MODELS } from './models';

const NATIVE_PDF_TYPES = ['application/pdf'];
const SCANNED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export function pickModel(mimeType: string, fileSizeBytes: number): string {
  if (NATIVE_PDF_TYPES.includes(mimeType)) {
    return fileSizeBytes > 5 * 1024 * 1024 ? MODELS.EXPLANATION : MODELS.EXTRACTION;
  }
  if (SCANNED_IMAGE_TYPES.includes(mimeType)) {
    return MODELS.EXPLANATION;
  }
  return MODELS.EXTRACTION;
}

export function needsReupload(mimeType: string, confidence: number): boolean {
  if (confidence < 0.3) return true;
  if (!SCANNED_IMAGE_TYPES.includes(mimeType) && mimeType !== 'application/pdf') return true;
  return false;
}
