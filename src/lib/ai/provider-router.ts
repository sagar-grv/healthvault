import { GoogleGenAI } from '@google/genai';
import { MODELS, MODEL_CONFIGS } from './models';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });

export type AIProvider = 'gemini';

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
}

async function callGemini(
  systemPrompt: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<AIResponse> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (imageBase64 && imageMimeType) {
    parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
  }
  parts.push({ text: systemPrompt });

  const result = await ai.models.generateContent({
    model: MODELS.EXTRACTION,
    contents: parts,
    config: {
      maxOutputTokens: MODEL_CONFIGS.EXTRACTION.maxTokens,
      temperature: MODEL_CONFIGS.EXTRACTION.temperature,
    },
  });
  return { text: result.text ?? '', provider: 'gemini', model: MODELS.EXTRACTION };
}

export async function callVisionAI(
  systemPrompt: string,
  imageBase64: string,
  imageMimeType: string
): Promise<AIResponse> {
  return callGemini(systemPrompt, imageBase64, imageMimeType);
}

export async function callTextAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 2048
): Promise<AIResponse> {
  const systemMsg = messages.find((m) => m.role === 'system');
  const userMsgs = messages.filter((m) => m.role !== 'system');

  const parts = userMsgs.map((m) => ({ text: m.content }));
  const result = await ai.models.generateContent({
    model: MODELS.EXPLANATION,
    contents: parts,
    config: {
      systemInstruction: systemMsg?.content,
      maxOutputTokens: maxTokens,
      temperature: MODEL_CONFIGS.EXPLANATION.temperature,
    },
  });
  return { text: result.text ?? '', provider: 'gemini', model: MODELS.EXPLANATION };
}
