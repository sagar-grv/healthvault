import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const { id } = await params;

  if (!id || id.length < 10) {
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
  return NextResponse.json({
    name: firstName,
    bloodGroup: data.blood_group,
    allergies: data.allergies || [],
    conditions: data.conditions || [],
    emergencyContact: {
      name: data.emergency_contact_name,
      phone: data.emergency_contact_phone,
    },
  });
}
