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

  const { data: submission, error: fetchError } = await supabase
    .from('pre_check_submissions')
    .select('*')
    .eq('id', id)
    .eq('patient_id', user.id)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (submission.status !== 'draft') {
    return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, health_id, preferred_language')
    .eq('id', user.id)
    .single();

  const symptomsText = (submission.symptoms || [])
    .map(
      (s: { name: string; severity?: string; duration?: string }) =>
        `- ${s.name} (${s.severity || 'unspecified'}, ${s.duration || 'unknown duration'})`
    )
    .join('\n');

  const vitalsRecord = (submission.vitals as Record<string, unknown>) || {};
  const vitalsText = Object.entries(vitalsRecord)
    .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`)
    .join('\n');

  let summary = `## Patient: ${profile?.full_name || 'Unknown'}\n\n`;
  if (symptomsText) summary += `### Symptoms\n${symptomsText}\n\n`;
  if (vitalsText) summary += `### Vitals\n${vitalsText}\n\n`;
  if (submission.existing_conditions?.length)
    summary += `### Existing Conditions\n- ${submission.existing_conditions.join('\n- ')}\n\n`;
  if (submission.current_medications?.length)
    summary += `### Current Medications\n- ${submission.current_medications.join('\n- ')}\n\n`;
  if (submission.allergies?.length)
    summary += `### Allergies\n- ${submission.allergies.join('\n- ')}\n\n`;
  if (submission.family_history?.length)
    summary += `### Family History\n- ${submission.family_history.join('\n- ')}\n\n`;

  summary += '> AI-generated clinical brief. For reference only — always verify with patient.';

  await supabase
    .from('pre_check_submissions')
    .update({ ai_summary: summary, updated_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json({ summary });
}
