'use client';

import { useEffect, useRef } from 'react';

interface ExitConfirmationProps {
  enabled?: boolean;
  message?: string;
}

export default function ExitConfirmation({
  enabled = true,
  message = 'Are you sure you want to leave HealthVault? Your unsaved changes may be lost.',
}: ExitConfirmationProps) {
  const isEnabled = useRef(enabled);

  useEffect(() => {
    isEnabled.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isEnabled.current) return;
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [message]);

  return null;
}
