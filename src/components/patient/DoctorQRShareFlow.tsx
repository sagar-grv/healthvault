'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  Chip,
  IconButton,
  List,
  ListItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import { shareReportsWithDoctor, lookupDoctor } from '@/app/(protected)/dashboard/patient/actions';
import { createClient } from '@/lib/supabase/client';
import { REPORT_TYPES } from '@/constants';
import type { Report } from '@/types';
import VerificationBadge from '@/components/VerificationBadge';

const QRScannerDialog = dynamic(() => import('@/components/doctor/QRScannerDialog'), {
  ssr: false,
});

/** Custom parser for doctor QR codes — accepts hv-doctor:{userId} and raw UUIDs */
function parseDoctorQR(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith('hv-doctor:')) return trimmed; // pass full string to onScan
  if (trimmed.toLowerCase().startsWith('hv-')) return null; // patient QR, not doctor
  // Try as raw UUID (basic check)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

type FlowState = 'scanning' | 'confirming' | 'selecting' | 'sharing' | 'success' | 'error';

interface DoctorQRShareFlowProps {
  open: boolean;
  onClose: () => void;
  reports: Report[];
}

export default function DoctorQRShareFlow({ open, onClose, reports }: DoctorQRShareFlowProps) {
  const [state, setState] = useState<FlowState>('scanning');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [doctorVerificationState, setDoctorVerificationState] = useState('unverified');
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const [localReports, setLocalReports] = useState<Report[]>(reports);
  const [loadingReports, setLoadingReports] = useState(false);

  const showScanner = open && state === 'scanning';

  // Fetch patient's own reports when entering selecting state
  useEffect(() => {
    if (state === 'selecting' && localReports.length === 0) {
      const fetchReports = async () => {
        setLoadingReports(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoadingReports(false);
          return;
        }

        const { data } = await supabase
          .from('reports')
          .select('*')
          .eq('patient_id', user.id)
          .order('uploaded_at', { ascending: false });

        if (data) setLocalReports(data);
        setLoadingReports(false);
      };
      fetchReports();
    }
  }, [state, localReports.length]);

  const resetState = () => {
    setState('scanning');
    setDoctorId(null);
    setDoctorName('');
    setClinicName('');
    setSelectedReports(new Set());
    setErrorMessage('');
    setSharing(false);
  };

  // Handle QR scan result
  const handleScan = useCallback(async (decoded: string) => {
    // Expect format: hv-doctor:{userId} or plain UUID
    let extractedDoctorId: string | null = null;

    if (decoded.toLowerCase().startsWith('hv-doctor:')) {
      extractedDoctorId = decoded.replace(/hv-doctor:/i, '');
    } else if (decoded.toLowerCase().startsWith('hv-')) {
      setErrorMessage("This is a patient QR code. Please scan a doctor's QR code.");
      setState('error');
      return;
    } else {
      // Try as raw UUID
      extractedDoctorId = decoded;
    }

    if (!extractedDoctorId) {
      setErrorMessage('Could not read QR code. Please try again.');
      setState('error');
      return;
    }

    // Validate UUID format
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(extractedDoctorId)
    ) {
      setErrorMessage('Invalid QR code format. Please scan again.');
      setState('error');
      return;
    }

    setDoctorId(extractedDoctorId);

    // Fetch doctor identity for confirmation
    const doc = await lookupDoctor(extractedDoctorId);
    setDoctorName(doc.full_name || '');
    setClinicName(doc.clinic_name || '');
    setDoctorVerificationState(doc.verification_state || 'unverified');

    setState('confirming');
  }, []);

  // Handle share action
  const handleShare = async () => {
    if (!doctorId || selectedReports.size === 0) return;

    setSharing(true);
    const result = await shareReportsWithDoctor(doctorId, Array.from(selectedReports));
    setSharing(false);

    if (result.error) {
      setErrorMessage(result.error);
      setState('error');
      return;
    }

    setDoctorName(result.doctorName || '');
    setClinicName(result.clinicName || '');
    setState('success');
  };

  // Toggle report selection
  const toggleReport = (reportId: string) => {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  // Select all reports
  const selectAll = () => {
    if (selectedReports.size === localReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(localReports.map((r) => r.id)));
    }
  };

  // Get report type label
  const getReportTypeLabel = (type: string) =>
    REPORT_TYPES.find((t) => t.value === type)?.label || type;

  // Handle scanner close — reset state for next open
  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <>
      {/* QR Scanner — full screen */}
      <QRScannerDialog
        open={showScanner}
        onClose={handleClose}
        onScan={handleScan}
        customParser={parseDoctorQR}
      />

      {/* Confirmation dialog */}
      <Dialog open={open && state === 'confirming'} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'success.main' }}>
              <CheckIcon />
            </Box>
            Doctor Found
          </Box>
        </DialogTitle>
        <DialogContent>
          {doctorName && (
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Dr. {doctorName}
            </Typography>
          )}
          {clinicName && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {clinicName}
            </Typography>
          )}
          <VerificationBadge state={doctorVerificationState} size="small" />
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Share your reports with this doctor?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            You'll select which reports to share on the next step.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={() => setState('selecting')} color="success">
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report selection dialog */}
      <Dialog
        open={open && state === 'selecting'}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { maxHeight: '80vh' } } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setState('confirming')} size="small">
              <BackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>Select Reports to Share</Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedReports.size === localReports.length && localReports.length > 0}
                  indeterminate={
                    selectedReports.size > 0 && selectedReports.size < localReports.length
                  }
                  onChange={selectAll}
                />
              }
              label={`Select All (${localReports.length} reports)`}
            />
          </Box>
          {loadingReports ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : localReports.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No reports available to share. Upload reports from the dashboard first.
            </Typography>
          ) : (
            <List dense>
              {localReports.map((report) => (
                <ListItem key={report.id} sx={{ px: 0 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedReports.has(report.id)}
                        onChange={() => toggleReport(report.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {report.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.25 }}>
                          <Chip
                            label={getReportTypeLabel(report.report_type)}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(report.report_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ m: 0, alignItems: 'flex-start' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleShare}
            disabled={selectedReports.size === 0 || sharing}
            color="success"
            startIcon={sharing ? <CircularProgress size={16} /> : undefined}
          >
            {sharing
              ? 'Sharing...'
              : `Share ${selectedReports.size} Report${selectedReports.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={open && state === 'success'} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ color: 'success.main', mb: 2 }}>
            <CheckIcon sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Reports Shared!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedReports.size} report{selectedReports.size !== 1 ? 's' : ''} shared successfully
          </Typography>
          {doctorName && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Dr. {doctorName}
              {clinicName && ` · ${clinicName}`}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={handleClose} color="success">
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error dialog */}
      <Dialog open={open && state === 'error'} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setErrorMessage('');
              setState('scanning');
            }}
          >
            Try Again
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
