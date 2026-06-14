export type VerificationState =
  | 'unverified'
  | 'pending'
  | 'auto_verified'
  | 'admin_verified'
  | 'rejected';

export type VerificationMethod = 'nmc_scrape' | 'ai_ocr' | 'gov_api' | 'admin_review';

export type VerificationStatus = 'pending' | 'success' | 'failed' | 'error';

export interface DoctorVerification {
  id: string;
  doctor_id: string;
  method: VerificationMethod;
  status: VerificationStatus;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  confidence_score: number | null;
  error_message: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface VerificationChainResult {
  method: VerificationMethod;
  status: VerificationStatus;
  confidence: number;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  errorMessage?: string;
}

export interface NmcScrapeResult {
  found: boolean;
  doctorName?: string;
  registrationNumber?: string;
  councilName?: string;
  status?: string;
  confidence: number;
}

export interface AiOcrResult {
  extractedName: string;
  extractedRegNumber: string;
  extractedCouncil: string;
  matched: boolean;
  confidence: number;
}

export interface GovApiResult {
  found: boolean;
  doctorName?: string;
  confidence: number;
}
