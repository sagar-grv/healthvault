'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PhoneIcon from '@mui/icons-material/Phone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';

interface EmergencyData {
  name: string;
  bloodGroup: string | null;
  allergies: string[];
  conditions: string[];
  emergencyContact: {
    name: string | null;
    phone: string | null;
  };
}

export default function EmergencyPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<EmergencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/emergency/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((d) => setData(d))
      .catch(() => setError('Emergency card not found or has been disabled.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#FEF2F2',
        }}
      >
        <CircularProgress color="error" />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#F9FAFB',
          p: 3,
        }}
      >
        <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center' }}>
          {error || 'Emergency card not found.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FEF2F2',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
          py: 3,
        }}
      >
        <LocalHospitalIcon sx={{ fontSize: 48, color: '#DC2626' }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#DC2626', mt: 1 }}>
          EMERGENCY INFO
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Medical information for first responders
        </Typography>
      </Box>

      {/* Main Card */}
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(220,38,38,0.15)',
          border: '2px solid #FECACA',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Patient Name */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
            {data.name}
          </Typography>

          {/* Blood Group */}
          {data.bloodGroup && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 2,
                p: 2,
                bgcolor: '#FEF2F2',
                borderRadius: 2,
              }}
            >
              <BloodtypeIcon sx={{ color: '#DC2626', fontSize: 28 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Blood Group
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {data.bloodGroup}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Allergies */}
          {data.allergies.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningAmberIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400E' }}>
                  Allergies
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {data.allergies.map((allergy, i) => (
                  <Chip
                    key={i}
                    label={allergy}
                    size="small"
                    sx={{
                      bgcolor: '#FEF3C7',
                      color: '#92400E',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Conditions */}
          {data.conditions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                Medical Conditions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {data.conditions.map((condition, i) => (
                  <Chip
                    key={i}
                    label={condition}
                    size="small"
                    sx={{
                      bgcolor: '#EFF6FF',
                      color: '#1D4ED8',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Emergency Contact */}
          {data.emergencyContact.phone && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: '#F0FDF4',
                borderRadius: 2,
                border: '1px solid #BBF7D0',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#065F46', mb: 1 }}>
                Emergency Contact
              </Typography>
              {data.emergencyContact.name && (
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {data.emergencyContact.name}
                </Typography>
              )}
              <Button
                variant="contained"
                color="success"
                startIcon={<PhoneIcon />}
                fullWidth
                href={`tel:${data.emergencyContact.phone}`}
                sx={{ mt: 1, py: 1.5, fontWeight: 700, fontSize: '1rem' }}
              >
                Call {data.emergencyContact.phone}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Powered by HealthVault
        </Typography>
      </Box>
    </Box>
  );
}
