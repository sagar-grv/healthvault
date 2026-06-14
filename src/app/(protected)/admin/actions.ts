'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, logAdminAction } from '@/lib/supabase/admin';

/** Get overview stats for admin dashboard. */
export async function getAdminStats() {
  const adminUser = await requireAdmin();
  if (!adminUser) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const [
    { count: totalDoctors },
    { count: totalPatients },
    { count: pendingVerifications },
    { count: totalReports },
  ] = await Promise.all([
    supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase
      .from('doctor_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_state', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalDoctors: totalDoctors ?? 0,
    totalPatients: totalPatients ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    totalReports: totalReports ?? 0,
  };
}

/** Get pending verification requests. */
export async function getPendingVerifications() {
  const adminUser = await requireAdmin();
  if (!adminUser) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('*, profiles!inner(full_name, email)')
    .eq('verification_state', 'pending')
    .order('created_at', { ascending: true });

  if (error) return { error: error.message };
  return { verifications: data ?? [] };
}

/** Get all doctors with verification status. */
export async function getAllDoctors() {
  const adminUser = await requireAdmin();
  if (!adminUser) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('*, profiles!inner(full_name, email, health_id)')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { doctors: data ?? [] };
}

/** Get doctor detail with verification history. */
export async function getDoctorDetail(doctorId: string) {
  const adminUser = await requireAdmin();
  if (!adminUser) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { data: doctor, error: doctorError } = await supabase
    .from('doctor_profiles')
    .select('*, profiles!inner(full_name, email, health_id, created_at)')
    .eq('id', doctorId)
    .single();

  if (doctorError) return { error: doctorError.message };

  const { data: verifications } = await supabase
    .from('doctor_verifications')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('verified_at', { ascending: false });

  const { data: auditLogs } = await supabase
    .from('admin_audit_log')
    .select('*')
    .eq('target_id', doctorId)
    .order('action_time', { ascending: false });

  return { doctor, verifications: verifications ?? [], auditLogs: auditLogs ?? [] };
}

/** Get all patients. */
export async function getAllPatients() {
  const adminUser = await requireAdmin();
  if (!adminUser) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, health_id, created_at')
    .eq('role', 'patient')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { patients: data ?? [] };
}

/** Approve a doctor verification. */
export async function approveDoctor(doctorId: string) {
  const adminUser = await requireAdmin();
  if (!adminUser) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('doctor_profiles')
    .update({ verification_state: 'admin_verified' })
    .eq('id', doctorId);

  if (error) return { error: error.message };

  await logAdminAction(adminUser.id, 'approve_doctor', doctorId, {
    previousState: 'pending',
    newState: 'admin_verified',
  });

  return { success: true };
}

/** Reject a doctor verification with reason. */
export async function rejectDoctor(doctorId: string, reason: string) {
  const adminUser = await requireAdmin();
  if (!adminUser) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('doctor_profiles')
    .update({ verification_state: 'rejected' })
    .eq('id', doctorId);

  if (error) return { error: error.message };

  await logAdminAction(adminUser.id, 'reject_doctor', doctorId, {
    previousState: 'pending',
    newState: 'rejected',
    reason,
  });

  return { success: true };
}
