'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmergencyCardSetup from '@/components/patient/EmergencyCardSetup';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function EmergencyCardPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    router.push('/dashboard/patient');
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={handleClose}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Emergency card
        </Typography>
      </Box>
      <EmergencyCardSetup open={open} onClose={handleClose} />
    </Box>
  );
}
