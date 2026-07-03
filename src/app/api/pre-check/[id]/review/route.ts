import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'doctor') {
    return NextResponse.json({ error: 'Only doctors can review pre-checks' }, { status: 403 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status: 'reviewed',
    reviewed_at: now,
    updated_at: now,
  };
  if (body.doctor_notes !== undefined) updateData.doctor_notes = body.doctor_notes;

  const { data, error } = await supabase
    .from('pre_check_submissions')
    .update(updateData)
    .eq('id', id)
    .eq('doctor_id', user.id)
    .eq('status', 'submitted')
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)
    return NextResponse.json({ error: 'Pre-check not found or already reviewed' }, { status: 404 });
  return NextResponse.json({ submission: data });
}
