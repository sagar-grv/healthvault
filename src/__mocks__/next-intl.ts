/**
 * Mock for next-intl in Jest (CommonJS environment)
 * next-intl uses ESM which Jest can't process directly.
 * This mock provides the minimum needed for tests.
 */
import React from 'react';

// useTranslations returns a function that returns the key (for easy assertion)
export const useTranslations = (namespace: string) => (key: string) => `${namespace}.${key}`;

// NextIntlClientProvider is a passthrough wrapper
export const NextIntlClientProvider = ({
  children,
}: {
  children: React.ReactNode;
  messages?: Record<string, unknown>;
  locale?: string;
}) => {
  return React.createElement(React.Fragment, null, children);
};

export const useLocale = () => 'en';
export const useMessages = () => ({});
export const useNow = () => new Date();
export const useTimeZone = () => 'UTC';
export const useFormatter = () => ({
  dateTime: (v: Date) => v.toISOString(),
  number: (v: number) => v.toString(),
  list: (v: string[]) => v.join(', '),
});

const nextIntlMock = { useTranslations, NextIntlClientProvider };
export default nextIntlMock;
