'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import DevicesIcon from '@mui/icons-material/DevicesOutlined';
import SpeedIcon from '@mui/icons-material/SpeedOutlined';
import ShieldIcon from '@mui/icons-material/ShieldOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const features = [
  {
    icon: <LockIcon />,
    title: 'Private by Default',
    desc: 'Every report is private until you choose to share it. Your data, your rules.',
    color: '#EFF6FF',
    iconColor: 'primary.main',
  },
  {
    icon: <VisibilityIcon />,
    title: 'Full Audit Trail',
    desc: 'See exactly who viewed your records and when. Complete transparency.',
    color: '#F0FDF4',
    iconColor: 'secondary.main',
  },
  {
    icon: <DevicesIcon />,
    title: 'Any Device',
    desc: 'Works on your ₹8,000 phone or a clinic desktop. Even on slow internet.',
    color: 'background.default',
    iconColor: 'text.secondary',
  },
  {
    icon: <SpeedIcon />,
    title: '2-Tap Sharing',
    desc: 'Show your Health ID QR code. Doctor searches. Done in 10 seconds.',
    color: '#FFF7ED',
    iconColor: '#C2410C',
  },
];

const steps = [
  {
    number: '01',
    icon: <CloudUploadIcon sx={{ fontSize: 28 }} />,
    title: 'Upload Reports',
    desc: 'Take a photo or upload PDFs of your prescriptions, lab results, and scans.',
    color: '#EFF6FF',
    borderColor: '#BFDBFE',
    iconBg: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
  },
  {
    number: '02',
    icon: <BadgeIcon sx={{ fontSize: 28 }} />,
    title: 'Share Your ID',
    desc: 'Get a unique Health ID. Show it to your doctor — verbally, as QR, or via WhatsApp.',
    color: '#F0FDF4',
    borderColor: '#A7F3D0',
    iconBg: 'linear-gradient(135deg, #047857, #10B981)',
  },
  {
    number: '03',
    icon: <VisibilityIcon sx={{ fontSize: 28 }} />,
    title: 'Doctor Sees History',
    desc: 'Your doctor instantly accesses your shared records digitally. No paper needed.',
    color: '#EFF6FF',
    borderColor: '#BFDBFE',
    iconBg: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
  },
];

