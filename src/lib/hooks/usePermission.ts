'use client';

import { useState, useCallback } from 'react';

export type PermissionResult = 'granted' | 'denied' | 'unavailable' | 'prompt';
export type PermissionType = 'camera' | 'notifications' | 'geolocation';

interface StoredPermissions {
  onboarded: boolean;
  camera: PermissionResult;
  notifications: PermissionResult;
  geolocation: PermissionResult;
}

const STORAGE_KEY = 'hv_permissions';

function getStored(): StoredPermissions {
  if (typeof window === 'undefined')
    return { onboarded: false, camera: 'prompt', notifications: 'prompt', geolocation: 'prompt' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { onboarded: false, camera: 'prompt', notifications: 'prompt', geolocation: 'prompt' };
}

function setStored(p: Partial<StoredPermissions>) {
  try {
    const current = getStored();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...p }));
  } catch {
    /* quota exceeded */
  }
}

export type Browser =
  | 'ios_safari'
  | 'chrome_android'
  | 'chrome_desktop'
  | 'firefox'
  | 'safari'
  | 'edge'
  | 'unknown';

export function detectBrowser(): Browser {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios_safari';
  if (/android/i.test(ua) && /chrome/i.test(ua)) return 'chrome_android';
  if (/firefox/i.test(ua)) return 'firefox';
  if (/edg/i.test(ua)) return 'edge';
  if (/chrome/i.test(ua)) return 'chrome_desktop';
  if (/safari/i.test(ua)) return 'safari';
  return 'unknown';
}

export function getBrowserSettingsInstructions(type: PermissionType): {
  steps: string[];
  settingsUrl?: string;
} {
  const browser = detectBrowser();

  if (type === 'camera') {
    switch (browser) {
      case 'ios_safari':
        return {
          steps: [
            'Open the **Settings** app on your iPhone/iPad',
            'Scroll down and tap **Safari**',
            'Under **Settings for Websites**, tap **Camera**',
            'Select **Allow** (or **Ask**)',
            'Return to HealthVault — the page will reload automatically',
          ],
          settingsUrl: 'App-Prefs:Safari',
        };
      case 'chrome_android':
        return {
          steps: [
            'Open **Chrome** and tap the ⋮ menu (three dots)',
            'Go to **Settings** > **Site settings** > **Camera**',
            'Make sure Camera is **Allowed** (not blocked)',
            'Return to HealthVault and tap Retry',
          ],
          settingsUrl: 'chrome://settings/content/camera',
        };
      case 'chrome_desktop':
        return {
          steps: [
            'Click the 🔒 icon (lock) next to the URL bar',
            'Find **Camera** in the list and change it to **Allow**',
            'Reload the page and tap Retry',
          ],
          settingsUrl: 'chrome://settings/content/camera',
        };
      case 'firefox':
        return {
          steps: [
            'Click the 🔒 icon next to the URL bar',
            'Find **Camera** and change to **Allow**',
            'Reload the page and tap Retry',
          ],
        };
      case 'edge':
        return {
          steps: [
            'Click the 🔒 icon next to the URL bar',
            'Find **Camera** and change to **Allow**',
            'Reload the page and tap Retry',
          ],
          settingsUrl: 'edge://settings/content/camera',
        };
      default:
        return {
          steps: [
            'Open your browser settings and find the **Camera** permission section',
            'Allow camera access for this site',
            'Reload the page and tap Retry',
          ],
        };
    }
  }

  if (type === 'geolocation') {
    switch (browser) {
      case 'ios_safari':
        return {
          steps: [
            'Open the **Settings** app on your iPhone/iPad',
            'Scroll down and tap **Safari**',
            'Under **Settings for Websites**, tap **Location**',
            'Select **Allow** (or **Ask**)',
            'Return to HealthVault and tap Retry',
          ],
          settingsUrl: 'App-Prefs:Safari',
        };
      case 'chrome_android':
        return {
          steps: [
            'Open **Chrome** and tap the ⋮ menu',
            'Go to **Settings** > **Site settings** > **Location**',
            'Make sure Location is **Allowed**',
            'Return to HealthVault and tap Retry',
          ],
          settingsUrl: 'chrome://settings/content/location',
        };
      case 'chrome_desktop':
        return {
          steps: [
            'Click the 🔒 icon next to the URL bar',
            'Find **Location** and change to **Allow**',
            'Reload the page and tap Retry',
          ],
          settingsUrl: 'chrome://settings/content/location',
        };
      default:
        return {
          steps: [
            'Open your browser settings and find the **Location** permission section',
            'Allow location access for this site',
            'Reload the page and tap Retry',
          ],
        };
    }
  }

  if (type === 'notifications') {
    return {
      steps: [
        'Notifications are available on Android Chrome and desktop browsers',
        'On iOS, notifications are not supported by Safari',
        'On Android Chrome, tap Allow when the browser prompts you',
      ],
    };
  }

  return { steps: [] };
}

