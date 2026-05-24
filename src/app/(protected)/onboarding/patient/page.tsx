'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import BadgeIcon from '@mui/icons-material/Badge';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import LockOpenIcon from '@mui/icons-material/LockOpenOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { createClient } from '@/lib/supabase/client';

const steps = [
  {
    icon: <BadgeIcon sx={{ fontSize: 56, color: '#2563EB' }} />,
    bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
    badge: '#DBEAFE',
    badgeText: '#1D4ED8',
    title: 'Your Health ID',
    description: 'You now have a unique Health ID — like HV-4K9M-2R7P. Share this with your doctor at any clinic to give them instant access to your records.',
    step: '01',
  },
  {
    icon: <CloudUploadIcon sx={{ fontSize: 56, color: '#059669' }} />,
    bg: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)',
    badge: '#D1FAE5',
    badgeText: '#065F46',
    title: 'Upload Your Reports',
    description: 'Upload prescriptions, lab results, scans — any medical document. Take a photo right from your phone, or upload a PDF.',
    step: '02',
  },
  {
    icon: <LockOpenIcon sx={{ fontSize: 56, color: '#2563EB' }} />,
    bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
    badge: '#DBEAFE',
    badgeText: '#1D4ED8',
    title: 'You Control Sharing',
    description: 'Every report is private by default. Toggle which reports doctors can see. Check your access log to see exactly who viewed what.',
    step: '03',
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
      const { data: { user } } = await supabase.auth.getUser();
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

  return (
    <Box
      className="gradient-mesh-blue"
      sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 4 }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Step counter */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {steps.map((_, i) => (
              <Box
                key={i}
                sx={{
                  height: 4,
                  width: i === activeStep ? 32 : 16,
                  borderRadius: 99,
                  bgcolor: i === activeStep ? '#2563EB' : '#D1D5DB',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Card */}
        <Box
          key={activeStep}
          className="animate-fade-in-up"
          sx={{
            background: s.bg,
            borderRadius: 4,
            p: { xs: 3, sm: 4 },
            textAlign: 'center',
            border: '1px solid rgba(0,0,0,0.05)',
            mb: 3,
          }}
        >
          {/* Step badge */}
          <Box
            sx={{
              display: 'inline-flex',
              bgcolor: s.badge,
              color: s.badgeText,
              borderRadius: 99,
              px: 2, py: 0.4,
              mb: 3,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em' }}>
              STEP {s.step}
            </Typography>
          </Box>

          {/* Icon */}
          <Box sx={{ mb: 3 }}>{s.icon}</Box>

          <Typography variant="h3" sx={{ mb: 2 }}>{s.title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {s.description}
          </Typography>
        </Box>

        {/* Actions */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          endIcon={activeStep < steps.length - 1 ? <ArrowForwardIcon /> : null}
          onClick={activeStep === steps.length - 1 ? handleComplete : () => setActiveStep(p => p + 1)}
          disabled={loading}
          sx={{ mb: 1.5, py: 1.75 }}
        >
          {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </Button>

        <Button
          variant="text" fullWidth
          onClick={handleComplete}
          disabled={loading}
          sx={{ color: 'text.secondary', '&:hover': { transform: 'none' } }}
        >
          Skip
        </Button>
      </Box>
    </Box>
  );
}
