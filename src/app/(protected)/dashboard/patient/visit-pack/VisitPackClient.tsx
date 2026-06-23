'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createVisitPack, lookupDoctor } from '../actions';
import { Report } from '@/types';

const STEPS = ['Why are you visiting?', 'Select reports', 'Preview & share'];

interface VisitPackClientProps {
  reports: Report[];
}

export default function VisitPackClient({ reports }: VisitPackClientProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [visitReason, setVisitReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [doctorInput, setDoctorInput] = useState('');
  const [doctorInfo, setDoctorInfo] = useState<{
    full_name: string | null;
    clinic_name: string | null;
    verification_state: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);

  const handleLookupDoctor = async () => {
    setError('');
    const doctorId = doctorInput.trim();
    if (!doctorId) return;
    const result = await lookupDoctor(doctorId);
    if (!result.full_name) {
      setError('Doctor not found. Make sure they have a HealthVault account.');
      return;
    }
    setDoctorInfo(result);
  };

  const toggleReport = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleShare = async () => {
    if (!doctorInfo || selectedIds.size === 0) return;
    setSharing(true);
    setError('');
    const result = await createVisitPack(doctorInput.trim(), Array.from(selectedIds), visitReason);
    if (result.error) {
      setError(result.error);
      setSharing(false);
      return;
    }
    router.push('/dashboard/patient');
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Why are you visiting the doctor?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This helps the doctor prepare before seeing you.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="e.g. Follow-up for diabetes, knee pain since 2 weeks, routine blood test review..."
            value={visitReason}
            onChange={(e) => setVisitReason(e.target.value)}
          />
        </Box>
      )}

      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Which reports should the doctor see?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the reports relevant to this visit. You can always share more later.
          </Typography>
          {reports.length === 0 ? (
            <Alert severity="info">Upload reports first to share with your doctor.</Alert>
          ) : (
            reports.map((report) => (
              <Card
                key={report.id}
                sx={{
                  mb: 1,
                  border: selectedIds.has(report.id) ? '2px solid' : '1px solid',
                  borderColor: selectedIds.has(report.id) ? 'primary.main' : 'divider',
                  boxShadow: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => toggleReport(report.id)}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <FormControlLabel
                    control={<Checkbox checked={selectedIds.has(report.id)} />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {report.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.report_type} ·{' '}
                          {new Date(report.report_date).toLocaleDateString('en-IN')}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Preview & share
          </Typography>

          {visitReason && (
            <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Visit reason
                </Typography>
                <Typography variant="body2">{visitReason}</Typography>
              </CardContent>
            </Card>
          )}

          <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Reports selected ({selectedIds.size})
              </Typography>
              <Typography variant="body2">
                {reports
                  .filter((r) => selectedIds.has(r.id))
                  .map((r) => r.title)
                  .join(', ')}
              </Typography>
            </CardContent>
          </Card>

          <TextField
            fullWidth
            label="Doctor's HealthVault ID"
            placeholder="Paste doctor's User ID from their QR card"
            value={doctorInput}
            onChange={(e) => setDoctorInput(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button variant="outlined" size="small" onClick={handleLookupDoctor} sx={{ mb: 2 }}>
            Look up doctor
          </Button>

          {doctorInfo && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Sharing with {doctorInfo.full_name}
              {doctorInfo.clinic_name ? ` at ${doctorInfo.clinic_name}` : ''}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep((s) => s - 1)} startIcon={<ArrowBackIcon />}>
            Back
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {activeStep < 2 ? (
          <Button
            variant="contained"
            onClick={() => setActiveStep((s) => s + 1)}
            disabled={activeStep === 0 && !visitReason.trim()}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleShare}
            disabled={!doctorInfo || selectedIds.size === 0 || sharing}
          >
            {sharing ? 'Sharing...' : 'Share with doctor'}
          </Button>
        )}
      </Box>
    </Box>
  );
}
