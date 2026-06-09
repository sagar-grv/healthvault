import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseGeminiAnalysis } from '@/lib/ai/analysis-parser';
import {
  checkAIGuardrails,
  buildSecureSystemPrompt,
  validateAIResponse,
  logAuditEntry,
  detectPromptInjection,
} from '@/lib/ai/guardrails';

function calculateConfidence(data: {
  summary?: string | null;
  key_findings?: unknown;
  abnormal_values?: unknown;
  medications_found?: unknown;
  recommendation?: string | null;
}): number {
  let c = 0;
  if (data.summary && data.summary !== 'No summary available.') c += 0.2;
  if (Array.isArray(data.key_findings) && data.key_findings.length > 0) c += 0.2;
  if (Array.isArray(data.abnormal_values) && data.abnormal_values.length > 0) c += 0.15;
  if (Array.isArray(data.medications_found) && data.medications_found.length > 0) c += 0.15;
  if (data.recommendation && data.recommendation.length > 10) c += 0.15;
  if (data.summary && data.summary.length > 20) c += 0.1;
  if (
    data.summary &&
    data.summary !== 'No summary available.' &&
    Array.isArray(data.key_findings) &&
    data.key_findings.length > 0 &&
    data.recommendation &&
    data.recommendation.length > 10
  ) {
    c += 0.05;
  }
  return Math.round(Math.min(c, 1) * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId } = body;
    if (!reportId || typeof reportId !== 'string') {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    // Guard: reject obviously injected reportId values
    if (detectPromptInjection(reportId)) {
      await logAuditEntry(supabase, {
        user_id: user.id,
        action: 'analyze_report',
        flagged: true,
        flag_reason: 'Prompt injection detected in reportId',
      });
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Fetch the report — ensure caller owns it or it's shareable
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, patient_id, file_path, mime_type, report_type, is_shareable, title, file_size')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Auth check: patient who owns it, or doctor viewing a shareable report
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = report.patient_id === user.id;
    const isDoctor = profile?.role === 'doctor';
    const isAdmin = profile?.role === 'admin';
    const canAccess = isOwner || (isDoctor && report.is_shareable) || isAdmin;
    if (!canAccess) {
      await logAuditEntry(supabase, {
        user_id: user.id,
        report_id: reportId,
        action: 'analyze_report',
        flagged: true,
        flag_reason: 'Unauthorized access attempt',
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Return cached analysis if it exists (guardrails already passed for this report)
    const { data: existing } = await supabase
      .from('report_analyses')
      .select('*')
      .eq('report_id', reportId)
      .single();

    if (existing) {
      // Recalculate confidence from cached data (no migration needed)
      const cachedConfidence = calculateConfidence(existing);
      return NextResponse.json({ analysis: { ...existing, confidence: cachedConfidence } });
    }

    // Download file to check size before calling guardrails
    const { data: fileData, error: fileError } = await supabase.storage
      .from('reports')
      .download(report.file_path);

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'Could not retrieve report file' }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const fileSizeBytes = arrayBuffer.byteLength;

    // ── Security guardrails ──────────────────────────────────────────────────
    const guardResult = await checkAIGuardrails(supabase, user.id, reportId, fileSizeBytes);
    if (!guardResult.allowed) {
      return NextResponse.json(
        { error: guardResult.reason },
        { status: guardResult.status ?? 429 }
      );
    }

    const mimeType = report.mime_type as string;
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json({ error: 'File type not supported for analysis' }, { status: 422 });
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Secure system prompt with topic guardrails and injection prevention
    const systemPrompt = buildSecureSystemPrompt();

    // Multi-provider: Gemini → NVIDIA (vision fallback)
    const { callVisionAI } = await import('@/lib/ai/provider-router');
    let rawText = '';
    let usedModel = '';

    try {
      const aiResult = await callVisionAI(systemPrompt, base64, mimeType);
      rawText = aiResult.text;
      usedModel = aiResult.model;
    } catch (e) {
      const err = e as { message?: string };
      if (
        err.message?.includes('429') ||
        err.message?.includes('quota') ||
        err.message?.includes('rate')
      ) {
        return NextResponse.json(
          { error: 'AI service is busy. Please try again in a minute.' },
          { status: 429 }
        );
      }
      throw e;
    }
    if (!rawText) {
      return NextResponse.json(
        { error: 'AI service returned empty response. Please try again.' },
        { status: 503 }
      );
    }

    // ── Validate AI response for safety ─────────────────────────────────────
    const validation = validateAIResponse(rawText);
    if (!validation.safe) {
      await logAuditEntry(supabase, {
        user_id: user.id,
        report_id: reportId,
        action: 'analyze_report',
        model_used: usedModel,
        flagged: true,
        flag_reason: `Unsafe AI response: ${validation.reason}`,
      });
      return NextResponse.json(
        { error: 'AI returned an unsafe response. Please try again.' },
        { status: 422 }
      );
    }

    // Check if AI flagged the document as non-medical
    if (rawText.includes('"not_medical_document"')) {
      return NextResponse.json(
        { error: 'This document does not appear to be a medical record.' },
        { status: 422 }
      );
    }

    const analysis = parseGeminiAnalysis(rawText);
    if (!analysis) {
      return NextResponse.json(
        { error: 'AI could not analyze this document. Try a clearer image.' },
        { status: 422 }
      );
    }

    // Update audit log with model used
    await logAuditEntry(supabase, {
      user_id: user.id,
      report_id: reportId,
      action: 'analyze_report',
      model_used: usedModel,
      file_size_bytes: fileSizeBytes,
      flagged: false,
    });

    // Store result in DB
    const { data: saved, error: saveError } = await supabase
      .from('report_analyses')
      .upsert(
        {
          report_id: reportId,
          summary: analysis.summary,
          key_findings: analysis.key_findings,
          abnormal_values: analysis.abnormal_values,
          medications_found: analysis.medications_found,
          recommendation: analysis.recommendation,
          model_used: usedModel,
        },
        { onConflict: 'report_id' }
      )
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ analysis: { ...analysis, report_id: reportId } });
    }

    return NextResponse.json({ analysis: saved });
  } catch (err: unknown) {
    const apiErr = err as { status?: number; message?: string };
    console.error('[analyze-report] error:', apiErr);
    if (apiErr.status === 429) {
      return NextResponse.json(
        { error: 'AI service is busy. Please wait a few seconds and try again.' },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
