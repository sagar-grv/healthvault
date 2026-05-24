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

  return <AccessLogClient logs={logs || []} />;
}
