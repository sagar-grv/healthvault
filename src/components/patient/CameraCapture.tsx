'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ReplayIcon from '@mui/icons-material/Replay';

interface CameraCaptureProps {
  /** Called when user finishes capturing (one or more pages) */
  onCapture: (images: Blob[]) => void;
  /** Called when user cancels */
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPages, setCapturedPages] = useState<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Start camera
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    try {
      // Stop existing stream
      if (videoRef.current?.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 2560 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera access denied. Please allow camera permission.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Could not access camera. Try again.');
        }
      }
    }
  }, []);

  // Initialize camera on mount and when facing mode changes
  useEffect(() => {
    const videoEl = videoRef.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera(facingMode);
    return () => {
      if (videoEl?.srcObject) {
        const existingStream = videoEl.srcObject as MediaStream;
        existingStream.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    // Auto-enhance: slight contrast boost for document readability
    // (lightweight — no heavy processing)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      },
      'image/jpeg',
      0.92 // High quality capture — compression happens in optimizer later
    );
  }, []);

  // Accept the captured photo
  const acceptPhoto = useCallback(() => {
    if (!previewUrl) return;

    // Convert preview URL back to blob
    fetch(previewUrl)
      .then((r) => r.blob())
      .then((blob) => {
        setCapturedPages((prev) => [...prev, blob]);
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      });
  }, [previewUrl]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Finish — return all captured pages
  const finishCapture = useCallback(() => {
    // Stop camera
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    onCapture(capturedPages);
  }, [stream, capturedPages, onCapture]);

  // Switch camera direction
  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  }, [stream, previewUrl, onClose]);

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          bgcolor: 'black',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Typography color="white" sx={{ textAlign: 'center', mb: 3 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={handleClose}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        bgcolor: 'black',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
        }}
      >
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
        {capturedPages.length > 0 && (
          <Typography
            color="white"
            variant="body2"
            sx={{
              bgcolor: 'rgba(0,0,0,0.5)',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
            }}
          >
            {capturedPages.length} page
            {capturedPages.length > 1 ? 's' : ''} captured
          </Typography>
        )}
        <IconButton onClick={switchCamera} sx={{ color: 'white' }}>
          <FlipCameraAndroidIcon />
        </IconButton>
      </Box>

      {/* Camera view OR Preview */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!previewUrl ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Document guide overlay */}
            <Fade in={cameraReady}>
              <Box
                sx={{
                  position: 'absolute',
                  inset: '10% 5%',
                  border: '2px solid rgba(255,255,255,0.6)',
                  borderRadius: 2,
                  pointerEvents: 'none',
                }}
              />
            </Fade>
            {/* Instruction */}
            <Fade in={cameraReady}>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 120,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                }}
              >
                <Typography
                  color="white"
                  variant="body2"
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.5)',
                    display: 'inline-block',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                  }}
                >
                  Hold steady over your report
                </Typography>
              </Box>
            </Fade>
          </>
        ) : (
          /* Preview captured image */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Captured report"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        )}
      </Box>

      {/* Bottom controls */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {!previewUrl ? (
          /* Capture button */
          <>
            {capturedPages.length > 0 && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={finishCapture}
                sx={{ borderRadius: 3 }}
              >
                Done ({capturedPages.length})
              </Button>
            )}
            <IconButton
              onClick={capturePhoto}
              sx={{
                width: 72,
                height: 72,
                border: '4px solid white',
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              <CameraAltIcon sx={{ fontSize: 32, color: 'white' }} />
            </IconButton>
            {capturedPages.length === 0 && <Box sx={{ width: 72 }} />}
          </>
        ) : (
          /* Preview actions: Retake or Accept */
          <>
            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={retakePhoto}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Retake
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={acceptPhoto}
              sx={{ borderRadius: 3 }}
            >
              Add Page
            </Button>
          </>
        )}
      </Box>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
}
