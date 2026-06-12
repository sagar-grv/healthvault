'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ReplayIcon from '@mui/icons-material/Replay';
import CropIcon from '@mui/icons-material/Crop';
import {
  detectDocumentCorners,
  perspectiveCrop,
  getDefaultCorners,
  type DocumentCorners,
  type Point,
} from '@/lib/utils/document-scanner';

interface CameraCaptureProps {
  onCapture: (images: Blob[]) => void;
  onClose: () => void;
}

type Stage = 'camera' | 'crop' | 'preview';

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPages, setCapturedPages] = useState<Blob[]>([]);
  const [stage, setStage] = useState<Stage>('camera');
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [corners, setCorners] = useState<DocumentCorners | null>(null);
  const [dragging, setDragging] = useState<keyof DocumentCorners | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Start camera
  useEffect(() => {
    const videoEl = videoRef.current;
    let mounted = true;

    const startCamera = async () => {
      try {
        if (videoEl?.srcObject) {
          (videoEl.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1920 }, height: { ideal: 2560 } },
          audio: false,
        });
        if (!mounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoEl) {
          videoEl.srcObject = mediaStream;
          videoEl.onloadedmetadata = () => {
            if (mounted) setCameraReady(true);
          };
        }
        setError(null);
      } catch (err) {
        if (!mounted) return;
        const e = err as Error;
        if (e.name === 'NotAllowedError')
          setError('Camera access denied. Please allow camera permission.');
        else if (e.name === 'NotFoundError') setError('No camera found on this device.');
        else setError('Could not access camera. Try again.');
      }
    };

    startCamera();
    return () => {
      mounted = false;
      if (videoEl?.srcObject) {
        (videoEl.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Draw corner overlay on the crop stage
  useEffect(() => {
    if (stage !== 'crop' || !corners || !overlayRef.current || !rawImageUrl) return;

    const overlay = overlayRef.current;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      overlay.width = img.width;
      overlay.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw semi-transparent overlay outside document
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, overlay.width, overlay.height);

      // Draw document polygon (clipped bright area)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
      ctx.lineTo(corners.topRight.x, corners.topRight.y);
      ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
      ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Redraw image inside polygon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
      ctx.lineTo(corners.topRight.x, corners.topRight.y);
      ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
      ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      // Draw corner border lines
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
      ctx.lineTo(corners.topRight.x, corners.topRight.y);
      ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
      ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
      ctx.closePath();
      ctx.stroke();

      // Draw draggable corner handles
      const handleRadius = Math.min(overlay.width, overlay.height) * 0.025;
      Object.values(corners).forEach((pt) => {
        ctx.beginPath();
        ctx.arc((pt as Point).x, (pt as Point).y, handleRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#10B981';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };
    img.src = rawImageUrl;
  }, [stage, corners, rawImageUrl]);

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

    // Detect corners
    setDetecting(true);
    setTimeout(() => {
      const detected = detectDocumentCorners(canvas);
      const finalCorners = detected || getDefaultCorners(canvas.width, canvas.height);
      setCorners(finalCorners);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const rawUrl = URL.createObjectURL(blob);
            setRawImageUrl(rawUrl);

            if (detected) {
              // Document clearly detected — silently apply crop and jump to preview
              const cropped = perspectiveCrop(canvas, detected);
              cropped.toBlob(
                (croppedBlob) => {
                  if (croppedBlob) {
                    setCroppedUrl((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return URL.createObjectURL(croppedBlob);
                    });
                    setStage('preview');
                  }
                },
                'image/jpeg',
                0.92
              );
            } else {
              // No clear document found — show raw image in preview (skip crop drag UI)
              setCroppedUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return rawUrl;
              });
              setStage('preview');
            }
            setDetecting(false);
          }
        },
        'image/jpeg',
        0.95
      );
    }, 50);
  }, []);

  // Handle corner drag on overlay canvas
  const getScaledPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = overlayRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!corners) return;
      const pt = getScaledPoint(e);
      const SNAP = Math.min(overlayRef.current!.width, overlayRef.current!.height) * 0.06;

      const entries = Object.entries(corners) as [keyof DocumentCorners, Point][];
      for (const [key, corner] of entries) {
        if (Math.hypot(pt.x - corner.x, pt.y - corner.y) < SNAP) {
          setDragging(key);
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          break;
        }
      }
    },
    [corners, getScaledPoint]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragging || !corners) return;
      const pt = getScaledPoint(e);
      setCorners((prev) => (prev ? { ...prev, [dragging]: pt } : prev));
    },
    [dragging, corners, getScaledPoint]
  );

  const onPointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Apply crop and show preview
  const applyCrop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !corners) return;

    const cropped = perspectiveCrop(canvas, corners);
    cropped.toBlob(
      (blob) => {
        if (blob) {
          if (croppedUrl) URL.revokeObjectURL(croppedUrl);
          const url = URL.createObjectURL(blob);
          setCroppedUrl(url);
          setStage('preview');
        }
      },
      'image/jpeg',
      0.92
    );
  }, [corners, croppedUrl]);

  // Accept and add to pages
  const acceptPage = useCallback(() => {
    if (!croppedUrl) return;
    fetch(croppedUrl)
      .then((r) => r.blob())
      .then((blob) => {
        setCapturedPages((prev) => [...prev, blob]);
        URL.revokeObjectURL(croppedUrl);
        setCroppedUrl(null);
        if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
        setRawImageUrl(null);
        setCorners(null);
        setStage('camera');
      });
  }, [croppedUrl, rawImageUrl]);

  const retake = useCallback(() => {
    if (croppedUrl) URL.revokeObjectURL(croppedUrl);
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
    setCroppedUrl(null);
    setRawImageUrl(null);
    setCorners(null);
    setStage('camera');
  }, [croppedUrl, rawImageUrl]);

  const finishCapture = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    onCapture(capturedPages);
  }, [capturedPages, onCapture]);

  const handleClose = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    if (croppedUrl) URL.revokeObjectURL(croppedUrl);
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
    onClose();
  }, [croppedUrl, rawImageUrl, onClose]);

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
            sx={{ bgcolor: 'rgba(0,0,0,0.5)', px: 1.5, py: 0.5, borderRadius: 2 }}
          >
            {capturedPages.length} page{capturedPages.length > 1 ? 's' : ''} captured
          </Typography>
        )}
        {stage === 'camera' && (
          <IconButton
            onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
            sx={{ color: 'white' }}
          >
            <FlipCameraAndroidIcon />
          </IconButton>
        )}
        {stage !== 'camera' && <Box sx={{ width: 40 }} />}
      </Box>

      {/* Stage: Camera */}
      {stage === 'camera' && (
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
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
          <Fade in={cameraReady}>
            <Box sx={{ position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center' }}>
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
          {detecting && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.4)',
              }}
            >
              <CircularProgress sx={{ color: 'secondary.light' }} />
              <Typography color="white" sx={{ ml: 2 }}>
                Detecting edges...
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Stage: Crop (adjust corners) */}
      {stage === 'crop' && rawImageUrl && (
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <canvas
            ref={overlayRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ width: '100%', height: '100%', objectFit: 'contain', touchAction: 'none' }}
          />
          <Box sx={{ position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center' }}>
            <Typography
              color="white"
              variant="body2"
              sx={{
                bgcolor: 'rgba(0,0,0,0.6)',
                display: 'inline-block',
                px: 2,
                py: 0.5,
                borderRadius: 2,
              }}
            >
              Drag green dots to adjust corners
            </Typography>
          </Box>
        </Box>
      )}

      {/* Stage: Preview (cropped result) */}
      {stage === 'preview' && croppedUrl && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={croppedUrl}
            alt="Cropped report"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>
      )}

      {/* Bottom controls */}
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3 }}>
        {stage === 'camera' && (
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
              disabled={!cameraReady || detecting}
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
        )}

        {stage === 'crop' && (
          <>
            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={retake}
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
              color="success"
              startIcon={<CropIcon />}
              onClick={applyCrop}
              sx={{ borderRadius: 3 }}
            >
              Crop Document
            </Button>
          </>
        )}

        {stage === 'preview' && (
          <>
            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={retake}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Retake
            </Button>
            <Button
              variant="outlined"
              startIcon={<CropIcon />}
              onClick={() => setStage('crop')}
              sx={{
                color: 'rgba(255,255,255,0.75)',
                borderColor: 'rgba(255,255,255,0.4)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Adjust
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={acceptPage}
              sx={{ borderRadius: 3 }}
            >
              Add Page
            </Button>
          </>
        )}
      </Box>

      {/* Hidden canvases */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={cropCanvasRef} style={{ display: 'none' }} />
    </Box>
  );
}
