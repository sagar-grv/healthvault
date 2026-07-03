import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
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
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role === 'patient') {
    const { data, error } = await supabase
      .from('pre_check_submissions')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ submissions: data });
  }

  if (profile.role === 'doctor') {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('pre_check_submissions')
      .select('*')
      .eq('doctor_id', user.id)
      .gte('submitted_at', today)
      .order('submitted_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ submissions: data || [] });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
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
  if (!profile || profile.role !== 'patient') {
    return NextResponse.json({ error: 'Only patients can create pre-checks' }, { status: 403 });
  }

  const body = await request.json();
  const {
    doctor_id,
    symptoms,
    vitals,
    existing_conditions,
    current_medications,
    allergies,
    past_surgeries,
    family_history,
  } = body;

  const { data, error } = await supabase
    .from('pre_check_submissions')
    .insert({
      patient_id: user.id,
      doctor_id: doctor_id || null,
      symptoms: symptoms || [],
      vitals: vitals || {},
      existing_conditions: existing_conditions || [],
      current_medications: current_medications || [],
      allergies: allergies || [],
      past_surgeries: past_surgeries || [],
      family_history: family_history || [],
      status: 'draft',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submission: data });
}
