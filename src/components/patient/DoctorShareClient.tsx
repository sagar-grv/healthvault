'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import { createClient } from '@/lib/supabase/client';
import { shareWithDoctor } from '@/app/(protected)/dashboard/patient/actions';
import type { Report } from '@/types';

interface DoctorInfo {
  id: string;
  full_name: string;
  qualification: string | null;
  specialization: string | null;
  clinic_name: string | null;
  city: string | null;
}

interface DoctorShareClientProps {
  doctor: DoctorInfo;
}

export default function DoctorShareClient({ doctor }: DoctorShareClientProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false })
        .then(({ data }) => {
          setReports(data ?? []);
          setLoading(false);
        });
    });
  }, []);

  const shareableReports = reports.filter((r) => r.is_shareable);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    if (selectedIds.size === 0) return;
    setSharing(true);
    setError('');
    const result = await shareWithDoctor(doctor.id, Array.from(selectedIds));
    if (result.error) {
      setError(result.error);
      setSharing(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Reports Shared!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {selectedIds.size} report{selectedIds.size > 1 ? 's' : ''} shared with Dr.{' '}
          {doctor.full_name}
        </Typography>
        <Button variant="contained" color="secondary" href="/dashboard/patient">
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: 'rgba(5,150,105,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MedicalServicesIcon sx={{ fontSize: 24, color: 'success.main' }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Dr. {doctor.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {[doctor.qualification, doctor.specialization].filter(Boolean).join(' · ') ||
              'Medical Professional'}
            {doctor.clinic_name ? ` at ${doctor.clinic_name}` : ''}
            {doctor.city ? `, ${doctor.city}` : ''}
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select reports to share with this doctor:
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : shareableReports.length === 0 ? (
        <Card
          sx={{
            textAlign: 'center',
            py: 4,
            border: '2px dashed',
            borderColor: 'divider',
            bgcolor: 'transparent',
            boxShadow: 'none',
          }}
        >
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              No shareable reports yet. Upload a report first.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card sx={{ mb: 2, maxHeight: 300, overflow: 'auto' }}>
            {shareableReports.map((report, idx) => (
              <Box key={report.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedIds.has(report.id)}
                      onChange={() => handleToggle(report.id)}
                      color="secondary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                        {report.title || 'Untitled Report'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.report_type?.replace(/_/g, ' ') || 'Report'} ·{' '}
                        {new Date(report.uploaded_at).toLocaleDateString('en-IN')}
                      </Typography>
                    </Box>
                  }
                  sx={{ py: 1, px: 2, mx: 0, width: '100%' }}
                />
                {idx < shareableReports.length - 1 && (
                  <Box sx={{ mx: 2, borderBottom: '1px solid', borderColor: 'divider' }} />
                )}
              </Box>
            ))}
          </Card>

          <Button
            variant="contained"
            color="secondary"
            fullWidth
            size="large"
            onClick={handleShare}
            disabled={selectedIds.size === 0 || sharing}
            sx={{ py: 1.5 }}
          >
            {sharing ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              `Share ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''} Reports`
            )}
          </Button>
        </>
      )}
    </Box>
  );
}
