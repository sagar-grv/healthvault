import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DoctorDashboardClient from './DoctorDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DoctorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch profile, doctor profile, and recent access logs with embedded patient profiles
  // Single query for recent access + patient names — eliminates the waterfall
  const [{ data: profile, error: profileError }, { data: doctorProfile }, { data: recentAccess }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, role, full_name, email, health_id, phone, preferred_language, onboarding_complete, created_at, updated_at'
        )
        .eq('id', user.id)
        .single(),
      supabase.from('doctor_profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('access_logs')
        // Embed patient profile in the same query — no second round-trip
        .select(
          'patient_id, searched_at, patient:profiles!access_logs_patient_id_fkey(id, full_name, health_id)'
        )
        .eq('doctor_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(10),
    ]);

  if (profileError || !profile) redirect('/dashboard');
  if (profile.role !== 'doctor') redirect('/dashboard');

  // Deduplicate recent patients from embedded data — no extra DB call
  const seen = new Set<string>();
  const recentPatients: { id: string; full_name: string; health_id: string | null }[] = [];

  for (const log of recentAccess ?? []) {
    const patient = Array.isArray(log.patient) ? log.patient[0] : log.patient;
    if (patient && !seen.has(patient.id)) {
      seen.add(patient.id);
      recentPatients.push(patient);
      if (recentPatients.length === 5) break;
    }
  }

  return (
    <DoctorDashboardClient
      profile={profile}
      doctorProfile={doctorProfile}
      recentPatients={recentPatients}
    />
  );
}
