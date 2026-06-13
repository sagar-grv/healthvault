import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReportsPageClient from './ReportsPageClient';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch first page + total count in parallel
  const [{ data: reports }, { count }] = await Promise.all([
    supabase
      .from('reports')
      .select('*')
      .eq('patient_id', user.id)
      .order('uploaded_at', { ascending: false })
      .limit(PAGE_SIZE),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('patient_id', user.id),
  ]);

  return (
    <Suspense fallback={<div />}>
      <ReportsPageClient
        reports={reports || []}
        totalCount={count ?? 0}
        initialHasMore={(reports?.length ?? 0) === PAGE_SIZE}
      />
    </Suspense>
  );
}
