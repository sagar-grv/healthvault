'use client';

import { useState, useCallback, ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import type { SnackbarOrigin } from '@mui/material/Snackbar';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: Severity;
}

interface UseSnackbarOptions {
  anchorOrigin?: SnackbarOrigin;
  autoHideDuration?: number;
}

interface UseSnackbarReturn {
  showSnackbar: (message: string, severity?: Severity) => void;
  snackbarComponent: ReactNode;
}

export function useSnackbar(options: UseSnackbarOptions = {}): UseSnackbarReturn {
  const { anchorOrigin = { vertical: 'bottom', horizontal: 'left' }, autoHideDuration = 4000 } =
    options;
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = useCallback((message: string, severity: Severity = 'info') => {
    setState({ open: true, message, severity });
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const snackbarComponent = (
    <Snackbar
      open={state.open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        onClose={handleClose}
        severity={state.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {state.message}
      </Alert>
    </Snackbar>
  );

  return { showSnackbar, snackbarComponent };
}
