export type ClaimType = 'document_fact' | 'general_information' | 'ai_interpretation' | 'unknown';

export interface EvidenceSource {
  reportId: string;
  page?: number;
  region?: { x: number; y: number; width: number; height: number };
  text?: string;
}

export interface EvidenceClaim {
  id: string;
  reportId: string;
  claim: string;
  claimType: ClaimType;
  confidence: number;
  sources: EvidenceSource[];
  category?: string;
  isAbnormal?: boolean;
}

export interface ComprehensionSession {
  id: string;
  reportId: string;
  userId: string;
  question: string;
  options: string[];
  selectedAnswer?: string;
  correct: boolean;
  createdAt: string;
}
