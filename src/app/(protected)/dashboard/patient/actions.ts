'use server';

import { createClient } from '@/lib/supabase/server';

const UPLOAD_HOURLY_LIMIT = 50;

export async function checkUploadAllowed(): Promise<{ allowed: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { allowed: false, error: 'Not authenticated' };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('upload_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('uploaded_at', oneHourAgo);

  if ((count ?? 0) >= UPLOAD_HOURLY_LIMIT) {
    return {
      allowed: false,
      error: `Upload limit reached (${UPLOAD_HOURLY_LIMIT} per hour). Try again later.`,
    };
  }

  return { allowed: true };
}

export async function recordUpload(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('upload_attempts').insert({ user_id: user.id });
}
