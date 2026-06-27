'use client';

import PermissionsOnboarding from '@/components/permissions/PermissionsOnboarding';
import { useRouter } from 'next/navigation';

export default function PermissionsPage() {
  const router = useRouter();

  return (
    <PermissionsOnboarding
      onComplete={() => router.push('/dashboard')}
      onSkip={() => router.push('/dashboard')}
    />
  );
}
