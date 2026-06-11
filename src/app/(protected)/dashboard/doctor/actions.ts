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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Fetch the share to get patient_id and doctor_id
  const { data: share, error: fetchError } = await supabase
    .from('shared_reports')
    .select('patient_id, doctor_id, report_id')
    .eq('id', shareId)
    .single();

  if (fetchError || !share) return { error: 'Share not found' };
  if (share.doctor_id !== user.id) return { error: 'Unauthorized' };

  // Mark as viewed
  const { error: updateError } = await supabase
    .from('shared_reports')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', shareId);

  if (updateError) return { error: updateError.message };

  // Log audit trail
  const { data: doctorInfo } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const { error: logError } = await supabase.from('access_logs').insert({
    patient_id: share.patient_id,
    doctor_id: user.id,
    doctor_name: doctorInfo?.full_name || 'Unknown',
    reports_viewed: [share.report_id],
  });
  if (logError) console.error('Audit log failed:', logError.message);

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

  const seen = new Map<string, string>();

  // Get patients from shared_reports (push-based sharing)
  const { data: sharedData, error: sharedError } = await supabase
    .from('shared_reports')
    .select(
      `
      patient_id,
      shared_at,
      patient:patient_id (full_name, health_id)
    `
    )
    .eq('doctor_id', user.id)
    .order('shared_at', { ascending: false });

  if (sharedError) return { error: sharedError.message };

  // Also get patients from access_logs (pull-based / old flow)
  const { data: accessData, error: accessError } = await supabase
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

  if (accessError) return { error: accessError.message };

  const patientInfo = new Map<string, { full_name: string; health_id: string }>();

  for (const row of sharedData ?? []) {
    const pid = row.patient_id as string;
    const ts = row.shared_at as string;
    const patientArr = row.patient as { full_name: string; health_id: string }[] | undefined;
    const patient = patientArr?.[0];
    if (!seen.has(pid) || ts > seen.get(pid)!) {
      seen.set(pid, ts);
    }
    if (patient && !patientInfo.has(pid)) {
      patientInfo.set(pid, patient);
    }
  }

  for (const row of accessData ?? []) {
    const pid = row.patient_id as string;
    const ts = row.searched_at as string;
    const patientArr = row.patient as { full_name: string; health_id: string }[] | undefined;
    const patient = patientArr?.[0];
    if (!seen.has(pid) || ts > seen.get(pid)!) {
      seen.set(pid, ts);
    }
    if (patient && !patientInfo.has(pid)) {
      patientInfo.set(pid, patient);
    }
  }

  const patients = Array.from(seen.entries())
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([pid, lastVisited]) => {
      const info = patientInfo.get(pid);
      return {
        id: pid,
        full_name: info?.full_name || 'Unknown',
        health_id: info?.health_id || '',
        last_visited: lastVisited,
      };
    });

  return { patients };
}
