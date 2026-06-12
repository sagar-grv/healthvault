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

  return <PatientsClient />;
}
