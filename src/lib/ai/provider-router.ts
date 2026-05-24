/**
 * AI Provider Router — Multi-provider fallback for resilience
 *
 * Strategy:
 * - Vision tasks (report image analysis): Gemini → NVIDIA (mistral-small-3.1) → fail
 * - Text tasks (interpretation, scheme advisor): Gemini → NVIDIA (nemotron-super) → fail
 *
 * All providers use OpenAI-compatible API format.
 * Gemini is accessed via Google Generative AI SDK.
 * NVIDIA is accessed via OpenAI SDK with custom baseURL.
 */

export type AIProvider = 'gemini' | 'nvidia';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AIContentPart[];
}

export interface AIContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
}

// NVIDIA API config (OpenAI-compatible)
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
// phi-4-multimodal: free endpoint, supports images (vision)
const NVIDIA_VISION_MODEL = 'microsoft/phi-4-multimodal-instruct';
// nemotron-super: free endpoint, excellent text quality
const NVIDIA_TEXT_MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1';

/**
 * Call NVIDIA NIM API (OpenAI-compatible)
 */
async function callNvidia(messages: AIMessage[], model: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not configured');

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NVIDIA API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call Gemini API with vision support
 */
async function callGemini(
  messages: AIMessage[],
  imageBase64?: string,
  imageMimeType?: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY not configured');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Build content parts
  const contentParts: Array<string | { inlineData: { data: string; mimeType: string } }> = [];

  // Add text from messages
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      contentParts.push(msg.content);
    }
  }

  // Add image if provided
  if (imageBase64 && imageMimeType) {
    contentParts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
  }

  const result = await model.generateContent(contentParts);
  return result.response.text();
}

/**
 * Vision task: analyze a medical report image
 * Gemini → NVIDIA mistral-small-3.1 (has vision) → throw
 */
export async function callVisionAI(
  systemPrompt: string,
  imageBase64: string,
  imageMimeType: string
): Promise<AIResponse> {
  // Try Gemini first (best vision quality)
  try {
    const text = await callGemini(
      [{ role: 'user', content: systemPrompt }],
      imageBase64,
      imageMimeType
    );
    return { text, provider: 'gemini', model: 'gemini-2.5-flash' };
  } catch (err) {
    const error = err as { message?: string; status?: number; toString?: () => string };
    const errStr = error.message || error.toString?.() || '';
    const is429 =
      error.status === 429 ||
      errStr.includes('429') ||
      errStr.includes('quota') ||
      errStr.includes('rate') ||
      errStr.includes('RESOURCE_EXHAUSTED') ||
      errStr.includes('Too Many Requests');
    if (!is429) throw err; // Only fallback on rate limit errors
    console.warn('[AI] Gemini rate limited, falling back to NVIDIA');
  }

  // Fallback: NVIDIA phi-4-multimodal (vision capable, free endpoint)
  try {
    // NVIDIA vision: encode image as data URL in message
    const dataUrl = `data:${imageMimeType};base64,${imageBase64}`;
    const nvidiaMessages: AIMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ];
    const text = await callNvidia(nvidiaMessages, NVIDIA_VISION_MODEL, 2048);
    return { text, provider: 'nvidia', model: NVIDIA_VISION_MODEL };
  } catch (err) {
    throw new Error(`All vision AI providers failed: ${(err as Error).message}`);
  }
}

/**
 * Text task: generate explanation, scheme advice, etc.
 * Gemini → NVIDIA nemotron-super → throw
 */
export async function callTextAI(messages: AIMessage[], maxTokens = 2048): Promise<AIResponse> {
  // Try Gemini first
  try {
    const text = await callGemini(messages);
    return { text, provider: 'gemini', model: 'gemini-2.5-flash' };
  } catch (err) {
    const error = err as { message?: string; status?: number; toString?: () => string };
    const errStr = error.message || error.toString?.() || '';
    const is429 =
      error.status === 429 ||
      errStr.includes('429') ||
      errStr.includes('quota') ||
      errStr.includes('rate') ||
      errStr.includes('RESOURCE_EXHAUSTED') ||
      errStr.includes('Too Many Requests');
    if (!is429) throw err;
    console.warn('[AI] Gemini rate limited, falling back to NVIDIA');
  }

  // Fallback: NVIDIA nemotron-super (text only, excellent quality, free)
  try {
    const text = await callNvidia(messages, NVIDIA_TEXT_MODEL, maxTokens);
    return { text, provider: 'nvidia', model: NVIDIA_TEXT_MODEL };
  } catch (err) {
    throw new Error(`All text AI providers failed: ${(err as Error).message}`);
  }
}
