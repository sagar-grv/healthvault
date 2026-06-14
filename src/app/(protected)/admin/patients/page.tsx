'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { getAllPatients } from '../actions';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  health_id: string;
  created_at: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await getAllPatients();
      if ('patients' in result) setPatients(result.patients as Patient[]);
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
        All Patients
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {patients.length} registered patient{patients.length !== 1 ? 's' : ''}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {patients.map((p) => (
          <Card key={p.id}>
            <CardContent
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {p.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {p.email} · {p.health_id}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Joined {new Date(p.created_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
