'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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

export async function getQueueStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { stats: null };

  const today = new Date().toISOString().split('T')[0];

  const [{ count: waiting }, { count: todayCompleted }, { count: inCons }] = await Promise.all([
    supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .eq('status', 'waiting'),
    supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .eq('status', 'completed')
      .gte('consultation_started_at', today),
    supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .eq('status', 'in_consultation'),
  ]);

  return {
    stats: {
      waiting: waiting || 0,
      todayCompleted: todayCompleted || 0,
      inConsultation: inCons || 0,
    },
  };
}

export async function updateQueueEntryStatus(entryId: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const validStatuses = ['waiting', 'in_consultation', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) return { error: 'Invalid status' };

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { status, updated_at: now };
  if (status === 'in_consultation') updateData.consultation_started_at = now;
  if (status === 'completed') updateData.consultation_ended_at = now;

  const { error } = await supabase
    .from('queue_entries')
    .update(updateData)
    .eq('id', entryId)
    .eq('doctor_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/doctor');
  return { success: true };
}

export async function getPreCheckSubmissions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { submissions: [] };

  const { data } = await supabase
    .from('pre_check_submissions')
    .select('*')
    .eq('doctor_id', user.id)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(20);

  if (!data || data.length === 0) return { submissions: [] };

  const patientIds = [...new Set(data.map((s) => s.patient_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, health_id')
    .in('id', patientIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const enriched = data.map((s) => ({ ...s, patient: profileMap.get(s.patient_id) || null }));

  return { submissions: enriched };
}

/** Schedule account deletion for 72h from now (soft delete). */
export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: 'Not authenticated' };

  // Check if already scheduled
  const { data: existing } = await supabase
    .from('profiles')
    .select('deleted_at, deletion_scheduled_at')
    .eq('id', user.id)
    .single();

  if (existing?.deleted_at) {
    return { error: 'Account is already scheduled for deletion' };
  }

  // Schedule deletion for 72h from now
  const scheduledAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
      deletion_scheduled_at: scheduledAt,
    })
    .eq('id', user.id);

  if (error) {
    return { error: 'Failed to schedule account deletion' };
  }

  return {};
}
