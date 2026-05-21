import { HEALTH_ID_CHARS, HEALTH_ID_PREFIX } from '@/constants';

/**
 * Generates a Health ID in format HV-XXXX-XXXX
 * Uses characters that are easy to read (no 0/O, 1/I/L confusion)
 */
export function generateHealthId(): string {
  let id = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * HEALTH_ID_CHARS.length);
    id += HEALTH_ID_CHARS[randomIndex];
  }
  return `${HEALTH_ID_PREFIX}-${id.slice(0, 4)}-${id.slice(4, 8)}`;
}

/**
 * Validates a Health ID format
 */
export function isValidHealthId(id: string): boolean {
  const pattern = /^HV-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  return pattern.test(id.toUpperCase());
}

/**
 * Normalizes a Health ID to uppercase with proper formatting
 */
export function normalizeHealthId(id: string): string {
  // Remove spaces and dashes, uppercase
  const clean = id.replace(/[\s-]/g, '').toUpperCase();
  
  // If it starts with HV and has 10 chars total (HV + 8)
  if (clean.startsWith('HV') && clean.length === 10) {
    return `HV-${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
  }
  
  // If it's just 8 chars (no prefix)
  if (clean.length === 8) {
    return `HV-${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
  }
  
  return id.toUpperCase();
}
