import Box from '@mui/material/Box';
import PatientBottomNav from '@/components/patient/PatientBottomNav';
import PermissionsGate from '@/components/permissions/PermissionsGate';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsGate>
      <Box sx={{ pb: '72px', minHeight: '100vh' }}>
        {children}
        <PatientBottomNav />
      </Box>
    </PermissionsGate>
  );
}
