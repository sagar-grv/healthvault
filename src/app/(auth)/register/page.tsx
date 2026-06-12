'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import MedicalServicesIcon from '@mui/icons-material/MedicalServicesOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import Chip from '@mui/material/Chip';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5, justifyContent: 'center' }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            <FavoriteIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
            HealthVault
          </Typography>
        </Box>

        <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 700 }}>
          Join HealthVault
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
          Choose how you&apos;ll use the platform
        </Typography>

        {/* Role Selection Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Patient */}
          <Card
            sx={{
              background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              border: '1px solid #BFDBFE',
            }}
          >
            <CardActionArea onClick={() => router.push('/register/patient')} sx={{ p: 0 }}>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(37,99,235,0.3)',
                  }}
                >
                  <PersonIcon sx={{ fontSize: 26, color: 'white' }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h5">I&apos;m a Patient</Typography>
                    <Chip
                      label="Most common"
                      size="small"
                      sx={{
                        bgcolor: '#DBEAFE',
                        color: '#1D4ED8',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Upload and share your medical records securely
                  </Typography>
                </Box>
                <ArrowForwardIcon sx={{ color: 'primary.main', flexShrink: 0 }} />
              </CardContent>
            </CardActionArea>
          </Card>

          {/* Doctor */}
          <Card
            sx={{
              background: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)',
              border: '1px solid #A7F3D0',
            }}
          >
            <CardActionArea onClick={() => router.push('/register/doctor')} sx={{ p: 0 }}>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #047857, #10B981)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(5,150,105,0.3)',
                  }}
                >
                  <MedicalServicesIcon sx={{ fontSize: 26, color: 'white' }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ mb: 0.5 }}>
                    I&apos;m a Doctor
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access your patients&apos; complete medical history digitally
                  </Typography>
                </Box>
                <ArrowForwardIcon sx={{ color: 'secondary.main', flexShrink: 0 }} />
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>

        {/* Note */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', lineHeight: 1.6 }}
          >
            HealthVault doesn&apos;t replace your clinic software — it gives doctors access to
            records from other clinics.
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            style={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
