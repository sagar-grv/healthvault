import type { EvidenceClaim } from '@/types/evidence';

const DIAGNOSTIC_PATTERNS = [
  /you have/i,
  /you are suffering from/i,
  /diagnosed with/i,
  /this means you have/i,
  /your condition is/i,
  /you need (immediate|urgent)/i,
  /seek (medical|emergency) attention/i,
  /this is (serious|critical|severe|dangerous)/i,
  /you should (start|take|stop) (taking|using)/i,
  /prescribe/i,
  /dosage|dose of/i,
];

const GENERAL_KNOWLEDGE_PATTERNS = [
  /in general/i,
  /commonly/i,
  /typically/i,
  /most people/i,
  /generally/i,
  /is usually/i,
];

export interface VerificationResult {
  passed: boolean;
  failedClaims: Array<{ claim: string; reason: string }>;
}

export function verifyClaims(claims: EvidenceClaim[]): VerificationResult {
  const failedClaims: Array<{ claim: string; reason: string }> = [];

  for (const c of claims) {
    if (c.claimType === 'unknown') {
      failedClaims.push({ claim: c.claim, reason: 'Claim type is unknown' });
      continue;
    }

    if (c.claimType === 'ai_interpretation' && c.confidence < 0.3) {
      failedClaims.push({ claim: c.claim, reason: 'AI interpretation below confidence threshold' });
      continue;
    }

    if (c.claimType === 'document_fact' && c.sources.length === 0) {
      failedClaims.push({ claim: c.claim, reason: 'Document fact has no source reference' });
      continue;
    }

    if (DIAGNOSTIC_PATTERNS.some((p) => p.test(c.claim))) {
      failedClaims.push({
        claim: c.claim,
        reason: 'Contains diagnostic language — blocked by claim verifier',
      });
      continue;
    }
  }

  return { passed: failedClaims.length === 0, failedClaims };
}

export function claimHasSource(claim: EvidenceClaim): boolean {
  if (claim.claimType === 'document_fact') return claim.sources.length > 0;
  if (claim.claimType === 'general_information') return true;
  if (claim.claimType === 'ai_interpretation') return claim.confidence >= 0.3;
  return false;
}
