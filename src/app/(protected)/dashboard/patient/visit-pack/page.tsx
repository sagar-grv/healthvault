import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VisitPackClient from './VisitPackClient';
import { Report } from '@/types';

export const dynamic = 'force-dynamic';

export default async function VisitPackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'patient') redirect('/dashboard');

  const { data: reports } = await supabase
    .from('reports')
    .select('id, title, report_type, report_date, is_shareable')
    .eq('patient_id', user.id)
    .order('report_date', { ascending: false });

  return <VisitPackClient reports={(reports || []) as Report[]} />;
}
