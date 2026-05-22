/**
 * Returns true only if the given role string is 'admin' (case-insensitive).
 */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return role.toLowerCase() === 'admin';
}

/**
 * Given a role and the requested path, returns the redirect path if access should
 * be denied, or null if access is permitted.
 */
export function getAdminRedirectPath(role: string | null | undefined): string | null {
  if (isAdminRole(role)) return null;
  return '/login';
}
