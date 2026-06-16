import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  // Only allow accessing certificates bucket files
  if (!path.startsWith('certificates/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // Require admin role
  const { user, error: adminError } = await requireAdmin();
  if (adminError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.storage.from('certificates').createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
