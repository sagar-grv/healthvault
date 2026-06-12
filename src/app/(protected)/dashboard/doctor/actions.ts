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
      doctor_name: patientProfile?.full_name || '',
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
