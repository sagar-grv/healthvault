import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateEmergencyCardId } from '@/lib/security/public-access';

export const runtime = 'edge';

// ── In-memory rate limiter (10 req/min per IP, 96-bit entropy) ───────────────
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

// Cleanup stale entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, timestamps] of hits) {
      const recent = timestamps.filter((t) => now - t < WINDOW_MS);
      if (recent.length === 0) hits.delete(ip);
      else hits.set(ip, recent);
    }
  },
  5 * 60 * 1000
);

/**
 * GET /api/emergency/[id]
 *
 * Public endpoint — NO authentication required.
 * Returns emergency profile data for the given random_id.
 *
 * Security:
 * - Only returns minimal data (blood group, allergies, conditions, emergency contact)
 * - No full medical history exposed
 * - random_id is 24-char hex (not guessable from Health ID)
 * - Uses service role client to bypass RLS (this is intentional for public access)
 * - Rate limited by Vercel's edge (no abuse)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip =
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    );
  }

  const { id } = await params;

  if (!validateEmergencyCardId(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  // Use service role to bypass RLS (this is a PUBLIC endpoint by design)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from('emergency_profiles')
    .select(
      `
      blood_group,
      allergies,
      conditions,
      emergency_contact_name,
      emergency_contact_phone,
      is_active,
      patient_id
    `
    )
    .eq('random_id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Emergency card not found' }, { status: 404 });
  }

  // Fetch patient name (only first name for privacy)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', data.patient_id)
    .single();

  const firstName = profile?.full_name?.split(' ')[0] || 'Unknown';

  // Return only what's needed — minimal data
  // Cache for 60s on CDN, stale-while-revalidate for 5min
  return NextResponse.json(
    {
      name: firstName,
      bloodGroup: data.blood_group,
      allergies: data.allergies || [],
      conditions: data.conditions || [],
      emergencyContact: {
        name: data.emergency_contact_name,
        phone: data.emergency_contact_phone,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
