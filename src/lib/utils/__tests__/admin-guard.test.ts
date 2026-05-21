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
    expect(getAdminRedirectPath('admin', '/admin/users')).toBeNull();
  });

  test('redirects to /login when no role (unauthenticated)', () => {
    expect(getAdminRedirectPath(null, '/admin')).toBe('/login');
  });

  test('redirects to /login when role is patient', () => {
    expect(getAdminRedirectPath('patient', '/admin')).toBe('/login');
  });

  test('redirects to /login when role is doctor', () => {
    expect(getAdminRedirectPath('doctor', '/admin/doctors')).toBe('/login');
  });

  test('redirects to /login for any non-admin access to /admin subpaths', () => {
    expect(getAdminRedirectPath('patient', '/admin/analytics')).toBe('/login');
  });
});
