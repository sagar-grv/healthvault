'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { parseDoctorQRContent } from '@/lib/utils/qr-parser';
import { getDoctorByShareId, shareWithDoctor } from '@/app/(protected)/dashboard/patient/actions';
import type { Report } from '@/types';

interface ScanDoctorQRSheetProps {
  open: boolean;
  onClose: () => void;
  patientReports: Report[];
}

type SheetPhase = 'scanning' | 'doctor_found' | 'sharing' | 'success';

interface DoctorInfo {
  id: string;
  full_name: string;
  specialization: string;
  clinic_name: string;
  city: string;
}

export default function ScanDoctorQRSheet({
  open,
  onClose,
  patientReports,
}: ScanDoctorQRSheetProps) {
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const [phase, setPhase] = useState<SheetPhase>('scanning');
  const [scannerStarting, setScannerStarting] = useState(false);
  const [error, setError] = useState('');
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const shareableReports = patientReports.filter((r) => r.is_shareable);

  const resetState = useCallback(() => {
    setPhase('scanning');
    setDoctor(null);
    setSelectedReportIds(new Set());
    setError('');
    setSnackbar({ open: false, message: '', severity: 'success' });
  }, []);

  const prevOpen = useRef(open);

  useEffect(() => {
    if (open && !prevOpen.current) resetState();
    prevOpen.current = open;
  }, [open, resetState]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* ok */
      }
      try {
        scannerRef.current.clear();
      } catch {
        /* ok */
      }
      scannerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopScanner();
    resetState();
    onClose();
  }, [stopScanner, resetState, onClose]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const startScanner = async () => {
      setScannerStarting(true);

      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (!mounted) return;

        let cameras: { id: string; label: string }[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch {
          setError('Camera permission denied. Please allow camera access.');
          setScannerStarting(false);
          return;
        }

        if (!mounted) return;
        if (cameras.length === 0) {
          setError('No camera found on this device.');
          setScannerStarting(false);
          return;
        }

        const cameraId = cameras[cameras.length - 1].id;
        const scanner = new Html5Qrcode('doctor-qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { deviceId: { exact: cameraId } },
          {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decoded: string) => {
            const doctorId = parseDoctorQRContent(decoded);
            if (!doctorId) return;

            await stopScanner();
            if (!mounted) return;

            setScannerStarting(false);

            const result = await getDoctorByShareId(doctorId);
            if (result.doctor) {
              setDoctor(result.doctor);
              setPhase('doctor_found');
            } else {
              setError('Doctor not found. Please try scanning again.');
              setPhase('scanning');
            }
          },
          () => {
            /* ignore partial reads */
          }
        );

        if (mounted) setScannerStarting(false);
      } catch {
        if (mounted) {
          setError('Could not start camera. Please try again.');
          setScannerStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [open, stopScanner, resetState]);

  const handleToggleReport = (reportId: string) => {
    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) next.delete(reportId);
      else next.add(reportId);
      return next;
    });
  };

  const handleShare = async () => {
    if (!doctor || selectedReportIds.size === 0) return;
    setPhase('sharing');
    const result = await shareWithDoctor(doctor.id, Array.from(selectedReportIds));
    if (result.success) {
      setPhase('success');
      setSnackbar({ open: true, message: 'Reports shared successfully!', severity: 'success' });
      setTimeout(() => handleClose(), 2000);
    } else {
      setError(result.error || 'Failed to share. Try again.');
      setPhase('doctor_found');
    }
  };

  const handleRetry = () => {
    setPhase('scanning');
    setDoctor(null);
    setError('');
    setSelectedReportIds(new Set());
  };

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85vh', pb: 2 },
        }}
      >
        <Box sx={{ px: 2, pt: 2 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              {phase === 'scanning' && 'Scan Doctor QR'}
              {phase === 'doctor_found' && 'Share with Doctor'}
              {phase === 'sharing' && 'Sharing...'}
              {phase === 'success' && 'Shared!'}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {phase === 'scanning' && (
            <Box>
              <Box
                id="doctor-qr-reader"
                sx={{
                  width: '100%',
                  maxWidth: 360,
                  height: 280,
                  mx: 'auto',
                  mb: 2,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'black',
                }}
              />
              {scannerStarting && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Starting camera...
                  </Typography>
                </Box>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {error}
                </Alert>
              )}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', mb: 2 }}
              >
                Point the camera at the doctor&apos;s QR code to see their details and share
                reports.
              </Typography>
              {error && (
                <Button fullWidth variant="outlined" onClick={handleRetry}>
                  Retry
                </Button>
              )}
            </Box>
          )}

          {phase === 'doctor_found' && doctor && (
            <Box>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <MedicalServicesIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {doctor.full_name}
                  </Typography>
                  <Typography variant="body2">
                    {doctor.specialization}
                    {doctor.clinic_name && ` · ${doctor.clinic_name}`}
                    {doctor.city && `, ${doctor.city}`}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Select reports to share
              </Typography>

              {shareableReports.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No shareable reports. Mark a report as shareable first.
                </Alert>
              ) : (
                <Box sx={{ maxHeight: 240, overflow: 'auto', mb: 2 }}>
                  {shareableReports.map((report) => (
                    <FormControlLabel
                      key={report.id}
                      control={
                        <Checkbox
                          checked={selectedReportIds.has(report.id)}
                          onChange={() => handleToggleReport(report.id)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {report.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.report_type.replace(/_/g, ' ')}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        width: '100%',
                        mx: 0,
                        px: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    />
                  ))}
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={handleRetry}>
                  Scan Again
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={selectedReportIds.size === 0}
                  onClick={handleShare}
                >
                  Share {selectedReportIds.size > 0 ? `(${selectedReportIds.size})` : ''}
                </Button>
              </Box>
            </Box>
          )}

          {phase === 'sharing' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Sharing reports with {doctor?.full_name}...
              </Typography>
            </Box>
          )}

          {phase === 'success' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>
                Reports Shared!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shared with {doctor?.full_name}
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
