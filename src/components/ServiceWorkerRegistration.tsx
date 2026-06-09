'use client';

import { useEffect } from 'react';
import { startQueueProcessor } from '@/lib/offline/queue';

/**
 * Registers the service worker for PWA functionality.
 * Also starts the offline upload queue processor.
 *
 * Features:
 * - Registers SW on mount (production only)
 * - Handles updates gracefully
 * - Starts background sync processor for offline uploads
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

          // Listen for sync messages from SW
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SYNC_TRIGGER') {
              // Queue processor will handle it
            }
          });
        })
        .catch((err) => {
          console.error('SW registration failed:', err);
        });

      // Start the offline upload queue processor
      const cleanup = startQueueProcessor();
      return cleanup;
    }
  }, []);

  return null;
}
