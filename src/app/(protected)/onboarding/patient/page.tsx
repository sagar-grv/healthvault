'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BadgeIcon from '@mui/icons-material/Badge';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ShieldIcon from '@mui/icons-material/Shield';
import { createClient } from '@/lib/supabase/client';

const steps = [
  {
    icon: <BadgeIcon sx={{ fontSize: 48, color: 'white' }} />,
    gradient: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
    glow: 'rgba(37,99,235,0.30)',
    badge: 'rgba(37,99,235,0.12)',
    badgeText: 'primary.main',
    title: 'Your Health ID',
    description:
      'You now have a unique Health ID — like HV-4K9M-2R7P. Share it with any doctor at any clinic to give them instant access to your records.',
  },
  {
    icon: <CameraAltIcon sx={{ fontSize: 48, color: 'white' }} />,
    gradient: 'linear-gradient(135deg, #047857, #10B981)',
    glow: 'rgba(5,150,105,0.30)',
    badge: 'rgba(5,150,105,0.12)',
    badgeText: 'success.main',
    title: 'Scan or Upload Reports',
    description:
      'Point your camera at any report — prescription, lab test, or scan. HealthVault reads it automatically. Or upload a PDF from your gallery.',
  },
  {
    icon: <ShieldIcon sx={{ fontSize: 48, color: 'white' }} />,
    gradient: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
    glow: 'rgba(109,40,217,0.30)',
    badge: 'rgba(109,40,217,0.12)',
    badgeText: 'secondary.main',
    title: 'You Control Sharing',
    description:
      'Every report is private by default. Toggle which reports doctors can see. Check your access log to see exactly who viewed what.',
  },
];

export default function PatientOnboardingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);
      }
      router.push('/dashboard/patient');
      router.refresh();
    } catch {
      router.push('/dashboard/patient');
    } finally {
      setLoading(false);
    }
  };

  const s = steps[activeStep];
  const isLast = activeStep === steps.length - 1;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        px: 3,
        pt: 5,
        pb: 4,
        maxWidth: 430,
        mx: 'auto',
        width: '100%',
      }}
    >
      {/* Progress dots */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 2 }}>
        {steps.map((_, i) => (
          <Box
            key={i}
            sx={{
              height: 5,
              width: i === activeStep ? 28 : 8,
              borderRadius: 99,
              bgcolor: i === activeStep ? 'primary.main' : 'divider',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </Box>

      {/* Main content — fills available space */}
      <Box
        key={activeStep}
        className="animate-fade-in-up"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 4,
          gap: 0,
        }}
      >
        {/* Icon Avatar — large gradient circle, app-icon style */}
        <Avatar
          sx={{
            width: 104,
            height: 104,
            background: s.gradient,
            boxShadow: `0 16px 48px ${s.glow}`,
            mb: 4,
          }}
        >
          {s.icon}
        </Avatar>

        {/* Step badge */}
        <Box
          sx={{
            display: 'inline-flex',
            bgcolor: s.badge,
            color: s.badgeText,
            borderRadius: 99,
            px: 2,
            py: 0.5,
            mb: 2.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.72rem' }}
          >
            STEP {String(activeStep + 1).padStart(2, '0')} OF {steps.length}
          </Typography>
        </Box>

        {/* Title */}
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
          {s.title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ lineHeight: 1.75, maxWidth: 320, mx: 'auto' }}
        >
          {s.description}
        </Typography>
      </Box>

      {/* Bottom actions */}
      <Box>
        <Button
          variant="contained"
          fullWidth
          size="large"
          endIcon={!isLast ? <ArrowForwardIcon /> : null}
          onClick={isLast ? handleComplete : () => setActiveStep((p) => p + 1)}
          disabled={loading}
          sx={{
            py: 1.875,
            borderRadius: 3,
            fontSize: '1rem',
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(37,99,235,0.30)',
            mb: 1,
          }}
        >
          {isLast ? 'Get Started' : 'Next'}
        </Button>
        <Button
          variant="text"
          fullWidth
          onClick={handleComplete}
          disabled={loading}
          sx={{ color: 'text.disabled', '&:hover': { transform: 'none' } }}
        >
          Skip
        </Button>
      </Box>
    </Box>
  );
}
