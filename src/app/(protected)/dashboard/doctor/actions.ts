'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidHealthId, normalizeHealthId } from '@/lib/utils/health-id';

/**
 * Server action: validate health ID, check rate limit, insert search attempt, navigate.
 * Runs server-side — eliminates 3 client→Supabase round-trips.
 */
export async function searchPatient(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const rawInput = (formData.get('healthId') as string) ?? '';
  const normalized = normalizeHealthId(rawInput.trim());

  if (!isValidHealthId(normalized)) {
    return { error: 'Invalid Health ID format. Expected: HV-XXXX-XXXX' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Session expired. Please login again.' };

  // Rate-limit check — uses idx_search_attempts_doctor_time index
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('search_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', user.id)
    .gte('searched_at', oneHourAgo);

  if ((count ?? 0) >= 10) {
    return { error: 'Search limit reached (10 per hour). Please try again later.' };
  }

  // Insert search attempt before redirect
  await supabase.from('search_attempts').insert({
    doctor_id: user.id,
    searched_health_id: normalized,
    found: false,
  });

  // Server-side redirect — no client round-trip needed
  redirect(`/dashboard/doctor/patient/${encodeURIComponent(normalized)}`);
}

/** Fetch all patients who shared reports with the current doctor. */
export async function getPatientsSharedWithMe() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated', shares: [] };
  }

  // 1. Fetch shares (no join needed here)
  const { data: shares, error: shareError } = await supabase
    .from('shared_reports')
    .select('id, patient_id, report_ids, shared_at, viewed_at')
    .eq('doctor_id', user.id)
    .order('shared_at', { ascending: false });

  if (shareError) {
    return { error: 'Failed to load shares', shares: [] };
  }

  if (!shares || shares.length === 0) {
    return { shares: [] };
  }

  // 2. Fetch patient profiles in one query (RLS allows doctors to see patients)
  const patientIds = [...new Set(shares.map((s) => s.patient_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, health_id')
    .in('id', patientIds);

  // 3. Merge
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const enriched = shares.map((share) => ({
    ...share,
    patient: profileMap.get(share.patient_id) || null,
  }));

  return { shares: enriched };
}

/** Submit doctor profile for verification. Sets state to 'pending'. */
export async function submitForVerification() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('doctor_profiles')
    .update({ verification_state: 'pending' })
    .eq('id', user.id)
    .in('verification_state', ['unverified', 'rejected']);

  if (error) {
    return { error: 'Failed to submit for verification' };
  }

  return { success: true };
}

export async function markShareViewed(shareId: string) {
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
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', shareId)
    .eq('doctor_id', user.id);

  if (error) {
    return { error: 'Failed to mark as viewed' };
  }

  return { success: true };
}

export async function getSharedReportDetails(shareId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  // Fetch share record — NO join (PostgREST join fails due to RLS)
  const { data: share, error: shareError } = await supabase
    .from('shared_reports')
    .select('id, patient_id, report_ids, shared_at, viewed_at')
    .eq('id', shareId)
    .eq('doctor_id', user.id)
    .single();

  if (shareError || !share) {
    return { error: 'Share not found' };
  }

  // Fetch patient profile directly — bypasses RLS join issue
  const { data: patientProfile } = await supabase
    .from('profiles')
    .select('id, full_name, health_id')
    .eq('id', share.patient_id)
    .single();

  // Fetch doctor's own name for access log (RLS allows viewing own profile)
  const { data: doctorProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Fetch reports — only needed columns, not select('*')
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select(
      'id, patient_id, title, report_type, report_date, file_path, file_name, file_size, mime_type, notes, thumbnail_path, is_shareable, is_starred, uploaded_at, updated_at'
    )
    .in('id', share.report_ids)
    .order('report_date', { ascending: false });

  if (reportsError) {
    return { error: 'Failed to load reports' };
  }

  // Fire-and-forget: don't await these — they run in background
  Promise.all([
    supabase
      .from('shared_reports')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', shareId),
    supabase.from('access_logs').insert({
      patient_id: share.patient_id,
      doctor_id: user.id,
      doctor_name: doctorProfile?.full_name || '',
      reports_viewed: share.report_ids,
    }),
  ]).catch(() => {
    // Silent fail for fire-and-forget
  });

  return {
    share: { ...share, patient: patientProfile ? [patientProfile] : [] },
    reports: reports || [],
  };
}

/** Delete the current doctor's account and all associated data. */
export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: 'Not authenticated' };

  // 1. Delete storage files (certificates)
  const { data: files } = await supabase.storage.from('certificates').list(user.id);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from('certificates').remove(paths);
  }

  // 2. Delete DB rows in order (child tables first)
  await supabase.from('shared_reports').delete().eq('doctor_id', user.id);
  await supabase.from('access_logs').delete().eq('doctor_id', user.id);
  await supabase.from('search_attempts').delete().eq('doctor_id', user.id);
  await supabase.from('doctor_verifications').delete().eq('doctor_id', user.id);
  await supabase.from('admin_audit_log').delete().eq('target_id', user.id);
  await supabase.from('doctor_profiles').delete().eq('id', user.id);
  await supabase.from('profiles').delete().eq('id', user.id);

  // 3. Sign out (auth user remains but profile is deleted — GDPR compliant)
  await supabase.auth.signOut();

  return {};
}
