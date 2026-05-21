import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export function PatientDashboardSkeleton() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* AppBar skeleton */}
      <Box sx={{ height: 56, bgcolor: 'white', borderBottom: '1px solid #E5E7EB', px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="rounded" width={26} height={26} />
        <Skeleton variant="text" width={100} height={24} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="circular" width={32} height={32} />
      </Box>

      <Box sx={{ px: 2, py: 2.5, maxWidth: 600, mx: 'auto' }}>
        {/* Health ID Card skeleton */}
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width={80} height={16} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={160} height={32} sx={{ mb: 1.5 }} />
            <Skeleton variant="rounded" width={120} height={36} />
          </CardContent>
        </Card>

        {/* Report cards skeleton */}
        {[1, 2, 3].map(i => (
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

export function DoctorDashboardSkeleton() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* AppBar skeleton */}
      <Box sx={{ height: 56, bgcolor: 'white', borderBottom: '1px solid #E5E7EB', px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="rounded" width={26} height={26} />
        <Skeleton variant="text" width={100} height={24} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="rounded" width={56} height={26} sx={{ borderRadius: 13 }} />
        <Skeleton variant="circular" width={28} height={28} />
      </Box>

      <Box sx={{ px: 2, py: 2.5, maxWidth: 640, mx: 'auto' }}>
        {/* Welcome header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box>
            <Skeleton variant="text" width={140} height={28} />
            <Skeleton variant="text" width={100} height={14} />
          </Box>
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          {[1, 2, 3].map(i => (
            <Card key={i} sx={{ flex: 1, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Skeleton variant="text" width={30} height={36} sx={{ mx: 'auto' }} />
                <Skeleton variant="text" width={50} height={12} sx={{ mx: 'auto' }} />
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Search card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width={180} height={28} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={260} height={16} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" width="100%" height={48} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" width="100%" height={44} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export function PatientViewSkeleton() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* AppBar */}
      <Box sx={{ height: 56, bgcolor: 'white', borderBottom: '1px solid #E5E7EB', px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width={160} height={24} />
      </Box>

      <Box sx={{ px: 2, py: 3, maxWidth: 600, mx: 'auto' }}>
        {/* Patient info card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width={140} height={24} />
              <Skeleton variant="text" width={100} height={16} />
            </Box>
          </CardContent>
        </Card>

        {/* Report cards */}
        {[1, 2, 3].map(i => (
          <Card key={i} sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Skeleton variant="rounded" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="35%" height={16} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export function AccessLogSkeleton() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* AppBar */}
      <Box sx={{ height: 56, bgcolor: 'white', borderBottom: '1px solid #E5E7EB', px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="circular" width={32} height={32} />
        <Box>
          <Skeleton variant="text" width={90} height={22} />
          <Skeleton variant="text" width={140} height={12} />
        </Box>
      </Box>

      <Box sx={{ px: 2, py: 3, maxWidth: 600, mx: 'auto' }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Card sx={{ flex: 1, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Skeleton variant="text" width={30} height={40} sx={{ mx: 'auto' }} />
              <Skeleton variant="text" width={60} height={12} sx={{ mx: 'auto' }} />
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Skeleton variant="text" width={30} height={40} sx={{ mx: 'auto' }} />
              <Skeleton variant="text" width={70} height={12} sx={{ mx: 'auto' }} />
            </CardContent>
          </Card>
        </Box>

        {/* Timeline items */}
        {[1, 2, 3].map(i => (
          <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
            <Skeleton variant="circular" width={38} height={38} sx={{ flexShrink: 0 }} />
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: 2 }}>
                <Skeleton variant="text" width="50%" height={20} />
                <Skeleton variant="text" width="35%" height={14} sx={{ mt: 0.5 }} />
                <Skeleton variant="text" width="25%" height={12} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
