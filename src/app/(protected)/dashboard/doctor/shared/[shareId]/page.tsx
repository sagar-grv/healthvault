import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SharedReportsClient from './SharedReportsClient';

export default async function SharedReportsPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verify doctor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'doctor') redirect('/dashboard');

  return <SharedReportsClient shareId={shareId} />;
}
