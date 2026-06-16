'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const UPLOAD_HOURLY_LIMIT = 50;

/** Look up a doctor's profile for display in the confirmation step.
 *  Uses SECURITY DEFINER function to bypass RLS (patients can't view doctor profiles). */
export async function lookupDoctor(doctorUserId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_doctor_display_info', {
    p_doctor_id: doctorUserId,
  });

  if (error || !data)
    return { full_name: null, clinic_name: null, verification_state: 'unverified' };
  // RPC returns array — extract first row
  const row = Array.isArray(data) ? data[0] : data;
  return {
    full_name: row?.full_name ?? null,
    clinic_name: row?.clinic_name ?? null,
    verification_state: row?.verification_state ?? 'unverified',
  };
}

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

export async function shareReportsWithDoctor(doctorUserId: string, reportIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  if (!reportIds.length) {
    return { error: 'Select at least one report to share' };
  }

  // Validate reports belong to patient and are shareable
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('id')
    .in('id', reportIds)
    .eq('patient_id', user.id)
    .eq('is_shareable', true);

  if (reportsError || !reports || reports.length !== reportIds.length) {
    return { error: 'Some reports could not be found' };
  }

  // Call RPC — validates doctor exists via FK, handles upsert
  const { data: share, error: shareError } = await supabase.rpc('share_reports_with_doctor', {
    p_patient_id: user.id,
    p_doctor_id: doctorUserId,
    p_report_ids: reportIds,
  });

  if (shareError) {
    return { error: 'Failed to share reports' };
  }

  // Get doctor display info for the success message
  const doctorInfo = await lookupDoctor(doctorUserId);

  // Supabase may return the result as an array or object
  const shareData = Array.isArray(share) ? share[0] : share;

  revalidatePath('/dashboard/patient');

  return {
    success: true,
    doctorName: doctorInfo.full_name || 'Doctor',
    clinicName: doctorInfo.clinic_name || undefined,
    shareId: shareData?.id,
  };
}

export async function revokeShare(shareId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('shared_reports')
    .delete()
    .eq('id', shareId)
    .eq('patient_id', user.id);

  if (error) {
    return { error: 'Failed to revoke share' };
  }

  revalidatePath('/dashboard/patient/access-log');
  return { success: true };
}

/** Delete the current patient's account and all associated data. */
export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: 'Not authenticated' };

  // 1. Delete storage files
  const { data: files } = await supabase.storage.from('reports').list(user.id);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from('reports').remove(paths);
  }

  // 2. Delete DB rows in order (child tables first)
  await supabase.from('shared_reports').delete().eq('patient_id', user.id);
  await supabase.from('access_logs').delete().eq('patient_id', user.id);
  await supabase.from('reports').delete().eq('patient_id', user.id);
  await supabase.from('emergency_profiles').delete().eq('patient_id', user.id);
  await supabase.from('upload_attempts').delete().eq('user_id', user.id);
  await supabase.from('admin_audit_log').delete().eq('target_id', user.id);
  await supabase.from('profiles').delete().eq('id', user.id);

  // 3. Sign out (auth user remains but profile is deleted — GDPR compliant)
  await supabase.auth.signOut();

  return {};
}
