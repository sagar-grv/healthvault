'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for PWA functionality.
 * Place this component in the root layout.
 *
 * Features:
 * - Registers SW on mount (production only)
 * - Handles updates gracefully
 * - No visible UI — runs silently
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates every hour
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000
          );
        })
        .catch((err) => {
          console.error('SW registration failed:', err);
        });
    }
  }, []);

  return null;
}
