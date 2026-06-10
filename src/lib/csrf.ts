import { NextRequest } from 'next/server';

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://healthvault-dusky.vercel.app';
  if (origin && !origin.startsWith(siteUrl)) {
    return false;
  }
  return true;
}
