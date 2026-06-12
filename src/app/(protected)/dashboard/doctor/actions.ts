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

export async function getSharedReports() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  const { data: shares, error } = await supabase
    .from('shared_reports')
    .select(
      `
      id,
      patient_id,
      report_ids,
      shared_at,
      viewed_at,
      patient:profiles!shared_reports_patient_id_fkey(full_name, health_id)
    `
    )
    .eq('doctor_id', user.id)
    .order('shared_at', { ascending: false });

  if (error) {
    return { error: 'Failed to load shared reports' };
  }

  return { shares: shares || [] };
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

  // Fetch share record
  const { data: share, error: shareError } = await supabase
    .from('shared_reports')
    .select(
      `
      id,
      patient_id,
      report_ids,
      shared_at,
      viewed_at,
      patient:profiles!shared_reports_patient_id_fkey(id, full_name, health_id)
    `
    )
    .eq('id', shareId)
    .eq('doctor_id', user.id)
    .single();

  if (shareError || !share) {
    return { error: 'Share not found' };
  }

  // Fetch the actual reports
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .in('id', share.report_ids)
    .order('report_date', { ascending: false });

  if (reportsError) {
    return { error: 'Failed to load reports' };
  }

  // Mark as viewed (fire-and-forget)
  await supabase
    .from('shared_reports')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', shareId);

  // Log access (fire-and-forget)
  const { data: doctorProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  await supabase.from('access_logs').insert({
    patient_id: share.patient_id,
    doctor_id: user.id,
    doctor_name: doctorProfile?.full_name || '',
    reports_viewed: share.report_ids,
  });

  return { share, reports: reports || [] };
}
