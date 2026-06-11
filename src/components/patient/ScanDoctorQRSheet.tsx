'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
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
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
    applyVideoConstraints: (c: object) => Promise<void>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<SheetPhase>('scanning');
  const [scanState, setScanState] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
  const [error, setError] = useState('');
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [torchOn, setTorchOn] = useState(false);
  const [cameraCount, setCameraCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [searchingManual, setSearchingManual] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const shareableReports = patientReports.filter((r) => r.is_shareable);

  const resetState = useCallback(() => {
    setPhase('scanning');
    setScanState('idle');
    setDoctor(null);
    setSelectedReportIds(new Set());
    setError('');
    setTorchOn(false);
    setManualInput('');
    setSearchingManual(false);
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
      setScanState('starting');
      setError('');

      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (!mounted) return;

        let cameras: { id: string; label: string }[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch {
          /* permission not yet granted */
        }
        if (!mounted) return;
        setCameraCount(cameras.length);

        const scanner = new Html5Qrcode('doctor-qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = scanner;

        const upiConfig = {
          fps: 30,
          disableFlip: false,
          aspectRatio: window.innerHeight / window.innerWidth,
        };

        const onDecode = async (decoded: string) => {
          const doctorId = parseDoctorQRContent(decoded);
          if (!doctorId) return;

          await stopScanner();
          if (!mounted) return;

          setScanState('idle');

          const result = await getDoctorByShareId(doctorId);
          if (result.doctor) {
            setDoctor(result.doctor);
            setPhase('doctor_found');
          } else {
            setError('Doctor not found. Try scanning again or enter manually.');
            setScanState('error');
          }
        };

        let started = false;

        if (!started) {
          try {
            await scanner.start({ facingMode: 'environment' }, upiConfig, onDecode, () => {});
            started = true;
          } catch {
            /* */
          }
        }

        if (!started) {
          try {
            await scanner.start({ facingMode: 'user' }, upiConfig, onDecode, () => {});
            started = true;
          } catch {
            /* */
          }
        }

        if (!started && cameras.length > 0) {
          await scanner.start(cameras[0].id, upiConfig, onDecode, () => {});
          started = true;
        }

        if (!started) {
          const freshCams = await Html5Qrcode.getCameras();
          if (!freshCams.length)
            throw Object.assign(new Error('No camera'), { name: 'NotFoundError' });
          setCameraCount(freshCams.length);
          await scanner.start(freshCams[0].id, upiConfig, onDecode, () => {});
        }

        if (mounted) setScanState('scanning');
      } catch (err: unknown) {
        if (!mounted) return;
        const e = err as { name?: string; message?: string };
        const name = e?.name ?? '';
        const msg = (e?.message ?? '').toLowerCase();
        if (name === 'NotAllowedError' || msg.includes('permission') || msg.includes('denied')) {
          setError('Camera permission denied. Enter the doctor ID manually below.');
        } else if (name === 'NotFoundError' || msg.includes('no camera')) {
          setError('No camera found. Enter the doctor ID manually below.');
        } else if (msg.includes('already in use') || msg.includes('notreadableerror')) {
          setError('Camera in use by another app. Enter manually below.');
        } else {
          setError('Could not start camera. Enter the doctor ID manually below.');
        }
        setScanState('error');
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [open, stopScanner, resetState]);

  const handleToggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((t) => !t);
    } catch {
      /* torch not supported */
    }
  };

  const handleSwitchCamera = async () => {
    if (!scannerRef.current || cameraCount < 2) return;
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length < 2) return;

      await stopScanner();
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const scanner = new Html5Qrcode('doctor-qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        cameras[1].id,
        { fps: 30, disableFlip: false, aspectRatio: window.innerHeight / window.innerWidth },
        async (decoded: string) => {
          const doctorId = parseDoctorQRContent(decoded);
          if (!doctorId) return;
          await stopScanner();
          setScanState('idle');
          const result = await getDoctorByShareId(doctorId);
          if (result.doctor) {
            setDoctor(result.doctor);
            setPhase('doctor_found');
          } else {
            setError('Doctor not found.');
            setScanState('error');
          }
        },
        () => {}
      );
    } catch {
      /* switch failed */
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('doctor-qr-upload', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      const result = await scanner.scanFile(file, false);
      scanner.clear();
      const doctorId = parseDoctorQRContent(result);
      if (doctorId) {
        const res = await getDoctorByShareId(doctorId);
        if (res.doctor) {
          setDoctor(res.doctor);
          setPhase('doctor_found');
        } else {
          setError('Doctor not found.');
          setScanState('error');
        }
      } else {
        setError('No doctor QR found in this image.');
        setScanState('error');
      }
    } catch {
      setError('Could not read QR from image. Try a clearer photo.');
      setScanState('error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSearch = async () => {
    const input = manualInput.trim();
    if (!input) return;
    setSearchingManual(true);
    setError('');
    const doctorId = parseDoctorQRContent(input) || input;
    const result = await getDoctorByShareId(doctorId);
    if (result.doctor) {
      await stopScanner();
      setDoctor(result.doctor);
      setPhase('doctor_found');
    } else {
      setError('No doctor found with that ID. Please check and try again.');
    }
    setSearchingManual(false);
  };

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
    setManualInput('');
    // Re-mount camera by toggling open
    handleClose();
    setTimeout(() => {
      // Parent re-opens via user tap
    }, 300);
  };

  const isScanning = scanState === 'scanning';
  const isStarting = scanState === 'starting';
  const hasError = scanState === 'error';

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <Box
        id="doctor-qr-upload"
        sx={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
      />

      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        slotProps={{ paper: { sx: { bgcolor: '#000', overflow: 'hidden' } } }}
      >
        {/* ── Scanner Phase ──────────────────────────────────────────────── */}
        {phase === 'scanning' && (
          <>
            {/* Top bar */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1,
                pt: 'max(env(safe-area-inset-top), 8px)',
                pb: 1,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
              }}
            >
              <IconButton onClick={handleClose} sx={{ color: 'white' }} aria-label="Close">
                <CloseIcon />
              </IconButton>
              <Typography
                variant="body1"
                sx={{ fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}
              >
                Scan Doctor QR
              </Typography>
              <Box sx={{ display: 'flex' }}>
                {isScanning && (
                  <IconButton
                    onClick={handleToggleTorch}
                    sx={{ color: 'white' }}
                    aria-label="Torch"
                  >
                    {torchOn ? <FlashlightOffIcon /> : <FlashlightOnIcon />}
                  </IconButton>
                )}
                {isScanning && cameraCount > 1 && (
                  <IconButton
                    onClick={handleSwitchCamera}
                    sx={{ color: 'white' }}
                    aria-label="Switch camera"
                  >
                    <CameraswitchIcon />
                  </IconButton>
                )}
                {!isScanning && !isStarting && <Box sx={{ width: 40 }} />}
              </Box>
            </Box>

            {/* Camera container */}
            <Box
              id="doctor-qr-reader"
              sx={{
                position: 'absolute',
                inset: 0,
                opacity: isScanning ? 1 : 0,
                transition: 'opacity 0.25s ease',
                '& video': {
                  width: '100% !important',
                  height: '100% !important',
                  objectFit: 'cover',
                },
                '& #doctor-qr-reader__header_message': { display: 'none !important' },
                '& #doctor-qr-reader__status_span': { display: 'none !important' },
                '& #doctor-qr-reader__dashboard': { display: 'none !important' },
                '& #doctor-qr-reader__camera_selection': { display: 'none !important' },
                '& button': { display: 'none !important' },
              }}
            />

            {/* Loading */}
            {isStarting && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress sx={{ color: '#10B981', mb: 2 }} size={40} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Starting camera…
                </Typography>
              </Box>
            )}

            {/* Error state */}
            {hasError && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 3,
                }}
              >
                <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 380 }}>
                  {error}
                </Alert>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    width: '100%',
                    maxWidth: 380,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      onClick={handleRetry}
                      sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, flex: 1 }}
                    >
                      Retry
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleClose}
                      sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', flex: 1 }}
                    >
                      Cancel
                    </Button>
                  </Box>

                  {/* Manual input fallback */}
                  <Box sx={{ mt: 1, p: 2, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        mb: 1,
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      Or enter doctor ID manually
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Paste doctor ID or URL here"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      sx={{
                        mb: 1,
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          '& fieldset': { borderColor: 'transparent' },
                        },
                        '& .MuiInputBase-input': { fontSize: '0.85rem' },
                      }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={searchingManual ? <CircularProgress size={16} /> : <SearchIcon />}
                      onClick={handleManualSearch}
                      disabled={searchingManual || !manualInput.trim()}
                      sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
                    >
                      {searchingManual ? 'Searching...' : 'Find Doctor'}
                    </Button>
                  </Box>

                  <Button
                    variant="text"
                    startIcon={<UploadFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}
                  >
                    {uploading ? 'Scanning image…' : 'Upload QR image instead'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Scan frame — UPI style */}
            {isScanning && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '20%',
                  bgcolor: 'rgba(0,0,0,0.55)',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              />
            )}
            {isScanning && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '25%',
                  bgcolor: 'rgba(0,0,0,0.55)',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              />
            )}
            {isScanning && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '20%',
                  bottom: '25%',
                  left: '10%',
                  right: '10%',
                  zIndex: 15,
                  pointerEvents: 'none',
                  border: '2px solid #10B981',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 4,
                    right: 4,
                    height: 2,
                    bgcolor: '#10B981',
                    boxShadow: '0 0 8px #10B981, 0 0 16px #10B981',
                    animation: 'scanLine 2s ease-in-out infinite',
                    '@keyframes scanLine': {
                      '0%': { top: 4 },
                      '50%': { top: 'calc(100% - 6px)' },
                      '100%': { top: 4 },
                    },
                  }}
                />
                {[
                  { top: -2, left: -2, borderWidth: '3px 0 0 3px' },
                  { top: -2, right: -2, borderWidth: '3px 3px 0 0' },
                  { bottom: -2, left: -2, borderWidth: '0 0 3px 3px' },
                  { bottom: -2, right: -2, borderWidth: '0 3px 3px 0' },
                ].map((style, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: 'absolute',
                      width: 20,
                      height: 20,
                      borderColor: '#10B981',
                      borderStyle: 'solid',
                      borderRadius: 0.5,
                      ...style,
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Bottom instructions */}
            {isScanning && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '6%',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  zIndex: 20,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'white', fontWeight: 600, mb: 0.5, pointerEvents: 'none' }}
                >
                  Point at the doctor&apos;s QR code
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    display: 'block',
                    mb: 1.5,
                    pointerEvents: 'none',
                  }}
                >
                  Scanning automatically — any angle works
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<UploadFileIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    stopScanner();
                    fileInputRef.current?.click();
                  }}
                  disabled={uploading}
                  sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}
                >
                  {uploading ? 'Scanning…' : 'Upload QR image'}
                </Button>
              </Box>
            )}
          </>
        )}

        {/* ── Doctor Found Phase ─────────────────────────────────────────── */}
        {phase === 'doctor_found' && doctor && (
          <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', px: 2, py: 3 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Share with Doctor
              </Typography>
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
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
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {doctor.full_name}
                </Typography>
                <Typography variant="body2">
                  {doctor.specialization}
                  {doctor.clinic_name && ` · ${doctor.clinic_name}`}
                  {doctor.city && `, ${doctor.city}`}
                </Typography>
              </Box>
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Select reports to share
            </Typography>
            {shareableReports.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No shareable reports. Mark a report as shareable first.
              </Alert>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
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
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setPhase('scanning');
                  setDoctor(null);
                  setError('');
                  setSelectedReportIds(new Set());
                }}
              >
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

        {/* ── Sharing Phase ─────────────────────────────────────────────── */}
        {phase === 'sharing' && (
          <Box
            sx={{
              bgcolor: 'background.default',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Sharing with {doctor?.full_name}...
            </Typography>
          </Box>
        )}

        {/* ── Success Phase ─────────────────────────────────────────────── */}
        {phase === 'success' && (
          <Box
            sx={{
              bgcolor: 'background.default',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
            }}
          >
            <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>
              Reports Shared!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Shared with {doctor?.full_name}
            </Typography>
          </Box>
        )}
      </Dialog>

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
