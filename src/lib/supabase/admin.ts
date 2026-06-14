import { createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/utils/admin-guard';

/**
 * Check if the current user is an admin. Returns the user or null.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isAdminRole(profile?.role)) return null;

  return user;
}

/**
 * Log an admin action to the audit trail.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetId: string | null = null,
  details: Record<string, unknown> = {}
) {
  const supabase = await createClient();
  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_id: targetId,
    details,
  });
}

/**
 * Update a doctor's verification state.
 */
export async function updateVerificationState(
  doctorId: string,
  state: string,
  reviewedBy: string | null = null,
  rejectionReason: string | null = null
) {
  const supabase = await createClient();
  const update: Record<string, unknown> = {
    verification_state: state,
  };

  if (state === 'admin_verified') {
    update.verified_at = new Date().toISOString();
  }
  if (rejectionReason) {
    update.rejection_reason = rejectionReason;
  }

  await supabase.from('doctor_profiles').update(update).eq('id', doctorId);

  // Log the verification attempt
  await supabase.from('doctor_verifications').insert({
    doctor_id: doctorId,
    method: 'admin_review',
    status: state === 'admin_verified' ? 'success' : 'failed',
    reviewed_by: reviewedBy,
    rejection_reason: rejectionReason,
    request_payload: { action: state },
    response_payload: { reviewed_by: reviewedBy },
  });
}
