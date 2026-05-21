'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { MEDICAL_COUNCILS } from '@/constants';
import { createClient } from '@/lib/supabase/client';

export default function DoctorOnboardingPage() {
  const router = useRouter();
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [councilName, setCouncilName] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Session expired. Please login again.');
        return;
      }

      // Update doctor profile
      const { error: updateError } = await supabase
        .from('doctor_profiles')
        .update({
          registration_number: registrationNumber,
          council_name: councilName,
          qualification,
          specialization: specialization || null,
          clinic_name: clinicName || null,
          city: city || null,
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', user.id);

      router.push('/dashboard/doctor');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('id', user.id);
      }

      router.push('/dashboard/doctor');
      router.refresh();
    } catch {
      router.push('/dashboard/doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Complete Your Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This helps patients trust their data with verified professionals.
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Profile Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Medical Registration Number"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              required
              placeholder="e.g., 12345"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Medical Council"
              value={councilName}
              onChange={(e) => setCouncilName(e.target.value)}
              required
              sx={{ mb: 2 }}
            >
              {MEDICAL_COUNCILS.map((council) => (
                <MenuItem key={council} value={council}>
                  {council}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Qualification"
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
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Clinic Name (Optional)"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="e.g., City Health Clinic"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="City (Optional)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Mumbai"
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mb: 1 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Save & Continue'
              )}
            </Button>

            <Button
              variant="text"
              fullWidth
              onClick={handleSkip}
              disabled={loading}
              sx={{ color: 'text.secondary' }}
            >
              Skip for now
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
