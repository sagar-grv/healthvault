/**
 * Language preference utilities
 *
 * TWO separate language settings:
 *
 * 1. UI Locale (hv_locale cookie + profiles.preferred_language)
 *    - Controls the full app UI language (dashboard labels, buttons, etc.)
 *    - Changed via the [EN|HI] chip in the AppBar
 *    - Uses: setPreferredLanguage(), getPreferredLanguage(), syncLanguageFromProfile()
 *
 * 2. AI Explanation Language (hv_ai_language localStorage)
 *    - Controls only the language used in HealthInterpreter AI explanations
 *    - Changed inside the HealthInterpreter dialog
 *    - Does NOT affect app UI language
 *    - Uses: setAiLanguage(), getAiLanguage()
 */

import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'hv_preferred_language';
const LOCALE_COOKIE = 'hv_locale';
const AI_LANGUAGE_KEY = 'hv_ai_language';

// ─── UI Locale ────────────────────────────────────────────────────────────────

/**
 * Get UI locale — reads from localStorage first (instant).
 * Falls back to 'en' if nothing stored.
 */
export function getPreferredLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(STORAGE_KEY) || 'en';
}

/**
 * Set UI locale — saves to localStorage, cookie, and DB.
 * Cookie is read by next-intl on every server request.
 * Call router.refresh() after this to re-render translated strings.
 *
 * localStorage + cookie: synchronous, immediate
 * DB sync: fire-and-forget, never blocks UI
 */
export async function setPreferredLanguage(lang: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Save to localStorage
  localStorage.setItem(STORAGE_KEY, lang);

  // 2. Set locale cookie — next-intl server reads this on next request
  document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;

  // 3. Sync to DB — background, non-blocking
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ preferred_language: lang }).eq('id', user.id);
    }
  } catch {
    // Silently ignore — offline or session expired
  }
}

/**
 * Sync UI locale from DB profile on app mount (cross-device sync).
 * Call once in PatientDashboardClient with profile.preferred_language.
 */
export function syncLanguageFromProfile(profileLanguage: string | null | undefined): void {
  if (!profileLanguage || typeof window === 'undefined') return;

  const current = localStorage.getItem(STORAGE_KEY);
  if (current !== profileLanguage) {
    localStorage.setItem(STORAGE_KEY, profileLanguage);
    document.cookie = `${LOCALE_COOKIE}=${profileLanguage}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

// ─── AI Explanation Language ──────────────────────────────────────────────────

/**
 * Get AI explanation language.
 * Falls back to UI locale, then 'en'.
 * This is SEPARATE from the app UI language.
 */
export function getAiLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(AI_LANGUAGE_KEY) || localStorage.getItem(STORAGE_KEY) || 'en';
}

/**
 * Set AI explanation language — localStorage ONLY.
 * Does NOT write hv_locale cookie.
 * Does NOT affect app UI language.
 * Optionally syncs to profiles.preferred_language in DB (background).
 */
export function setAiLanguage(lang: string): void {
  if (typeof window === 'undefined') return;

  // Only localStorage — no cookie, no page re-render
  localStorage.setItem(AI_LANGUAGE_KEY, lang);

  // Optional: background DB sync (non-blocking, best-effort)
  try {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .update({ preferred_language: lang })
            .eq('id', user.id)
            .then(() => {});
        }
      });
    });
  } catch {
    // Silently ignore
  }
}
