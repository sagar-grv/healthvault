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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
      return NextResponse.json({ analysis: existing });
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
      return NextResponse.json({ error: guardResult.reason }, { status: guardResult.status ?? 429 });
    }

    const mimeType = report.mime_type as string;
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json({ error: 'File type not supported for analysis' }, { status: 422 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI analysis not configured' }, { status: 503 });
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // Secure system prompt with topic guardrails and injection prevention
    const systemPrompt = buildSecureSystemPrompt();

    // Model priority: gemini-2.5-flash → gemini-2.0-flash-lite
    const MODEL_PRIORITY = ['gemini-2.5-flash', 'gemini-2.0-flash-lite'];
    const contents = [
      systemPrompt,
      { inlineData: { data: base64, mimeType } },
    ];

    let rawText = '';
    let usedModel = '';
    let lastErr: any = null;

    for (const modelName of MODEL_PRIORITY) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(contents);
        rawText = result.response.text();
        usedModel = modelName;
        break;
      } catch (e: any) {
        lastErr = e;
        if (e?.status === 404) continue;
        if (e?.status === 429 || e?.status === 503) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw e;
      }
    }

    if (!rawText) {
      if (lastErr?.status === 429) {
        return NextResponse.json(
          { error: 'AI service is busy. Please wait 10 seconds and try again.' },
          { status: 429 }
        );
      }
      throw lastErr ?? new Error('All Gemini models failed');
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
      .upsert({
        report_id: reportId,
        summary: analysis.summary,
        key_findings: analysis.key_findings,
        abnormal_values: analysis.abnormal_values,
        medications_found: analysis.medications_found,
        recommendation: analysis.recommendation,
        model_used: usedModel,
      }, { onConflict: 'report_id' })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ analysis: { ...analysis, report_id: reportId } });
    }

    return NextResponse.json({ analysis: saved });
  } catch (err: any) {
    console.error('[analyze-report] error:', err);
    if (err?.status === 429) {
      return NextResponse.json(
        { error: 'AI service is busy. Please wait a few seconds and try again.' },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
