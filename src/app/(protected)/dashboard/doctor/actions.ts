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

export async function fetchSharedReports(): Promise<{
  error?: string;
  reports?: Array<{
    id: string;
    patient_id: string;
    doctor_id: string;
    report_id: string;
    shared_at: string;
    viewed_at: string | null;
    message: string | null;
    patient_name?: string;
    patient_health_id?: string;
    report_title?: string;
    report_type?: string;
  }>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('shared_reports')
    .select(
      `
      *,
      patient:patient_id (full_name, health_id),
      report:report_id (title, report_type)
    `
    )
    .eq('doctor_id', user.id)
    .order('shared_at', { ascending: false })
    .limit(20);

  if (error) return { error: error.message };

  type SharedReportRow = {
    id: string;
    patient_id: string;
    doctor_id: string;
    report_id: string;
    shared_at: string;
    viewed_at: string | null;
    message: string | null;
    patient: { full_name: string; health_id: string } | null;
    report: { title: string; report_type: string } | null;
  };

  const reports = (data ?? []).map((r: SharedReportRow) => ({
    id: r.id,
    patient_id: r.patient_id,
    doctor_id: r.doctor_id,
    report_id: r.report_id,
    shared_at: r.shared_at,
    viewed_at: r.viewed_at,
    message: r.message,
    patient_name: r.patient?.full_name,
    patient_health_id: r.patient?.health_id,
    report_title: r.report?.title,
    report_type: r.report?.report_type,
  }));

  return { reports };
}

export async function markSharedReportViewed(shareId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('shared_reports')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', shareId);

  if (error) return { error: error.message };
  return {};
}

export async function getDoctorPatients(): Promise<{
  error?: string;
  patients?: Array<{
    id: string;
    full_name: string;
    health_id: string;
    last_visited: string;
  }>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('access_logs')
    .select(
      `
      patient_id,
      searched_at,
      patient:patient_id (full_name, health_id)
    `
    )
    .eq('doctor_id', user.id)
    .order('searched_at', { ascending: false });

  if (error) return { error: error.message };

  type AccessLogRow = {
    patient_id: string;
    searched_at: string;
    patient: { full_name: string; health_id: string } | null;
  };

  const seen = new Set<string>();
  const patients = (data ?? [])
    .filter((log: AccessLogRow) => {
      if (seen.has(log.patient_id)) return false;
      seen.add(log.patient_id);
      return true;
    })
    .map((log: AccessLogRow) => ({
      id: log.patient_id,
      full_name: log.patient?.full_name || 'Unknown',
      health_id: log.patient?.health_id || '',
      last_visited: log.searched_at,
    }));

  return { patients };
}
