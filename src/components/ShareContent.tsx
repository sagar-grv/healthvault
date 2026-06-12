'use client';

import { useState, useEffect } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { QRCodeSVG } from 'qrcode.react';

interface ShareContentProps {
  healthId: string;
  expiryTimestamp?: number;
}

function getTimeRemaining(expiryMs: number): string {
  const remaining = expiryMs - Date.now();
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function ShareContent({ healthId, expiryTimestamp }: ShareContentProps) {
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string | undefined>(
    expiryTimestamp ? getTimeRemaining(expiryTimestamp) : undefined
  );

  // Update countdown every minute
  useEffect(() => {
    if (!expiryTimestamp) return;
    const interval = setInterval(() => {
      setExpiresIn(getTimeRemaining(expiryTimestamp));
    }, 60_000);
    return () => clearInterval(interval);
  }, [expiryTimestamp]);

  const copyId = async () => {
    await navigator.clipboard.writeText(healthId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MUIThemeProvider theme={lightTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 3 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <LinkIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
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
              <QRCodeSVG value={healthId} size={140} level="M" />
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
              {healthId}
            </Typography>

            {expiresIn && expiresIn !== 'Expired' && (
              <Chip
                label={`Expires in ${expiresIn}`}
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

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Enter this ID in HealthVault to request access to medical records.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MUIThemeProvider>
  );
}
