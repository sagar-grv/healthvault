/**
 * Preferred language utilities
 *
 * Stores and retrieves user's preferred language for AI explanations.
 * Uses localStorage for instant access (no DB round-trip on load).
 * Also syncs to profiles.preferred_language for cross-device access.
 */

const STORAGE_KEY = 'hv_preferred_language';

export function getPreferredLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(STORAGE_KEY) || 'en';
}

export function setPreferredLanguage(lang: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, lang);
}
