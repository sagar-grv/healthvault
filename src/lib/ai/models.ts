export const MODELS = {
  EXTRACTION: 'gemini-3.5-flash-lite',
  EXPLANATION: 'gemini-3.6-flash',
  EMBEDDING: 'gemini-embedding-exp-03-07',
} as const;

export const MODEL_CONFIGS = {
  EXTRACTION: { maxTokens: 4096, temperature: 0.1 },
  EXPLANATION: { maxTokens: 8192, temperature: 0.3 },
  EMBEDDING: { maxTokens: 2048, temperature: 0.0 },
} as const;

export type ModelKey = keyof typeof MODELS;
