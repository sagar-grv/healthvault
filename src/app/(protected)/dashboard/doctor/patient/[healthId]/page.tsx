import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PatientViewClient from './PatientViewClient';

export const dynamic = 'force-dynamic';

export default async function DoctorPatientViewPage({
  params,
}: {
  params: Promise<{ healthId: string }>;
}) {
  const { healthId } = await params;
  const decodedHealthId = decodeURIComponent(healthId);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch doctor profile + patient in parallel
  const [{ data: doctorProfile }, { data: patient }] = await Promise.all([
    supabase.from('profiles').select('id, role, full_name').eq('id', user.id).single(),
    supabase
      .from('profiles')
      .select('id, full_name, health_id')
      .eq('health_id', decodedHealthId)
      .eq('role', 'patient')
      .single(),
  ]);

  if (!doctorProfile || doctorProfile.role !== 'doctor') redirect('/dashboard');

  if (!patient) {
    return (
      <PatientViewClient
        found={false}
        healthId={decodedHealthId}
        patientName=""
        reports={[]}
        doctorId={user.id}
        doctorName={doctorProfile.full_name}
        hasActiveShare={false}
      />
    );
  }

  // Fetch reports + check active share in parallel
  const [reportsResult, activeShareResult] = await Promise.all([
    supabase
      .from('reports')
      .select(
        'id, title, report_type, file_path, file_name, file_size, mime_type, report_date, notes, thumbnail_path, uploaded_at, updated_at, is_shareable, is_starred, patient_id'
      )
      .eq('patient_id', patient.id)
      .eq('is_shareable', true)
      .order('report_date', { ascending: false }),
    supabase
      .from('shared_reports')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('doctor_id', user.id)
      .maybeSingle(),
  ]);

  const reports = reportsResult.data ?? [];
  const hasActiveShare = !!activeShareResult.data;

  // Log access — fire and forget, does not block page render
  Promise.all([
    supabase.from('access_logs').insert({
      patient_id: patient.id,
      doctor_id: user.id,
      doctor_name: doctorProfile.full_name,
      reports_viewed: reports.map((r) => r.id),
    }),
    supabase
      .from('search_attempts')
      .update({ found: true })
      .eq('doctor_id', user.id)
      .eq('searched_health_id', decodedHealthId)
      .order('searched_at', { ascending: false })
      .limit(1),
  ]).catch(() => {});

  return (
    <PatientViewClient
      found={true}
      healthId={decodedHealthId}
      patientName={patient.full_name}
      reports={reports}
      doctorId={user.id}
      doctorName={doctorProfile.full_name}
      hasActiveShare={hasActiveShare}
    />
  );
}
