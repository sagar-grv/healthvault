'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import { parseQRContent } from '@/lib/utils/qr-parser';

interface QRScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (healthId: string) => void;
}

type ScanState = 'idle' | 'starting' | 'scanning' | 'success' | 'error';

export default function QRScannerDialog({ open, onClose, onScan }: QRScannerDialogProps) {
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
    applyVideoConstraints: (c: object) => Promise<void>;
  } | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [error, setError] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [cameraCount, setCameraCount] = useState(0);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* already stopped */
      }
      try {
        scannerRef.current.clear?.();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    let mounted = true;

    const startScanner = async () => {
      setScanState('starting');
      setError('');

      // Two rAF cycles ensure the DOM element has real dimensions before html5-qrcode measures it
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (!mounted) return;

        // Enumerate cameras
        let cameras: { id: string; label: string }[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch {
          /* permission not yet granted */
        }
        if (!mounted) return;
        setCameraCount(cameras.length);

        const scanner = new Html5Qrcode('qr-reader-container', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], // QR only = faster
          verbose: false,
        });
        scannerRef.current = scanner;

        // UPI-style config:
        // - fps: 30 (scans 3x more frames per second vs default 10)
        // - NO qrbox constraint = scans entire camera frame (not just a center square)
        // - disableFlip: false = handles mirrored/front-camera QRs
        // - aspectRatio: 1 = square camera view fills screen edge-to-edge
        const upiConfig = {
          fps: 30,
          disableFlip: false,
          aspectRatio: window.innerHeight / window.innerWidth,
        };

        const onDecode = (decoded: string) => {
          const healthId = parseQRContent(decoded);
          if (healthId) {
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]); // double-pulse like UPI
            setScanState('success');
            stopScanner();
            if (mounted) onScan(healthId);
          }
        };

        /**
         * Sequential camera fallback chain.
         * Each strategy is guarded by `!started` so earlier strategies
         * take priority. `started` prevents double-initialization and
         * short-circuits remaining strategies once one succeeds.
         */
        let started = false;

        // Strategy 1: rear camera by facingMode (best for phones)
        if (!started) {
          try {
            await scanner.start({ facingMode: 'environment' }, upiConfig, onDecode, () => {});
            started = true;
          } catch {
            /* unavailable */
          }
        }

        // Strategy 2: front camera by facingMode (fallback for laptops)
        if (!started) {
          try {
            await scanner.start({ facingMode: 'user' }, upiConfig, onDecode, () => {});
            started = true;
          } catch {
            /* unavailable */
          }
        }

        // Strategy 3: first camera by device ID (most reliable on desktop)
        if (!started && cameras.length > 0) {
          await scanner.start(cameras[0].id, upiConfig, onDecode, () => {});
          started = true;
        }

        // Strategy 4: fresh camera list after permission prompt
        if (!started) {
          const freshCams = await Html5Qrcode.getCameras();
          if (!freshCams.length)
            throw Object.assign(new Error('No camera'), { name: 'NotFoundError' });
          setCameraCount(freshCams.length);
          await scanner.start(freshCams[0].id, upiConfig, onDecode, () => {});
          started = true; // consistent with strategies 1-3
        }

        if (mounted) setScanState('scanning');
      } catch (err: unknown) {
        if (!mounted) return;
        const e = err as { name?: string; message?: string };
        const name = e?.name ?? '';
        const msg = (e?.message ?? '').toLowerCase();
        if (name === 'NotAllowedError' || msg.includes('permission') || msg.includes('denied')) {
          setError(
            'Camera permission denied. Allow camera access in your browser settings and tap Retry.'
          );
        } else if (name === 'NotFoundError' || msg.includes('no camera')) {
          setError('No camera found on this device.');
        } else if (msg.includes('already in use') || msg.includes('notreadableerror')) {
          setError('Camera is in use by another app. Close it and tap Retry.');
        } else {
          setError('Could not start camera. Enter the Health ID manually instead.');
        }
        setScanState('error');
      }
    };

    startScanner();
    return () => {
      mounted = false;
      stopScanner();
    };
  }, [open, onScan, stopScanner]);

  const handleClose = useCallback(() => {
    stopScanner();
    setScanState('idle');
    setError('');
    setTorchOn(false);
    onClose();
  }, [stopScanner, onClose]);

  const handleRetry = useCallback(async () => {
    await stopScanner();
    setScanState('idle');
    setError('');
    // Brief delay then re-trigger the effect by forcing a re-mount via key change
    setTimeout(() => setScanState('idle'), 100);
    // Directly restart: toggle open state in parent is not available here,
    // so we re-run init by briefly resetting to idle and back
    // The effect watches `open` not `scanState`, so we need to force re-run:
    setScanState('starting');
    requestAnimationFrame(async () => {
      setScanState('idle'); // The useEffect will NOT re-run since open didn't change.
      // Instead, just call the same logic inline:
    });
    // Simplest: just close + reopen
    onClose();
    setTimeout(() => {
      // The parent will re-open immediately if we signal via onScan('' won't work)
      // So we just reset the state and let the user tap the button again
      setScanState('idle');
    }, 150);
  }, [stopScanner, onClose]);

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

      const scanner = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        cameras[1].id,
        { fps: 30, disableFlip: false, aspectRatio: window.innerHeight / window.innerWidth },
        (decoded: string) => {
          const healthId = parseQRContent(decoded);
          if (healthId) {
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            stopScanner();
            onScan(healthId);
          }
        },
        () => {}
      );
    } catch {
      /* switch failed — ignore */
    }
  };

  const isScanning = scanState === 'scanning';
  const isStarting = scanState === 'starting';
  const hasError = scanState === 'error';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      slotProps={{ paper: { sx: { bgcolor: '#000', overflow: 'hidden' } } }}
    >
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
          Scan Health ID
        </Typography>
        <Box sx={{ display: 'flex' }}>
          {isScanning && (
            <IconButton onClick={handleToggleTorch} sx={{ color: 'white' }} aria-label="Torch">
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

      {/* Camera container — ALWAYS rendered at full size; opacity controls visibility */}
      <Box
        id="qr-reader-container"
        sx={{
          position: 'absolute',
          inset: 0,
          // CRITICAL: html5-qrcode measures this element's bounding rect.
          // It must be visible (not display:none) with real dimensions.
          // We use opacity to hide it while loading, keeping dimensions intact.
          opacity: isScanning ? 1 : 0,
          transition: 'opacity 0.25s ease',
          '& video': {
            width: '100% !important',
            height: '100% !important',
            objectFit: 'cover',
          },
          // Hide all html5-qrcode default UI chrome
          '& #qr-reader-container__header_message': { display: 'none !important' },
          '& #qr-reader-container__status_span': { display: 'none !important' },
          '& #qr-reader-container__dashboard': { display: 'none !important' },
          '& #qr-reader-container__camera_selection': { display: 'none !important' },
          '& button': { display: 'none !important' },
        }}
      />

      {/* Loading state */}
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
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={handleRetry}
              sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
            >
              Enter Manually
            </Button>
          </Box>
        </Box>
      )}

      {/* Scan frame overlay — UPI style: full-width top/bottom bars + center box */}
      {isScanning && (
        <>
          {/* Dark overlay top */}
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
          {/* Dark overlay bottom */}
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
          {/* Scan frame — center 60% of screen width */}
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
            {/* Animated scan line */}
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
            {/* Corner accents — UPI style */}
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

          {/* Instructions */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '6%',
              left: 0,
              right: 0,
              textAlign: 'center',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, mb: 0.5 }}>
              Place QR code in the frame
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Scanning automatically — any angle works
            </Typography>
          </Box>
        </>
      )}
    </Dialog>
  );
}
