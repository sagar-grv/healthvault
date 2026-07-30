import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';
import { checkAIGuardrails, logAuditEntry } from '@/lib/ai/guardrails';

/**
 * POST /api/interpret-report
 *
 * Generates a plain-language explanation of a medical report
 * in the user's preferred language, with optional TTS audio.
 *
 * Body: { reportId: string, language: string }
 * Returns: { explanation: string, keyPoints: string[], audioText: string }
 *
 * Security:
 * - Auth required
 * - Patient must own the report, or doctor must have access
 * - Rate limited (shares AI quota with other AI routes)
 * - API key never exposed to client
 */

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

function buildInterpretPrompt(language: string): string {
  const langName = LANGUAGE_NAMES[language] || 'English';

  return `You are a friendly health assistant explaining a medical report to a patient in simple terms.

LANGUAGE: Respond ENTIRELY in ${langName}. Every word of your response must be in ${langName}.

RULES:
1. Use simple, everyday language — no medical jargon
2. If you must use a medical term, immediately explain it in brackets
3. Be warm, reassuring, and clear
4. NEVER diagnose — always say "talk to your doctor"
5. Use analogies when helpful (e.g., "think of it like...")
6. Highlight what is normal (good news first) before what needs attention
7. End with ONE simple action the patient can take

RESPONSE FORMAT (respond in ${langName}):
Return valid JSON only — no markdown, no code fences:
{
  "headline": "One sentence in simple words — what is this report about?",
  "explanation": "2-3 paragraph plain language explanation",
  "keyPoints": [
    "Point 1 — a simple observation",
    "Point 2 — another simple observation"
  ],
  "abnormalItems": [
    {
      "name": "Test name in simple words",
      "yourValue": "what the report shows",
      "normalRange": "what is normal",
      "whatItMeans": "simple explanation",
      "isHigh": true or false
    }
  ],
  "actionAdvice": "One simple thing the patient should do or discuss with doctor",
  "audioText": "A friendly 2-3 sentence spoken summary for text-to-speech — conversational, no numbers or jargon"
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
    const { reportId, language = 'en' } = body;

    if (!reportId || typeof reportId !== 'string') {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    // Validate language code
    if (!LANGUAGE_NAMES[language]) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    // Fetch report — check ownership
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, patient_id, file_path, mime_type, report_type, is_shareable')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Auth check: patient owns it OR doctor with shareable access
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

    // Check cache — return existing interpretation for same language
    const { data: cached } = await supabase
      .from('report_analyses')
      .select('extracted_data')
      .eq('report_id', reportId)
      .single();

    const cacheKey = `interpretation_${language}`;
    if (cached?.extracted_data?.[cacheKey]) {
      return NextResponse.json(cached.extracted_data[cacheKey]);
    }

    // Download report file
    const { data: fileData, error: fileError } = await supabase.storage
      .from('reports')
      .download(report.file_path);

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'Could not retrieve report file' }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const fileSizeBytes = arrayBuffer.byteLength;

    // Rate limiting
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

    // Multi-provider AI: Gemini → NVIDIA (vision fallback)
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

    // Parse JSON response
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

    // Cache the interpretation in report_analyses.extracted_data
    const updatedCache = {
      ...(cached?.extracted_data || {}),
      [cacheKey]: parsed,
    };

    await supabase.from('report_analyses').upsert({
      report_id: reportId,
      extracted_data: updatedCache,
      updated_at: new Date().toISOString(),
    });

    // Audit log success
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
