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
import Divider from '@mui/material/Divider';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import ShieldIcon from '@mui/icons-material/ShieldOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import PhoneIcon from '@mui/icons-material/Phone';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';

// ─── Inline SVG phone mockup ───────────────────────────────────────────────

function PhoneMockup() {
  return (
    <Box
      className="animate-float"
      sx={{
        width: 260,
        mx: 'auto',
        position: 'relative',
        filter: 'drop-shadow(0 24px 48px rgba(29,78,216,0.25))',
      }}
    >
      {/* Phone frame */}
      <Box
        sx={{
          border: '6px solid',
          borderColor: 'divider',
          borderRadius: '36px',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {/* Status bar */}
        <Box
          sx={{
            height: 28,
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ width: 60, height: 10, bgcolor: 'divider', borderRadius: 99 }} />
        </Box>

        {/* App bar */}
        <Box
          sx={{
            height: 44,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: 1,
              background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FavoriteIcon sx={{ fontSize: 10, color: 'white' }} />
          </Box>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'primary.main' }}>
            HealthVault
          </Typography>
        </Box>

        {/* Screen content */}
        <Box sx={{ p: 1, bgcolor: 'background.default', minHeight: 380 }}>
          {/* Health ID card */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #3B82F6 100%)',
              borderRadius: 2.5,
              p: 1.5,
              mb: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.5rem',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Your Health ID
            </Typography>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '0.1em',
                mt: 0.25,
              }}
            >
              HV-4K9M-2R7P
            </Typography>
            <Typography sx={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', mt: 0.25 }}>
              Sunita Sharma
            </Typography>
            <Box
              sx={{
                mt: 1,
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: 1,
                px: 1,
                py: 0.4,
                display: 'inline-block',
              }}
            >
              <Typography sx={{ fontSize: '0.5rem', color: 'white', fontWeight: 700 }}>
                Share with Doctor →
              </Typography>
            </Box>
          </Box>

          {/* Recent Reports label */}
          <Typography
            sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'text.secondary', mb: 0.5, px: 0.5 }}
          >
            Recent Reports
          </Typography>

          {/* Report rows */}
          {[
            {
              label: 'Blood Test Results',
              sub: '3 days ago',
              color: 'rgba(5,150,105,0.12)',
              icolor: '#10B981',
            },
            {
              label: 'Chest X-Ray',
              sub: '2 weeks ago',
              color: 'rgba(124,58,237,0.10)',
              icolor: '#A78BFA',
            },
            {
              label: 'Prescription',
              sub: '1 month ago',
              color: 'rgba(37,99,235,0.10)',
              icolor: '#3B82F6',
            },
          ].map((r) => (
            <Box
              key={r.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                p: 0.75,
                bgcolor: 'background.paper',
                borderRadius: 1.5,
                mb: 0.5,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: 1,
                  bgcolor: r.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AssignmentOutlinedIcon sx={{ fontSize: 12, color: r.icolor }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, lineHeight: 1.2 }}>
                  {r.label}
                </Typography>
                <Typography sx={{ fontSize: '0.48rem', color: 'text.disabled' }}>
                  {r.sub}
                </Typography>
              </Box>
            </Box>
          ))}

          {/* Bottom nav */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              mt: 1,
              pt: 0.75,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            {['Home', 'Reports', 'Log', 'Profile'].map((n) => (
              <Typography
                key={n}
                sx={{
                  fontSize: '0.42rem',
                  color: n === 'Home' ? 'primary.main' : 'text.disabled',
                  fontWeight: n === 'Home' ? 700 : 400,
                }}
              >
                {n}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', native: 'English' },
  { code: 'hi', native: 'हिंदी' },
  { code: 'ta', native: 'தமிழ்' },
  { code: 'te', native: 'తెలుగు' },
  { code: 'mr', native: 'मराठी' },
  { code: 'bn', native: 'বাংলা' },
  { code: 'gu', native: 'ગુજરાતી' },
  { code: 'kn', native: 'ಕನ್ನಡ' },
  { code: 'ml', native: 'മലയാളം' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', native: 'ଓଡ଼ିଆ' },
  { code: 'as', native: 'অসমীয়া' },
];

const steps = [
  {
    number: '01',
    icon: <CloudUploadIcon sx={{ fontSize: 28 }} />,
    title: 'Upload Your Reports',
    desc: 'Take a photo with your camera or upload PDFs of prescriptions, lab results, and scans. HealthVault reads it automatically.',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.25)',
    iconBg: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
  },
  {
    number: '02',
    icon: <BadgeIcon sx={{ fontSize: 28 }} />,
    title: 'Share with Your Doctor',
    desc: 'Tap "Share with Doctor". Your Health ID appears large. Copy it or send via WhatsApp. Doctor types it — done in 10 seconds.',
    bg: 'rgba(5,150,105,0.08)',
    border: 'rgba(5,150,105,0.25)',
    iconBg: 'linear-gradient(135deg, #047857, #10B981)',
  },
  {
    number: '03',
    icon: <VisibilityIcon sx={{ fontSize: 28 }} />,
    title: 'Doctor Sees History',
    desc: 'Your doctor instantly accesses your shared records digitally. No paper needed. Every access is logged — you see who viewed what.',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.25)',
    iconBg: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
  },
];

const features = [
  {
    icon: <LockIcon />,
    title: 'Private by Default',
    desc: 'Every report is private until you choose to share it. Your data, your rules.',
    bg: 'rgba(37,99,235,0.08)',
    iconColor: 'primary.main',
  },
  {
    icon: <VisibilityIcon />,
    title: 'Full Audit Trail',
    desc: 'See exactly who viewed your records and when. Complete transparency.',
    bg: 'rgba(5,150,105,0.08)',
    iconColor: 'success.main',
  },
  {
    icon: <TranslateIcon />,
    title: 'AI in Your Language',
    desc: 'Reports explained in plain language — Tamil, Hindi, Telugu, and 9 more Indian languages.',
    bg: 'rgba(124,58,237,0.08)',
    iconColor: 'secondary.main',
  },
  {
    icon: <WifiOffIcon />,
    title: 'Works Offline',
    desc: 'Reports accessible without internet. Built as a PWA for cheap Android on slow 3G.',
    bg: 'rgba(107,114,128,0.08)',
    iconColor: 'text.secondary',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* ── Navigation ────────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1.5,
          px: 2,
          opacity: 0.96,
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

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <Box
        className="gradient-mesh-blue"
        sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 14 }, px: 2 }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 8 }} sx={{ alignItems: 'center' }}>
            {/* Left: text */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '14px !important' }} />}
                label="ABDM-ready · AI-powered · 12 Indian Languages"
                sx={{
                  mb: 3,
                  bgcolor: 'rgba(37,99,235,0.10)',
                  color: 'primary.main',
                  fontWeight: 600,
                  border: '1px solid rgba(37,99,235,0.25)',
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
                  Understood. Secure.
                </Box>{' '}
                Always with you.
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  mb: 5,
                  fontWeight: 400,
                  maxWidth: 520,
                  lineHeight: 1.7,
                }}
              >
                Stop carrying physical reports to every doctor. HealthVault gives you a digital
                Health ID — and AI that explains your reports in Tamil, Hindi, or any Indian
                language.
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { xs: 'center', md: 'flex-start' },
                  gap: 2,
                  mb: 5,
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
                    minWidth: 280,
                  }}
                >
                  Create your free Health ID
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Are you a doctor?{' '}
                  <Link
                    href="/register/doctor"
                    style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Register here
                  </Link>
                </Typography>
              </Box>

              {/* Social proof pills */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  'Free to use',
                  'No app download needed',
                  'AI in 12 languages',
                  'Emergency card included',
                  'Works offline',
                ].map((f) => (
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
                    <CheckCircleIcon sx={{ fontSize: 13, color: 'success.main' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {f}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Right: phone mockup */}
            <Grid
              size={{ xs: 0, md: 5 }}
              sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}
            >
              <PhoneMockup />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 8, md: 12 }, px: 2, bgcolor: 'background.default' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Chip
              label="How it works"
              size="small"
              sx={{ mb: 2, bgcolor: 'action.hover', color: 'text.primary', fontWeight: 600 }}
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
                  bgcolor: step.bg,
                  border: '1px solid',
                  borderColor: step.border,
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
                        sx={{ fontWeight: 700, color: 'text.disabled', letterSpacing: '0.08em' }}
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

      {/* ── AI Explain in Your Language ───────────────────────────── */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          bgcolor: 'rgba(124,58,237,0.03)',
          borderTop: '1px solid rgba(124,58,237,0.12)',
          borderBottom: '1px solid rgba(124,58,237,0.12)',
        }}
      >
        <Container maxWidth="md">
          <Grid container spacing={5} sx={{ alignItems: 'center' }}>
            {/* Left: text */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip
                label="AI-Powered"
                size="small"
                sx={{
                  mb: 2,
                  bgcolor: 'rgba(124,58,237,0.12)',
                  color: 'secondary.main',
                  fontWeight: 600,
                }}
              />
              <Typography variant="h2" sx={{ mb: 2 }}>
                Medical reports.{' '}
                <Box component="span" className="text-gradient-blue">
                  In your language.
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                HealthVault&apos;s AI reads your report and explains it in plain language — in
                Tamil, Telugu, Hindi, Marathi, and 9 more Indian languages. No medical jargon. Tap
                to listen.
              </Typography>
              {[
                'Plain language, no medical jargon',
                'Abnormal values highlighted and explained',
                'Listen in your language with 1 tap',
                'Works in 12 Indian languages',
              ].map((f) => (
                <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {f}
                  </Typography>
                </Box>
              ))}
            </Grid>

            {/* Right: mock HealthInterpreter card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  border: '1px solid rgba(124,58,237,0.25)',
                  bgcolor: 'rgba(124,58,237,0.06)',
                  boxShadow: '0 8px 32px rgba(124,58,237,0.12)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(124,58,237,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TranslateIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: 'secondary.main', flexGrow: 1 }}
                    >
                      Explain This Report
                    </Typography>
                    {/* Language selector mock */}
                    <Box
                      sx={{
                        border: '1px solid rgba(124,58,237,0.35)',
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: 'secondary.main' }}
                      >
                        தமிழ் ▾
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Tamil headline */}
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.4 }}
                  >
                    உங்கள் ஹீமோகுளோபின் சற்று குறைவாக உள்ளது
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 2 }}
                  >
                    Your hemoglobin is slightly low
                  </Typography>

                  {/* Key point */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                    <CheckCircleIcon
                      sx={{ fontSize: 15, color: 'success.main', mt: 0.15, flexShrink: 0 }}
                    />
                    <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                      இரும்புச்சத்து நிறைந்த உணவுகளை சாப்பிடுங்கள் — பச்சை இலைக் காய்கறிகள், பருப்பு
                      வகைகள்.
                    </Typography>
                  </Box>

                  {/* Abnormal value */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 1,
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                        Hemoglobin (Hb)
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.65rem' }}
                      >
                        Normal: 12–16 g/dL
                      </Typography>
                    </Box>
                    <Chip
                      label="10.2 g/dL ↓"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(239,68,68,0.12)',
                        color: 'error.main',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>

                  {/* Listen button */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<VolumeUpIcon sx={{ fontSize: 16 }} />}
                    sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
                  >
                    தமிழில் கேளுங்கள் (Listen in Tamil)
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Before Your Appointment ───────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          bgcolor: 'rgba(37,99,235,0.03)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <Grid
            container
            spacing={5}
            sx={{ alignItems: 'center', flexDirection: { xs: 'column-reverse', md: 'row' } }}
          >
            {/* Left: mock share sheet */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                sx={{
                  borderRadius: 4,
                  border: '1.5px solid rgba(37,99,235,0.25)',
                  bgcolor: 'background.paper',
                  boxShadow: '0 12px 40px rgba(37,99,235,0.12)',
                  overflow: 'hidden',
                }}
              >
                {/* Drawer handle */}
                <Box
                  sx={{
                    pt: 1.5,
                    pb: 0.5,
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(150,150,150,0.35)',
                    }}
                  />
                </Box>
                <CardContent sx={{ px: 3, pb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Share with your doctor
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 2 }}
                  >
                    Show this before your appointment
                  </Typography>

                  {/* Health ID display */}
                  <Box
                    sx={{
                      bgcolor: 'rgba(37,99,235,0.08)',
                      border: '1.5px solid rgba(37,99,235,0.25)',
                      borderRadius: 2.5,
                      py: 2,
                      px: 2,
                      textAlign: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      Your Health ID
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '1.5rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: 'primary.main',
                        letterSpacing: '0.12em',
                      }}
                    >
                      HV-4K9M-2R7P
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: 'center', mb: 2, lineHeight: 1.5 }}
                  >
                    Give this to your doctor. They type it to see your shared records.
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small" fullWidth sx={{ borderRadius: 2 }}>
                      Copy ID
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      color="secondary"
                      sx={{ borderRadius: 2 }}
                    >
                      Share via WhatsApp
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Right: text */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip
                label="Before your appointment"
                size="small"
                sx={{
                  mb: 2,
                  bgcolor: 'rgba(37,99,235,0.10)',
                  color: 'primary.main',
                  fontWeight: 600,
                }}
              />
              <Typography variant="h2" sx={{ mb: 2 }}>
                1 tap. Doctor sees everything.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                Before your appointment, tap &quot;Share with Doctor&quot;. Your Health ID appears
                large and clear. Copy it or send via WhatsApp. Your doctor types it and instantly
                sees your shared records — no paper, no waiting.
              </Typography>
              {[
                'No waiting for reports to be re-run',
                'No explaining your medical history from memory',
                'Doctor sees exactly what you shared — nothing more',
              ].map((f) => (
                <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {f}
                  </Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── For Doctors ───────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          bgcolor: 'background.default',
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
                sx={{
                  mb: 2,
                  bgcolor: 'rgba(5,150,105,0.12)',
                  color: 'success.dark',
                  fontWeight: 600,
                }}
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
                'One search to see the full patient history',
                'AI insights across all shared reports',
                'Every access is logged — complete accountability',
              ].map((f) => (
                <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
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

            {/* Updated realistic mock card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  bgcolor: 'rgba(5,150,105,0.06)',
                  border: '1px solid rgba(5,150,105,0.25)',
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: 'success.dark', display: 'block', mb: 1.5 }}
                  >
                    Doctor&apos;s view
                  </Typography>
                  {/* Patient info card */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      p: 1.5,
                      mb: 1.5,
                      border: '1px solid rgba(5,150,105,0.20)',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #047857, #10B981)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                      }}
                    >
                      S
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Sunita Sharma
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'var(--font-mono)',
                          color: 'success.dark',
                          fontWeight: 600,
                        }}
                      >
                        HV-4K9M-2R7P
                      </Typography>
                    </Box>
                    <Chip
                      label="3 reports"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(5,150,105,0.12)',
                        color: 'success.dark',
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {/* Report rows */}
                  {[
                    {
                      label: 'Blood Test — 3 days ago',
                      color: 'rgba(5,150,105,0.10)',
                      ic: '#10B981',
                    },
                    {
                      label: 'X-Ray Report — 2 weeks ago',
                      color: 'rgba(124,58,237,0.10)',
                      ic: '#A78BFA',
                    },
                    {
                      label: 'Prescription — 1 month ago',
                      color: 'rgba(37,99,235,0.10)',
                      ic: '#3B82F6',
                    },
                  ].map((r) => (
                    <Box
                      key={r.label}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.25,
                        bgcolor: 'background.paper',
                        borderRadius: 1.5,
                        mb: 0.75,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 1.5,
                          bgcolor: r.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <AssignmentOutlinedIcon sx={{ fontSize: 16, color: r.ic }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {r.label}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Emergency Card ────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          background: 'linear-gradient(135deg, rgba(220,38,38,0.04) 0%, rgba(239,68,68,0.02) 100%)',
          borderBottom: '1px solid rgba(220,38,38,0.15)',
        }}
      >
        <Container maxWidth="md">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip
              label="Emergency"
              size="small"
              sx={{ mb: 2, bgcolor: 'rgba(220,38,38,0.10)', color: 'error.main', fontWeight: 600 }}
            />
            <Typography variant="h2" sx={{ mb: 2, maxWidth: 560, mx: 'auto' }}>
              When you can&apos;t speak — your phone speaks for you
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}
            >
              Your emergency card works without internet. No login needed. First responders scan the
              QR code and instantly see your blood group, allergies, and emergency contact.
            </Typography>
          </Box>

          {/* Mock emergency card */}
          <Box sx={{ maxWidth: 340, mx: 'auto', mb: 3 }}>
            <Card
              sx={{
                border: '2px solid rgba(220,38,38,0.25)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(220,38,38,0.12)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <LocalHospitalIcon sx={{ color: 'error.main', fontSize: 40, mb: 0.5 }} />
                  <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 700 }}>
                    EMERGENCY INFO
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Medical information for first responders
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}>
                  Sunita Sharma
                </Typography>

                {/* Blood group */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 1.5,
                    p: 1.5,
                    bgcolor: 'rgba(220,38,38,0.08)',
                    borderRadius: 2,
                  }}
                >
                  <BloodtypeIcon sx={{ color: 'error.main', fontSize: 24 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Blood Group
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                      O+
                    </Typography>
                  </Box>
                </Box>

                {/* Allergies */}
                <Box sx={{ mb: 1.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}
                  >
                    Allergies
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    <Chip
                      label="Penicillin"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(245,158,11,0.15)',
                        color: 'warning.dark',
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label="Sulfa drugs"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(245,158,11,0.15)',
                        color: 'warning.dark',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>

                {/* Emergency contact */}
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<PhoneIcon />}
                  sx={{ py: 1.25, fontWeight: 700 }}
                >
                  Call Ramesh — 9876543210
                </Button>
              </CardContent>
            </Card>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Set up in 2 minutes · Free · Always accessible · No login needed for first responders
          </Typography>
        </Container>
      </Box>

      {/* ── 12 Languages ──────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 7, md: 10 }, px: 2, bgcolor: 'background.default' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Chip
              label="12 Languages"
              size="small"
              sx={{
                mb: 2,
                bgcolor: 'rgba(37,99,235,0.10)',
                color: 'primary.main',
                fontWeight: 600,
              }}
            />
            <Typography variant="h2" sx={{ mb: 1.5 }}>
              HealthVault speaks your language
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
              The app UI, AI explanations, and voice readout — all in your mother tongue.
            </Typography>
          </Box>

          {/* Language chip grid */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
            {LANGUAGES.map((lang) => (
              <Chip
                key={lang.code}
                label={lang.native}
                sx={{
                  fontSize: '0.95rem',
                  height: 42,
                  px: 0.5,
                  bgcolor: 'rgba(37,99,235,0.07)',
                  color: 'primary.main',
                  border: '1px solid rgba(37,99,235,0.20)',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(37,99,235,0.12)' },
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Trust Features ────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
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
                    bgcolor: f.bg,
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: 'none',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'background.paper',
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

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <Box className="gradient-patient" sx={{ py: { xs: 8, md: 12 }, px: 2, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>
            Understand your reports. In your language.
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'rgba(255,255,255,0.8)', mb: 1.5, fontWeight: 400 }}
          >
            AI explains your blood test in Tamil. Emergency card works without internet.
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 4 }}>
            Free. Forever. No app download needed.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/register/patient"
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: '#1D4ED8',
                '&:hover': { bgcolor: '#F9FAFB' },
                px: 4,
                py: 1.75,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              Get my Health ID — it&apos;s free
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

      {/* ── Footer ────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#111827', py: 6, px: 2 }}>
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 3,
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                component={Link}
                href="/login"
                size="small"
                sx={{ color: '#9CA3AF', '&:hover': { transform: 'none', color: 'white' } }}
              >
                Sign in
              </Button>
              <Button
                component={Link}
                href="/register/patient"
                size="small"
                sx={{ color: '#9CA3AF', '&:hover': { transform: 'none', color: 'white' } }}
              >
                Get Health ID
              </Button>
              <Button
                component={Link}
                href="/register/doctor"
                size="small"
                sx={{ color: '#9CA3AF', '&:hover': { transform: 'none', color: 'white' } }}
              >
                For Doctors
              </Button>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#374151', mb: 3 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              AI Analysis · 12 Languages · Emergency Card · Offline PWA · ABDM-ready
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Made for India · Future ABDM/ABHA integration ready
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
