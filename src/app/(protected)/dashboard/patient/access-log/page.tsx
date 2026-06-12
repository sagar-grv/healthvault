import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AccessLogClient from './AccessLogClient';

export const dynamic = 'force-dynamic';

export default async function AccessLogPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Select only needed columns, cap at 100 most recent entries
  const { data: logs } = await supabase
    .from('access_logs')
    .select('id, patient_id, doctor_id, doctor_name, searched_at, reports_viewed')
    .eq('patient_id', user.id)
    .order('searched_at', { ascending: false })
    .limit(100);

  // Fetch patient's shared reports
  const { data: shares } = await supabase
    .from('shared_reports')
    .select('id, doctor_id, report_ids, shared_at, viewed_at')
    .eq('patient_id', user.id)
    .order('shared_at', { ascending: false });

  // Fetch doctor profiles for the shares
  let enrichedShares: Array<{
    id: string;
    doctor_id: string;
    report_ids: string[];
    shared_at: string;
    viewed_at: string | null;
    doctor: { full_name: string; clinic_name: string | null } | null;
  }> = [];

  if (shares && shares.length > 0) {
    const doctorIds = [...new Set(shares.map((s) => s.doctor_id))];
    const { data: doctorProfiles } = await supabase
      .from('doctor_profiles')
      .select('id, clinic_name')
      .in('id', doctorIds);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', doctorIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const clinicMap = new Map((doctorProfiles || []).map((dp) => [dp.id, dp]));

    enrichedShares = shares.map((share) => ({
      ...share,
      doctor: {
        full_name: profileMap.get(share.doctor_id)?.full_name || 'Unknown',
        clinic_name: clinicMap.get(share.doctor_id)?.clinic_name || null,
      },
    }));
  }

  return <AccessLogClient logs={logs || []} shares={enrichedShares} />;
}
