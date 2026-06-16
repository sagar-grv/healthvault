'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getDoctorDetail, approveDoctor, rejectDoctor } from '../../actions';

interface DoctorData {
  id: string;
  registration_number: string;
  council_name: string;
  qualification: string;
  specialization: string | null;
  clinic_name: string | null;
  city: string | null;
  certificate_path: string | null;
  verification_state: string;
  created_at: string;
  profiles: { full_name: string; email: string; health_id: string; created_at: string } | null;
}

interface VerificationRecord {
  id: string;
  method: string;
  status: string;
  confidence_score: number;
  created_at: string;
  error_message: string | null;
}

interface AuditRecord {
  id: string;
  action: string;
  created_at: string;
  previous_state: string | null;
  new_state: string | null;
  reason: string | null;
}

const stateColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  admin_verified: 'success',
  pending: 'warning',
  rejected: 'error',
  unverified: 'default',
};

export default function DoctorDetailPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getDoctorDetail(doctorId);
      if (!cancelled && 'doctor' in result) {
        setDoctor(result.doctor as DoctorData);
        setVerifications(result.verifications as VerificationRecord[]);
        setAuditLogs(result.auditLogs as AuditRecord[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const reload = async () => {
    const result = await getDoctorDetail(doctorId);
    if ('doctor' in result) {
      setDoctor(result.doctor as DoctorData);
      setVerifications(result.verifications as VerificationRecord[]);
      setAuditLogs(result.auditLogs as AuditRecord[]);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    const result = await approveDoctor(doctorId);
    if (result.error) {
      setSnackbar({ open: true, message: result.error, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Doctor approved successfully', severity: 'success' });
    }
    await reload();
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    const result = await rejectDoctor(doctorId, rejectReason);
    if (result.error) {
      setSnackbar({ open: true, message: result.error, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Doctor rejected', severity: 'success' });
    }
    setRejectDialog(false);
    setRejectReason('');
    await reload();
    setActionLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!doctor) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Doctor not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Doctor Detail
      </Typography>

      {/* Profile card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {doctor.profiles?.full_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {doctor.profiles?.email}
              </Typography>
            </Box>
            <Chip
              label={doctor.verification_state.replace('_', ' ')}
              color={stateColors[doctor.verification_state] ?? 'default'}
            />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Health ID
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {doctor.profiles?.health_id}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Reg. Number
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {doctor.registration_number}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Council
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {doctor.council_name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Qualification
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {doctor.qualification}
              </Typography>
            </Box>
            {doctor.specialization && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Specialization
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {doctor.specialization}
                </Typography>
              </Box>
            )}
            {doctor.clinic_name && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Clinic
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {doctor.clinic_name}
                </Typography>
              </Box>
            )}
            {doctor.city && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  City
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {doctor.city}
                </Typography>
              </Box>
            )}
          </Box>

          {doctor.verification_state === 'pending' && (
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                disabled={actionLoading}
                onClick={() => setRejectDialog(true)}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                disabled={actionLoading}
                onClick={handleApprove}
              >
                {actionLoading ? <CircularProgress size={20} /> : 'Approve'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Certificate */}
      {doctor.certificate_path && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Uploaded Documents
            </Typography>
            <Box
              component="a"
              href={`/api/storage?path=${encodeURIComponent(doctor.certificate_path)}`}
              target="_blank"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
              }}
            >
              <InsertDriveFileIcon sx={{ color: 'error.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Registration Certificate
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  View or download
                </Typography>
              </Box>
              <OpenInNewIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Verification chain results */}
      {verifications.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Verification Chain Results
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {verifications.map((v) => (
                <Box
                  key={v.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {v.method.replace('_', ' ')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(v.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={v.status}
                      color={
                        v.status === 'success'
                          ? 'success'
                          : v.status === 'failed'
                            ? 'error'
                            : 'warning'
                      }
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {(v.confidence_score * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Audit trail */}
      {auditLogs.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Admin Audit Trail
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {auditLogs.map((log) => (
                <Box key={log.id} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {log.action.replace('_', ' ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.created_at).toLocaleString()}
                    {log.previous_state && ` · ${log.previous_state} → ${log.new_state}`}
                    {log.reason && ` · Reason: ${log.reason}`}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)}>
        <DialogTitle>Reject Verification</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Registration number could not be verified..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!rejectReason.trim() || actionLoading}
            onClick={handleReject}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
