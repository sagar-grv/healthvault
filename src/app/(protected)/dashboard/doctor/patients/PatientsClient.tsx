'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupIcon from '@mui/icons-material/PeopleOutlined';
import SharedWithMePanel from '@/components/doctor/SharedWithMePanel';

interface PatientInfo {
  id: string;
  full_name: string;
  health_id: string | null;
}

interface ShareRecord {
  id: string;
  patient_id: string;
  report_ids: string[];
  shared_at: string;
  viewed_at: string | null;
  patient: PatientInfo | null;
}

interface PatientsClientProps {
  shares: ShareRecord[];
}

export default function PatientsClient({ shares: initialShares }: PatientsClientProps) {
  const router = useRouter();
  const [shares, setShares] = useState(initialShares);
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);

  // Group shares by patient (unique patients)
  const patientsMap = new Map<string, { patient: PatientInfo; shares: ShareRecord[] }>();
  for (const share of shares) {
    if (!share.patient) continue;
    const existing = patientsMap.get(share.patient_id);
    if (existing) {
      existing.shares.push(share);
    } else {
      patientsMap.set(share.patient_id, { patient: share.patient, shares: [share] });
    }
  }
  const patients = Array.from(patientsMap.values());

  const totalReports = shares.reduce((sum, s) => sum + s.report_ids.length, 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/doctor')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ ml: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Shared Patients
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1, mt: -0.25 }}
            >
              Patients who shared their reports with you
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 3, maxWidth: 640, mx: 'auto' }}>
        {/* Stats */}
        {patients.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Card
              sx={{
                flex: 1,
                textAlign: 'center',
                bgcolor: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.25)',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h3" sx={{ color: 'primary.main', mb: 0.25 }}>
                  {patients.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Patients
                </Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                flex: 1,
                textAlign: 'center',
                bgcolor: 'rgba(5,150,105,0.08)',
                border: '1px solid rgba(5,150,105,0.30)',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h3" sx={{ color: 'success.dark', mb: 0.25 }}>
                  {totalReports}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Reports
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Empty State */}
        {patients.length === 0 ? (
          <Card
            className="animate-fade-in-up"
            sx={{
              textAlign: 'center',
              py: 7,
              border: '2px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 4,
                  bgcolor: 'rgba(37,99,235,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <GroupIcon sx={{ fontSize: 32, color: '#2563EB' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                No shares yet
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 280, mx: 'auto' }}
              >
                When patients scan your QR code and share their reports, they will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box className="stagger-children">
            {patients.map(({ patient, shares: patientShares }) => {
              const reportCount = patientShares.reduce((sum, s) => sum + s.report_ids.length, 0);
              const hasNew = patientShares.some((s) => !s.viewed_at);
              const latestShare = patientShares[0];

              return (
                <Box key={patient.id} sx={{ mb: 2 }}>
                  <Card>
                    <CardActionArea onClick={() => setSelectedShareId(latestShare.id)}>
                      <CardContent
                        sx={{
                          p: 2.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          '&:last-child': { pb: 2.5 },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: 'rgba(5,150,105,0.15)',
                            color: 'success.main',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                          }}
                        >
                          {patient.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                              {patient.full_name || 'Unknown Patient'}
                            </Typography>
                            {hasNew && (
                              <Chip
                                label="New"
                                size="small"
                                color="warning"
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'var(--font-mono)',
                              color: 'text.secondary',
                              fontWeight: 500,
                              display: 'block',
                            }}
                          >
                            {patient.health_id || 'No Health ID'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reportCount} report{reportCount !== 1 ? 's' : ''} · Shared{' '}
                            {new Date(latestShare.shared_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Shared With Me Panel — opens when a patient is selected */}
      <SharedWithMePanel
        open={!!selectedShareId}
        onClose={() => setSelectedShareId(null)}
        shareId={selectedShareId}
        onShareViewed={(sid) => {
          setShares((prev) =>
            prev.map((s) => (s.id === sid ? { ...s, viewed_at: new Date().toISOString() } : s))
          );
        }}
      />
    </Box>
  );
}
