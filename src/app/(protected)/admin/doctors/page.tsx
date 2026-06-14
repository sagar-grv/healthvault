'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getAllDoctors } from '../actions';

interface Doctor {
  id: string;
  registration_number: string;
  council_name: string;
  qualification: string;
  verification_state: string;
  created_at: string;
  profiles: { full_name: string; email: string; health_id: string } | null;
}

const stateColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  admin_verified: 'success',
  auto_verified: 'success',
  pending: 'warning',
  rejected: 'error',
  unverified: 'default',
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await getAllDoctors();
      if ('doctors' in result) setDoctors(result.doctors as Doctor[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        All Doctors
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {doctors.length} registered doctor{doctors.length !== 1 ? 's' : ''}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {doctors.map((d) => (
          <Card
            key={d.id}
            component={Link}
            href={`/admin/doctors/${d.id}`}
            sx={{ textDecoration: 'none', '&:hover': { boxShadow: 4 } }}
          >
            <CardContent
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {d.profiles?.full_name ?? 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {d.registration_number} · {d.council_name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={d.verification_state.replace('_', ' ')}
                  color={stateColors[d.verification_state] ?? 'default'}
                  size="small"
                />
                <OpenInNewIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
