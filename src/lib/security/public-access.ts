export function validateEmergencyCardId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}

export function isCronRequestAuthorized(headers: Headers, sharedSecret?: string): boolean {
  if (headers.get('x-vercel-cron') !== '1') return false;

  if (!sharedSecret) return true;

  const auth = headers.get('authorization') ?? '';
  return auth === `Bearer ${sharedSecret}`;
}

export function getShareExpiryStatus(
  expiresAt: string | null | undefined,
  now = new Date()
): { expired: boolean; label: string } {
  if (!expiresAt) {
    return { expired: false, label: 'No expiry set' };
  }

  const expiry = new Date(expiresAt);
  const date = expiry.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return expiry.getTime() <= now.getTime()
    ? { expired: true, label: `Expired ${date}` }
    : { expired: false, label: `Shared until ${date}` };
}
