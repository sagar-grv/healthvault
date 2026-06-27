'use client';

import { useState } from 'react';
import PermissionsOnboarding from './PermissionsOnboarding';

const STORAGE_KEY = 'hv_permissions';

function isOnboarded(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.onboarded === true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function getInitialState(): boolean | null {
  if (typeof window === 'undefined') return null; // SSR — defer to client
  return !isOnboarded();
}

export default function PermissionsGate({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(getInitialState);

  if (showOnboarding === null) return <>{children}</>;

  if (showOnboarding) {
    return <PermissionsOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return <>{children}</>;
}
