import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;

const RETENTION_DAYS = 90;

export async function GET(request: NextRequest) {
  // Only allow Vercel Cron invocations
  if (request.headers.get('x-vercel-cron') !== '1') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

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

  return NextResponse.json({
    cleaned: true,
    ai_usage_deleted: usageResult?.length ?? 0,
    ai_audit_deleted: auditResult?.length ?? 0,
    retention_days: RETENTION_DAYS,
  });
}
