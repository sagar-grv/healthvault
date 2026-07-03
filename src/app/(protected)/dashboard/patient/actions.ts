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

export async function getDoctors() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_doctor_display_info', { p_doctor_id: null });
  if (error) return { doctors: [] };
  const rows = Array.isArray(data) ? data : [];
  return { doctors: rows };
}

export async function createPreCheckDraft(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const doctorId = formData.get('doctor_id') as string;
  if (!doctorId) return { error: 'Doctor is required' };

  const { data, error } = await supabase
    .from('pre_check_submissions')
    .insert({
      patient_id: user.id,
      doctor_id: doctorId,
      status: 'draft',
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function savePreCheckDraft(draftId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const symptoms = formData.get('symptoms') as string;
  const vitalsRaw = formData.get('vitals') as string;
  const reportIdsRaw = formData.get('report_ids') as string;

  const payload: Record<string, unknown> = {};
  if (symptoms) payload.symptoms = symptoms;
  if (vitalsRaw) payload.vitals = JSON.parse(vitalsRaw);
  if (reportIdsRaw) payload.attached_report_ids = JSON.parse(reportIdsRaw);

  const { error } = await supabase
    .from('pre_check_submissions')
    .update(payload)
    .eq('id', draftId)
    .eq('patient_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function submitPreCheck(draftId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: submission, error: fetchError } = await supabase
    .from('pre_check_submissions')
    .select('*')
    .eq('id', draftId)
    .eq('patient_id', user.id)
    .single();

  if (fetchError || !submission) return { error: 'Pre-check not found' };
  if (!submission.symptoms) return { error: 'Please describe your symptoms first' };

  const { error } = await supabase
    .from('pre_check_submissions')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', draftId)
    .eq('patient_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/patient');
  return { success: true };
}

export async function getMyPreChecks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { submissions: [] };

  const { data } = await supabase
    .from('pre_check_submissions')
    .select('*')
    .eq('patient_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(10);

  return { submissions: data || [] };
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
