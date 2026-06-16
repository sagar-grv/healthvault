import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function DoctorPatientsLoading() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          height: 56,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Skeleton variant="rounded" width={26} height={26} />
        <Skeleton variant="text" width={100} height={24} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="circular" width={32} height={32} />
      </Box>

      <Box sx={{ px: 2, py: 2.5, maxWidth: 600, mx: 'auto' }}>
        <Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
        {[1, 2, 3].map((i) => (
          <Card key={i} sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={16} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
