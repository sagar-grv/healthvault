'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function TermsModal({ open, onClose, onAccept }: TermsModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setScrolledToBottom(isAtBottom);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', fontWeight: 600 }}>
        Terms & Conditions
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.5 }}>
          Read and accept to continue
        </Typography>
      </DialogTitle>
      <DialogContent onScroll={handleScroll} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Terms of Service
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Welcome to HealthVault. By using our service, you agree to these terms and conditions.
          HealthVault is a digital health records platform that enables patients to upload, store,
          and share medical records with doctors using a unique Health ID.
        </Typography>
        <Typography sx={{ mb: 2 }}>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activities that occur under your account.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Privacy Policy
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Your privacy is important to us. We collect only the information necessary to provide our
          services. Your medical data is stored securely using industry-standard encryption.
        </Typography>
        <Typography sx={{ mb: 2 }}>
          You have the right to access, modify, or delete your personal data at any time.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Data Sharing Consent
        </Typography>
        <Typography sx={{ mb: 2 }}>
          HealthVault allows you to share your medical records with verified healthcare providers.
          You control which reports are shared and can revoke access at any time.
        </Typography>

        {!scrolledToBottom && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            ↑ Scroll to read the full terms ↑
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onAccept} variant="contained" disabled={!scrolledToBottom}>
          I Agree
        </Button>
      </DialogActions>
    </Dialog>
  );
}
