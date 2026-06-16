import type { ReportType } from '@/types';

export interface AnalysisResult {
  summary: string;
  key_findings: string[];
  abnormal_values: {
    name: string;
    value: string;
    normal_range: string;
    status: string;
    clinical_significance?: string;
    severity?: string;
  }[];
  medications_found: string[];
  recommendation: string;
  report_type_detected?: string;
  vital_signs?: {
    blood_pressure?: string;
    heart_rate?: string;
    temperature?: string;
    other?: string;
  };
  risk_assessment?: {
    overall_risk: string;
    risk_factors: string[];
    urgency: string;
  };
  follow_up_actions?: string[];
  disclaimer?: string;
}

/**
 * Full GeminiAnalysis type — the raw structured output from the updated prompt.
 * parseGeminiAnalysis normalizes this into AnalysisResult for backward compat.
 */
export interface GeminiAnalysis {
  summary: string;
  report_type_detected?: string;
  key_findings: Array<{
    finding: string;
    clinical_significance: string;
    severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';
  }>;
  abnormal_values: Array<{
    name: string;
    value: string;
    normal_range: string;
    status: 'high' | 'low' | 'critical_high' | 'critical_low' | 'normal';
    clinical_significance?: string;
    severity?: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';
  }>;
  medications_found: Array<{
    name: string;
    dosage: string;
    frequency: string;
    purpose?: string;
  }>;
  vital_signs?: {
    blood_pressure?: string;
    heart_rate?: string;
    temperature?: string;
    other?: string;
  };
  risk_assessment?: {
    overall_risk: 'low' | 'moderate' | 'high' | 'critical';
    risk_factors: string[];
    urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  };
  follow_up_actions?: string[];
  recommendation?: string;
  disclaimer?: string;
}

// ─── buildAnalysisPrompt ──────────────────────────────────────────────────────

const TYPE_HINTS: Partial<Record<ReportType | string, string>> = {
  lab_report:
    'Pay special attention to all lab values — blood counts, glucose, cholesterol, kidney and liver markers. Identify which values are outside the normal range.',
  prescription:
    'Extract all medication names, dosages, and frequencies. Identify if any medications are for chronic conditions.',
  scan: 'Describe the key findings from the imaging report. Note any abnormalities mentioned.',
  discharge_summary:
    'Extract the primary diagnosis, procedures performed, medications prescribed at discharge, and follow-up instructions.',
  vaccination: 'List vaccines administered, dates, and any due upcoming doses if mentioned.',
  other: 'Extract any clinically relevant information present in the document.',
};

export function buildAnalysisPrompt(reportType: ReportType | string): string {
  const hint = TYPE_HINTS[reportType] ?? TYPE_HINTS.other!;

  return `You are a medical document analyzer helping patients understand their health records.
Analyze the provided medical document image or PDF and extract the following information.

Document type: ${reportType}
${hint}

Return your response as a JSON object with EXACTLY this structure:
{
  "summary": "2-3 sentence plain-language summary a non-medical person can understand",
  "key_findings": ["finding 1", "finding 2"],
  "abnormal_values": [
    { "name": "parameter name", "value": "actual value with units", "normal_range": "expected range", "status": "high" | "low" | "critical" | "normal" }
  ],
  "medications_found": ["Medication 500mg", "Another Drug 10mg"],
  "recommendation": "One-line guidance. Always end with: This is not medical advice — consult your doctor."
}

IMPORTANT:
- Output ONLY valid JSON. No markdown, no extra text.
- If a field has no data, return an empty array [] for arrays or empty string "" for strings.
- The recommendation MUST always include the phrase "not medical advice".
- Keep the summary in simple language a patient can understand.
- Do not invent values not present in the document.`;
}

// ─── parseGeminiAnalysis ──────────────────────────────────────────────────────

