import type { ReportType } from '@/types';

export interface AnalysisResult {
  summary: string;
  key_findings: string[];
  abnormal_values: { name: string; value: string; normal_range: string; status: string }[];
  medications_found: string[];
  recommendation: string;
}

// ─── buildAnalysisPrompt ──────────────────────────────────────────────────────

const TYPE_HINTS: Partial<Record<ReportType | string, string>> = {
  lab_report: 'Pay special attention to all lab values — blood counts, glucose, cholesterol, kidney and liver markers. Identify which values are outside the normal range.',
  prescription: 'Extract all medication names, dosages, and frequencies. Identify if any medications are for chronic conditions.',
  scan: 'Describe the key findings from the imaging report. Note any abnormalities mentioned.',
  discharge_summary: 'Extract the primary diagnosis, procedures performed, medications prescribed at discharge, and follow-up instructions.',
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

  // Normalize summary: must be a string
  const rawSummary = parsed.summary;
  const summary = rawSummary != null ? String(rawSummary) : 'No summary available.';

  // Normalize arrays with safe defaults
  const key_findings = Array.isArray(parsed.key_findings)
    ? (parsed.key_findings as unknown[]).filter(v => typeof v === 'string') as string[]
    : [];

  const abnormal_values = Array.isArray(parsed.abnormal_values)
    ? (parsed.abnormal_values as Record<string, unknown>[]).map(v => ({
        name: String(v.name ?? ''),
        value: String(v.value ?? ''),
        normal_range: String(v.normal_range ?? ''),
        // Normalize status to lowercase
        status: String(v.status ?? 'unknown').toLowerCase(),
      }))
    : [];

  const medications_found = Array.isArray(parsed.medications_found)
    ? (parsed.medications_found as unknown[]).filter(v => typeof v === 'string') as string[]
    : [];

  // Recommendation: ensure it always mentions "doctor"
  const rawRec = parsed.recommendation;
  const recommendation = rawRec
    ? String(rawRec)
    : 'Please consult your doctor for further guidance. This is not medical advice.';

  return { summary, key_findings, abnormal_values, medications_found, recommendation };
}
