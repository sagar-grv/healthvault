import { GOV_API_URL, type VerificationResult } from './types';

/**
 * Attempt to verify against government open data APIs.
 */
export async function verifyWithGovApi(registrationNumber: string): Promise<VerificationResult> {
  const requestPayload = { registrationNumber };

  try {
    const response = await fetch(
      `${GOV_API_URL}?api-key=${process.env.GOV_API_KEY || 'demo'}&format=json&filters[registration_no]=${registrationNumber}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      return {
        method: 'gov_api',
        status: 'error',
        confidence: 0,
        requestPayload,
        responsePayload: { error: `HTTP ${response.status}` },
        errorMessage: `Gov API returned status ${response.status}`,
      };
    }

    const data = await response.json();
    const records = data.records || [];
    const found = records.length > 0;

    return {
      method: 'gov_api',
      status: found ? 'success' : 'failed',
      confidence: found ? 0.8 : 0,
      requestPayload,
      responsePayload: { found, recordCount: records.length },
    };
  } catch (error) {
    return {
      method: 'gov_api',
      status: 'error',
      confidence: 0,
      requestPayload,
      responsePayload: {},
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
