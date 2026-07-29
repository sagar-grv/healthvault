import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';
import { checkAIGuardrails, logAuditEntry, MAX_AI_FILE_BYTES } from '@/lib/ai/guardrails';
import fs from 'fs';
import path from 'path';

const EXTRACTION_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'src/prompts/extraction.txt'),
  'utf-8'
);

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
    const { image, mimeType } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 });
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json({ error: 'mimeType is required' }, { status: 400 });
    }

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Only JPEG and PNG images are supported for extraction' },
        { status: 422 }
      );
    }

    const estimatedBytes = (image.length * 3) / 4;
    if (estimatedBytes > MAX_AI_FILE_BYTES) {
      return NextResponse.json(
        { error: `Image too large (max ${MAX_AI_FILE_BYTES / 1024 / 1024}MB)` },
        { status: 413 }
      );
    }

    const guardResult = await checkAIGuardrails(
      supabase,
      user.id,
      'extract_report',
      estimatedBytes
    );
    if (!guardResult.allowed) {
      return NextResponse.json(
        { error: guardResult.reason },
        { status: guardResult.status ?? 429 }
      );
    }

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
        action: 'extract_report',
        flagged: true,
        flag_reason: 'Failed to parse Gemini response as JSON',
      });
      return NextResponse.json(
        { error: 'Could not read this report. Try a clearer photo.' },
        { status: 422 }
      );
    }

    await logAuditEntry(supabase, { user_id: user.id, action: 'extract_report', flagged: false });
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Extract report error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
