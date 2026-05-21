import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PatientDashboardClient from './PatientDashboardClient';

export const dynamic = 'force-dynamic';

export default async function PatientDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Run profile + reports queries in parallel
  const [{ data: profile, error: profileError }, { data: reports }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('reports').select('*').eq('patient_id', user.id).order('uploaded_at', { ascending: false }),
  ]);

  // No profile or wrong role → go back to role router
  if (profileError || !profile) redirect('/dashboard');
  if (profile.role !== 'patient') redirect('/dashboard');

  return (
    <PatientDashboardClient
      profile={profile}
      reports={reports || []}
    />
  );
}
