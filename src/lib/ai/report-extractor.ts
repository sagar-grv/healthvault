/**
 * Report Data Extraction via Gemini AI
 *
 * Takes an image blob of a medical report and extracts:
 * - Report title/name
 * - Date
 * - Doctor name
 * - Lab/hospital name
 * - Category (blood test, x-ray, prescription, etc.)
 * - Key test values with normal ranges
 *
 * Used after camera capture — user sees extracted info with zero manual input.
 */

export interface ExtractedReportData {
  /** Auto-generated report title */
  title: string;
  /** Report date (YYYY-MM-DD format) */
  reportDate: string | null;
  /** Doctor name if found */
  doctorName: string | null;
  /** Lab or hospital name if found */
  facilityName: string | null;
  /** Report category */
  reportType:
    | 'prescription'
    | 'lab_report'
    | 'scan'
    | 'discharge_summary'
    | 'vaccination'
    | 'other';
  /** Key findings/values extracted */
  keyValues: Array<{
    name: string;
    value: string;
    unit: string | null;
    normalRange: string | null;
    isAbnormal: boolean;
  }>;
  /** Brief one-line summary */
  summary: string;
  /** Raw text extracted (for search) */
  rawText: string;
  /** Confidence score 0-1 */
  confidence: number;
}

/**
 * Extract structured data from a report image using Gemini
 *
 * @param imageBlob - The image blob to analyze
 * @returns Extracted report data or null if extraction fails
 */
export async function extractReportData(imageBlob: Blob): Promise<ExtractedReportData | null> {
  try {
    // Convert blob to base64
    const buffer = await imageBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    // Call our API route (which handles Gemini securely server-side)
    const response = await fetch('/api/extract-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        mimeType: imageBlob.type || 'image/jpeg',
      }),
    });

    if (!response.ok) {
      console.error('Extraction API failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data as ExtractedReportData;
  } catch (error) {
    console.error('Report extraction failed:', error);
    return null;
  }
}
