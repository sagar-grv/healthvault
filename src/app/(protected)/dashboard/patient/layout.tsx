import Box from '@mui/material/Box';
import PatientBottomNav from '@/components/patient/PatientBottomNav';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ pb: '72px', minHeight: '100vh' }}>
      {children}
      <PatientBottomNav />
    </Box>
  );
}
