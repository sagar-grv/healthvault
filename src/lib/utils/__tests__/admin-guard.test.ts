import { isAdminRole, getAdminRedirectPath } from '@/lib/utils/admin-guard';

describe('isAdminRole', () => {
  test('returns true for role="admin"', () => {
    expect(isAdminRole('admin')).toBe(true);
  });

  test('returns false for role="patient"', () => {
    expect(isAdminRole('patient')).toBe(false);
  });

  test('returns false for role="doctor"', () => {
    expect(isAdminRole('doctor')).toBe(false);
  });

  test('returns false for null', () => {
    expect(isAdminRole(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isAdminRole(undefined)).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isAdminRole('')).toBe(false);
  });

  test('is case-insensitive (ADMIN uppercase)', () => {
    expect(isAdminRole('ADMIN')).toBe(true);
  });
});

describe('getAdminRedirectPath', () => {
  test('returns null (no redirect) when role is admin', () => {
    expect(getAdminRedirectPath('admin')).toBeNull();
  });

  test('redirects to /login when no role (unauthenticated)', () => {
    expect(getAdminRedirectPath(null)).toBe('/login');
  });

  test('redirects to /login when role is patient', () => {
    expect(getAdminRedirectPath('patient')).toBe('/login');
  });

  test('redirects to /login when role is doctor', () => {
    expect(getAdminRedirectPath('doctor')).toBe('/login');
  });

  test('redirects to /login for any non-admin access', () => {
    expect(getAdminRedirectPath('patient')).toBe('/login');
  });
});
