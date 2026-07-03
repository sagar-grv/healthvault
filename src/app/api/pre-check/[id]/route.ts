import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { data, error } = await supabase
    .from('pre_check_submissions')
    .select('*, pre_check_reports(id, report_id, relationship)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (data.patient_id !== user.id && data.doctor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ submission: data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const body = await request.json();
  const allowedFields: Record<string, unknown> = {};
  if (body.symptoms !== undefined) allowedFields.symptoms = body.symptoms;
  if (body.vitals !== undefined) allowedFields.vitals = body.vitals;
  if (body.existing_conditions !== undefined)
    allowedFields.existing_conditions = body.existing_conditions;
  if (body.current_medications !== undefined)
    allowedFields.current_medications = body.current_medications;
  if (body.allergies !== undefined) allowedFields.allergies = body.allergies;
  if (body.past_surgeries !== undefined) allowedFields.past_surgeries = body.past_surgeries;
  if (body.family_history !== undefined) allowedFields.family_history = body.family_history;
  if (body.doctor_id !== undefined) allowedFields.doctor_id = body.doctor_id;

  const { data, error } = await supabase
    .from('pre_check_submissions')
    .update({ ...allowedFields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('patient_id', user.id)
    .in('status', ['draft', 'submitted'])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found or already reviewed' }, { status: 404 });
  return NextResponse.json({ submission: data });
}
