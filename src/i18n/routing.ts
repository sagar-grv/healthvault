export const routing = {
  locales: ['en', 'hi', 'ta', 'te', 'mr', 'bn', 'gu', 'kn', 'ml', 'pa', 'or', 'as'],
  defaultLocale: 'en',
} as const;

export type Locale = (typeof routing.locales)[number];
