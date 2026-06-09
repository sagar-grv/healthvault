import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.error('[CSP-REPORT]', JSON.stringify(body, null, 2));
  } catch {
    // Ignore parse errors
  }
  return new Response(null, { status: 204 });
}
