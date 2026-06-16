import { NMC_URL, type VerificationResult } from './types';

/**
 * Attempt to verify a doctor's registration number against NMC website.
 * Returns a VerificationResult with confidence score.
 */
export async function verifyWithNmc(
  registrationNumber: string,
  councilName: string
): Promise<VerificationResult> {
  const requestPayload = { registrationNumber, councilName };

  try {
    const response = await fetch(NMC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        registrationNo: registrationNumber,
        councilName: councilName,
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      return {
        method: 'nmc_scrape',
        status: 'error',
        confidence: 0,
        requestPayload,
        responsePayload: { error: `HTTP ${response.status}` },
        errorMessage: `NMC returned status ${response.status}`,
      };
    }

    const html = await response.text();

    // Simple heuristic: check if the registration number appears in the response
    const found =
      html.includes(registrationNumber) || html.includes(registrationNumber.toUpperCase());

    return {
      method: 'nmc_scrape',
      status: found ? 'success' : 'failed',
      confidence: found ? 0.9 : 0,
      requestPayload,
      responsePayload: { found, htmlLength: html.length },
    };
  } catch (error) {
    return {
      method: 'nmc_scrape',
      status: 'error',
      confidence: 0,
      requestPayload,
      responsePayload: {},
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
