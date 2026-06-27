import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 120;

const RETENTION_DAYS = 90;
const SOFT_DELETE_GRACE_HOURS = 72;

export async function GET(request: NextRequest) {
  // Verify Vercel Cron header + shared secret
  if (request.headers.get('x-vercel-cron') !== '1') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (
    process.env.CRON_SECRET &&
    request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const graceCutoff = new Date(Date.now() - SOFT_DELETE_GRACE_HOURS * 60 * 60 * 1000).toISOString();

  const results: Record<string, number> = {};

  // ── 1. Execute soft deletes past 72h grace period ────────────────────────────
  // Find accounts where deletion_scheduled_at has passed
  const { data: expiredAccounts } = await supabase
    .from('profiles')
    .select('id')
    .not('deleted_at', 'is', null)
    .not('deletion_scheduled_at', 'is', null)
    .lt('deletion_scheduled_at', graceCutoff);

  let deletedAuthCount = 0;
  if (expiredAccounts && expiredAccounts.length > 0) {
    const ids = expiredAccounts.map((a) => a.id);

    // Delete DB rows first (child tables, then profiles)
    await supabase.from('shared_reports').delete().in('patient_id', ids);
    await supabase.from('shared_reports').delete().in('doctor_id', ids);
    await supabase.from('access_logs').delete().in('patient_id', ids);
    await supabase.from('access_logs').delete().in('doctor_id', ids);
    await supabase.from('reports').delete().in('patient_id', ids);
    await supabase.from('search_attempts').delete().in('doctor_id', ids);
    await supabase.from('doctor_verifications').delete().in('doctor_id', ids);
    await supabase.from('emergency_profiles').delete().in('patient_id', ids);
    await supabase.from('upload_attempts').delete().in('user_id', ids);
    await supabase.from('admin_audit_log').delete().in('target_id', ids);
    await supabase.from('doctor_profiles').delete().in('id', ids);
    await supabase.from('profiles').delete().in('id', ids);

    // Delete Auth users
    for (const id of ids) {
      try {
        await supabase.auth.admin.deleteUser(id);
        deletedAuthCount++;
      } catch {
        // Skip if auth user already deleted or not found
      }
    }

    // Clean up storage files
    for (const id of ids) {
      try {
        const { data: reportFiles } = await supabase.storage.from('reports').list(id);
        if (reportFiles && reportFiles.length > 0) {
          await supabase.storage.from('reports').remove(reportFiles.map((f) => `${id}/${f.name}`));
        }
        const { data: certFiles } = await supabase.storage.from('certificates').list(id);
        if (certFiles && certFiles.length > 0) {
          await supabase.storage
            .from('certificates')
            .remove(certFiles.map((f) => `${id}/${f.name}`));
        }
      } catch {
        // Skip storage cleanup errors
      }
    }
  }

  results.deleted_accounts = deletedAuthCount;

  // ── 2. Clean up old audit/usage data (90-day retention) ──────────────────────
  const { data: usageResult } = await supabase
    .from('ai_usage')
    .delete()
    .lt('used_at', cutoff)
    .select('id');

  const { data: auditResult } = await supabase
    .from('ai_audit_log')
    .delete()
    .lt('created_at', cutoff)
    .select('id');

  const { data: accessResult } = await supabase
    .from('access_logs')
    .delete()
    .lt('searched_at', cutoff)
    .select('id');

  const { data: searchResult } = await supabase
    .from('search_attempts')
    .delete()
    .lt('searched_at', cutoff)
    .select('id');

  const { data: uploadResult } = await supabase
    .from('upload_attempts')
    .delete()
    .lt('uploaded_at', cutoff)
    .select('id');

  results.ai_usage_deleted = usageResult?.length ?? 0;
  results.ai_audit_deleted = auditResult?.length ?? 0;
  results.access_logs_deleted = accessResult?.length ?? 0;
  results.search_attempts_deleted = searchResult?.length ?? 0;
  results.upload_attempts_deleted = uploadResult?.length ?? 0;
  results.retention_days = RETENTION_DAYS;
  results.soft_delete_grace_hours = SOFT_DELETE_GRACE_HOURS;

  return NextResponse.json(results);
}
