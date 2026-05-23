/**
 * Mock for next-intl/server in Jest (CommonJS environment)
 */
export const getRequestConfig = (fn: unknown) => fn;
export const getTranslations = async () => (key: string) => key;
export const getLocale = async () => 'en';
export const getMessages = async () => ({});
export const getNow = async () => new Date();
export const getTimeZone = async () => 'UTC';
export const getFormatter = async () => ({});
