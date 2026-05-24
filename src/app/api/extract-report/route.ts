import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAIGuardrails, logAuditEntry } from '@/lib/ai/guardrails';

/**
 * POST /api/extract-report
 *
 * Extracts structured data from a medical report image using Gemini.
 * Called client-side after camera capture or file selection.
 *
 * Body: { image: base64string, mimeType: string }
 * Returns: ExtractedReportData JSON
 *
 * Security:
 * - Requires authenticated user
 * - Rate limited via guardrails
 * - API key never exposed to client
 * - Audit logged
 */

const EXTRACTION_PROMPT = `You are a medical report data extractor. Analyze this medical report image and extract structured data.

RULES:
- Extract EXACTLY what you see. Do not guess or hallucinate.
- If a field is not visible, set it to null.
- For dates, use YYYY-MM-DD format.
- For report type, choose ONLY from: prescription, lab_report, scan, discharge_summary, vaccination, other
- For key values, extract test results with their normal ranges if shown on the report.
- Mark values as abnormal if they are outside the normal range shown.
- Keep the summary to ONE simple sentence a non-medical person would understand.
- Extract all visible text as rawText (for search indexing).
- If this is NOT a medical report, set confidence to 0 and title to "Not a medical report".

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "title": "string - descriptive title like 'Complete Blood Count Report'",
  "reportDate": "YYYY-MM-DD or null",
  "doctorName": "string or null",
  "facilityName": "string or null",
  "reportType": "prescription|lab_report|scan|discharge_summary|vaccination|other",
  "keyValues": [
    {
      "name": "Test name",
      "value": "Result value",
      "unit": "unit or null",
      "normalRange": "range string or null",
      "isAbnormal": true or false
    }
  ],
  "summary": "One simple sentence summary",
  "rawText": "All visible text from the report",
  "confidence": 0.0 to 1.0
}`;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const { image, mimeType } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 });
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json({ error: 'mimeType is required' }, { status: 400 });
    }

    // Validate mime type
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Only JPEG and PNG images are supported for extraction' },
        { status: 422 }
      );
    }

    // Size check (base64 is ~33% larger than binary)
    const estimatedBytes = (image.length * 3) / 4;
    if (estimatedBytes > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 413 });
    }

    // Rate limiting via guardrails
    const guardResult = await checkAIGuardrails(
      supabase,
      user.id,
      'extract-report',
      estimatedBytes
    );
    if (!guardResult.allowed) {
      return NextResponse.json(
        { error: guardResult.reason },
        { status: guardResult.status ?? 429 }
      );
    }

    // Multi-provider AI: Gemini → NVIDIA (vision fallback)
    const { callVisionAI } = await import('@/lib/ai/provider-router');
    let responseText = '';

    try {
      const aiResult = await callVisionAI(EXTRACTION_PROMPT, image, mimeType);
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

    // Parse JSON from response (strip any markdown code fences if present)
    let parsed;
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, return a minimal result
      await logAuditEntry(supabase, {
        user_id: user.id,
        action: 'extract_report',
        flagged: true,
        flag_reason: 'Failed to parse Gemini response as JSON',
      });
      return NextResponse.json(
        { error: 'Could not read this report. Try a clearer photo.' },
        { status: 422 }
      );
    }

    // Audit log (success)
    await logAuditEntry(supabase, {
      user_id: user.id,
      action: 'extract_report',
      flagged: false,
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Extract report error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
