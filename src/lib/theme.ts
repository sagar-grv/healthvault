'use client';

import { createTheme, alpha } from '@mui/material/styles';
import type { Shadows } from '@mui/material/styles';

// ─── Shared typography + shape + shadows ─────────────────────────────────────

const typography = {
  fontFamily: 'var(--font-body), "Inter", "Helvetica", "Arial", sans-serif',
  h1: {
    fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
    fontSize: '2.5rem',
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.015em',
  },
  h3: {
    fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
    fontSize: '1.5rem',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
    fontSize: '1.25rem',
    fontWeight: 700,
    lineHeight: 1.4,
  },
  h5: {
    fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body1: { fontSize: '1rem', lineHeight: 1.6 },
  body2: { fontSize: '0.9375rem', lineHeight: 1.5 },
  button: {
    textTransform: 'none' as const,
    fontWeight: 600,
    fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
  },
  caption: { fontSize: '0.75rem', lineHeight: 1.4 },
};

const shape = { borderRadius: 12 };

const shadows: Shadows = [
  'none',
  '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
  '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
  '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)',
  '0 20px 25px rgba(0,0,0,0.07), 0 10px 10px rgba(0,0,0,0.03)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
  '0 25px 50px rgba(0,0,0,0.08)',
];

// ─── Component overrides (mode-aware) ────────────────────────────────────────

const getComponents = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'scale(0.98)' },
        },
        sizeLarge: { padding: '14px 32px', fontSize: '1rem', borderRadius: 12 },
        sizeSmall: { padding: '6px 14px', fontSize: '0.8125rem', borderRadius: 8 },
        contained: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: isDark
            ? '0 1px 3px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          border: isDark ? '1px solid #334155' : '1px solid #E5E7EB',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: isDark
              ? '0 10px 25px rgba(0,0,0,0.4)'
              : '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            transition: 'box-shadow 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563EB' },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha('#2563EB', 0.15)}` },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#334155' : '#E5E7EB',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: isDark ? '0 1px 0 #334155' : '0 1px 0 #E5E7EB',
          backdropFilter: 'blur(8px)',
          backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 20, fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12, fontWeight: 500 } },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: isDark ? '1px solid #334155' : '1px solid #E5E7EB',
          height: 64,
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { '&.Mui-selected': { color: '#2563EB' } },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: isDark ? '#334155' : '#E5E7EB' },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
          fontWeight: 700,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, backgroundColor: alpha('#2563EB', 0.12) },
        bar: { borderRadius: 99 },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 6 },
        thumb: { boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
        track: { borderRadius: 99, opacity: 1, backgroundColor: isDark ? '#475569' : '#D1D5DB' },
        switchBase: { '&.Mui-checked': { '& + .MuiSwitch-track': { opacity: 1 } } },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
          fontWeight: 600,
          textTransform: 'none' as const,
          fontSize: '0.9rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: isDark ? '0 25px 50px rgba(0,0,0,0.6)' : '0 25px 50px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        },
      },
    },
  };
};

// ─── Light theme ──────────────────────────────────────────────────────────────

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1D4ED8', contrastText: '#FFFFFF' },
    secondary: { main: '#059669', light: '#10B981', dark: '#047857', contrastText: '#FFFFFF' },
    background: { default: '#F9FAFB', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280' },
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    success: { main: '#10B981' },
    divider: '#E5E7EB',
  },
  typography,
  shape,
  shadows,
  components: getComponents('light'),
});

// ─── Dark theme ───────────────────────────────────────────────────────────────

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', contrastText: '#FFFFFF' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#FFFFFF' },
    background: { default: '#0F172A', paper: '#1E293B' },
    text: { primary: '#F1F5F9', secondary: '#94A3B8' },
    error: { main: '#F87171' },
    warning: { main: '#FBD26A' },
    success: { main: '#34D399' },
    divider: '#334155',
  },
  typography,
  shape,
  shadows,
  components: getComponents('dark'),
});

// Default export kept for any imports that use the old single-theme pattern
export default lightTheme;
