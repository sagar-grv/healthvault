import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import EmotionRegistry from '@/components/EmotionRegistry';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import OfflineIndicator from '@/components/OfflineIndicator';
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
  const supported = ['en', 'hi', 'ta', 'te', 'mr', 'bn', 'gu', 'kn', 'ml', 'pa', 'or', 'as'];
  const resolvedLocale = supported.includes(locale) ? locale : 'en';
  const messages = (await import(`../../messages/${resolvedLocale}.json`)).default;
  return (
    <html
      lang={resolvedLocale}
      className={`${plusJakarta.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      {/* Anti-flash: apply saved theme before React hydrates to prevent white flash in dark mode */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('hv_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
        <EmotionRegistry>
          <ThemeProvider>
            <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          </ThemeProvider>
        </EmotionRegistry>
        <ServiceWorkerRegistration />
        <OfflineIndicator />
      </body>
    </html>
  );
}
