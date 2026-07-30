import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';
import { checkAIGuardrails, logAuditEntry } from '@/lib/ai/guardrails';
import { callTextAI } from '@/lib/ai/provider-router';

/**
 * POST /api/explain-report
 *
 * Takes extracted report data + preferred language.
 * Returns a plain-language explanation that any non-medical person can understand.
 * Includes TTS-friendly text (short sentences, no complex punctuation).
 *
 * Body: { extractedData: ExtractedReportData, language: string }
 * Returns: { explanation: string, highlights: Array<{value, status, meaning}> }
 */

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

function buildExplanationPrompt(language: string): string {
  const langName = SUPPORTED_LANGUAGES[language] || 'English';

  return `You are a friendly health assistant explaining a medical report to a patient in ${langName}.

RULES:
- Write in ${langName} language ONLY (use the script of that language, e.g., Devanagari for Hindi).
- Explain like you are talking to someone who has never read a medical report before.
- Use very simple words. No medical jargon.
- Use short sentences (good for text-to-speech).
- Use analogies when helpful: "Think of cholesterol like fat clogging a pipe."
- NEVER diagnose. Always say "Talk to your doctor about..."
- For each abnormal value, explain what it means in daily life terms.
- End with one actionable suggestion (e.g., "Drink more water", "Walk 30 minutes daily").
- Keep total length under 200 words.
- Format as plain text paragraphs (no markdown, no bullets, no headers).

Also provide a JSON array called "highlights" with this format for each key test value:
[{"name": "Test Name", "value": "result", "status": "normal|high|low", "meaning": "one sentence explanation in ${langName}"}]

Respond in this exact JSON format:
{
  "explanation": "The full explanation text in ${langName}",
  "highlights": [{"name":"...", "value":"...", "status":"normal|high|low", "meaning":"..."}]
}`;
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

    // Verify report ownership if reportId is provided
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
          flag_reason: 'Unauthorized access attempt — report ownership mismatch',
        });
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    // Rate limiting
    const guardResult = await checkAIGuardrails(supabase, user.id, 'explain_report', 0);
    if (!guardResult.allowed) {
      return NextResponse.json(
        { error: guardResult.reason },
        { status: guardResult.status ?? 429 }
      );
    }

    const systemPrompt = buildExplanationPrompt(language);

    // Build context from extracted data
    const reportContext = `Report: ${extractedData.title || 'Medical Report'}
Date: ${extractedData.reportDate || 'Unknown'}
Doctor: ${extractedData.doctorName || 'Unknown'}
Facility: ${extractedData.facilityName || 'Unknown'}
Type: ${extractedData.reportType || 'other'}
Summary: ${extractedData.summary || ''}

Test Values:
${
  extractedData.keyValues
    ?.map(
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

    const aiResponse = await callTextAI([
      { role: 'user', content: `${systemPrompt}\n\n${reportContext}` },
    ]);
    const responseText = aiResponse.text;

    // Parse JSON response
    let parsed;
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, use raw text as explanation
      parsed = {
        explanation: responseText,
        highlights: [],
      };
    }

    await logAuditEntry(supabase, {
      user_id: user.id,
      action: 'explain_report',
      flagged: false,
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Explain report error:', error);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
