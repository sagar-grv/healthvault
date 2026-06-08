'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GoogleIcon from '@mui/icons-material/Google';
import { createClient } from '@/lib/supabase/client';

export default function PatientRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: 'patient' } },
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      window.location.href = '/dashboard';
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/patient`,
        },
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch {
      setError('Could not connect to Google. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      {/* Back button */}
      <Box sx={{ width: '100%', maxWidth: 420, mb: 2 }}>
        <IconButton onClick={() => router.push('/register')} sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          borderRadius: 3,
          border: '1px solid #E5E7EB',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Role badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 2.5,
              p: 1.5,
              bgcolor: '#EFF6FF',
              borderRadius: 2,
              border: '1px solid #BFDBFE',
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PersonIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: '#1D4ED8', lineHeight: 1.2 }}
              >
                Patient Account
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Get your unique Health ID
              </Typography>
            </Box>
          </Box>

          <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 700 }}>
            Create account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Already have one?{' '}
            <Link
              href="/login"
              style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              helperText="At least 6 characters"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Patient Account'}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">
              or
            </Typography>
          </Divider>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleRegister}
            disabled={loading}
            sx={{
              py: 1.25,
              borderColor: '#E5E7EB',
              color: '#374151',
              bgcolor: 'white',
              '&:hover': { bgcolor: '#F9FAFB', borderColor: '#D1D5DB' },
            }}
          >
            Sign up with Google
          </Button>

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
              Are you a doctor?
            </Typography>
          </Divider>
          <Button
            component={Link}
            href="/register/doctor"
            variant="outlined"
            fullWidth
            sx={{
              py: 1.25,
              borderColor: '#A7F3D0',
              color: '#047857',
              bgcolor: '#F0FDF4',
              '&:hover': { bgcolor: '#D1FAE5', borderColor: '#6EE7B7', transform: 'none' },
            }}
          >
            Register as a Doctor instead
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
