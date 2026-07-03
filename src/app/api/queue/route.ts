import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';
import { calculatePriorityScore } from '@/lib/queue/priority-calculator';
import type { PatientVitals } from '@/types';

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
  if (!profile || profile.role !== 'doctor') {
    return NextResponse.json({ error: 'Only doctors can view the queue' }, { status: 403 });
  }

  const { data: patients, error: patErr } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('doctor_id', user.id)
    .in('status', ['waiting', 'in_consultation'])
    .order('priority_score', { ascending: false })
    .order('checked_in_at', { ascending: true });

  if (patErr) return NextResponse.json({ error: patErr.message }, { status: 500 });

  const patientIds = [...new Set(patients.map((p) => p.patient_id))];
  const { data: patientProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, health_id')
    .in('id', patientIds);

  const profileMap = new Map((patientProfiles || []).map((p) => [p.id, p]));
  const enriched = patients.map((entry) => ({
    ...entry,
    patient: profileMap.get(entry.patient_id) || null,
  }));

  return NextResponse.json({ entries: enriched });
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
    .select('role, full_name')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'patient') {
    return NextResponse.json({ error: 'Only patients can join the queue' }, { status: 403 });
  }

  const body = await request.json();
  const doctorId = body.doctor_id as string;
  if (!doctorId) {
    return NextResponse.json({ error: 'doctor_id is required' }, { status: 400 });
  }

  const existing = await supabase
    .from('queue_entries')
    .select('id')
    .eq('patient_id', user.id)
    .eq('doctor_id', doctorId)
    .in('status', ['waiting', 'in_consultation'])
    .single();

  if (existing.data) {
    return NextResponse.json({ error: 'Already in queue for this doctor' }, { status: 409 });
  }

  const { data: ageData } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', user.id)
    .single();

  const patientAge = ageData?.created_at
    ? Math.floor(
        (Date.now() - new Date(ageData.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      ) + 25
    : 30;

  const { data: emergencyProfile } = await supabase
    .from('emergency_profiles')
    .select('conditions')
    .eq('patient_id', user.id)
    .single();

  const { data: preCheck } = await supabase
    .from('pre_check_submissions')
    .select('id, vitals')
    .eq('patient_id', user.id)
    .eq('doctor_id', doctorId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(1);

  const hasPreCheck = (preCheck?.length ?? 0) > 0;
  const vitals = hasPreCheck && preCheck?.[0]?.vitals ? (preCheck[0].vitals as PatientVitals) : {};

  const { data: rules } = await supabase.from('queue_rules').select('*').eq('is_active', true);

  const patientCtx = {
    age: patientAge,
    conditions: emergencyProfile?.conditions || [],
    vitals,
    hasPreCheck,
  };

  const { score, reasons } = calculatePriorityScore(patientCtx, rules || []);

  const { data: entry, error: insertError } = await supabase
    .from('queue_entries')
    .insert({
      patient_id: user.id,
      doctor_id: doctorId,
      priority_score: score,
      priority_reasons: reasons,
      pre_check_id: hasPreCheck ? preCheck![0].id : null,
      status: 'waiting',
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ entry });
}
