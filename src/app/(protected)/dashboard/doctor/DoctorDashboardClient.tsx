'use client';

import { useState } from 'react';
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
import { createClient } from '@/lib/supabase/client';
import { Profile, DoctorProfile } from '@/types';
import { isValidHealthId, normalizeHealthId } from '@/lib/utils/health-id';

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
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const normalized = normalizeHealthId(searchInput.trim());

    if (!isValidHealthId(normalized)) {
      setSearchError('Invalid Health ID format. Expected: HV-XXXX-XXXX');
      return;
    }

    setSearching(true);
    try {
      const supabase = createClient();

      // Check rate limit BEFORE inserting the search attempt
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('search_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', profile.id)
        .gte('searched_at', oneHourAgo);

      if (count && count >= 10) {
        setSearchError('Search limit reached (10 per hour). Please try again later.');
        setSearching(false);
        return;
      }

      // Insert search attempt after the rate-limit guard
      await supabase.from('search_attempts').insert({
        doctor_id: profile.id,
        searched_health_id: normalized,
        found: false,
      });

      router.push(`/dashboard/doctor/patient/${encodeURIComponent(normalized)}`);
    } catch {
      setSearchError('Something went wrong. Please try again.');
      setSearching(false);
    }
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
      <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
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
              sx={{ mr: 1, bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600, height: 26 }}
            />
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
                bgcolor: '#F0FDF4',
                border: '1px solid #A7F3D0',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h4" sx={{ color: '#059669', fontWeight: 800 }}>
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
                bgcolor: doctorProfile?.is_verified ? '#F0FDF4' : '#FFF7ED',
                border: `1px solid ${doctorProfile?.is_verified ? '#A7F3D0' : '#FDE68A'}`,
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: doctorProfile?.is_verified ? '#059669' : '#D97706',
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
                bgcolor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                boxShadow: 'none',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#DBEAFE' },
              }}
              onClick={() => router.push('/dashboard/doctor/profile')}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h4" sx={{ color: '#2563EB', fontWeight: 800 }}>
                  →
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  My Profile
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Search Card — Primary Element */}
          <Card
            className="animate-fade-in-up"
            sx={{ mb: 3, boxShadow: '0 2px 12px rgba(5,150,105,0.1)', border: '1px solid #A7F3D0' }}
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
                          <SearchIcon sx={{ color: '#059669' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        bgcolor: '#F9FAFB',
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
                  disabled={searching || !searchInput.trim()}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ py: 1.5, fontSize: '1rem', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
                >
                  {searching ? 'Searching...' : 'View Patient Records'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* First-time info for new doctors */}
          {recentPatients.length === 0 && (
            <Card
              sx={{ mb: 3, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', boxShadow: 'none' }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400E', mb: 0.5 }}>
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
                            bgcolor: '#D1FAE5',
                            color: '#047857',
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
                        <ArrowForwardIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
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
    </>
  );
}
