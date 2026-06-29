import { NextRequest } from 'next/server';

function tryParseOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

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

  const incoming = tryParseOrigin(headerOrigin);
  if (!incoming) return false;

  // Primary: NEXT_PUBLIC_SITE_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const allowed = tryParseOrigin(process.env.NEXT_PUBLIC_SITE_URL);
    if (allowed === incoming) return true;
  }

  // Vercel preview deployments
  if (process.env.VERCEL_URL) {
    const vercelOrigin = tryParseOrigin(`https://${process.env.VERCEL_URL}`);
    if (vercelOrigin === incoming) return true;
  }

  // Dev: allow localhost
  if (process.env.NODE_ENV === 'development' && incoming.startsWith('http://localhost')) {
    return true;
  }

  return false;
}
