'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import FavoriteIcon from '@mui/icons-material/Favorite';
import GoogleIcon from '@mui/icons-material/Google';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'setup_failed') return 'Account setup failed. Please try registering again.';
    if (errorParam === 'session_expired') return 'Your session has expired. Please sign in again.';
    return '';
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}
        >
          <FavoriteIcon sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
          HealthVault
        </Typography>
      </Box>

      {/* Login Card */}
      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h4" sx={{ mb: 0.75, fontWeight: 700 }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
            Access your HealthVault account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, mb: 2, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
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
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{
              py: 1.25,
              borderColor: 'divider',
              color: 'text.primary',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'action.focus' },
            }}
          >
            Sign in with Google
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">
              New to HealthVault?
            </Typography>
          </Divider>

          {/* Two clear register buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              component={Link}
              href="/register/patient"
              variant="outlined"
              fullWidth
              size="large"
              sx={{
                py: 1.25,
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.light' },
              }}
            >
              Register as a Patient
            </Button>
            <Button
              component={Link}
              href="/register/doctor"
              variant="outlined"
              fullWidth
              size="large"
              sx={{
                py: 1.25,
                borderColor: 'secondary.main',
                color: 'secondary.main',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover', borderColor: 'secondary.light' },
              }}
            >
              Register as a Doctor
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        Your health data is encrypted and private by default.
      </Typography>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
