import { NextRequest } from 'next/server';

function tryParseOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function validateOriginByHost(request: NextRequest, expectedOrigin?: string): boolean {
  const host = request.headers.get('host');
  if (!host) return false;

  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const hostOrigin = tryParseOrigin(`${proto}://${host}`);
  if (!hostOrigin) return false;

  if (expectedOrigin) return hostOrigin === expectedOrigin;
  return true;
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer') || '';
  const headerOrigin = origin || referer;

  if (!headerOrigin) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return false;
    }
    return true;
  }

  // Some browsers/extensions send Origin: "null" (opaque origin).
  // We can't compare by origin, so validate by Host header instead.
  if (origin === 'null') {
    return validateOriginByHost(request);
  }

  const incoming = tryParseOrigin(headerOrigin);
  if (!incoming) return false;

  // Primary: NEXT_PUBLIC_SITE_URL (custom domain)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const allowed = tryParseOrigin(process.env.NEXT_PUBLIC_SITE_URL);
    if (allowed === incoming) return true;
  }

  // Accept if origin matches the Host header
  // Covers Vercel preview URLs, custom domains, and local dev
  return validateOriginByHost(request, incoming);
}
