import PatientBottomNav from '@/components/patient/PatientBottomNav';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PatientBottomNav />
    </>
  );
}
