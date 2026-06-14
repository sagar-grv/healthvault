import { type VerificationResult } from './types';

/**
 * Use Gemini to extract text from a doctor's registration certificate image.
 * Compares extracted data with submitted data.
 */
export async function verifyWithAiOcr(
  certificateBase64: string,
  submittedName: string,
  submittedRegNumber: string,
  submittedCouncil: string
): Promise<VerificationResult> {
  const requestPayload = {
    hasCertificate: true,
    submittedName,
    submittedRegNumber,
    submittedCouncil,
  };

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract the following from this medical registration certificate:
              1. Doctor's full name
              2. Registration number
              3. Medical council name
              
              Return ONLY a JSON object with keys: name, registrationNumber, councilName
              If any field is not readable, use null.`,
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: certificateBase64,
                  },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const extracted = JSON.parse(jsonMatch[0]);

    // Compare extracted vs submitted
    const nameMatch = normalize(extracted.name) === normalize(submittedName);
    const regMatch = normalize(extracted.registrationNumber) === normalize(submittedRegNumber);
    const councilMatch = normalize(extracted.councilName) === normalize(submittedCouncil);

    const matchCount = [nameMatch, regMatch, councilMatch].filter(Boolean).length;
    const confidence = (matchCount / 3) * 0.85; // Max 0.85 for OCR

    return {
      method: 'ai_ocr',
      status: matchCount >= 2 ? 'success' : 'failed',
      confidence,
      requestPayload,
      responsePayload: {
        extracted,
        matches: { nameMatch, regMatch, councilMatch },
      },
    };
  } catch (error) {
    return {
      method: 'ai_ocr',
      status: 'error',
      confidence: 0,
      requestPayload,
      responsePayload: {},
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function normalize(str: string): string {
  return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
}
