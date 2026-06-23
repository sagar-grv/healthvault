'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import { revokeShare } from '../actions';

interface TrustCenterClientProps {
  profile: {
    health_id: string | null;
    deleted_at: string | null;
    deletion_scheduled_at: string | null;
  };
  hoursLeft: number | null;
  logs: Array<{
    id: string;
    doctor_name: string;
    reports_viewed: string[];
    searched_at: string;
  }>;
  shares: Array<{
    id: string;
    doctor_id: string;
    report_ids: string[];
    shared_at: string;
    viewed_at: string | null;
    doctor_name: string;
    clinic_name: string | null;
  }>;
}

export default function TrustCenterClient({
  profile,
  hoursLeft,
  logs,
  shares,
}: TrustCenterClientProps) {
  const router = useRouter();
  const [revokeConfirm, setRevokeConfirm] = useState<{ open: boolean; shareId: string | null }>({
    open: false,
    shareId: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleRevoke = async () => {
    if (!revokeConfirm.shareId) return;
    const result = await revokeShare(revokeConfirm.shareId);
    setSnackbar({
      open: true,
      message: result.success ? 'Access revoked.' : 'Failed to revoke.',
      severity: result.success ? 'success' : 'error',
    });
    setRevokeConfirm({ open: false, shareId: null });
    router.refresh();
  };

  const deletionActive = profile.deleted_at && profile.deletion_scheduled_at;

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => router.push('/dashboard/patient')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Trust & privacy
        </Typography>
      </Box>

      <Alert severity="info" icon={<ShieldOutlinedIcon />} sx={{ mb: 3 }}>
        You control who sees your medical records. Every view is logged and visible to you. Revoke
        access anytime. Your data is encrypted and never shared without your consent.
      </Alert>

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Active shares ({shares.length})
      </Typography>
      {shares.length === 0 ? (
        <Card sx={{ mb: 3, boxShadow: 'none', border: '1px dashed', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No active shares. Share reports with your doctor to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {shares.map((share) => (
            <Card
              key={share.id}
              sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {share.doctor_name}
                    </Typography>
                    {share.clinic_name && (
                      <Typography variant="caption" color="text.secondary">
                        {share.clinic_name}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={share.viewed_at ? 'Viewed' : 'Pending'}
                    size="small"
                    color={share.viewed_at ? 'success' : 'default'}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {share.report_ids.length} reports ·{' '}
                    {new Date(share.shared_at).toLocaleDateString('en-IN')}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setRevokeConfirm({ open: true, shareId: share.id })}
                    sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                  >
                    Revoke
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Recent access logs ({logs.length})
      </Typography>
      {logs.length === 0 ? (
        <Card sx={{ mb: 3, boxShadow: 'none', border: '1px dashed', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No access logs yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {logs.slice(0, 10).map((log) => (
            <Card
              key={log.id}
              sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
            >
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {log.doctor_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    viewed on{' '}
                    {new Date(log.searched_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Account status
      </Typography>
      {deletionActive ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your account is scheduled for deletion in approximately {hoursLeft} hours. Log in before
          then to cancel.
        </Alert>
      ) : (
        <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2">
              Your account is active. You can delete your account from your profile settings. After
              deletion, you have 72 hours to cancel.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={revokeConfirm.open}
        onClose={() => setRevokeConfirm({ open: false, shareId: null })}
      >
        <DialogTitle>Revoke access?</DialogTitle>
        <DialogContent>
          This doctor will no longer be able to view your shared reports.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeConfirm({ open: false, shareId: null })}>Cancel</Button>
          <Button onClick={handleRevoke} color="error">
            Revoke
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
