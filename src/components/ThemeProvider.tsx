'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@/lib/theme';

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeModeContextType {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'light',
  toggleMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy init from localStorage — reads saved preference before first render
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('hv_theme') as 'light' | 'dark') || 'light';
  });

  // Keep data-theme attribute on <html> in sync whenever mode changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('hv_theme', mode);
    // Optionally persist in cookie so server can read it for SSR in future
    document.cookie = `hv_theme=${mode}; path=/; max-age=31536000; SameSite=Lax`;
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const contextValue = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);
  const activeTheme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={activeTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeModeContext.Provider>
  );
}
