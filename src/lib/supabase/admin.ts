import { createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/utils/admin-guard';
import type { User } from '@supabase/supabase-js';

/**
 * Check if the current user is an admin. Returns { user } or { error }.
 */
export async function requireAdmin(): Promise<
  { user: User; error?: undefined } | { user: undefined; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: undefined, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isAdminRole(profile?.role))
    return { user: undefined, error: 'Not authorized — admin role required' };

  return { user, error: undefined };
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
): Promise<{ error?: string }> {
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

  const { error: updateError } = await supabase
    .from('doctor_profiles')
    .update(update)
    .eq('id', doctorId);
  if (updateError) return { error: updateError.message };

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

  return {};
}
