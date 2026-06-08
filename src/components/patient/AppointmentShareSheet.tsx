'use client';

import { useRef } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { QRCodeSVG } from 'qrcode.react';

interface AppointmentShareSheetProps {
  open: boolean;
  onClose: () => void;
  healthId: string;
  onCopy: () => void;
  onWhatsApp: () => void;
}

export default function AppointmentShareSheet({
  open,
  onClose,
  healthId,
  onCopy,
  onWhatsApp,
}: AppointmentShareSheetProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleWhatsAppQR = async () => {
    // Generate QR image and share (image only, no text)
    const svgEl = qrRef.current?.querySelector('svg');
    if (svgEl) {
      try {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          const svgData = new XMLSerializer().serializeToString(svgEl);
          const img = new Image();
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, size, size);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            img.src = url;
          });
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png', 1.0)
          );
          if (blob && navigator.share && navigator.canShare) {
            const file = new File([blob], 'healthvault-qr.png', { type: 'image/png' });
            const shareData = { files: [file] };
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              onClose();
              return;
            }
          }
          // Fallback: download QR image
          if (blob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'healthvault-qr.png';
            a.click();
            URL.revokeObjectURL(a.href);
            onClose();
            return;
          }
        }
      } catch {
        // User cancelled or error
      }
    }
    // Last fallback: WhatsApp text-only
    onWhatsApp();
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          borderRadius: '20px 20px 0 0',
          pb: 'env(safe-area-inset-bottom, 20px)',
          maxWidth: 540,
          mx: 'auto',
          left: 0,
          right: 0,
        },
        '& .MuiBackdrop-root': { backdropFilter: 'blur(2px)' },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ pt: 1.5, pb: 0.5, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(150,150,150,0.35)' }} />
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 3, pt: 1.5, pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Share with your doctor
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        {/* QR Code + Health ID */}
        <Box
          sx={{
            bgcolor: 'rgba(37,99,235,0.08)',
            border: '1.5px solid rgba(37,99,235,0.25)',
            borderRadius: 3,
            py: 2.5,
            px: 3,
            textAlign: 'center',
            mb: 2,
          }}
        >
          <Box
            ref={qrRef}
            sx={{
              display: 'inline-block',
              bgcolor: 'white',
              borderRadius: 2,
              p: 1.5,
              mb: 1.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <QRCodeSVG value={healthId} size={120} level="M" />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              mb: 0.5,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Your Health ID
          </Typography>
          <Typography
            sx={{
              fontSize: '1.6rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: 'primary.main',
              letterSpacing: '0.12em',
            }}
          >
            {healthId}
          </Typography>
        </Box>

        {/* Instruction */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', mb: 2.5, lineHeight: 1.5 }}
        >
          Show this QR to your doctor, or share it via WhatsApp so they can scan it.
        </Typography>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<WhatsAppIcon />}
            onClick={handleWhatsAppQR}
            sx={{
              borderRadius: 2.5,
              py: 1.4,
              bgcolor: '#25D366',
              '&:hover': { bgcolor: '#1EBE5A' },
            }}
          >
            Share QR via WhatsApp
          </Button>
          <Box sx={{ display: 'flex', gap: 1.2 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ContentCopyIcon />}
              onClick={() => {
                onCopy();
                onClose();
              }}
              sx={{ borderRadius: 2.5, py: 1.4 }}
            >
              Copy ID
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ShareIcon />}
              onClick={() => {
                onWhatsApp();
                onClose();
              }}
              sx={{ borderRadius: 2.5, py: 1.4 }}
            >
              Share Text
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
