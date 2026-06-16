import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function ReportsLoading() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar skeleton */}
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
        {/* Search bar skeleton */}
        <Skeleton variant="rounded" width="100%" height={48} sx={{ mb: 2, borderRadius: 2 }} />

        {/* Report cards skeleton */}
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Skeleton variant="rounded" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" height={20} />
                <Skeleton variant="text" width="40%" height={16} />
              </Box>
              <Skeleton variant="circular" width={32} height={20} sx={{ borderRadius: 10 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
