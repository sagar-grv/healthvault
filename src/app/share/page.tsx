'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@/lib/theme';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { QRCodeSVG } from 'qrcode.react';

function checkExpiry(hid: string | null, exp: string | null) {
  if (!hid) return { valid: false, reason: 'No Health ID provided.' };
  if (!exp) return { valid: true, healthId: hid, expired: false };

  const expiryMs = parseInt(exp, 10);
  if (isNaN(expiryMs)) return { valid: true, healthId: hid, expired: false };

  const now = Date.now();
  if (now > expiryMs) {
    const expiredAgo = new Date(expiryMs);
    return {
      valid: false,
      reason: `This link expired on ${expiredAgo.toLocaleDateString()} at ${expiredAgo.toLocaleTimeString()}.`,
    };
  }

  const remaining = expiryMs - now;
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const expiresIn = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return { valid: true, healthId: hid, expired: false, expiresIn };
}

export default function SharePage() {
  const searchParams = useSearchParams();
  const hid = searchParams.get('hid');
  const exp = searchParams.get('exp');
  const [copied, setCopied] = useState(false);
  const [result] = useState(() => checkExpiry(hid, exp));

  const copyId = async () => {
    if (!result.valid || !result.healthId) return;
    await navigator.clipboard.writeText(result.healthId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MUIThemeProvider theme={lightTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#F9FAFB',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 3 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            {!result.valid ? (
              <>
                <WarningAmberIcon sx={{ fontSize: 48, color: '#F59E0B', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Link Expired
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.reason}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Ask the patient to share a new link.
                </Typography>
              </>
            ) : (
              <>
                <LinkIcon sx={{ fontSize: 36, color: '#2563EB', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  HealthVault Share
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Health ID shared with you
                </Typography>

                <Box
                  sx={{
                    display: 'inline-block',
                    bgcolor: 'white',
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                >
                  <QRCodeSVG value={result.healthId!} size={140} level="M" />
                </Box>

                <Typography
                  sx={{
                    fontSize: '1.8rem',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    color: 'primary.main',
                    letterSpacing: '0.12em',
                    mb: 1,
                  }}
                >
                  {result.healthId}
                </Typography>

                {result.expiresIn && (
                  <Chip
                    label={`Expires in ${result.expiresIn}`}
                    size="small"
                    sx={{
                      mb: 2,
                      bgcolor: 'rgba(217,119,6,0.12)',
                      color: '#d97706',
                      fontWeight: 600,
                    }}
                  />
                )}

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                  onClick={copyId}
                  sx={{ py: 1.5, borderRadius: 2 }}
                >
                  {copied ? 'Copied!' : 'Copy Health ID'}
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 2 }}
                >
                  Enter this ID in HealthVault to request access to medical records.
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </MUIThemeProvider>
  );
}
