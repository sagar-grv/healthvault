import DoctorBottomNav from '@/components/doctor/DoctorBottomNav';
import Box from '@mui/material/Box';
import PermissionsGate from '@/components/permissions/PermissionsGate';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsGate>
      <Box sx={{ pb: '72px' }}>{children}</Box>
      <DoctorBottomNav />
    </PermissionsGate>
  );
}
