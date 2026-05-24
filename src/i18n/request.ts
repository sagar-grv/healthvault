import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('hv_locale')?.value || 'en';
  const supported = ['en', 'hi', 'ta', 'te', 'mr', 'bn', 'gu', 'kn', 'ml', 'pa', 'or', 'as'];
  const resolvedLocale = supported.includes(locale) ? locale : 'en';

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  };
});
