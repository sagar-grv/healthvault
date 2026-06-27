import { NextRequest } from 'next/server';

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer') || '';
  const headerOrigin = origin || referer;

  if (!headerOrigin) {
    // No Origin or Referer header — reject state-changing requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return false;
    }
    return true;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    // In dev, allow if origin matches localhost
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  }

  try {
    const allowed = new URL(siteUrl).origin;
    const incoming = new URL(headerOrigin).origin;
    return incoming === allowed;
  } catch {
    return false;
  }
}
