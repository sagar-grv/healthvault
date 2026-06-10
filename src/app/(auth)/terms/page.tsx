'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createClient } from '@/lib/supabase/client';
import { acceptTerms } from '@/lib/actions/consent';

export default function TermsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || '';
  const redirectPath =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard';
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setScrolledToBottom(isAtBottom);
  };

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to accept terms. Please log in first.');
        setAccepting(false);
        return;
      }
      await acceptTerms();
      router.push(redirectPath);
    } catch {
      setError('Failed to accept terms. Please try again.');
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mb: 2 }}>
        Back
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Terms & Conditions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Last updated: June 2026
      </Typography>

      <Card>
        <CardContent>
          <Box
            ref={contentRef}
            onScroll={handleScroll}
            sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}
          >
            <Typography variant="h6" gutterBottom>
              Terms of Service
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Welcome to HealthVault. By using our service, you agree to these terms and conditions.
              HealthVault is a digital health records platform that enables patients to upload,
              store, and share medical records with doctors using a unique Health ID.
            </Typography>
            <Typography sx={{ mb: 2 }}>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Privacy Policy
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Your privacy is important to us. We collect only the information necessary to provide
              our services. Your medical data is stored securely using industry-standard encryption.
            </Typography>
            <Typography sx={{ mb: 2 }}>
              You have the right to access, modify, or delete your personal data at any time.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Data Sharing Consent
            </Typography>
            <Typography sx={{ mb: 2 }}>
              HealthVault allows you to share your medical records with verified healthcare
              providers. You control which reports are shared and can revoke access at any time.
            </Typography>

            {!scrolledToBottom && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2, textAlign: 'center' }}
              >
                ↑ Scroll to read the full terms ↑
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button variant="outlined" fullWidth size="large" onClick={handleLogin} sx={{ py: 1.5 }}>
          Log In
        </Button>
        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={!scrolledToBottom || accepting}
          onClick={handleAccept}
          sx={{ py: 1.5 }}
        >
          {accepting ? 'Accepting...' : 'I Agree'}
        </Button>
      </Box>
    </Container>
  );
}