export function usePermission() {
  const [stored, setStoredState] = useState<StoredPermissions>(getStored);

  const persist = useCallback((patch: Partial<StoredPermissions>) => {
    setStored(patch);
    setStoredState((prev) => ({ ...prev, ...patch }));
  }, []);

  const requestCamera = useCallback(async (): Promise<PermissionResult> => {
    // iOS Safari: getUserMedia Promise MUST be created synchronously within
    // gesture context. Any await before getUserMedia destroys the gesture
    // context and causes NotAllowedError even when permission is granted.
    // permissions.query is checked non-blocking via .then(), never await.
    try {
      navigator.permissions.query({ name: 'camera' as PermissionName }).then((perm) => {
        if (perm.state === 'denied') {
          persist({ camera: 'denied' });
        }
      });
    } catch {
      /* permissions query not supported */
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((t) => t.stop());
      persist({ camera: 'granted' });
      return 'granted';
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'NotAllowedError' || e.name === 'NotReadableError') {
        persist({ camera: 'denied' });
        return 'denied';
      }
      if (e.name === 'NotFoundError') {
        persist({ camera: 'unavailable' });
        return 'unavailable';
      }
      persist({ camera: 'denied' });
      return 'denied';
    }
  }, [persist]);

  const requestNotifications = useCallback(async (): Promise<PermissionResult> => {
    if (!('Notification' in window)) {
      persist({ notifications: 'unavailable' });
      return 'unavailable';
    }
    const browser = detectBrowser();
    if (browser === 'ios_safari' || browser === 'safari') {
      persist({ notifications: 'unavailable' });
      return 'unavailable';
    }
    try {
      const result = await Notification.requestPermission();
      const mapped: PermissionResult = result === 'granted' ? 'granted' : 'denied';
      persist({ notifications: mapped });
      return mapped;
    } catch {
      persist({ notifications: 'denied' });
      return 'denied';
    }
  }, [persist]);

  const requestGeolocation = useCallback(async (): Promise<PermissionResult> => {
    // Use .then() pattern for consistency; getUserMedia/CurrentPosition is the
    // critical call that must be created inside gesture context on iOS.
    try {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((perm) => {
        if (perm.state === 'denied') {
          persist({ geolocation: 'denied' });
        }
      });
    } catch {
      /* permissions query not supported */
    }

    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 0 });
      });
      persist({ geolocation: 'granted' });
      return 'granted';
    } catch (err) {
      const e = err as { code?: number };
      if (e.code === 1) {
        persist({ geolocation: 'denied' });
        return 'denied';
      }
      persist({ geolocation: 'unavailable' });
      return 'unavailable';
    }
  }, [persist]);

  const markOnboarded = useCallback(() => {
    persist({ onboarded: true });
  }, [persist]);

  const isOnboarded = stored.onboarded;

  return {
    stored,
    isOnboarded,
    requestCamera,
    requestNotifications,
    requestGeolocation,
    markOnboarded,
  };
}
