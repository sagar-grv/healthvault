'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';

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
        {/* Health ID display — large, readable */}
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
          Give this ID to your doctor before they see you. They will type it to view your shared
          records.
        </Typography>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              onCopy();
              onClose();
            }}
            sx={{ borderRadius: 2.5, py: 1.5 }}
          >
            Copy ID
          </Button>
          <Button
            variant="contained"
            fullWidth
            startIcon={<ShareIcon />}
            onClick={() => {
              onWhatsApp();
              onClose();
            }}
            sx={{ borderRadius: 2.5, py: 1.5 }}
          >
            Share via WhatsApp
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
