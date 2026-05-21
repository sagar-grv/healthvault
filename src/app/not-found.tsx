'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        textAlign: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Typography variant="h1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </Typography>
      <Button
        component={Link}
        href="/"
        variant="contained"
        startIcon={<HomeIcon />}
      >
        Go Home
      </Button>
    </Box>
  );
}
