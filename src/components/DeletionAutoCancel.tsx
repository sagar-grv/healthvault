'use client';

import { useEffect } from 'react';
import { cancelPendingDeletion } from '@/app/(protected)/actions';

export default function DeletionAutoCancel() {
  useEffect(() => {
    cancelPendingDeletion();
  }, []);

  return null;
}
