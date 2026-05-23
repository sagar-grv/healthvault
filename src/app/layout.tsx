import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import EmotionRegistry from '@/components/EmotionRegistry';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'HealthVault - Secure Digital Health Records',
  description:
    'Share your medical records securely with doctors. Paperless, simple, and accessible on any device.',
  keywords: ['health records', 'medical records', 'digital health', 'ABDM', 'patient records'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HealthVault',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563EB',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('hv_locale')?.value || 'en';
  const supported = ['en', 'hi'];
  const resolvedLocale = supported.includes(locale) ? locale : 'en';
  const messages = (await import(`../../messages/${resolvedLocale}.json`)).default;
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#F9FAFB] antialiased">
        <EmotionRegistry>
          <ThemeProvider>
            <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          </ThemeProvider>
        </EmotionRegistry>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
