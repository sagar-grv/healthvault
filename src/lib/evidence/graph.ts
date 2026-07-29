import { createClient } from '@/lib/supabase/server';
import type { EvidenceClaim, EvidenceSource, ClaimType } from '@/types/evidence';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function insertExtractedFact(
  supabase: SupabaseClient,
  fact: {
    reportId: string;
    patientId: string;
    claim: string;
    claimType: ClaimType;
    category?: string;
    value?: string;
    unit?: string;
    normalRange?: string;
    isAbnormal?: boolean;
    confidence?: number;
    rawText?: string;
  }
) {
  const { data, error } = await supabase
    .from('extracted_facts')
    .insert({
      report_id: fact.reportId,
      patient_id: fact.patientId,
      claim: fact.claim,
      claim_type: fact.claimType,
      category: fact.category ?? null,
      value: fact.value ?? null,
      unit: fact.unit ?? null,
      normal_range: fact.normalRange ?? null,
      is_abnormal: fact.isAbnormal ?? null,
      confidence: fact.confidence ?? 1.0,
      raw_text: fact.rawText ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function insertFactSource(
  supabase: SupabaseClient,
  source: EvidenceSource & { factId: string }
) {
  const { error } = await supabase.from('fact_sources').insert({
    fact_id: source.factId,
    report_id: source.reportId,
    page_number: source.page ?? null,
    region_x: source.region?.x ?? null,
    region_y: source.region?.y ?? null,
    region_width: source.region?.width ?? null,
    region_height: source.region?.height ?? null,
    source_text: source.text ?? null,
  });
  if (error) throw error;
}

export async function getEvidenceForReport(
  supabase: SupabaseClient,
  reportId: string
): Promise<EvidenceClaim[]> {
  const { data: facts, error } = await supabase
    .from('extracted_facts')
    .select('*, fact_sources(*)')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (facts ?? []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    reportId: f.report_id as string,
    claim: f.claim as string,
    claimType: f.claim_type as ClaimType,
    confidence: f.confidence as number,
    category: f.category as string | undefined,
    isAbnormal: f.is_abnormal as boolean | undefined,
    sources: ((f.fact_sources as Record<string, unknown>[]) ?? []).map((s) => ({
      reportId: s.report_id as string,
      page: s.page_number as number | undefined,
      region:
        s.region_x != null
          ? {
              x: s.region_x as number,
              y: s.region_y as number,
              width: s.region_width as number,
              height: s.region_height as number,
            }
          : undefined,
      text: s.source_text as string | undefined,
    })),
  }));
}

export async function insertClaimsBatch(
  supabase: SupabaseClient,
  reportId: string,
  patientId: string,
  claims: EvidenceClaim[]
) {
  for (const claim of claims) {
    const factId = await insertExtractedFact(supabase, {
      reportId,
      patientId,
      claim: claim.claim,
      claimType: claim.claimType,
      category: claim.category,
      isAbnormal: claim.isAbnormal,
      confidence: claim.confidence,
    });
    for (const source of claim.sources) {
      await insertFactSource(supabase, { ...source, factId });
    }
  }
}

export async function insertComprehensionSession(
  supabase: SupabaseClient,
  session: {
    reportId: string;
    patientId: string;
    question: string;
    options: string[];
    correctAnswer: string;
    selectedAnswer?: string;
    isCorrect?: boolean;
    understandingLevel?: number;
  }
) {
  const { error } = await supabase.from('comprehension_sessions').insert({
    report_id: session.reportId,
    patient_id: session.patientId,
    question: session.question,
    options: session.options,
    correct_answer: session.correctAnswer,
    selected_answer: session.selectedAnswer ?? null,
    is_correct: session.isCorrect ?? null,
    understanding_level: session.understandingLevel ?? null,
  });
  if (error) throw error;
}

export async function insertUserCorrection(
  supabase: SupabaseClient,
  correction: {
    reportId: string;
    patientId: string;
    factId?: string;
    originalValue: string;
    correctedValue: string;
    correctionType: string;
    notes?: string;
  }
) {
  const { error } = await supabase.from('user_corrections').insert({
    report_id: correction.reportId,
    patient_id: correction.patientId,
    fact_id: correction.factId ?? null,
    original_value: correction.originalValue,
    corrected_value: correction.correctedValue,
    correction_type: correction.correctionType,
    notes: correction.notes ?? null,
  });
  if (error) throw error;
}
