'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { isOnline, onOnlineStatusChange } from '@/lib/offline/db';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(() => isOnline());

  useEffect(() => {
    const unsub = onOnlineStatusChange(setOnline);
    return unsub;
  }, []);

  if (online) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        bgcolor: '#F59E0B',
        color: '#78350F',
        py: 1,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <CloudOffIcon sx={{ fontSize: 18 }} />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        You&apos;re offline — changes will sync when reconnected
      </Typography>
    </Box>
  );
}
