import { parseGeminiAnalysis, buildAnalysisPrompt } from '@/lib/ai/analysis-parser';

// ─── buildAnalysisPrompt ──────────────────────────────────────────────────────

describe('buildAnalysisPrompt', () => {
  test('returns a non-empty string', () => {
    const prompt = buildAnalysisPrompt('prescription');
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(50);
  });

  test('includes instruction to return JSON', () => {
    const prompt = buildAnalysisPrompt('lab_report');
    expect(prompt.toLowerCase()).toContain('json');
  });

  test('includes disclaimer instruction for all report types', () => {
    const prompt = buildAnalysisPrompt('scan');
    expect(prompt.toLowerCase()).toContain('not medical advice');
  });

  test('tailors prompt for lab_report type', () => {
    const prompt = buildAnalysisPrompt('lab_report');
    expect(prompt.toLowerCase()).toContain('lab');
  });

  test('tailors prompt for prescription type', () => {
    const prompt = buildAnalysisPrompt('prescription');
    expect(prompt.toLowerCase()).toContain('medication');
  });
});

// ─── parseGeminiAnalysis ──────────────────────────────────────────────────────

const validGeminiResponse = JSON.stringify({
  summary: 'Blood test shows mildly elevated glucose levels.',
  key_findings: ['Fasting glucose: 126 mg/dL (slightly high)', 'HbA1c: 6.8%'],
  abnormal_values: [
    { name: 'Fasting Glucose', value: '126 mg/dL', normal_range: '70–100 mg/dL', status: 'high' },
  ],
  medications_found: ['Metformin 500mg'],
  recommendation: 'Follow up with your doctor. This is not medical advice.',
});

describe('parseGeminiAnalysis', () => {
  test('parses a valid Gemini JSON response into a structured object', () => {
    const result = parseGeminiAnalysis(validGeminiResponse);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe('Blood test shows mildly elevated glucose levels.');
    expect(result!.key_findings).toHaveLength(2);
    expect(result!.abnormal_values).toHaveLength(1);
    expect(result!.medications_found).toHaveLength(1);
  });

  test('parses a response wrapped in markdown code fences', () => {
    const fenced = '```json\n' + validGeminiResponse + '\n```';
    const result = parseGeminiAnalysis(fenced);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe('Blood test shows mildly elevated glucose levels.');
  });

  test('returns null for completely invalid JSON', () => {
    const result = parseGeminiAnalysis('Sorry, I cannot analyze this image.');
    expect(result).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(parseGeminiAnalysis('')).toBeNull();
  });

  test('fills in defaults when optional fields are missing', () => {
    const minimal = JSON.stringify({ summary: 'Normal report.' });
    const result = parseGeminiAnalysis(minimal);
    expect(result).not.toBeNull();
    expect(result!.key_findings).toEqual([]);
    expect(result!.abnormal_values).toEqual([]);
    expect(result!.medications_found).toEqual([]);
    expect(result!.recommendation).toContain('doctor');
  });

  test('abnormal_values status is normalized to lowercase', () => {
    const response = JSON.stringify({
      summary: 'Test',
      abnormal_values: [{ name: 'Glucose', value: '200', normal_range: '70-100', status: 'HIGH' }],
    });
    const result = parseGeminiAnalysis(response);
    expect(result!.abnormal_values[0].status).toBe('high');
  });

  test('summary is always a string even if Gemini returns a number', () => {
    const response = JSON.stringify({ summary: 42 });
    const result = parseGeminiAnalysis(response);
    expect(typeof result!.summary).toBe('string');
  });
});
