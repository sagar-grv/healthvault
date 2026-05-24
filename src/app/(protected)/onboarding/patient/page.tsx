'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { createClient } from '@/lib/supabase/client';

// ─── Inline SVG Illustrations ─────────────────────────────────────────────

function HealthIdIllustration() {
  return (
    <Box sx={{ width: 140, height: 88, mx: 'auto', mb: 1 }}>
      <svg viewBox="0 0 140 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Card */}
        <rect x="4" y="8" width="132" height="72" rx="10" fill="#1D4ED8" opacity="0.9" />
        <rect x="4" y="8" width="132" height="72" rx="10" fill="url(#cardGrad)" />
        {/* Dot pattern overlay */}
        <rect x="4" y="8" width="132" height="72" rx="10" fill="url(#dots)" opacity="0.15" />
        {/* Text lines */}
        <rect x="16" y="24" width="16" height="16" rx="3" fill="white" opacity="0.3" />
        <text
          x="36"
          y="35"
          fill="white"
          fontSize="8"
          fontWeight="700"
          opacity="0.7"
          fontFamily="sans-serif"
        >
          HEALTH ID
        </text>
        <text
          x="16"
          y="52"
          fill="white"
          fontSize="10"
          fontWeight="800"
          fontFamily="monospace"
          letterSpacing="1.5"
        >
          HV-4K9M
        </text>
        <rect x="16" y="60" width="40" height="5" rx="2" fill="white" opacity="0.4" />
        {/* QR code block */}
        <rect x="100" y="22" width="28" height="28" rx="3" fill="white" opacity="0.92" />
        <rect x="103" y="25" width="8" height="8" rx="1.5" fill="#1D4ED8" />
        <rect x="115" y="25" width="8" height="8" rx="1.5" fill="#1D4ED8" />
        <rect x="103" y="37" width="8" height="8" rx="1.5" fill="#1D4ED8" />
        <rect x="115" y="33" width="4" height="4" rx="1" fill="#1D4ED8" />
        <rect x="111" y="37" width="4" height="4" rx="1" fill="#1D4ED8" />
        <defs>
          <linearGradient
            id="cardGrad"
            x1="4"
            y1="8"
            x2="136"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#1E3A8A" />
            <stop offset="0.5" stopColor="#1D4ED8" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </Box>
  );
}

function CameraIllustration() {
  return (
    <Box sx={{ width: 120, height: 96, mx: 'auto', mb: 1 }}>
      <svg viewBox="0 0 120 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Phone body */}
        <rect
          x="36"
          y="4"
          width="48"
          height="88"
          rx="8"
          stroke="#059669"
          strokeWidth="2.5"
          fill="rgba(5,150,105,0.06)"
        />
        {/* Notch */}
        <rect x="50" y="6" width="20" height="5" rx="2.5" fill="#059669" opacity="0.4" />
        {/* Viewfinder */}
        <rect
          x="40"
          y="16"
          width="40"
          height="52"
          rx="3"
          fill="rgba(5,150,105,0.08)"
          stroke="#059669"
          strokeWidth="1.5"
          strokeDasharray="5 2.5"
        />
        {/* Corner brackets */}
        <path
          d="M 43 19 L 43 23 L 47 23"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 77 19 L 77 23 L 73 23"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 43 65 L 43 61 L 47 61"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 77 65 L 77 61 L 73 61"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Paper document */}
        <rect
          x="48"
          y="24"
          width="24"
          height="32"
          rx="2"
          fill="white"
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        <rect x="52" y="30" width="16" height="2" rx="1" fill="#D1D5DB" />
        <rect x="52" y="35" width="16" height="2" rx="1" fill="#D1D5DB" />
        <rect x="52" y="40" width="12" height="2" rx="1" fill="#D1D5DB" />
        <rect x="52" y="45" width="14" height="2" rx="1" fill="#D1D5DB" />
        {/* Shutter button */}
        <circle cx="60" cy="84" r="6" fill="#059669" opacity="0.85" />
        <circle cx="60" cy="84" r="4" fill="#059669" />
      </svg>
    </Box>
  );
}

function AILanguageIllustration() {
  return (
    <Box sx={{ width: 140, height: 96, mx: 'auto', mb: 1 }}>
      <svg viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main speech bubble */}
        <rect
          x="8"
          y="8"
          width="112"
          height="56"
          rx="14"
          fill="rgba(124,58,237,0.12)"
          stroke="rgba(124,58,237,0.4)"
          strokeWidth="1.5"
        />
        {/* Bubble tail */}
        <path
          d="M 28 64 L 18 80 L 44 64 Z"
          fill="rgba(124,58,237,0.12)"
          stroke="rgba(124,58,237,0.4)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Tamil text line (simulated) */}
        <rect x="20" y="18" width="72" height="7" rx="3.5" fill="rgba(124,58,237,0.55)" />
        {/* Body text lines */}
        <rect x="20" y="31" width="88" height="5" rx="2.5" fill="rgba(124,58,237,0.28)" />
        <rect x="20" y="41" width="68" height="5" rx="2.5" fill="rgba(124,58,237,0.28)" />
        {/* Sound wave icon (top right) */}
        <circle
          cx="118"
          cy="20"
          r="10"
          fill="rgba(124,58,237,0.15)"
          stroke="rgba(124,58,237,0.5)"
          strokeWidth="1.5"
        />
        <path
          d="M 113 20 Q 115.5 16 118 20 Q 120.5 24 123 20"
          stroke="rgba(124,58,237,0.85)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Language dots */}
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i}
            cx={20 + i * 22}
            cy={86}
            r={7}
            fill={
              [
                'rgba(37,99,235,0.6)',
                'rgba(5,150,105,0.6)',
                'rgba(124,58,237,0.6)',
                'rgba(234,88,12,0.6)',
                'rgba(239,68,68,0.6)',
              ][i]
            }
          />
        ))}
        <text x="17" y="89" fill="white" fontSize="5.5" fontWeight="700" fontFamily="sans-serif">
          EN
        </text>
        <text x="36" y="89" fill="white" fontSize="5.5" fontWeight="700" fontFamily="sans-serif">
          TA
        </text>
        <text x="56" y="89" fill="white" fontSize="5.5" fontWeight="700" fontFamily="sans-serif">
          HI
        </text>
        <text x="76" y="89" fill="white" fontSize="5.5" fontWeight="700" fontFamily="sans-serif">
          TE
        </text>
        <text x="95" y="89" fill="white" fontSize="5.5" fontWeight="700" fontFamily="sans-serif">
          MR
        </text>
      </svg>
    </Box>
  );
}