export function parseGeminiAnalysis(raw: string): AnalysisResult | null {
  if (!raw || !raw.trim()) return null;

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }

  // Validate it's an object (not array/null/primitive)
  if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
    return null;
  }

  // ── Normalize summary ──
  const rawSummary = parsed.summary;
  const summary = rawSummary != null ? String(rawSummary) : 'No summary available.';

  // ── Normalize key_findings (handle both string[] and object[]) ──
  let key_findings: string[];
  if (Array.isArray(parsed.key_findings)) {
    key_findings = (parsed.key_findings as unknown[])
      .map((v) => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object' && 'finding' in v) {
          // New structured format: { finding, clinical_significance, severity }
          const obj = v as Record<string, unknown>;
          const finding = String(obj.finding ?? '');
          const sig = obj.clinical_significance ? ` (${obj.clinical_significance})` : '';
          return finding + sig;
        }
        return null;
      })
      .filter((v): v is string => v !== null && v.length > 0);
  } else {
    key_findings = [];
  }

  // ── Normalize abnormal_values (handle old and new formats) ──
  let abnormal_values: AnalysisResult['abnormal_values'];
  if (Array.isArray(parsed.abnormal_values)) {
    abnormal_values = (parsed.abnormal_values as Record<string, unknown>[]).map((v) => ({
      name: String(v.name ?? ''),
      value: String(v.value ?? ''),
      normal_range: String(v.normal_range ?? ''),
      status: String(v.status ?? 'unknown').toLowerCase(),
      clinical_significance: v.clinical_significance ? String(v.clinical_significance) : undefined,
      severity: v.severity ? String(v.severity) : undefined,
    }));
  } else {
    abnormal_values = [];
  }

  // ── Normalize medications_found (handle both string[] and object[]) ──
  let medications_found: string[];
  if (Array.isArray(parsed.medications_found)) {
    medications_found = (parsed.medications_found as unknown[])
      .map((v) => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') {
          // New structured format: { name, dosage, frequency, purpose }
          const obj = v as Record<string, unknown>;
          const parts: string[] = [];
          if (obj.name) parts.push(String(obj.name));
          if (obj.dosage) parts.push(String(obj.dosage));
          if (obj.frequency) parts.push(String(obj.frequency));
          return parts.length > 0 ? parts.join(' ') : null;
        }
        return null;
      })
      .filter((v): v is string => v !== null && v.length > 0);
  } else {
    medications_found = [];
  }

  // ── Recommendation ──
  const rawRec = parsed.recommendation;
  const recommendation = rawRec
    ? String(rawRec)
    : 'Please consult your doctor for further guidance. This is not medical advice.';

  // ── Optional new fields ──
  const report_type_detected = parsed.report_type_detected
    ? String(parsed.report_type_detected)
    : undefined;

  const vital_signs =
    parsed.vital_signs && typeof parsed.vital_signs === 'object'
      ? (parsed.vital_signs as Record<string, unknown> as AnalysisResult['vital_signs'])
      : undefined;

  const risk_assessment =
    parsed.risk_assessment && typeof parsed.risk_assessment === 'object'
      ? (() => {
          const ra = parsed.risk_assessment as Record<string, unknown>;
          return {
            overall_risk: String(ra.overall_risk ?? 'unknown'),
            risk_factors: Array.isArray(ra.risk_factors)
              ? (ra.risk_factors as unknown[]).map(String)
              : [],
            urgency: String(ra.urgency ?? 'routine'),
          };
        })()
      : undefined;

  const follow_up_actions = Array.isArray(parsed.follow_up_actions)
    ? (parsed.follow_up_actions as unknown[]).map(String).filter((s) => s.length > 0)
    : undefined;

  const disclaimer = parsed.disclaimer ? String(parsed.disclaimer) : undefined;

  return {
    summary,
    key_findings,
    abnormal_values,
    medications_found,
    recommendation,
    report_type_detected,
    vital_signs,
    risk_assessment,
    follow_up_actions,
    disclaimer,
  };
}
