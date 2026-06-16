'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000;

export default function SessionManager() {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningOpenRef = useRef(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  const cleanupTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const logout = useCallback(async () => {
    cleanupTimers();
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // ignore
    }
    window.location.href = '/login';
  }, [cleanupTimers]);

  const handleStayLoggedIn = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    warningOpenRef.current = false;
    setWarningOpen(false);
  }, []);

  useEffect(() => {
    function startIdleTimer() {
      cleanupTimers();
      warningOpenRef.current = false;
      idleTimerRef.current = setTimeout(() => {
        warningOpenRef.current = true;
        // Schedule state updates as microtasks to avoid synchronous setState in effect
        Promise.resolve().then(() => {
          setWarningOpen(true);
          setSecondsLeft(120);
        });
        countdownRef.current = setInterval(() => {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              logout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);
    }

    startIdleTimer();

    const handleActivity = () => {
      if (!warningOpenRef.current) {
        startIdleTimer();
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => document.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      cleanupTimers();
      events.forEach((event) => document.removeEventListener(event, handleActivity));
    };
  }, [cleanupTimers, logout]);

  return (
    <Dialog
      open={warningOpen}
      onClose={handleStayLoggedIn}
      slotProps={{ paper: { sx: { borderRadius: 3, maxWidth: 400 } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Session Expiring Soon
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          You have been inactive for a while. Your session will expire in{' '}
          <strong style={{ color: '#f59e0b' }}>
            {Math.floor(secondsLeft / 60)}m {secondsLeft % 60}s
          </strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click &quot;Stay Logged In&quot; to continue your session.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={logout}
          variant="outlined"
          color="error"
          size="small"
          sx={{ fontWeight: 600 }}
        >
          Log Out Now
        </Button>
        <Button
          onClick={handleStayLoggedIn}
          variant="contained"
          color="secondary"
          size="small"
          sx={{ fontWeight: 700 }}
        >
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
}
