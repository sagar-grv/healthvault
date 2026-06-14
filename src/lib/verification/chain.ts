import { createClient } from '@/lib/supabase/server';
import { verifyWithNmc } from './nmc-scraper';
import { verifyWithAiOcr } from './ai-ocr';
import { verifyWithGovApi } from './gov-api';
import { VERIFICATION_CONFIDENCE_THRESHOLD, type VerificationResult } from './types';

interface ChainInput {
  doctorId: string;
  registrationNumber: string;
  councilName: string;
  qualification: string;
  certificateBase64?: string;
  doctorName: string;
}

/**
 * Run the full verification chain for a doctor.
 * All APIs run regardless of earlier results (for audit trail).
 * Returns the aggregate result and saves each step to doctor_verifications.
 */
export async function runVerificationChain(input: ChainInput): Promise<{
  overallConfidence: number;
  autoVerified: boolean;
  results: VerificationResult[];
}> {
  const supabase = await createClient();
  const results: VerificationResult[] = [];

  // Step 1: NMC Scrape
  const nmcResult = await verifyWithNmc(input.registrationNumber, input.councilName);
  results.push(nmcResult);
  await saveVerificationResult(supabase, input.doctorId, nmcResult);

  // Step 2: AI OCR (if certificate provided)
  if (input.certificateBase64) {
    const ocrResult = await verifyWithAiOcr(
      input.certificateBase64,
      input.doctorName,
      input.registrationNumber,
      input.councilName
    );
    results.push(ocrResult);
    await saveVerificationResult(supabase, input.doctorId, ocrResult);
  }

  // Step 3: Gov API
  const govResult = await verifyWithGovApi(input.registrationNumber);
  results.push(govResult);
  await saveVerificationResult(supabase, input.doctorId, govResult);

  // Calculate average confidence from successful results
  const successfulResults = results.filter((r) => r.status === 'success');
  const overallConfidence =
    successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length
      : 0;

  const autoVerified = overallConfidence >= VERIFICATION_CONFIDENCE_THRESHOLD;

  // Update doctor's verification state
  await supabase
    .from('doctor_profiles')
    .update({
      verification_state: autoVerified ? 'auto_verified' : 'pending',
    })
    .eq('id', input.doctorId);

  return { overallConfidence, autoVerified, results };
}

async function saveVerificationResult(
  supabase: Awaited<ReturnType<typeof createClient>>,
  doctorId: string,
  result: VerificationResult
) {
  await supabase.from('doctor_verifications').insert({
    doctor_id: doctorId,
    method: result.method,
    status: result.status,
    confidence_score: result.confidence,
    request_payload: result.requestPayload,
    response_payload: result.responsePayload,
    error_message: result.errorMessage || null,
  });
}
