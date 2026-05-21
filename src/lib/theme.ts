'use client';

import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#059669',
      light: '#10B981',
      dark: '#047857',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    success: { main: '#10B981' },
    divider: '#E5E7EB',
  },
  typography: {
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
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.9375rem', // 15px — more readable for elderly users
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
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
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '1rem',
          borderRadius: 12,
        },
        sizeSmall: {
          padding: '6px 14px',
          fontSize: '0.8125rem',
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid #E5E7EB',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            transition: 'box-shadow 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#2563EB',
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha('#2563EB', 0.1)}`,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#E5E7EB',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 0 #E5E7EB',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255,255,255,0.95)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: '1px solid #E5E7EB',
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#2563EB',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E5E7EB',
        },
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
        root: {
          borderRadius: 99,
          backgroundColor: alpha('#2563EB', 0.12),
        },
        bar: {
          borderRadius: 99,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 6,
        },
        thumb: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        },
        track: {
          borderRadius: 99,
          opacity: 1,
          backgroundColor: '#D1D5DB',
        },
        switchBase: {
          '&.Mui-checked': {
            '& + .MuiSwitch-track': {
              opacity: 1,
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif',
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '0.9rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        },
      },
    },
  },
});

export default theme;
