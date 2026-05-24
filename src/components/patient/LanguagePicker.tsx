'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import CheckIcon from '@mui/icons-material/Check';
import LanguageIcon from '@mui/icons-material/Language';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
];

interface LanguagePickerProps {
  open: boolean;
  currentLocale: string;
  onClose: () => void;
  onSelect: (locale: string) => void;
}

export default function LanguagePicker({
  open,
  currentLocale,
  onClose,
  onSelect,
}: LanguagePickerProps) {
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
          maxHeight: '80vh',
        },
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(2px)',
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ pt: 1.5, pb: 0.5, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(150,150,150,0.35)' }} />
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, pt: 1.5, pb: 2 }}>
        <LanguageIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Choose Language
        </Typography>
      </Box>

      {/* Language list */}
      <Box sx={{ px: 2, pb: 3, overflowY: 'auto' }}>
        {LANGUAGES.map((lang) => {
          const isSelected = currentLocale === lang.code;
          return (
            <ButtonBase
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                borderRadius: 2,
                mb: 0.5,
                bgcolor: isSelected ? 'rgba(37,99,235,0.10)' : 'transparent',
                border: isSelected ? '1.5px solid rgba(37,99,235,0.35)' : '1.5px solid transparent',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'action.hover' },
                '&:active': { transform: 'scale(0.99)' },
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'primary.main' : 'text.primary',
                    lineHeight: 1.3,
                  }}
                >
                  {lang.native}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang.name}
                </Typography>
              </Box>
              {isSelected && <CheckIcon sx={{ color: 'primary.main', fontSize: 20 }} />}
            </ButtonBase>
          );
        })}
      </Box>
    </Drawer>
  );
}
