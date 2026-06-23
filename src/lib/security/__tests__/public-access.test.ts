import {
  isCronRequestAuthorized,
  validateEmergencyCardId,
  getShareExpiryStatus,
} from '@/lib/security/public-access';

describe('public access security helpers', () => {
  describe('validateEmergencyCardId', () => {
    test('accepts only 24-character hex emergency IDs', () => {
      expect(validateEmergencyCardId('a1b2c3d4e5f678901234abcd')).toBe(true);
      expect(validateEmergencyCardId('A1B2C3D4E5F678901234ABCD')).toBe(true);
    });

    test('rejects short, long, and non-hex emergency IDs', () => {
      expect(validateEmergencyCardId('abc123')).toBe(false);
      expect(validateEmergencyCardId('a1b2c3d4e5f678901234abcde')).toBe(false);
      expect(validateEmergencyCardId('HV-ABCD-2345')).toBe(false);
      expect(validateEmergencyCardId('../a1b2c3d4e5f678901234')).toBe(false);
    });
  });

  describe('isCronRequestAuthorized', () => {
    test('requires Vercel cron header when no shared secret is configured', () => {
      const headers = new Headers({ 'x-vercel-cron': '1' });
      expect(isCronRequestAuthorized(headers)).toBe(true);
    });

    test('requires both Vercel cron header and bearer secret when a shared secret is configured', () => {
      const headers = new Headers({
        'x-vercel-cron': '1',
        authorization: 'Bearer cron-secret',
      });
      expect(isCronRequestAuthorized(headers, 'cron-secret')).toBe(true);
      expect(isCronRequestAuthorized(new Headers({ 'x-vercel-cron': '1' }), 'cron-secret')).toBe(
        false
      );
      expect(
        isCronRequestAuthorized(
          new Headers({ 'x-vercel-cron': '1', authorization: 'Bearer wrong' }),
          'cron-secret'
        )
      ).toBe(false);
    });
  });

  describe('getShareExpiryStatus', () => {
    test('labels missing expiry as active for legacy shares', () => {
      expect(getShareExpiryStatus(null, new Date('2026-06-23T10:00:00Z'))).toEqual({
        expired: false,
        label: 'No expiry set',
      });
    });

    test('labels future and expired timestamps', () => {
      expect(
        getShareExpiryStatus('2026-06-24T10:00:00Z', new Date('2026-06-23T10:00:00Z'))
      ).toEqual({
        expired: false,
        label: 'Shared until 24 Jun 2026',
      });
      expect(
        getShareExpiryStatus('2026-06-22T10:00:00Z', new Date('2026-06-23T10:00:00Z'))
      ).toEqual({
        expired: true,
        label: 'Expired 22 Jun 2026',
      });
    });
  });
});
