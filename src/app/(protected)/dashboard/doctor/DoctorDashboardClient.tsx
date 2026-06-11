'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MedicalServicesIcon from '@mui/icons-material/MedicalServicesOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { createClient } from '@/lib/supabase/client';
import { Profile, DoctorProfile } from '@/types';
import { isValidHealthId, normalizeHealthId } from '@/lib/utils/health-id';
import ThemeToggle from '@/components/ThemeToggle';
import QRScannerDialog from '@/components/doctor/QRScannerDialog';
import { searchPatient } from './actions';

// Lazy load AI assistant — only loaded after page renders
const DoctorAIAssistant = dynamic(() => import('@/components/doctor/DoctorAIAssistant'), {
  ssr: false,
});

interface DoctorDashboardClientProps {
  profile: Profile;
  doctorProfile: DoctorProfile | null;
  recentPatients: { id: string; full_name: string; health_id: string | null }[];
}

export default function DoctorDashboardClient({
  profile,
  doctorProfile,
  recentPatients,
}: DoctorDashboardClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [qrOpen, setQrOpen] = useState(false);

  // Use server action for search — eliminates 3 client→Supabase round-trips
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchError('');
    const normalized = normalizeHealthId(searchInput.trim());
    if (!isValidHealthId(normalized)) {
      setSearchError('Invalid Health ID format. Expected: HV-XXXX-XXXX');
      return;
    }
    const formData = new FormData();
    formData.set('healthId', normalized);
    startTransition(async () => {
      const result = await searchPatient(null, formData);
      // If result is returned (not redirected), it means there was an error
      if (result?.error) {
        setSearchError(result.error);
      }
    });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace('/login');
  };

  const profileIncomplete = !doctorProfile?.registration_number;
  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '?';

  const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'Doctor';

  return (
    <>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* App Bar */}
        <AppBar position="sticky" color="inherit" elevation={0}>
          <Toolbar sx={{ minHeight: '56px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: 1.5,
                  background: 'linear-gradient(135deg, #047857, #10B981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ color: 'white', fontSize: 11, fontWeight: 800 }}>HV</Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: 'secondary.main', fontSize: '1rem' }}
              >
                HealthVault
              </Typography>
            </Box>
            <Chip
              icon={<MedicalServicesIcon sx={{ fontSize: 13 }} />}
              label="Doctor"
              size="small"
              sx={{
                mr: 1,
                bgcolor: 'rgba(5,150,105,0.15)',
                color: 'success.main',
                fontWeight: 600,
                height: 26,
              }}
            />
            <ThemeToggle />
            <IconButton
              onClick={() => router.push('/dashboard/doctor/profile')}
              size="small"
              aria-label="View profile"
            >
              <PersonIcon sx={{ fontSize: 22 }} />
            </IconButton>
            <IconButton onClick={handleLogout} size="small" aria-label="Logout" sx={{ ml: 0.5 }}>
              <LogoutIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ px: 2, py: 2.5, maxWidth: 640, mx: 'auto' }}>
          {/* Profile Incomplete Banner */}
          {profileIncomplete && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              action={
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => router.push('/dashboard/doctor/profile')}
                >
                  Complete
                </Button>
              }
              sx={{ mb: 2.5 }}
            >
              Complete your profile to get verified
            </Alert>
          )}

          {/* Welcome header */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}
            className="animate-fade-in-up"
          >
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background: 'linear-gradient(135deg, #047857, #10B981)',
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
              }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Dr. {firstName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {doctorProfile?.specialization ||
                  doctorProfile?.qualification ||
                  'General Medicine'}
                {doctorProfile?.clinic_name && ` · ${doctorProfile.clinic_name}`}
              </Typography>
            </Box>
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }} className="animate-fade-in-up">
            <Card
              sx={{
                flex: 1,
                textAlign: 'center',
                bgcolor: 'rgba(5,150,105,0.08)',
                border: '1px solid rgba(5,150,105,0.30)',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 800 }}>
                  {recentPatients.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Patients Seen
                </Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                flex: 1,
                textAlign: 'center',
                bgcolor: doctorProfile?.is_verified
                  ? 'rgba(5,150,105,0.08)'
                  : 'rgba(245,158,11,0.08)',
                border: `1px solid ${doctorProfile?.is_verified ? 'rgba(5,150,105,0.30)' : 'rgba(245,158,11,0.35)'}`,
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: doctorProfile?.is_verified ? 'success.main' : 'warning.main',
                    fontWeight: 800,
                  }}
                >
                  {doctorProfile?.is_verified ? '✓' : '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {doctorProfile?.is_verified ? 'Verified' : 'Unverified'}
                </Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                flex: 1,
                textAlign: 'center',
                bgcolor: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.25)',
                boxShadow: 'none',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(37,99,235,0.14)' },
              }}
              onClick={() => router.push('/dashboard/doctor/profile')}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 800 }}>
                  →
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  My Profile
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* QR Scanner Button — Primary Action */}
          <Card
            className="animate-fade-in-up"
            sx={{
              mb: 3,
              bgcolor: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.25)',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <QrCodeScannerIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  Scan patient QR code
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Quick access — scan instead of typing Health ID
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => setQrOpen(true)}
                sx={{ fontWeight: 600, textTransform: 'none' }}
              >
                Scan
              </Button>
            </CardContent>
          </Card>

          {/* Search Card — Primary Element */}
          <Card
            className="animate-fade-in-up"
            sx={{
              mb: 3,
              boxShadow: '0 2px 12px rgba(5,150,105,0.1)',
              border: '1px solid rgba(5,150,105,0.30)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>
                Look up a patient
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Ask the patient for their Health ID (format: HV-XXXX-XXXX)
              </Typography>

              <Box component="form" onSubmit={handleSearch}>
                <TextField
                  fullWidth
                  placeholder="HV-XXXX-XXXX"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value.toUpperCase());
                    setSearchError('');
                  }}
                  required
                  sx={{ mb: searchError ? 1.5 : 2 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'secondary.main' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        bgcolor: 'background.default',
                      },
                    },
                  }}
                />
                {searchError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {searchError}
                  </Alert>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  fullWidth
                  size="large"
                  disabled={isPending || !searchInput.trim()}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ py: 1.5, fontSize: '1rem', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
                >
                  {isPending ? 'Searching...' : 'View Patient Records'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* First-time info for new doctors */}
          {recentPatients.length === 0 && (
            <Card
              sx={{
                mb: 3,
                bgcolor: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.30)',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: 'warning.dark', mb: 0.5 }}
                >
                  How it works
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask your patient for their HealthVault Health ID. Type it above to see their
                  shared medical history — prescriptions, lab reports, and scans from any clinic.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Recent Patients */}
          {recentPatients.length > 0 && (
            <Box className="animate-fade-in-up">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: '0.75rem',
                  }}
                >
                  Recent Patients
                </Typography>
              </Box>
              <Card>
                {recentPatients.map((patient, idx) => (
                  <Box key={patient.id}>
                    <CardActionArea
                      onClick={() =>
                        patient.health_id
                          ? router.push(
                              `/dashboard/doctor/patient/${encodeURIComponent(patient.health_id)}`
                            )
                          : undefined
                      }
                    >
                      <CardContent
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          '&:last-child': { pb: 2 },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: 'rgba(5,150,105,0.15)',
                            color: 'success.main',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                          }}
                        >
                          {patient.full_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                            {patient.full_name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'var(--font-mono)',
                              color: 'text.secondary',
                              fontWeight: 500,
                            }}
                          >
                            {patient.health_id}
                          </Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </CardContent>
                    </CardActionArea>
                    {idx < recentPatients.length - 1 && <Divider />}
                  </Box>
                ))}
              </Card>
            </Box>
          )}
        </Box>
      </Box>

      {/* Floating AI Assistant */}
      <DoctorAIAssistant
        profile={profile}
        doctorProfile={doctorProfile}
        recentPatients={recentPatients}
      />

      {/* QR Scanner Dialog */}
      <QRScannerDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onScan={(healthId) => {
          setQrOpen(false);
          router.push(`/dashboard/doctor/patient/${encodeURIComponent(healthId)}`);
        }}
      />
    </>
  );
}
