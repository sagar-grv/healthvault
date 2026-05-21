import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import EmotionRegistry from "@/components/EmotionRegistry";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "HealthVault - Secure Digital Health Records",
  description:
    "Share your medical records securely with doctors. Paperless, simple, and accessible on any device.",
  keywords: ["health records", "medical records", "digital health", "ABDM", "patient records"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
      <body className="min-h-screen bg-[#F9FAFB] antialiased">
        <EmotionRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
