'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { MEDICAL_COUNCILS } from '@/constants';
import { createClient } from '@/lib/supabase/client';

// ── Welcome slides data ─────────────────────────────────────────────────────

const welcomeSteps = [
  {
    icon: <MedicalServicesIcon sx={{ fontSize: 48, color: 'white' }} />,
    gradient: 'linear-gradient(135deg, #047857, #10B981)',
    glow: 'rgba(5,150,105,0.30)',
    badge: 'rgba(5,150,105,0.12)',
    badgeText: 'success.main',
    title: 'Welcome to HealthVault',
    description:
      "See your patient's complete medical history — prescriptions, lab reports, and scans from any clinic. All in one search.",
  },
  {
    icon: <SearchIcon sx={{ fontSize: 48, color: 'white' }} />,
    gradient: 'linear-gradient(135deg, #047857, #10B981)',
    glow: 'rgba(5,150,105,0.30)',
    badge: 'rgba(5,150,105,0.12)',
    badgeText: 'success.main',
    title: 'Search Any Patient',
    description:
      "Ask your patient for their Health ID. Type it in. Instantly see all the records they've chosen to share with you. Every access is logged.",
  },
  {
    icon: <VerifiedIcon sx={{ fontSize: 48, color: 'white' }} />,
    gradient: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
    glow: 'rgba(37,99,235,0.30)',
    badge: 'rgba(37,99,235,0.12)',
    badgeText: 'primary.main',
    title: 'Complete Your Profile',
    description:
      'Add your registration number, council, and qualification. This gets you verified — and patients will trust you with their records.',
  },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default function DoctorOnboardingPage() {
  const router = useRouter();

  // Welcome slides state
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Profile form state — unchanged from original
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [councilName, setCouncilName] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  // ── Existing handlers — untouched ────────────────────────────────────────

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

      const { error: updateError } = await supabase
        .from('doctor_profiles')
        .update({
          registration_number: registrationNumber,
          council_name: councilName,
          qualification,
          specialization: specialization || null,
          clinic_name: clinicName || null,
          city: city || null,
          verification_state: 'pending',
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Upload certificate if provided
      if (certificateFile) {
        const filePath = `certificates/${user.id}/${certificateFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('certificates')
          .upload(filePath, certificateFile, { contentType: certificateFile.type, upsert: true });

        if (!uploadErr) {
          await supabase
            .from('doctor_profiles')
            .update({ certificate_path: filePath })
            .eq('id', user.id);
        }
      }

      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);

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
        await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);
      }

      router.push('/dashboard/doctor');
      router.refresh();
    } catch {
      router.push('/dashboard/doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Certificate file must be less than 10MB');
      return;
    }

    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!acceptedTypes.includes(file.type)) {
      setError('Accepted formats: PDF, JPEG, JPG, PNG');
      return;
    }

    setCertificateFile(file);
    setError('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setCertificatePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setCertificatePreview('pdf');
    }
  };

  // ── Welcome slides ───────────────────────────────────────────────────────

  if (showWelcome) {
    const s = welcomeSteps[activeSlide];
    const isLast = activeSlide === welcomeSteps.length - 1;

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
          {welcomeSteps.map((_, i) => (
            <Box
              key={i}
              sx={{
                height: 5,
                width: i === activeSlide ? 28 : 8,
                borderRadius: 99,
                bgcolor: i === activeSlide ? 'secondary.main' : 'divider',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>

        {/* Main content */}
        <Box
          key={activeSlide}
          className="animate-fade-in-up"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 4,
          }}
        >
          {/* Icon Avatar */}
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
              {String(activeSlide + 1).padStart(2, '0')} OF {welcomeSteps.length}
            </Typography>
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
            {s.title}
          </Typography>
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
            color="secondary"
            fullWidth
            size="large"
            endIcon={!isLast ? <ArrowForwardIcon /> : null}
            onClick={isLast ? () => setShowWelcome(false) : () => setActiveSlide((p) => p + 1)}
            sx={{
              py: 1.875,
              borderRadius: 3,
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(5,150,105,0.30)',
              mb: 1,
            }}
          >
            {isLast ? 'Set Up Profile →' : 'Next'}
          </Button>
          <Button
            variant="text"
            fullWidth
            onClick={handleSkip}
            disabled={loading}
            sx={{ color: 'text.disabled', '&:hover': { transform: 'none' } }}
          >
            Skip for now
          </Button>
        </Box>
      </Box>
    );
  }

  // ── Profile form — exactly as original, with styled green header ─────────

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
        {/* Green header — matches doctor profile hero */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)',
            px: 3,
            pt: 3,
            pb: 2.5,
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
            Complete Your Profile
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Required to get verified by admin
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

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

            {/* Certificate Upload (Optional) */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Upload Registration Certificate (Optional)
              </Typography>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', mb: 1.5 }}
              >
                PDF, JPEG, JPG, or PNG — Max 10MB
              </Typography>

              {certificatePreview ? (
                <Box sx={{ position: 'relative' }}>
                  {certificatePreview === 'pdf' ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <InsertDriveFileIcon sx={{ color: 'error.main' }} />
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {certificateFile?.name}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setCertificateFile(null);
                          setCertificatePreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        component="img"
                        src={certificatePreview}
                        alt="Certificate preview"
                        sx={{
                          width: '100%',
                          maxHeight: 200,
                          objectFit: 'contain',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCertificateFile(null);
                          setCertificatePreview(null);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ) : (
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ py: 2, borderStyle: 'dashed', borderRadius: 2 }}
                >
                  Choose Certificate
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleCertificateChange}
                  />
                </Button>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mb: 1 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Save & Continue'}
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
