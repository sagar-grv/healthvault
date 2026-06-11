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
import Fab from '@mui/material/Fab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MedicalServicesIcon from '@mui/icons-material/MedicalServicesOutlined';
import HomeIcon from '@mui/icons-material/Home';
import QrCodeIcon from '@mui/icons-material/QrCode2';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { createClient } from '@/lib/supabase/client';
import { Profile, DoctorProfile } from '@/types';
import { isValidHealthId, normalizeHealthId } from '@/lib/utils/health-id';
import ThemeToggle from '@/components/ThemeToggle';
import SharedWithMeSection from '@/components/doctor/SharedWithMeSection';
import { searchPatient } from './actions';
import { QRCodeSVG } from 'qrcode.react';

const DoctorAIAssistant = dynamic(() => import('@/components/doctor/DoctorAIAssistant'), {
  ssr: false,
});

interface SharedReport {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_health_id?: string;
  report_title?: string;
  report_type?: string;
  shared_at: string;
  viewed_at: string | null;
}

interface DoctorDashboardClientProps {
  profile: Profile;
  doctorProfile: DoctorProfile | null;
  recentPatients: { id: string; full_name: string; health_id: string | null }[];
  sharedReports: SharedReport[];
}

export default function DoctorDashboardClient({
  profile,
  doctorProfile,
  recentPatients,
  sharedReports,
}: DoctorDashboardClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [navValue, setNavValue] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

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
      if (result?.error) setSearchError(result.error);
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

  const doctorShareUrl = profile.id
    ? `https://healthvault-dusky.vercel.app/doctor-share/${profile.id}`
    : '';

  const handleCopyLink = async () => {
    if (!doctorShareUrl) return;
    try {
      await navigator.clipboard.writeText(doctorShareUrl);
      setSnackbar({ open: true, message: 'Link copied!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Could not copy.', severity: 'error' });
    }
  };

  return (
    <>
      <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
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
              aria-label="Profile"
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
          </Box>

          {/* Search Card */}
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

          {/* Shared with Me */}
          <SharedWithMeSection reports={sharedReports} />

          {/* First-time info */}
          {recentPatients.length === 0 && sharedReports.length === 0 && (
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
                  shared medical history.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Bottom Navigation */}
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }} elevation={0}>
          <BottomNavigation
            value={navValue}
            onChange={(_, v) => {
              setNavValue(v);
              if (v === 0) router.push('/dashboard/doctor');
              if (v === 1) router.push('/dashboard/doctor/patients');
              if (v === 2) router.push('/dashboard/doctor/profile');
            }}
            showLabels
          >
            <BottomNavigationAction label="Home" icon={<HomeIcon />} />
            <BottomNavigationAction label="Patients" icon={<PeopleIcon />} />
            <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>

      {/* QR Popup Dialog */}
      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Your Doctor QR
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {profile.full_name} ·{' '}
            {doctorProfile?.specialization || doctorProfile?.qualification || 'Doctor'}
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              p: 2,
              bgcolor: 'white',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 2,
            }}
          >
            {profile.id && (
              <QRCodeSVG
                id="doctor-dashboard-qr"
                value={doctorShareUrl}
                size={200}
                level="M"
                fgColor="#047857"
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                const svg = document.getElementById('doctor-dashboard-qr');
                if (!svg) return;
                const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${profile.full_name || 'doctor'}-share-qr.svg`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              sx={{ fontSize: '0.75rem' }}
            >
              Download
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                const svg = document.getElementById('doctor-dashboard-qr');
                if (!svg) return;
                const w = window.open('', '_blank');
                if (!w) return;
                w.document.write(
                  `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0">${svg.outerHTML}</body></html>`
                );
                w.document.close();
                w.print();
              }}
              sx={{ fontSize: '0.75rem' }}
            >
              Print
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
              onClick={handleCopyLink}
              sx={{ fontSize: '0.75rem' }}
            >
              Copy Link
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Floating QR button — above AI Assistant */}
      <Fab
        aria-label="Your Scan-to-Share QR"
        onClick={() => setQrOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 'calc(144px + env(safe-area-inset-bottom, 0px))',
          right: 20,
          width: 56,
          height: 56,
          background: 'linear-gradient(135deg, #047857, #10B981)',
          color: 'white',
          boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
          zIndex: 1200,
          '&:hover': {
            background: 'linear-gradient(135deg, #065F46, #047857)',
            transform: 'scale(1.05)',
          },
          transition: 'transform 0.15s ease',
        }}
      >
        <QrCodeIcon sx={{ fontSize: 24 }} />
      </Fab>

      {/* Floating AI Assistant */}
      <DoctorAIAssistant
        profile={profile}
        doctorProfile={doctorProfile}
        recentPatients={recentPatients}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
