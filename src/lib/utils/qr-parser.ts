import { isValidHealthId, normalizeHealthId } from './health-id';

/**
 * Parses arbitrary QR code content and extracts a HealthVault Health ID if present.
 *
 * Handles these QR content formats:
 *   - Plain Health ID:             "HV-ABCD-2345"
 *   - Raw without dashes:          "HVABCD2345" or "ABCD2345"
 *   - URL containing a Health ID:  "https://healthvault.app/emergency/HV-ABCD-2345"
 *
 * Returns the normalized "HV-XXXX-XXXX" string, or null if no valid Health ID found.
 */
export function parseQRContent(content: string): string | null {
  if (!content) return null;

  const trimmed = content.trim();

  // 1. Try the full string directly (plain Health ID or normalizable form)
  const direct = normalizeHealthId(trimmed);
  if (isValidHealthId(direct)) return direct;

  // 2. Extract HV-XXXX-XXXX pattern from anywhere in the string (e.g. a URL)
  const patternWithDashes = /HV-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}/i;
  const matchDashes = trimmed.match(patternWithDashes);
  if (matchDashes) {
    const candidate = normalizeHealthId(matchDashes[0]);
    if (isValidHealthId(candidate)) return candidate;
  }

  // 3. Extract a raw 10-char HV-prefixed block (no dashes) from the string
  const patternRaw = /HV([2-9A-HJ-NP-Z]{8})/i;
  const matchRaw = trimmed.match(patternRaw);
  if (matchRaw) {
    const candidate = normalizeHealthId(matchRaw[0]);
    if (isValidHealthId(candidate)) return candidate;
  }

  return null;
}
