import { NextRequest } from 'next/server';

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  if (!origin) return true;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://healthvault-dusky.vercel.app';
  try {
    const allowed = new URL(siteUrl).origin;
    const incoming = new URL(origin).origin;
    return incoming === allowed;
  } catch {
    return false;
  }
}
