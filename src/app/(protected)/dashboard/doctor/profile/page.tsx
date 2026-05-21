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
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import { MEDICAL_COUNCILS } from '@/constants';
import { createClient } from '@/lib/supabase/client';

export default function DoctorProfilePage() {
  const router = useRouter();

  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Doctor profile state
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [councilName, setCouncilName] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [city, setCity] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

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
        setIsVerified(doctorProfile.is_verified || false);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!registrationNumber || !councilName || !qualification) {
      setSnackbar({ open: true, message: 'Registration number, council and qualification are required.', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }

      const [profileRes, doctorRes] = await Promise.all([
        supabase.from('profiles').update({ full_name: fullName, phone: phone || null }).eq('id', user.id),
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

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/doctor')} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
            My Profile
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 3, maxWidth: 500, mx: 'auto' }}>

        {/* Avatar + Identity */}
        <Card sx={{ mb: 3, textAlign: 'center', py: 3 }}>
          <CardContent>
            <Avatar
              sx={{
                width: 80, height: 80, mx: 'auto', mb: 2,
                bgcolor: 'secondary.main', fontSize: '1.75rem', fontWeight: 700,
              }}
            >
              {initials || <MedicalServicesIcon sx={{ fontSize: 40 }} />}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {fullName || 'Doctor Name'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {email}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Doctor" color="secondary" size="small" />
              {isVerified ? (
                <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />
              ) : (
                <Chip icon={<PendingIcon />} label="Unverified" size="small" variant="outlined" />
              )}
            </Box>
            {!isVerified && (
              <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                Complete your profile details to get verified by admin.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Personal Details</Typography>
            <TextField
              fullWidth label="Full Name" value={fullName}
              onChange={e => setFullName(e.target.value)} sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Email" value={email}
              disabled helperText="Email cannot be changed" sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Phone (Optional)" value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </CardContent>
        </Card>

        {/* Medical Credentials */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Medical Credentials</Typography>
            <TextField
              fullWidth label="Registration Number" value={registrationNumber}
              onChange={e => setRegistrationNumber(e.target.value)}
              required placeholder="e.g., MH-12345" sx={{ mb: 2 }}
            />
            <TextField
              fullWidth select label="Medical Council" value={councilName}
              onChange={e => setCouncilName(e.target.value)}
              required sx={{ mb: 2 }}
            >
              {MEDICAL_COUNCILS.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth label="Qualification" value={qualification}
              onChange={e => setQualification(e.target.value)}
              required placeholder="e.g., MBBS, MD (Medicine)" sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Specialization (Optional)" value={specialization}
              onChange={e => setSpecialization(e.target.value)}
              placeholder="e.g., General Medicine, Cardiology"
            />
          </CardContent>
        </Card>

        {/* Practice Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Practice Details</Typography>
            <TextField
              fullWidth label="Clinic / Hospital Name (Optional)" value={clinicName}
              onChange={e => setClinicName(e.target.value)}
              placeholder="e.g., City Health Clinic" sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Clinic Address (Optional)" value={clinicAddress}
              onChange={e => setClinicAddress(e.target.value)}
              multiline rows={2}
              placeholder="Street, Area" sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="City (Optional)" value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g., Mumbai"
            />
          </CardContent>
        </Card>

        {/* ABDM Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>ABDM / HPR Integration</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Link your Healthcare Professionals Registry (HPR) ID for official ABDM verification.
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">HPR ID</Typography>
              <Chip label="Coming Soon" size="small" variant="outlined" />
            </Box>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          variant="contained" fullWidth size="large"
          onClick={handleSave} disabled={saving}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
