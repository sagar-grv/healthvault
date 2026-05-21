import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DoctorDashboardClient from './DoctorDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DoctorDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch profile + doctor profile + recent access in parallel
  const [{ data: profile, error: profileError }, { data: doctorProfile }, { data: recentAccess }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('doctor_profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('access_logs')
        .select('patient_id, searched_at')
        .eq('doctor_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(10),
    ]);

  // No profile or wrong role → go back to role router
  if (profileError || !profile) redirect('/dashboard');
  if (profile.role !== 'doctor') redirect('/dashboard');

  // Get unique patient IDs from recent access
  const uniquePatientIds = [
    ...new Set((recentAccess || []).map((a) => a.patient_id)),
  ].slice(0, 5);

  let recentPatients: { id: string; full_name: string; health_id: string | null }[] = [];
  if (uniquePatientIds.length > 0) {
    const { data: patients } = await supabase
      .from('profiles')
      .select('id, full_name, health_id')
      .in('id', uniquePatientIds);
    recentPatients = patients || [];
  }

  return (
    <DoctorDashboardClient
      profile={profile}
      doctorProfile={doctorProfile}
      recentPatients={recentPatients}
    />
  );
}
