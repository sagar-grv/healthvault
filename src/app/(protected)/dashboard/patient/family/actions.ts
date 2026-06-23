'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addFamilyMember(data: {
  memberName: string;
  relationship: string;
  dateOfBirth?: string;
  bloodGroup?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('family_profiles').insert({
    guardian_id: user.id,
    member_name: data.memberName,
    relationship: data.relationship,
    date_of_birth: data.dateOfBirth || null,
    blood_group: data.bloodGroup || null,
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/patient/family');
  return { success: true };
}

export async function removeFamilyMember(memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('family_profiles')
    .delete()
    .eq('id', memberId)
    .eq('guardian_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/patient/family');
  return { success: true };
}
