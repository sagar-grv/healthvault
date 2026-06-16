'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { CURRENT_TERMS_VERSION, CONSENT_TYPES } from '@/constants';

export async function acceptTerms() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Capture IP and User-Agent for HIPAA audit trail
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip') || null;
  const userAgent = hdrs.get('user-agent') || null;

  const { error: consentError } = await supabase.from('consent_logs').insert({
    user_id: user.id,
    consent_type: CONSENT_TYPES.TERMS_OF_SERVICE,
    consent_version: CURRENT_TERMS_VERSION,
    ip_address: ip,
    user_agent: userAgent,
  });
  if (consentError) throw consentError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      terms_accepted_at: new Date().toISOString(),
      consent_version: CURRENT_TERMS_VERSION,
    })
    .eq('id', user.id);
  if (profileError) throw profileError;

  return { success: true };
}

export async function checkConsentStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hasAccepted: false };

  const { data } = await supabase
    .from('profiles')
    .select('terms_accepted_at')
    .eq('id', user.id)
    .single();

  return { hasAccepted: !!data?.terms_accepted_at };
}
