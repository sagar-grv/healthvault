'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
} from '@mui/material';
import { ArrowBack as BackIcon, Description as ReportIcon } from '@mui/icons-material';
import { getSharedReportDetails } from '@/app/(protected)/dashboard/doctor/actions';
import { REPORT_TYPE_COLORS } from '@/constants';
import type { Report, Profile } from '@/types';

export default function SharedReportsClient({ shareId }: { shareId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Pick<Profile, 'id' | 'full_name' | 'health_id'> | null>(
    null
  );
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    getSharedReportDetails(shareId).then((res) => {
      if ('error' in res) {
        setError(res.error ?? 'An unknown error occurred');
      } else {
        // Supabase returns patient as an array from the join — extract first item
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patientData = (res.share as Record<string, any>)?.patient;
        setPatient(Array.isArray(patientData) ? (patientData[0] ?? null) : (patientData ?? null));
        setReports(res.reports || []);
      }
      setLoading(false);
    });
  }, [shareId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <IconButton onClick={() => router.back()} sx={{ mt: 2 }}>
          <BackIcon /> Go Back
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {patient?.full_name || 'Patient'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {patient?.health_id}
            </Typography>
          </Box>
          <Chip label={`${reports.length} reports`} size="small" color="primary" />
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 2.5, maxWidth: 640, mx: 'auto' }}>
        {/* Patient info card */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'rgba(37,99,235,0.15)',
              color: 'primary.main',
              fontSize: '1.1rem',
              fontWeight: 700,
            }}
          >
            {patient?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {patient?.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {patient?.health_id}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Reports list */}
        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
          Shared Reports
        </Typography>
        <List>
          {reports.map((report) => {
            const colors = REPORT_TYPE_COLORS[report.report_type] || REPORT_TYPE_COLORS.other;
            return (
              <ListItemButton
                key={report.id}
                sx={{ borderRadius: 1, mb: 0.5 }}
                onClick={() => {
                  // TODO: open report detail dialog in the future
                }}
              >
                <ListItemIcon>
                  <ReportIcon sx={{ color: colors.color }} />
                </ListItemIcon>
                <ListItemText
                  primary={report.title}
                  secondary={new Date(report.report_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
                <Chip
                  label={report.report_type.replace('_', ' ')}
                  size="small"
                  sx={{
                    bgcolor: colors.bg,
                    color: colors.color,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        {reports.length === 0 && <Alert severity="info">No reports found in this share.</Alert>}
      </Box>
    </Box>
  );
}
