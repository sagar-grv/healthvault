'use server';

import { createClient } from '@/lib/supabase/server';

export async function cancelPendingDeletion() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from('profiles')
      .select('deleted_at, deletion_scheduled_at')
      .eq('id', user.id)
      .single();

    if (prof?.deleted_at && prof?.deletion_scheduled_at) {
      await supabase
        .from('profiles')
        .update({ deleted_at: null, deletion_scheduled_at: null })
        .eq('id', user.id);
    }
  } catch {
    // Best effort — don't block page load
  }
}