export default function HomePage() {
  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* Navigation */}
      <Box
        component="nav"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1.5,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FavoriteIcon sx={{ color: 'white', fontSize: 18 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                HealthVault
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={Link}
                href="/login"
                variant="text"
                size="small"
                sx={{ color: 'text.secondary', '&:hover': { transform: 'none' } }}
              >
                Sign in
              </Button>
              <Button
                component={Link}
                href="/register"
                variant="contained"
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero */}
      <Box
        className="gradient-mesh-blue"
        sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 }, px: 2 }}
      >
        <Container maxWidth="md" sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Chip
            icon={<ShieldIcon sx={{ fontSize: '14px !important' }} />}
            label="ABDM-ready · Private by default"
            sx={{
              mb: 3,
              bgcolor: '#DBEAFE',
              color: 'primary.dark',
              fontWeight: 600,
              border: '1px solid #BFDBFE',
            }}
          />

          <Typography
            variant="h1"
            sx={{
              mb: 3,
              fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' },
              lineHeight: 1.1,
            }}
          >
            Your medical records.{' '}
            <Box component="span" className="text-gradient-blue">
              Secure. Paperless.
            </Box>{' '}
            Always with you.
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              mb: 5,
              fontWeight: 400,
              maxWidth: 560,
              mx: { xs: 'auto', md: 0 },
              lineHeight: 1.7,
            }}
          >
            Stop carrying physical reports to every doctor. HealthVault gives you a digital Health
            ID that any doctor can look up — with your permission.
          </Typography>

          {/* Single primary CTA — patient path. Doctor link is secondary. */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', md: 'flex-start' },
              gap: 2,
              mb: 6,
            }}
          >
            <Button
              component={Link}
              href="/register/patient"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                px: 5,
                py: 1.875,
                fontSize: '1.0625rem',
                boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
                minWidth: 260,
              }}
            >
              Create your free Health ID
            </Button>
            <Typography variant="body2" color="text.secondary">
              Are you a doctor?{' '}
              <Link
                href="/register/doctor"
                style={{
                  color: 'var(--mui-palette-secondary-main)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Register here
              </Link>
            </Typography>
          </Box>

          {/* Social proof pills */}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Free to use', 'No app download needed', 'ABHA-ready', 'Works on any phone'].map(
              (f) => (
                <Box
                  key={f}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: 'rgba(255,255,255,0.7)',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 99,
                    px: 1.5,
                    py: 0.5,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {f}
                  </Typography>
                </Box>
              )
            )}
          </Box>
        </Container>
      </Box>

      {/* How It Works */}
      <Box sx={{ py: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Chip
              label="How it works"
              size="small"
              sx={{ mb: 2, bgcolor: '#F3F4F6', color: 'text.secondary', fontWeight: 600 }}
            />
            <Typography variant="h2" sx={{ mb: 1.5 }}>
              Simple as 1-2-3
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto' }}>
              From signup to sharing with a doctor in under 3 minutes.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {steps.map((step) => (
              <Card
                key={step.number}
                sx={{
                  bgcolor: step.color,
                  border: `1px solid ${step.borderColor}`,
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3.5,
                      flexShrink: 0,
                      background: step.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: 'grey.400', letterSpacing: '0.08em' }}
                      >
                        {step.number}
                      </Typography>
                      <Typography variant="h5">{step.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {step.desc}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* For Doctors */}
      <Box
        sx={{
          bgcolor: 'background.default',
          py: { xs: 8, md: 12 },
          px: 2,
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <Grid container spacing={5} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip
                label="For doctors"
                size="small"
                sx={{ mb: 2, bgcolor: '#D1FAE5', color: 'secondary.dark', fontWeight: 600 }}
              />
              <Typography variant="h2" sx={{ mb: 2 }}>
                Not another clinic system.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                HealthVault doesn&apos;t replace your clinic software. It gives you a window into
                records from other clinics — prescriptions, tests, and scans you&apos;ve never had
                access to before.
              </Typography>
              {[
                'Keep using your existing system',
                'One search to see all history',
                'Every access is logged',
                'ABDM-compliant design',
              ].map((f) => (
                <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {f}
                  </Typography>
                </Box>
              ))}
              <Button
                component={Link}
                href="/register/doctor"
                variant="contained"
                color="secondary"
                size="large"
                sx={{ mt: 3, px: 3 }}
                endIcon={<ArrowForwardIcon />}
              >
                Register as Doctor
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)',
                  border: '1px solid #A7F3D0',
                  boxShadow: 'none',
                  p: 1,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: 'secondary.dark', mb: 1.5 }}
                  >
                    Doctor&apos;s view
                  </Typography>
                  <Box sx={{ bgcolor: 'white', borderRadius: 2.5, p: 2, mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Patient Health ID
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: 'secondary.main',
                        letterSpacing: '0.08em',
                      }}
                    >
                      HV-4K9M-2R7P
                    </Typography>
                  </Box>
                  {[
                    'Blood Test — 3 days ago',
                    'X-Ray Report — 2 weeks ago',
                    'Prescription — 1 month ago',
                  ].map((r) => (
                    <Box
                      key={r}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        bgcolor: 'white',
                        borderRadius: 2,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          bgcolor: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {r}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Trust Features */}
      <Box sx={{ py: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="h2" sx={{ mb: 1.5 }}>
              Built for trust
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Health data is sensitive. We treat it that way.
            </Typography>
          </Box>
          <Grid container spacing={2.5}>
            {features.map((f) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6 }}>
                <Card
                  sx={{
                    bgcolor: f.color,
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: 'none',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'white',
                        color: f.iconColor,
                        mb: 2,
                        width: 44,
                        height: 44,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    >
                      {f.icon}
                    </Avatar>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box className="gradient-patient" sx={{ py: { xs: 8, md: 12 }, px: 2, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>
            Start today — it&apos;s free
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, fontWeight: 400 }}>
            Get your Health ID in 30 seconds. No payment, no app download.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/register/patient"
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.dark',
                '&:hover': { bgcolor: 'background.default' },
                px: 4,
                py: 1.75,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              Get my Health ID
            </Button>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-1px)',
                },
                px: 4,
                py: 1.75,
              }}
            >
              Sign in
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', py: 5, px: 2 }}>
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FavoriteIcon sx={{ color: 'white', fontSize: 16 }} />
              </Box>
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 700 }}>
                HealthVault
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              Future ABDM/ABHA integration ready · Made for India
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
