import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

const MAX_BODY_BYTES = 10 * 1024;
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = hits.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://healthvault-dusky.vercel.app';
    if (origin && !origin.startsWith(siteUrl)) {
      return new Response(null, { status: 204 });
    }

    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    if (!rateLimit(ip)) {
      return new Response(null, { status: 204 });
    }

    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return new Response(null, { status: 204 });
    }

    const body = JSON.parse(text);
    Sentry.captureMessage('CSP Violation', {
      level: 'warning',
      extra: body,
    });
  } catch {
    // Silently ignore malformed reports
  }
  return new Response(null, { status: 204 });
}
