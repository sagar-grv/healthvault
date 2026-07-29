import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';
import { checkAIGuardrails, logAuditEntry } from '@/lib/ai/guardrails';
import fs from 'fs';
import path from 'path';

const SUPPORTED_LANGUAGES: Record<string, string> = {
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

function buildExplanationPrompt(language: string): string {
  const langName = SUPPORTED_LANGUAGES[language] || 'English';
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
    const { extractedData, language = 'en', reportId } = body;

    if (!extractedData || typeof extractedData !== 'object') {
      return NextResponse.json({ error: 'extractedData is required' }, { status: 400 });
    }

    if (reportId) {
      const { data: report } = await supabase
        .from('reports')
        .select('patient_id')
        .eq('id', reportId)
        .single();
      if (!report || report.patient_id !== user.id) {
        await logAuditEntry(supabase, {
          user_id: user.id,
          report_id: reportId,
          action: 'explain_report',
          flagged: true,
          flag_reason: 'Unauthorized access attempt',
        });
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    const guardResult = await checkAIGuardrails(supabase, user.id, 'explain_report', 0);
    if (!guardResult.allowed) {
      return NextResponse.json(
        { error: guardResult.reason },
        { status: guardResult.status ?? 429 }
      );
    }

    const systemPrompt = buildExplanationPrompt(language);
    const reportContext = `Report: ${extractedData.title || 'Medical Report'}
Date: ${extractedData.reportDate || 'Unknown'}
Doctor: ${extractedData.doctorName || 'Unknown'}
Facility: ${extractedData.facilityName || 'Unknown'}
Type: ${extractedData.reportType || 'other'}
Summary: ${extractedData.summary || ''}

Test Values:
${
  (extractedData.keyValues ?? [])
    .map(
      (v: {
        name: string;
        value: string;
        unit?: string;
        normalRange?: string;
        isAbnormal?: boolean;
      }) =>
        `- ${v.name}: ${v.value} ${v.unit || ''} (Normal: ${v.normalRange || 'N/A'}) ${v.isAbnormal ? '[ABNORMAL]' : '[NORMAL]'}`
    )
    .join('\n') || 'No specific values extracted.'
}`;

    const { callTextAI } = await import('@/lib/ai/provider-router');
    const aiResponse = await callTextAI([
      { role: 'user', content: `${systemPrompt}\n\n${reportContext}` },
    ]);
    const responseText = aiResponse.text;

    let parsed;
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { explanation: responseText, highlights: [] };
    }

    await logAuditEntry(supabase, { user_id: user.id, action: 'explain_report', flagged: false });
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Explain report error:', error);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
