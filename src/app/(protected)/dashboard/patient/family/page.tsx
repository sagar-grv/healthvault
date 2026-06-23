import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FamilyClient from './FamilyClient';
import type { FamilyMember } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FamilyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: members } = await supabase
    .from('family_profiles')
    .select('*')
    .eq('guardian_id', user.id)
    .order('created_at', { ascending: true });

  return <FamilyClient members={(members || []) as FamilyMember[]} />;
}
