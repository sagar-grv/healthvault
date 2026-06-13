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

  const [{ data: profile, error: profileError }, { data: doctorProfile }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, role, full_name, email, health_id, phone, preferred_language, terms_accepted_at, consent_version, onboarding_complete, created_at, updated_at'
      )
      .eq('id', user.id)
      .single(),
    supabase.from('doctor_profiles').select('*').eq('id', user.id).single(),
  ]);

  if (profileError || !profile) redirect('/dashboard');
  if (profile.role !== 'doctor') redirect('/dashboard');

  return <DoctorDashboardClient profile={profile} doctorProfile={doctorProfile} />;
}
