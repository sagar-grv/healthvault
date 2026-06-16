import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { validateOrigin } from '@/lib/csrf';

// Simple in-memory rate limit: max 10 signouts per IP per 5 minutes
const signoutAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = signoutAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    signoutAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_MAX;
}

export async function POST(request: NextRequest) {
  // CSRF check
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
