import { isValidHealthId, normalizeHealthId, generateHealthId } from '@/lib/utils/health-id';
import { parseQRContent } from '@/lib/utils/qr-parser';

// ─── isValidHealthId ──────────────────────────────────────────────────────────

describe('isValidHealthId', () => {
  test('accepts a correctly formatted Health ID', () => {
    expect(isValidHealthId('HV-2345-6789')).toBe(true);
  });

  test('accepts Health ID with allowed letters', () => {
    expect(isValidHealthId('HV-ABCD-EFGH')).toBe(true);
  });

  test('rejects ID missing HV prefix', () => {
    expect(isValidHealthId('AB-2345-6789')).toBe(false);
  });

  test('rejects ID with forbidden character O (looks like 0)', () => {
    expect(isValidHealthId('HV-OABC-1234')).toBe(false);
  });

  test('rejects ID with forbidden character 0 (zero)', () => {
    expect(isValidHealthId('HV-0ABC-1234')).toBe(false);
  });

  test('rejects ID with forbidden character 1', () => {
    expect(isValidHealthId('HV-1ABC-2345')).toBe(false);
  });

  test('rejects ID with forbidden character I', () => {
    expect(isValidHealthId('HV-IABC-2345')).toBe(false);
  });

  test('rejects ID with wrong segment lengths', () => {
    expect(isValidHealthId('HV-ABC-12345')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(isValidHealthId('')).toBe(false);
  });

  test('rejects plain text that is not a Health ID', () => {
    expect(isValidHealthId('hello world')).toBe(false);
  });

  test('is case-insensitive (lowercase input)', () => {
    expect(isValidHealthId('hv-abcd-efgh')).toBe(true);
  });
});

// ─── normalizeHealthId ────────────────────────────────────────────────────────

describe('normalizeHealthId', () => {
  test('returns correctly formatted ID unchanged (already normalized)', () => {
    expect(normalizeHealthId('HV-2345-6789')).toBe('HV-2345-6789');
  });

  test('uppercases a lowercase input', () => {
    expect(normalizeHealthId('hv-abcd-efgh')).toBe('HV-ABCD-EFGH');
  });

  test('inserts dashes when given raw 10-char HV-prefixed string', () => {
    expect(normalizeHealthId('HVABCD2345')).toBe('HV-ABCD-2345');
  });

  test('inserts HV prefix and dashes when given 8-char string', () => {
    expect(normalizeHealthId('ABCD2345')).toBe('HV-ABCD-2345');
  });

  test('strips spaces from input', () => {
    expect(normalizeHealthId('HV ABCD 2345')).toBe('HV-ABCD-2345');
  });
});

// ─── generateHealthId ─────────────────────────────────────────────────────────

describe('generateHealthId', () => {
  test('generates an ID matching the HV-XXXX-XXXX format', () => {
    const id = generateHealthId();
    expect(isValidHealthId(id)).toBe(true);
  });

  test('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, generateHealthId));
    expect(ids.size).toBe(100);
  });

  test('generated ID never contains forbidden characters', () => {
    const forbidden = /[01IOL]/;
    for (let i = 0; i < 50; i++) {
      expect(generateHealthId()).not.toMatch(forbidden);
    }
  });
});

// ─── parseQRContent ───────────────────────────────────────────────────────────
// These tests will FAIL until we implement parseQRContent

describe('parseQRContent', () => {
  test('returns the Health ID when QR contains a plain Health ID', () => {
    expect(parseQRContent('HV-ABCD-2345')).toBe('HV-ABCD-2345');
  });

  test('extracts Health ID when QR contains a URL with the ID', () => {
    expect(parseQRContent('https://healthvault-dusky.vercel.app/emergency/HV-ABCD-2345')).toBe('HV-ABCD-2345');
  });

  test('normalizes a Health ID without dashes found in a QR', () => {
    expect(parseQRContent('HVABCD2345')).toBe('HV-ABCD-2345');
  });

  test('returns null for QR content that contains no Health ID', () => {
    expect(parseQRContent('https://google.com')).toBeNull();
  });

  test('returns null for arbitrary text with no Health ID', () => {
    expect(parseQRContent('Dr Sharma Clinic Room 3')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(parseQRContent('')).toBeNull();
  });
});
