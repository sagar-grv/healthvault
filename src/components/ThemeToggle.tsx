'use client';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeMode } from '@/components/ThemeProvider';

export default function ThemeToggle({ size = 'small' }: { size?: 'small' | 'medium' }) {
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleMode}
        size={size}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        sx={{
          color: isDark ? '#FBD26A' : 'text.secondary',
          transition: 'color 0.2s ease, transform 0.2s ease',
          '&:hover': { transform: 'rotate(20deg)' },
        }}
      >
        {isDark ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
      </IconButton>
    </Tooltip>
  );
}
