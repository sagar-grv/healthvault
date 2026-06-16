'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, updateVerificationState, logAdminAction } from '@/lib/supabase/admin';

/** Get overview stats for admin dashboard. */
export async function getAdminStats() {
  const { user: adminUser, error: adminError } = await requireAdmin();
  if (adminError || !adminUser) return { error: adminError || 'Unauthorized' };

  const supabase = await createClient();

  const [
    { count: totalDoctors },
    { count: totalPatients },
    { count: pendingVerifications },
    { count: totalReports },
  ] = await Promise.all([
    supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'patient')
      .is('deleted_at', null),
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
  const { user: adminUser, error: adminError } = await requireAdmin();
  if (adminError || !adminUser) return { error: adminError || 'Unauthorized' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('*, profiles!inner(full_name, email)')
    .eq('verification_state', 'pending')
    .order('created_at', { ascending: true });

  if (error) return { error: error.message };

  // Filter out soft-deleted profiles
  const activeVerifications = (data ?? []).filter((v) => !v.profiles?.deleted_at);

  return { verifications: activeVerifications };
}

/** Get all doctors with verification status. */
export async function getAllDoctors() {
  const { user: adminUser, error: adminError } = await requireAdmin();
  if (adminError || !adminUser) return { error: adminError || 'Unauthorized' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('*, profiles!inner(full_name, email, health_id)')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };

  // Filter out soft-deleted profiles
  const activeDoctors = (data ?? []).filter((d) => !d.profiles?.deleted_at);

  return { doctors: activeDoctors };
}

/** Get doctor detail with verification history. */
export async function getDoctorDetail(doctorId: string) {
  const { user: adminUser, error: adminError } = await requireAdmin();
  if (adminError || !adminUser) return { error: adminError || 'Unauthorized' };

  const supabase = await createClient();

  const { data: doctor, error: doctorError } = await supabase
    .from('doctor_profiles')
    .select('*, profiles!inner(full_name, email, health_id, created_at, deleted_at)')
    .eq('id', doctorId)
    .single();

  if (doctorError) return { error: doctorError.message };
  if (doctor?.profiles?.deleted_at) return { error: 'Account has been deleted' };

  const { data: verifications } = await supabase
    .from('doctor_verifications')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  const { data: auditLogs } = await supabase
    .from('admin_audit_log')
    .select('*')
    .eq('target_id', doctorId)
    .order('created_at', { ascending: false });

  return { doctor, verifications: verifications ?? [], auditLogs: auditLogs ?? [] };
}

/** Get all patients. Pass includeDeleted=true to show soft-deleted accounts. */
export async function getAllPatients(includeDeleted = false) {
  const { user: adminUser, error: adminError } = await requireAdmin();
  if (adminError || !adminUser) return { error: adminError || 'Unauthorized' };

  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, health_id, created_at, deleted_at, deletion_scheduled_at')
    .eq('role', 'patient')
    .order('created_at', { ascending: false });

  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { patients: data ?? [] };
}

/** Approve a doctor verification. */
export async function approveDoctor(doctorId: string) {
  const { user: adminUser, error: adminError } = await requireAdmin();
  if (adminError || !adminUser) return { error: adminError || 'Unauthorized' };

  const result = await updateVerificationState(doctorId, 'admin_verified', adminUser.id);
  if (result.error) return { error: result.error };

  await logAdminAction(adminUser.id, 'approve_doctor', doctorId);

  return { success: true };
}

/** Reject a doctor verification with reason. */
export async function rejectDoctor(doctorId: string, reason: string) {
  if (!reason || reason.trim().length < 10) {
    return { error: 'Rejection reason must be at least 10 characters' };
  }

  const { user: adminUser, error: adminError } = await requireAdmin();
  if (adminError || !adminUser) return { error: adminError || 'Unauthorized' };

  const result = await updateVerificationState(doctorId, 'rejected', adminUser.id, reason);
  if (result.error) return { error: result.error };

  await logAdminAction(adminUser.id, 'reject_doctor', doctorId, { reason });

  return { success: true };
}
