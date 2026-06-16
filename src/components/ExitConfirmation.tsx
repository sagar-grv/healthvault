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
  const readyRef = useRef(false);

  useEffect(() => {
    isEnabled.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      readyRef.current = true;
    }, 3000);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isEnabled.current || !readyRef.current) return;
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [message]);

  return null;
}
