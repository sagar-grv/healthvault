import DoctorBottomNav from '@/components/doctor/DoctorBottomNav';
import Box from '@mui/material/Box';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Box sx={{ pb: '72px' }}>{children}</Box>
      <DoctorBottomNav />
    </>
  );
}
