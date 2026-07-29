import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';
import { checkAIGuardrails, logAuditEntry } from '@/lib/ai/guardrails';
import fs from 'fs';
import path from 'path';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  bn: 'Bengali',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
  as: 'Assamese',
};

const EXPLANATION_PROMPT_TEMPLATE = fs.readFileSync(
  path.join(process.cwd(), 'src/prompts/explanation.txt'),
  'utf-8'
);

function buildInterpretPrompt(language: string): string {
  const langName = LANGUAGE_NAMES[language] || 'English';
  return EXPLANATION_PROMPT_TEMPLATE.replace(/\{\{language\}\}/g, langName);
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
    const { reportId, language = 'en' } = body;

    if (!reportId || typeof reportId !== 'string') {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }
    if (!LANGUAGE_NAMES[language]) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, patient_id, file_path, mime_type, report_type, is_shareable')
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
    const canAccess = isOwner || (isDoctor && report.is_shareable);

    if (!canAccess) {
      await logAuditEntry(supabase, {
        user_id: user.id,
        report_id: reportId,
        action: 'interpret_report',
        flagged: true,
        flag_reason: 'Unauthorized access attempt',
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: cached } = await supabase
      .from('report_analyses')
      .select('extracted_data')
      .eq('report_id', reportId)
      .single();

    const cacheKey = `interpretation_${language}`;
    if (cached?.extracted_data?.[cacheKey]) {
      return NextResponse.json(cached.extracted_data[cacheKey]);
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
      'interpret_report',
      fileSizeBytes,
      reportId
    );
    if (!guardResult.allowed) {
      return NextResponse.json(
        { error: guardResult.reason },
        { status: guardResult.status ?? 429 }
      );
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = report.mime_type as string;

    const { callVisionAI } = await import('@/lib/ai/provider-router');
    let responseText = '';

    try {
      const aiResult = await callVisionAI(buildInterpretPrompt(language), base64, mimeType);
      responseText = aiResult.text;
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

    let parsed;
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      await logAuditEntry(supabase, {
        user_id: user.id,
        action: 'interpret_report',
        flagged: true,
        flag_reason: 'Failed to parse Gemini response as JSON',
      });
      return NextResponse.json(
        { error: 'Could not interpret this report. Try again.' },
        { status: 422 }
      );
    }

    const updatedCache = { ...(cached?.extracted_data || {}), [cacheKey]: parsed };
    await supabase.from('report_analyses').upsert({
      report_id: reportId,
      extracted_data: updatedCache,
      updated_at: new Date().toISOString(),
    });

    await logAuditEntry(supabase, {
      user_id: user.id,
      report_id: reportId,
      action: 'interpret_report',
      flagged: false,
    });
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Interpret report error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
