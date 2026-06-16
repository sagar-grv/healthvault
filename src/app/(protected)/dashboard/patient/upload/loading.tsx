import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function UploadLoading() {
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
        <Skeleton variant="text" width={120} height={24} />
      </Box>

      <Box sx={{ px: 2, py: 2.5, maxWidth: 600, mx: 'auto' }}>
        {/* Upload form skeleton */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width={140} height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" width="100%" height={120} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton
              variant="rounded"
              width="100%"
              height={48}
              sx={{ mb: 1.5, borderRadius: 2 }}
            />
            <Skeleton variant="rounded" width="100%" height={48} sx={{ borderRadius: 2 }} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
