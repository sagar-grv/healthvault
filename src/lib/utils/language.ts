/**
 * Language preference utilities
 *
 * Stores user's preferred language for AI explanations and UI.
 *
 * Three-layer persistence:
 * 1. localStorage — instant access on same device (no round-trip)
 * 2. Cookie (hv_locale) — read by next-intl server on every request
 * 3. Supabase profiles.preferred_language — cross-device sync (background)
 */

import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'hv_preferred_language';
const LOCALE_COOKIE = 'hv_locale';

/**
 * Get preferred language — reads from localStorage first (instant).
 * Falls back to 'en' if nothing stored.
 */
export function getPreferredLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(STORAGE_KEY) || 'en';
}

/**
 * Set preferred language — saves to localStorage, cookie, and DB.
 *
 * localStorage + cookie: synchronous, immediate effect
 * DB sync: fire-and-forget, never blocks the UI
 */
export async function setPreferredLanguage(lang: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Save to localStorage — instant reads on same device
  localStorage.setItem(STORAGE_KEY, lang);

  // 2. Set locale cookie — next-intl server reads this on next request
  //    1-year expiry, SameSite=Lax, no Secure flag (works on localhost too)
  document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;

  // 3. Sync to DB — background, non-blocking
  //    If this fails (offline, session expired) it's fine — localStorage is source of truth
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ preferred_language: lang }).eq('id', user.id);
    }
  } catch {
    // Silently ignore — offline or session expired, localStorage handles it
  }
}

/**
 * Sync language from DB to localStorage on app mount.
 * Call once in PatientDashboardClient on mount with profile.preferred_language.
 *
 * This ensures cross-device sync: if user set Hindi on phone,
 * opening on desktop will pick it up after one render.
 */
export function syncLanguageFromProfile(profileLanguage: string | null | undefined): void {
  if (!profileLanguage || typeof window === 'undefined') return;

  const current = localStorage.getItem(STORAGE_KEY);
  if (current !== profileLanguage) {
    localStorage.setItem(STORAGE_KEY, profileLanguage);
    // Also update cookie so next-intl server picks it up
    document.cookie = `${LOCALE_COOKIE}=${profileLanguage}; path=/; max-age=31536000; SameSite=Lax`;
  }
}
