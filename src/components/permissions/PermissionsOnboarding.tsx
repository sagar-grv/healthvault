'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { usePermission, type PermissionResult } from '@/lib/hooks/usePermission';

interface PermissionsOnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface StepDef {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  allowLabel: string;
  skipLabel: string;
  mobileOnly?: boolean;
  mobileNote?: string;
}

const steps: StepDef[] = [
  {
    key: 'welcome',
    icon: (
      <Box component="span" sx={{ fontSize: 56, lineHeight: 1 }}>
        🔒
      </Box>
    ),
    title: 'One-Time Setup',
    description:
      'HealthVault needs a few permissions to give you the best experience. You can skip any permission and enable it later from your profile settings.',
    allowLabel: 'Get Started',
    skipLabel: 'Skip All',
  },
  {
    key: 'camera',
    icon: <CameraAltIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
    title: 'Camera Access',
    description:
      'Used to scan your medical reports and Health ID QR codes. Your photos are processed locally and never uploaded without your permission.',
    allowLabel: 'Allow Camera',
    skipLabel: 'Skip',
  },
  {
    key: 'notifications',
    icon: <NotificationsIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
    title: 'Notifications',
    description:
      'Get alerts when a doctor accesses your shared reports or when new results are available.',
    allowLabel: 'Allow Notifications',
    skipLabel: 'Skip',
    mobileOnly: true,
    mobileNote: 'Notifications are only supported on Android Chrome and desktop browsers.',
  },
  {
    key: 'geolocation',
    icon: <LocationOnIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
    title: 'Location Access',
    description:
      'Used only during Emergency SOS to share your location with your emergency contact. Your location is never tracked or stored.',
    allowLabel: 'Allow Location',
    skipLabel: 'Skip',
  },
  {
    key: 'summary',
    icon: <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />,
    title: 'All Set!',
    description: '',
    allowLabel: 'Go to Dashboard',
    skipLabel: '',
  },
];

export default function PermissionsOnboarding({ onComplete, onSkip }: PermissionsOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<Record<string, PermissionResult | 'skipped'>>({});
  const { requestCamera, requestNotifications, requestGeolocation, markOnboarded } =
    usePermission();

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const handleAllow = useCallback(async () => {
    const key = step.key;

    if (key === 'welcome') {
      goNext();
      return;
    }

    if (key === 'summary') {
      markOnboarded();
      onComplete();
      return;
    }

    let result: PermissionResult | 'skipped' = 'denied';
    if (key === 'camera') result = await requestCamera();
    else if (key === 'notifications') result = await requestNotifications();
    else if (key === 'geolocation') result = await requestGeolocation();

    setResults((prev) => ({ ...prev, [key]: result }));
    goNext();
  }, [
    step.key,
    goNext,
    requestCamera,
    requestNotifications,
    requestGeolocation,
    markOnboarded,
    onComplete,
  ]);

  const handleSkip = useCallback(() => {
    const key = step.key;

    if (key === 'welcome') {
      markOnboarded();
      onSkip?.();
      return;
    }

    if (key === 'summary') {
      markOnboarded();
      onComplete();
      return;
    }

    setResults((prev) => ({ ...prev, [key]: 'skipped' }));
    goNext();
  }, [step.key, goNext, markOnboarded, onComplete, onSkip]);

  const resultBadge = (key: string) => {
    const r = results[key];
    if (!r) return null;
    if (r === 'granted')
      return <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', ml: 0.5 }} />;
    if (r === 'skipped')
      return (
        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', ml: 0.5 }}>
          (skipped)
        </Typography>
      );
    return (
      <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', ml: 0.5 }}>
        (denied)
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: 'divider',
          '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' },
        }}
      />

      {/* Steps indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          display: 'flex',
          gap: 0.5,
          alignItems: 'center',
        }}
      >
        {steps.slice(1, -1).map((s, i) => (
          <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor:
                  results[s.key] === 'granted'
                    ? 'success.main'
                    : results[s.key]
                      ? 'text.secondary'
                      : currentStep === i + 1
                        ? 'primary.main'
                        : 'divider',
                transition: 'background-color 0.3s',
              }}
            />
            {i < steps.length - 3 && <Box sx={{ width: 16, height: 1, bgcolor: 'divider' }} />}
          </Box>
        ))}
      </Box>

      {/* Step content */}
      <Box
        key={step.key}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 340,
          animation: 'fadeIn 0.25s ease',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Box sx={{ mb: 3 }}>{step.icon}</Box>

        <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700, mb: 1.5 }}>
          {step.title}
        </Typography>

        {step.key === 'summary' ? (
          <Box sx={{ width: '100%', textAlign: 'left', mb: 3 }}>
            {results.camera && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CameraAltIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography color="text.primary" sx={{ fontSize: '0.9rem' }}>
                    Camera
                  </Typography>
                </Box>
                {resultBadge('camera')}
              </Box>
            )}
            {results.notifications && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography color="text.primary" sx={{ fontSize: '0.9rem' }}>
                    Notifications
                  </Typography>
                </Box>
                {resultBadge('notifications')}
              </Box>
            )}
            {results.geolocation && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography color="text.primary" sx={{ fontSize: '0.9rem' }}>
                    Location
                  </Typography>
                </Box>
                {resultBadge('geolocation')}
              </Box>
            )}
            <Typography
              color="text.secondary"
              sx={{ fontSize: '0.8rem', mt: 2, textAlign: 'center' }}
            >
              You can change these anytime from your profile settings.
            </Typography>
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ mb: 2, lineHeight: 1.7, fontSize: '0.9rem' }}>
            {step.description}
          </Typography>
        )}

        {step.mobileOnly && step.mobileNote && (
          <Typography
            color="text.secondary"
            sx={{ fontSize: '0.75rem', mb: 2, fontStyle: 'italic' }}
          >
            {step.mobileNote}
          </Typography>
        )}

        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', maxWidth: 260 }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleAllow}
            sx={{
              bgcolor: step.key === 'summary' ? 'secondary.main' : undefined,
              '&:hover': { bgcolor: step.key === 'summary' ? 'secondary.dark' : undefined },
            }}
          >
            {step.allowLabel}
          </Button>
          {step.skipLabel && (
            <Button
              variant="text"
              onClick={handleSkip}
              startIcon={step.key === 'welcome' ? <SkipNextIcon /> : undefined}
              sx={{ color: 'text.secondary' }}
            >
              {step.skipLabel}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
