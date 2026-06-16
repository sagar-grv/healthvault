'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cancelPendingDeletion } from '@/app/(protected)/actions';

const ACCOUNT_DELETED_PATH = '/account-deleted';

export default function DeletionAutoCancel() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith(ACCOUNT_DELETED_PATH)) return;
    cancelPendingDeletion();
  }, [pathname]);

  return null;
}
