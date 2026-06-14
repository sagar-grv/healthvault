export const NMC_URL = 'https://www.nmc.org.in/MCIRest/searchDoctor';
export const GOV_API_URL = 'https://api.data.gov.in/resource';
export const VERIFICATION_CONFIDENCE_THRESHOLD = 0.7;

export interface VerificationResult {
  method: string;
  status: 'success' | 'failed' | 'error';
  confidence: number;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  errorMessage?: string;
}
