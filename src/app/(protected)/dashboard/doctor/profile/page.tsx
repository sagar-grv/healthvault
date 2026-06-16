'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import SaveIcon from '@mui/icons-material/Save';
import ThemeToggle from '@/components/ThemeToggle';
import { MEDICAL_COUNCILS } from '@/constants';
import { createClient } from '@/lib/supabase/client';
import { submitForVerification } from '../actions';
import { QRCodeSVG } from 'qrcode.react';

export default function DoctorProfilePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [councilName, setCouncilName] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [city, setCity] = useState('');
  const [verificationState, setVerificationState] = useState('unverified');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reSubmitting, setReSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const [{ data: profile }, { data: doctorProfile }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('doctor_profiles').select('*').eq('id', user.id).single(),
      ]);
      if (profile) {
        setFullName(profile.full_name || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
      }
      if (doctorProfile) {
        setRegistrationNumber(doctorProfile.registration_number || '');
        setCouncilName(doctorProfile.council_name || '');
        setQualification(doctorProfile.qualification || '');
        setSpecialization(doctorProfile.specialization || '');
        setClinicName(doctorProfile.clinic_name || '');
        setClinicAddress(doctorProfile.clinic_address || '');
        setCity(doctorProfile.city || '');
        setVerificationState(doctorProfile.verification_state || 'unverified');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!registrationNumber || !councilName || !qualification) {
      setSnackbar({
        open: true,
        message: 'Registration number, council and qualification are required.',
        severity: 'error',
      });
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaving(false);
        return;
      }
      const [profileRes, doctorRes] = await Promise.all([
        supabase
          .from('profiles')
          .update({ full_name: fullName, phone: phone || null })
          .eq('id', user.id),
        supabase.from('doctor_profiles').upsert({
          id: user.id,
          registration_number: registrationNumber,
          council_name: councilName,
          qualification,
          specialization: specialization || null,
          clinic_name: clinicName || null,
          clinic_address: clinicAddress || null,
          city: city || null,
        }),
      ]);
      if (profileRes.error || doctorRes.error) {
        setSnackbar({ open: true, message: 'Failed to save changes.', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Profile saved successfully.', severity: 'success' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Something went wrong.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResubmit = async () => {
    setReSubmitting(true);
    try {
      const result = await submitForVerification();
      if (result?.error) {
        setSnackbar({ open: true, message: result.error, severity: 'error' });
      } else {
        setVerificationState('pending');
        setSnackbar({
          open: true,
          message: 'Re-submitted for verification. Waiting for admin review.',
          severity: 'success',
        });
      }
    } catch {
      setSnackbar({ open: true, message: 'Something went wrong.', severity: 'error' });
    } finally {
      setReSubmitting(false);
    }
  };

  // Profile completion — drives the progress bar in the hero card
  const completionFields = [
    { label: 'Full Name', filled: !!fullName },
    { label: 'Registration No.', filled: !!registrationNumber },
    { label: 'Medical Council', filled: !!councilName },
    { label: 'Qualification', filled: !!qualification },
  ];
  const completionScore = completionFields.filter((f) => f.filled).length;
  const completionPct = (completionScore / completionFields.length) * 100;

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar — back + theme toggle + quick save */}
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.push('/dashboard/doctor')}
            aria-label="Back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 700, flexGrow: 1 }}>
            My Profile
          </Typography>
          <ThemeToggle />
          <Tooltip title="Save profile">
            <IconButton
              onClick={handleSave}
              disabled={saving}
              aria-label="Save profile"
              size="small"
              sx={{ ml: 0.5 }}
            >
              {saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SaveIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 2.5, maxWidth: 520, mx: 'auto' }}>
        {/* ── Clinical Hero Card ──────────────────────────────────────── */}
        <Card
          sx={{
            mb: 2,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #064E3B 0%, #047857 45%, #10B981 100%)',
            boxShadow: '0 8px 32px rgba(5,150,105,0.35)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Avatar + name row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
              <Avatar
                sx={{
                  width: 68,
                  height: 68,
                  bgcolor: 'rgba(255,255,255,0.18)',
                  border: '2px solid rgba(255,255,255,0.35)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {initials || <MedicalServicesIcon sx={{ fontSize: 32 }} />}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2, mb: 0.25 }}
                  noWrap
                >
                  {fullName || 'Doctor Name'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}
                  noWrap
                >
                  {[qualification, specialization].filter(Boolean).join(' · ') ||
                    'Medical Professional'}
                </Typography>
                {clinicName && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }} noWrap>
                    {clinicName}
                    {city ? `, ${city}` : ''}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Verification badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              {verificationState === 'admin_verified' ? (
                <Chip
                  icon={<VerifiedIcon sx={{ fontSize: 14, color: 'secondary.light !important' }} />}
                  label="Verified"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.18)',
                    color: 'white',
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.3)',
                    '& .MuiChip-icon': { color: '#6EE7B7' },
                  }}
                />
              ) : verificationState === 'pending' ? (
                <Chip
                  icon={<PendingIcon sx={{ fontSize: 14 }} />}
                  label="Pending Verification"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(251,191,36,0.25)',
                    color: '#FEF3C7',
                    fontWeight: 600,
                    border: '1px solid rgba(251,191,36,0.4)',
                  }}
                />
              ) : verificationState === 'rejected' ? (
                <Chip
                  icon={<PendingIcon sx={{ fontSize: 14 }} />}
                  label="Verification Rejected"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(239,68,68,0.25)',
                    color: '#FCA5A5',
                    fontWeight: 600,
                    border: '1px solid rgba(239,68,68,0.4)',
                  }}
                />
              ) : (
                <Chip
                  icon={<PendingIcon sx={{ fontSize: 14 }} />}
                  label="Unverified"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
              )}
              <Chip
                label="Doctor"
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontWeight: 600,
                }}
              />
            </Box>

            {/* Re-submit for verification (shown when rejected) */}
            {verificationState === 'rejected' && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleResubmit}
                disabled={reSubmitting}
                sx={{
                  mt: 1.5,
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.4)',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                {reSubmitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  'Re-submit for Verification'
                )}
              </Button>
            )}

            {/* Profile completion progress */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}
                >
                  Profile Completion
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}
                >
                  {completionScore} / {completionFields.length}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionPct}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.20)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: completionPct === 100 ? '#6EE7B7' : '#FCD34D',
                    borderRadius: 3,
                  },
                }}
              />
              {completionPct < 100 && (
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.55)', mt: 0.5, display: 'block' }}
                >
                  Fill in{' '}
                  {completionFields
                    .filter((f) => !f.filled)
                    .map((f) => f.label)
                    .join(', ')}{' '}
                  to get verified
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* ── Personal Details ─────────────────────────────────────────── */}
        <Card sx={{ mb: 2, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Personal Details
            </Typography>
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              value={email}
              disabled
              helperText="Email cannot be changed"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone (Optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </CardContent>
        </Card>

        {/* ── Medical Credentials ──────────────────────────────────────── */}
        <Card
          sx={{
            mb: 2,
            borderRadius: 3,
            borderLeft: '3px solid',
            borderLeftColor: 'secondary.main',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Medical Credentials
              </Typography>
              <Chip
                label="Required for verification"
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 20 }}
              />
            </Box>
            <TextField
              fullWidth
              label="Registration Number *"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              required
              placeholder="e.g., MH-12345"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Medical Council *"
              value={councilName}
              onChange={(e) => setCouncilName(e.target.value)}
              required
              sx={{ mb: 2 }}
            >
              {MEDICAL_COUNCILS.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Qualification *"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              required
              placeholder="e.g., MBBS, MD (Medicine)"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Specialization (Optional)"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g., General Medicine, Cardiology"
            />
          </CardContent>
        </Card>

        {/* ── Practice Details ─────────────────────────────────────────── */}
        <Card sx={{ mb: 2, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Practice Details
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                optional
              </Typography>
            </Typography>
            <TextField
              fullWidth
              label="Clinic / Hospital Name"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="e.g., City Health Clinic"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Clinic Address"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              multiline
              rows={2}
              placeholder="Street, Area"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Mumbai"
            />
          </CardContent>
        </Card>

        {/* ── QR Code ───────────────────────────────────────────────────── */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Your QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Patients can scan this QR to share their medical reports with you.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  display: 'inline-block',
                }}
              >
                <QRCodeSVG
                  value={`hv-doctor:${userId}`}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                  level="H"
                  includeMargin={false}
                />
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Format: hv-doctor:{'{'}userId{'}'}
            </Typography>
          </CardContent>
        </Card>

        {/* Save button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleSave}
          disabled={saving}
          color="secondary"
          sx={{ py: 1.75, borderRadius: 2, boxShadow: '0 4px 14px rgba(5,150,105,0.30)' }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
        </Button>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'error.light', mt: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: 'error.main' }}>
              Danger Zone
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => setDeleteConfirmOpen(true)}
              sx={{ borderRadius: 2, py: 1 }}
            >
              Delete My Account
            </Button>
          </CardContent>
        </Card>

        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>Delete your account?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              This will permanently delete:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 1 }}>
              <li>
                <Typography variant="body2">Your doctor profile</Typography>
              </li>
              <li>
                <Typography variant="body2">Certificate uploads</Typography>
              </li>
              <li>
                <Typography variant="body2">Patient access history</Typography>
              </li>
              <li>
                <Typography variant="body2">Verification records</Typography>
              </li>
            </Box>
            <Alert severity="error" sx={{ mt: 1 }}>
              This cannot be undone. You will be signed out immediately.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                const { deleteAccount } =
                  await import('@/app/(protected)/dashboard/doctor/actions');
                const result = await deleteAccount();
                if (result.error) {
                  setSnackbar({ open: true, message: result.error, severity: 'error' });
                  setDeleting(false);
                  setDeleteConfirmOpen(false);
                } else {
                  router.replace('/');
                }
              }}
            >
              {deleting ? <CircularProgress size={20} color="inherit" /> : 'Yes, Delete Account'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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
    </Box>
  );
}
