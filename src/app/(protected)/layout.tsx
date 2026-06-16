import DeletionAutoCancel from '@/components/DeletionAutoCancel';
import ExitConfirmation from '@/components/ExitConfirmation';
import SessionManager from '@/components/SessionManager';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DeletionAutoCancel />
      <ExitConfirmation />
      <SessionManager />
      {children}
    </>
  );
}
