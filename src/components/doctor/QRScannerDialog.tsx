'use client';

import { useEffect, useRef, useState, useCallback, startTransition } from 'react';
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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { parseQRContent } from '@/lib/utils/qr-parser';
import { getBrowserSettingsInstructions, detectBrowser } from '@/lib/hooks/usePermission';

interface QRScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (healthId: string) => void;
  /** Optional custom parser — receives raw QR content, returns parsed string or null.
   *  When omitted, the default parseQRContent (Health ID) is used. */
  customParser?: (raw: string) => string | null;
}

type ScanState = 'idle' | 'starting' | 'scanning' | 'success' | 'error';

export default function QRScannerDialog({
  open,
  onClose,
  onScan,
  customParser,
}: QRScannerDialogProps) {
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
    applyVideoConstraints: (c: object) => Promise<void>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [error, setError] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [cameraCount, setCameraCount] = useState(0);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const startScanner = useCallback(async () => {
    setScanState('starting');
    setError('');

    // Two rAF cycles ensure the DOM element has real dimensions before html5-qrcode measures it
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // Enumerate cameras
      let cameras: { id: string; label: string }[] = [];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch {
        /* permission not yet granted */
      }
      setCameraCount(cameras.length);

      const scanner = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      const upiConfig = {
        fps: 30,
        disableFlip: false,
        aspectRatio: window.innerHeight / window.innerWidth,
      };

      const onDecode = (decoded: string) => {
        const parsed = customParser ? customParser(decoded) : parseQRContent(decoded);
        if (parsed) {
          if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
          setScanState('success');
          stopScanner();
          onScan(parsed);
        }
      };

      let started = false;

      if (!started) {
        try {
          await scanner.start({ facingMode: 'environment' }, upiConfig, onDecode, () => {});
          started = true;
        } catch {
          /* unavailable */
        }
      }
      if (!started) {
        try {
          await scanner.start({ facingMode: 'user' }, upiConfig, onDecode, () => {});
          started = true;
        } catch {
          /* unavailable */
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

      setScanState('scanning');
      setHasStarted(true);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      const name = e?.name ?? '';
      const msg = (e?.message ?? '').toLowerCase();
      if (name === 'NotAllowedError' || msg.includes('permission') || msg.includes('denied')) {
        setShowSettings(true);
        setScanState('idle');
      } else if (name === 'NotFoundError' || msg.includes('no camera')) {
        setError('No camera found on this device.');
        setScanState('error');
      } else if (msg.includes('already in use') || msg.includes('notreadableerror')) {
        setError('Camera is in use by another app. Close it and tap Retry.');
        setScanState('error');
      } else {
        setError('Could not start camera. Enter the Health ID manually instead.');
        setScanState('error');
      }
    }
  }, [stopScanner, customParser, onScan]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }
    startTransition(() => {
      setScanState('idle');
      setError('');
      setHasStarted(false);
      setTorchOn(false);
      setCameraCount(0);
      setCameraIndex(0);
    });
  }, [open, stopScanner]);

  const handleContinue = useCallback(async () => {
    // iOS Safari: getUserMedia Promise MUST be created synchronously within the
    // click handler (gesture context). Any await before it destroys the gesture
    // context and causes NotAllowedError even when permission is granted.
    //
    // Strategy: pre-establish camera permission by calling getUserMedia directly
    // in the gesture context. Once permission is granted on iOS Safari, subsequent
    // getUserMedia calls (including from html5-qrcode) work regardless of gesture
    // context. The permissions pre-check is non-blocking via .then().
    try {
      navigator.permissions.query({ name: 'camera' as PermissionName }).then((perm) => {
        if (perm.state === 'denied') {
          setShowSettings(true);
        }
      });
    } catch {
      /* permissions query not supported — proceed */
    }

    // Pre-establish camera permission — creates the getUserMedia Promise inside gesture context
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      // Permission granted — stop the temp stream immediately
      tempStream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'NotAllowedError') {
        setShowSettings(true);
        return;
      }
      // Other errors (no camera, in use, etc.) — let startScanner handle them
    }

    setShowSettings(false);
    startScanner();
  }, [startScanner]);

  const handleClose = useCallback(() => {
    stopScanner();
    setScanState('idle');
    setError('');
    setTorchOn(false);
    setShowSettings(false);
    onClose();
  }, [stopScanner, onClose]);

  const handleRetry = useCallback(async () => {
    await stopScanner();
    setScanState('idle');
    setError('');
    setTorchOn(false);
    setShowSettings(false);
    handleContinue();
  }, [stopScanner, handleContinue]);

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

      // Toggle to the next camera
      const nextIndex = (cameraIndex + 1) % cameras.length;
      setCameraIndex(nextIndex);

      const scanner = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        cameras[nextIndex].id,
        { fps: 30, disableFlip: false, aspectRatio: window.innerHeight / window.innerWidth },
        (decoded: string) => {
          const parsed = customParser ? customParser(decoded) : parseQRContent(decoded);
          if (parsed) {
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            stopScanner();
            onScan(parsed);
          }
        },
        () => {}
      );
    } catch {
      /* switch failed — ignore */
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-upload-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      const result = await scanner.scanFile(file, /* showImage= */ false);
      scanner.clear();
      const parsed = customParser ? customParser(result) : parseQRContent(result);
      if (parsed) {
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setScanState('success');
        onScan(parsed);
      } else {
        setError('No Health ID found in this image. Try a different QR code.');
        setScanState('error');
      }
    } catch {
      setError('Could not read a QR code from this image. Try a clearer photo.');
      setScanState('error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      {/* Hidden file input for QR image upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      {/* Hidden div for upload scanner */}
      <Box
        id="qr-upload-container"
        sx={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
      />

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
          <CircularProgress sx={{ color: 'secondary.light', mb: 2 }} size={40} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Starting camera…
          </Typography>
        </Box>
      )}

      {/* Permission prompt */}
      {!hasStarted && scanState === 'idle' && !showSettings && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: 4,
          }}
        >
          <Box component="span" sx={{ fontSize: 64, mb: 3, lineHeight: 1 }}>
            📷
          </Box>
          <Typography variant="h5" color="white" sx={{ fontWeight: 700, mb: 1 }}>
            Camera Access Needed
          </Typography>
          <Typography
            color="rgba(255,255,255,0.7)"
            sx={{ textAlign: 'center', maxWidth: 320, mb: 3, lineHeight: 1.6 }}
          >
            HealthVault uses your camera to scan Health ID QR codes. Your camera feed is processed
            locally and never leaves your device.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              width: '100%',
              maxWidth: 280,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              sx={{ bgcolor: 'secondary.light', '&:hover': { bgcolor: 'secondary.main' } }}
            >
              Continue
            </Button>
            <Button variant="text" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* Settings instructions */}
      {showSettings && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: 4,
          }}
        >
          <SettingsIcon sx={{ fontSize: 48, color: 'white', mb: 2 }} />
          <Typography variant="h6" color="white" sx={{ fontWeight: 700, mb: 1 }}>
            Camera Access Blocked
          </Typography>
          <Typography
            color="rgba(255,255,255,0.6)"
            sx={{ textAlign: 'center', mb: 2, fontSize: '0.85rem' }}
          >
            {detectBrowser() === 'ios_safari'
              ? 'iOS Safari'
              : detectBrowser() === 'chrome_android'
                ? 'Chrome (Android)'
                : 'Your browser'}{' '}
            has blocked camera access.
          </Typography>
          <Box
            component="ol"
            sx={{
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'left',
              maxWidth: 340,
              mb: 3,
              fontSize: '0.85rem',
              lineHeight: 1.8,
              pl: 2.5,
              '& li': { mb: 0.5 },
            }}
          >
            {getBrowserSettingsInstructions('camera').steps.map((s, i) => (
              <Box key={i} component="li" dangerouslySetInnerHTML={{ __html: s }} />
            ))}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              maxWidth: 280,
              width: '100%',
            }}
          >
            {getBrowserSettingsInstructions('camera').settingsUrl && (
              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                onClick={() =>
                  window.open(getBrowserSettingsInstructions('camera').settingsUrl, '_blank')
                }
                sx={{ bgcolor: 'secondary.light', '&:hover': { bgcolor: 'secondary.main' } }}
              >
                Open Settings
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handleContinue}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
            >
              Retry
            </Button>
            <Button variant="text" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Go Back
            </Button>
          </Box>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                onClick={handleRetry}
                sx={{ bgcolor: 'secondary.light', '&:hover': { bgcolor: 'secondary.main' } }}
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
              border: '2px solid',
              borderColor: 'secondary.light',
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
                bgcolor: 'secondary.light',
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
                  borderColor: 'secondary.light',
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
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'white', fontWeight: 600, mb: 0.5, pointerEvents: 'none' }}
            >
              Place QR code in the frame
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
        </>
      )}
    </Dialog>
  );
}
