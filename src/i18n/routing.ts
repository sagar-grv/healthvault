export const routing = {
  locales: ['en', 'hi'],
  defaultLocale: 'en',
} as const;

export type Locale = (typeof routing.locales)[number];
