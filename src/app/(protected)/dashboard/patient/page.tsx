import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PatientDashboardClient from './PatientDashboardClient';
import { Report } from '@/types';

export const dynamic = 'force-dynamic';

// How many reports to show per page
const PAGE_SIZE = 20;

export default async function PatientDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch profile + first page of reports + recent reports in parallel
  const [{ data: profile, error: profileError }, { data: reports }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('reports')
      .select('*')
      .eq('patient_id', user.id)
      .order('uploaded_at', { ascending: false })
      .limit(PAGE_SIZE),
  ]);

  if (profileError || !profile) redirect('/dashboard');
  if (profile.role !== 'patient') redirect('/dashboard');

  const typedReports: Report[] = reports ?? [];

  return <PatientDashboardClient profile={profile} reports={typedReports} />;
}
