'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getAllPatients } from '../actions';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  health_id: string;
  created_at: string;
  deleted_at: string | null;
  deletion_scheduled_at: string | null;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchData = useCallback(async (includeDeleted: boolean) => {
    setLoading(true);
    const result = await getAllPatients(includeDeleted);
    if ('patients' in result) setPatients(result.patients as Patient[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await getAllPatients(showDeleted);
      if (!cancelled && 'patients' in result) setPatients(result.patients as Patient[]);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [showDeleted]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          All Patients
        </Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => fetchData(showDeleted)}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {patients.length} registered patient{patients.length !== 1 ? 's' : ''}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="caption">Show Deleted</Typography>}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {patients.map((p) => (
          <Card key={p.id} sx={{ opacity: p.deleted_at ? 0.6 : 1 }}>
            <CardContent
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {p.full_name}
                  </Typography>
                  {p.deleted_at && (
                    <Chip
                      label="Deleted"
                      size="small"
                      color="error"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  )}
                  {p.deletion_scheduled_at && !p.deleted_at && (
                    <Chip
                      label="Deletion Pending"
                      size="small"
                      color="warning"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {p.email} · {p.health_id}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Joined {new Date(p.created_at).toLocaleDateString()}
                {p.deletion_scheduled_at && (
                  <> · Deletes {new Date(p.deletion_scheduled_at).toLocaleDateString()}</>
                )}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
