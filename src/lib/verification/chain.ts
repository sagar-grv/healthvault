import { createClient } from '@/lib/supabase/server';
import { verifyWithNmc } from './nmc-scraper';
import { verifyWithGovApi } from './gov-api';
import type { VerificationResult } from './types';

interface ChainInput {
  doctorId: string;
  registrationNumber: string;
  councilName: string;
  qualification: string;
  doctorName: string;
}

export async function runVerificationChain(input: ChainInput): Promise<{
  results: VerificationResult[];
}> {
  const supabase = await createClient();
  const results: VerificationResult[] = [];

  // Step 1: NMC Scrape
  const nmcResult = await verifyWithNmc(input.registrationNumber, input.councilName);
  results.push(nmcResult);
  await saveVerificationResult(supabase, input.doctorId, nmcResult);

  // Step 2: Gov API
  const govResult = await verifyWithGovApi(input.registrationNumber);
  results.push(govResult);
  await saveVerificationResult(supabase, input.doctorId, govResult);

  // Update doctor's verification state to pending (admin always reviews)
  await supabase
    .from('doctor_profiles')
    .update({ verification_state: 'pending' })
    .eq('id', input.doctorId);

  return { results };
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
