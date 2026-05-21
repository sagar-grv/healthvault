import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AccessLogClient from './AccessLogClient';

export const dynamic = 'force-dynamic';

export default async function AccessLogPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: logs } = await supabase
    .from('access_logs')
    .select('*')
    .eq('patient_id', user.id)
    .order('searched_at', { ascending: false });

  return <AccessLogClient logs={logs || []} />;
}