function PrivacyIllustration() {
  return (
    <Box sx={{ width: 110, height: 96, mx: 'auto', mb: 1 }}>
      <svg viewBox="0 0 110 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Toggle pill (top) */}
        <rect
          x="18"
          y="6"
          width="74"
          height="22"
          rx="11"
          fill="rgba(5,150,105,0.12)"
          stroke="#059669"
          strokeWidth="1.5"
        />
        <circle cx="81" cy="17" r="9" fill="#059669" />
        <rect x="28" y="12" width="30" height="10" rx="5" fill="rgba(5,150,105,0.25)" />
        <text x="26" y="20" fill="#059669" fontSize="7" fontWeight="700" fontFamily="sans-serif">
          PRIVATE
        </text>
        {/* Lock body */}
        <rect
          x="30"
          y="48"
          width="50"
          height="40"
          rx="8"
          fill="rgba(37,99,235,0.12)"
          stroke="#2563EB"
          strokeWidth="2"
        />
        {/* Lock shackle */}
        <path
          d="M 40 48 L 40 36 Q 40 22 55 22 Q 70 22 70 36 L 70 48"
          stroke="#2563EB"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Keyhole */}
        <circle cx="55" cy="63" r="6" fill="#2563EB" opacity="0.7" />
        <rect x="52" y="67" width="6" height="9" rx="3" fill="#2563EB" opacity="0.7" />
      </svg>
    </Box>
  );
}

// ─── Steps data ───────────────────────────────────────────────────────────

const steps = [
  {
    step: '01',
    illustration: <HealthIdIllustration />,
    bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
    badge: '#DBEAFE',
    badgeText: '#1D4ED8',
    title: 'Your Health ID',
    description:
      'You now have a unique Health ID — like HV-4K9M-2R7P. Share this with any doctor at any clinic to give them instant access to your records.',
  },
  {
    step: '02',
    illustration: <CameraIllustration />,
    bg: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)',
    badge: '#D1FAE5',
    badgeText: '#065F46',
    title: 'Scan or Upload Reports',
    description:
      'Point your camera at any report — prescription, lab test, or scan. HealthVault reads it automatically. Or upload a PDF from your gallery.',
  },
  {
    step: '03',
    illustration: <AILanguageIllustration />,
    bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
    badge: '#EDE9FE',
    badgeText: '#6D28D9',
    title: 'AI Explains in Your Language',
    description:
      'Tap "Explain" on any report. HealthVault AI reads it and explains it clearly — in Tamil, Hindi, Telugu, or 9 other Indian languages. Tap to listen.',
  },
  {
    step: '04',
    illustration: <PrivacyIllustration />,
    bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
    badge: '#DBEAFE',
    badgeText: '#1D4ED8',
    title: 'You Control Sharing',
    description:
      'Every report is private by default. Toggle which reports doctors can see. Check your access log to see exactly who viewed what.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────

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

  return (
    <Box
      className="gradient-mesh-blue"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Step counter */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {steps.map((_, i) => (
              <Box
                key={i}
                sx={{
                  height: 4,
                  width: i === activeStep ? 32 : 16,
                  borderRadius: 99,
                  bgcolor: i <= activeStep ? '#2563EB' : '#D1D5DB',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>
            {activeStep + 1} / {steps.length}
          </Typography>
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
              px: 2,
              py: 0.4,
              mb: 2,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em' }}>
              STEP {s.step} / {steps.length.toString().padStart(2, '0')}
            </Typography>
          </Box>

          {/* SVG Illustration */}
          {s.illustration}

          <Typography variant="h3" sx={{ mb: 2 }}>
            {s.title}
          </Typography>
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
          onClick={
            activeStep === steps.length - 1 ? handleComplete : () => setActiveStep((p) => p + 1)
          }
          disabled={loading}
          sx={{ mb: 1.5, py: 1.75 }}
        >
          {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </Button>

        <Button
          variant="text"
          fullWidth
          onClick={handleComplete}
          disabled={loading}
          sx={{ color: 'text.secondary', '&:hover': { transform: 'none' } }}
        >
          Skip intro
        </Button>
      </Box>
    </Box>
  );
}
