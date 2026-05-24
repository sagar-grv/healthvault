'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import { ScanReportIcon, UploadCloudIcon, EmergencyHeartIcon } from '@/components/icons/FabIcons';

interface AddReportSheetProps {
  open: boolean;
  onClose: () => void;
  onScanReport: () => void;
  onUploadFile: () => void;
  onEmergencyCard: () => void;
}

const ACTIONS = [
  {
    id: 'scan',
    icon: (color: string) => <ScanReportIcon size={40} color={color} />,
    title: 'Scan Report',
    subtitle: 'Point camera at your medical report',
    bg: '#EFF6FF',
    iconColor: '#2563EB',
    borderColor: '#BFDBFE',
  },
  {
    id: 'upload',
    icon: (color: string) => <UploadCloudIcon size={40} color={color} />,
    title: 'Upload from Phone',
    subtitle: 'Choose a PDF or image from gallery',
    bg: '#F0FDF4',
    iconColor: '#059669',
    borderColor: '#A7F3D0',
  },
  {
    id: 'emergency',
    icon: (color: string) => <EmergencyHeartIcon size={40} color={color} />,
    title: 'Emergency Card',
    subtitle: 'Set up your emergency medical info + SOS',
    bg: '#FEF2F2',
    iconColor: '#DC2626',
    borderColor: '#FECACA',
  },
] as const;

export default function AddReportSheet({
  open,
  onClose,
  onScanReport,
  onUploadFile,
  onEmergencyCard,
}: AddReportSheetProps) {
  const handlers = {
    scan: onScanReport,
    upload: onUploadFile,
    emergency: onEmergencyCard,
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          borderRadius: '20px 20px 0 0',
          pb: 'env(safe-area-inset-bottom, 16px)',
          maxWidth: 540,
          mx: 'auto',
          left: 0,
          right: 0,
        },
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(2px)',
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ pt: 1.5, pb: 1, display: 'flex', justifyContent: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            bgcolor: '#D1D5DB',
          }}
        />
      </Box>

      {/* Title */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, px: 3, pb: 2, color: '#111827' }}>
        Add Report
      </Typography>

      {/* Actions */}
      <Box sx={{ px: 2, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {ACTIONS.map((action) => (
          <ButtonBase
            key={action.id}
            onClick={() => {
              onClose();
              handlers[action.id]();
            }}
            sx={{
              width: '100%',
              borderRadius: 3,
              border: `1.5px solid ${action.borderColor}`,
              bgcolor: action.bg,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textAlign: 'left',
              transition: 'all 0.15s ease',
              '&:hover': {
                filter: 'brightness(0.97)',
                transform: 'scale(0.99)',
              },
              '&:active': {
                transform: 'scale(0.97)',
              },
            }}
          >
            {/* Icon box */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2.5,
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              {action.icon(action.iconColor)}
            </Box>

            {/* Text */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.3 }}
              >
                {action.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3, lineHeight: 1.4 }}>
                {action.subtitle}
              </Typography>
            </Box>

            {/* Chevron */}
            <Box sx={{ color: action.iconColor, flexShrink: 0, opacity: 0.6 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M7.5 5L12.5 10L7.5 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
          </ButtonBase>
        ))}
      </Box>
    </Drawer>
  );
}
