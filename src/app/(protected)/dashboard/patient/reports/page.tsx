import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReportsPageClient from './ReportsPageClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('patient_id', user.id)
    .order('uploaded_at', { ascending: false });

  return <ReportsPageClient reports={reports || []} />;
}
