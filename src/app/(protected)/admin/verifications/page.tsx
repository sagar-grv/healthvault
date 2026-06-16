'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getPendingVerifications, approveDoctor, rejectDoctor } from '../actions';

interface Verification {
  id: string;
  registration_number: string;
  council_name: string;
  qualification: string;
  specialization: string | null;
  clinic_name: string | null;
  city: string | null;
  verification_state: string;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; doctorId: string | null }>({
    open: false,
    doctorId: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getPendingVerifications();
      if (!cancelled && 'verifications' in result) {
        setVerifications(result.verifications as Verification[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = async () => {
    const result = await getPendingVerifications();
    if ('verifications' in result) {
      setVerifications(result.verifications as Verification[]);
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId: string) => {
    setActionLoading(doctorId);
    const result = await approveDoctor(doctorId);
    if (result.error) {
      setSnackbar({ open: true, message: result.error, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Doctor approved successfully', severity: 'success' });
    }
    await reload();
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectDialog.doctorId || !rejectReason.trim()) return;
    setActionLoading(rejectDialog.doctorId);
    const result = await rejectDoctor(rejectDialog.doctorId, rejectReason);
    if (result.error) {
      setSnackbar({ open: true, message: result.error, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Doctor rejected', severity: 'success' });
    }
    setRejectDialog({ open: false, doctorId: null });
    setRejectReason('');
    await reload();
    setActionLoading(null);
  };

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
        Verification Queue
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {verifications.length} pending request{verifications.length !== 1 ? 's' : ''}
      </Typography>

      {verifications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6">All caught up!</Typography>
            <Typography variant="body2" color="text.secondary">
              No pending verification requests.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {verifications.map((v) => (
            <Card key={v.id}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {v.profiles?.full_name ?? 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {v.profiles?.email}
                    </Typography>
                  </Box>
                  <Chip label="Pending" color="warning" size="small" />
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Reg. Number
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {v.registration_number}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Council
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {v.council_name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Qualification
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {v.qualification}
                    </Typography>
                  </Box>
                  {v.specialization && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Specialization
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {v.specialization}
                      </Typography>
                    </Box>
                  )}
                  {v.clinic_name && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Clinic
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {v.clinic_name}
                      </Typography>
                    </Box>
                  )}
                  {v.city && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        City
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {v.city}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    disabled={actionLoading === v.id}
                    onClick={() => setRejectDialog({ open: true, doctorId: v.id })}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    disabled={actionLoading === v.id}
                    onClick={() => handleApprove(v.id)}
                  >
                    {actionLoading === v.id ? <CircularProgress size={20} /> : 'Approve'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, doctorId: null })}
      >
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
            placeholder="e.g., Registration number could not be verified with NMC..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, doctorId: null })}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!rejectReason.trim() || !!actionLoading}
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
