import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';

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
  const { status, doctor_notes } = body;
  const validStatuses = ['waiting', 'in_consultation', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { status, updated_at: now };

  if (status === 'in_consultation') updateData.consultation_started_at = now;
  if (status === 'completed') updateData.consultation_ended_at = now;
  if (doctor_notes) updateData.doctor_notes = doctor_notes;

  if (profile?.role === 'doctor') {
    const { data, error } = await supabase
      .from('queue_entries')
      .update(updateData)
      .eq('id', id)
      .eq('doctor_id', user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Queue entry not found' }, { status: 404 });
    return NextResponse.json({ entry: data });
  }

  if (profile?.role === 'patient') {
    if (status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Patients can only cancel their queue entry' },
        { status: 403 }
      );
    }
    const { data, error } = await supabase
      .from('queue_entries')
      .update(updateData)
      .eq('id', id)
      .eq('patient_id', user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Queue entry not found' }, { status: 404 });
    return NextResponse.json({ entry: data });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { error } = await supabase
    .from('queue_entries')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('patient_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
