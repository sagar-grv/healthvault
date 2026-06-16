import ExitConfirmation from '@/components/ExitConfirmation';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ExitConfirmation />
      {children}
    </>
  );
}
