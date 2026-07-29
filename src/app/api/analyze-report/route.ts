import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';
import {
  checkAIGuardrails,
  buildSecureSystemPrompt,
  validateAIResponse,
  logAuditEntry,
  detectPromptInjection,
} from '@/lib/ai/guardrails';
import type { EvidenceClaim, ClaimType } from '@/types/evidence';
import { verifyClaims } from '@/lib/evidence/claim-verifier';
import { insertClaimsBatch } from '@/lib/evidence/graph';
import { pickModel } from '@/lib/ai/model-router';

function parseFacts(raw: string): EvidenceClaim[] {
  try {
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    const facts = parsed.facts ?? [];
    return facts.map((f: Record<string, unknown>, i: number) => ({
      id: `fact-${i}`,
      reportId: '',
      claim: (f.claim as string) ?? '',
      claimType: 'document_fact' as ClaimType,
      confidence: f.isAbnormal != null ? 0.95 : 0.85,
      category: (f.category as string) ?? 'other',
      isAbnormal: (f.isAbnormal as boolean) ?? undefined,
      sources: f.sourceText ? [{ reportId: '', text: f.sourceText as string }] : [],
    }));
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
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

    if (detectPromptInjection(reportId)) {
      await logAuditEntry(supabase, {
        user_id: user.id,
        action: 'analyze_report',
        flagged: true,
        flag_reason: 'Prompt injection detected in reportId',
      });
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, patient_id, file_path, mime_type, report_type, is_shareable, title, file_size')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

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

    const { data: existing } = await supabase
      .from('report_analyses')
      .select('*')
      .eq('report_id', reportId)
      .single();

    if (existing && existing.analysis_type === 'v2') {
      return NextResponse.json({ analysis: existing });
    }

    const { data: fileData, error: fileError } = await supabase.storage
      .from('reports')
      .download(report.file_path);

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'Could not retrieve report file' }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const fileSizeBytes = arrayBuffer.byteLength;

    const guardResult = await checkAIGuardrails(
      supabase,
      user.id,
      'analyze_report',
      fileSizeBytes,
      reportId
    );
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
    const systemPrompt = buildSecureSystemPrompt();

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

    const claims = parseFacts(rawText);
    const verification = verifyClaims(claims);

    await supabase.from('report_analyses').upsert(
      {
        report_id: reportId,
        summary: claims.map((c) => c.claim).join('; '),
        key_findings: claims.filter((c) => c.isAbnormal).map((c) => c.claim),
        model_used: usedModel,
        analysis_type: 'v2',
        extracted_data: { claims, verification },
      },
      { onConflict: 'report_id' }
    );

    await insertClaimsBatch(supabase, reportId, report.patient_id, claims);

    await logAuditEntry(supabase, {
      user_id: user.id,
      report_id: reportId,
      action: 'analyze_report',
      model_used: usedModel,
      file_size_bytes: fileSizeBytes,
      flagged: false,
    });

    return NextResponse.json({ analysis: { claims, verification, report_id: reportId } });
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
