import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrustCenterClient from './TrustCenterClient';

export const dynamic = 'force-dynamic';

export default async function TrustCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, health_id, deleted_at, deletion_scheduled_at')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'patient') redirect('/dashboard');

  const { data: logs } = await supabase
    .from('access_logs')
    .select('id, doctor_id, doctor_name, reports_viewed, searched_at')
    .eq('patient_id', user.id)
    .order('searched_at', { ascending: false })
    .limit(50);

  const { data: shares } = await supabase
    .from('shared_reports')
    .select('id, doctor_id, report_ids, shared_at, viewed_at')
    .eq('patient_id', user.id)
    .order('shared_at', { ascending: false });

  let enrichedShares: Array<{
    id: string;
    doctor_id: string;
    report_ids: string[];
    shared_at: string;
    viewed_at: string | null;
    doctor_name: string;
    clinic_name: string | null;
  }> = [];

  if (shares && shares.length > 0) {
    const doctorIds = [...new Set(shares.map((s) => s.doctor_id))];
    const [{ data: profiles }, { data: doctorProfiles }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', doctorIds),
      supabase.from('doctor_profiles').select('id, clinic_name').in('id', doctorIds),
    ]);
    const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
    const clinicMap = new Map((doctorProfiles || []).map((dp) => [dp.id, dp.clinic_name]));

    enrichedShares = shares.map((s) => ({
      ...s,
      doctor_name: nameMap.get(s.doctor_id) || 'Unknown Doctor',
      clinic_name: clinicMap.get(s.doctor_id) || null,
    }));
  }

  const profileData = {
    health_id: profile.health_id,
    deleted_at: profile.deleted_at,
    deletion_scheduled_at: profile.deletion_scheduled_at,
  };

  const deletionActive = profileData.deleted_at && profileData.deletion_scheduled_at;
  /* eslint-disable react-hooks/purity */
  const hoursLeft = deletionActive
    ? Math.max(
        0,
        Math.round(
          (new Date(profileData.deletion_scheduled_at!).getTime() - Date.now()) / (1000 * 60 * 60)
        )
      )
    : null;
  /* eslint-enable react-hooks/purity */

  return (
    <TrustCenterClient
      profile={profileData}
      hoursLeft={hoursLeft}
      logs={
        (logs || []) as Array<{
          id: string;
          doctor_name: string;
          reports_viewed: string[];
          searched_at: string;
        }>
      }
      shares={enrichedShares}
    />
  );
}
