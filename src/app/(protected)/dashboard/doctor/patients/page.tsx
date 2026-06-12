import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PatientsClient from './PatientsClient';

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch shares — DON'T use PostgREST join (RLS blocks patient profiles via join)
  const { data: shares } = await supabase
    .from('shared_reports')
    .select('id, patient_id, report_ids, shared_at, viewed_at')
    .eq('doctor_id', user.id)
    .order('shared_at', { ascending: false });

  if (!shares || shares.length === 0) {
    return <PatientsClient shares={[]} />;
  }

  // Fetch patient profiles directly — bypasses the RLS join issue
  const patientIds = [...new Set(shares.map((s) => s.patient_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, health_id')
    .in('id', patientIds);

  // Merge patient info into shares
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const enrichedShares = shares.map((share) => ({
    ...share,
    patient: profileMap.get(share.patient_id) || null,
  }));

  return <PatientsClient shares={enrichedShares} />;
}
