import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';
import { calculatePriorityScore } from '@/lib/queue/priority-calculator';
import type { PatientVitals } from '@/types';

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

  const { data: entry, error: entryError } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('id', id)
    .single();

  if (entryError || !entry) {
    return NextResponse.json({ error: 'Queue entry not found' }, { status: 404 });
  }

  if (entry.patient_id !== user.id && entry.doctor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: ageData } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', entry.patient_id)
    .single();

  const patientAge = ageData?.created_at
    ? Math.floor(
        (Date.now() - new Date(ageData.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      ) + 25
    : 30;

  const { data: emergencyProfile } = await supabase
    .from('emergency_profiles')
    .select('conditions')
    .eq('patient_id', entry.patient_id)
    .single();

  const { data: preCheck } = await supabase
    .from('pre_check_submissions')
    .select('id, vitals')
    .eq('id', entry.pre_check_id || '')
    .maybeSingle();

  const hasPreCheck = !!entry.pre_check_id;
  const vitals = preCheck?.vitals ? (preCheck.vitals as PatientVitals) : {};

  const { data: rules } = await supabase.from('queue_rules').select('*').eq('is_active', true);

  const patientCtx = {
    age: patientAge,
    conditions: emergencyProfile?.conditions || [],
    vitals,
    hasPreCheck,
  };

  const { score, reasons } = calculatePriorityScore(patientCtx, rules || []);

  return NextResponse.json({
    entry_id: id,
    current_priority_score: entry.priority_score,
    recalculated_score: score,
    reasons,
    patient_context: {
      age: patientAge,
      conditions: emergencyProfile?.conditions || [],
      has_pre_check: hasPreCheck,
    },
  });
}
