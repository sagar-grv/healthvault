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
export async function shareWithDoctor(
  doctorId: string,
  reportIds: string[]
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('shared_reports').insert(
    reportIds.map((reportId) => ({
      patient_id: user.id,
      doctor_id: doctorId,
      report_id: reportId,
    }))
  );

  if (error) return { error: error.message };
  return { success: true };
}

export async function getDoctorByShareId(doctorId: string): Promise<{
  error?: string;
  doctor?: {
    id: string;
    full_name: string;
    specialization: string;
    clinic_name: string;
    city: string;
  };
}> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', doctorId)
    .single();

  if (profileError || !profile) return { error: 'Doctor not found' };

  const { data: docProfile, error: docError } = await supabase
    .from('doctor_profiles')
    .select('specialization, clinic_name, city')
    .eq('id', doctorId)
    .single();

  if (docError) return { error: 'Doctor profile not found' };

  return {
    doctor: {
      id: profile.id,
      full_name: profile.full_name,
      specialization: docProfile.specialization || '',
      clinic_name: docProfile.clinic_name || '',
      city: docProfile.city || '',
    },
  };
}
