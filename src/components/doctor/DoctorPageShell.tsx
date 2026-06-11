'use client';

import { useState, useEffect, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import QrCodeIcon from '@mui/icons-material/QrCode2';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, DoctorProfile } from '@/types';
import DoctorBottomNav from './DoctorBottomNav';

const DoctorAIAssistant = dynamic(() => import('@/components/doctor/DoctorAIAssistant'), {
  ssr: false,
});

export default function DoctorPageShell({ children }: { children: ReactNode }) {
  const [qrOpen, setQrOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [recentPatients, setRecentPatients] = useState<
    { id: string; full_name: string; health_id: string | null }[]
  >([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('doctor_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase
          .from('shared_reports')
          .select('patient_id, patient:patient_id(full_name, health_id)')
          .eq('doctor_id', user.id)
          .order('shared_at', { ascending: false })
          .limit(5),
      ]).then(([{ data: p }, { data: dp }, { data: shares }]) => {
        setProfile(p);
        setDoctorProfile(dp as DoctorProfile | null);
        if (shares) {
          const patients = shares
            .map(
              (s: {
                patient_id: string;
                patient: { full_name: string; health_id: string }[] | null;
              }) => {
                const p = s.patient?.[0];
                return p
                  ? { id: s.patient_id, full_name: p.full_name, health_id: p.health_id }
                  : null;
              }
            )
            .filter(Boolean) as { id: string; full_name: string; health_id: string | null }[];
          setRecentPatients(patients);
        }
      });
    });
  }, []);

  const doctorShareUrl = profile?.id
    ? `https://healthvault-dusky.vercel.app/doctor-share/${profile.id}`
    : '';

  const handleCopyLink = async () => {
    if (!doctorShareUrl) return;
    try {
      await navigator.clipboard.writeText(doctorShareUrl);
      setSnackbar({ open: true, message: 'Link copied!' });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
        {children}

        {/* QR Dialog */}
        <Dialog
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          maxWidth="xs"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        >
          <DialogContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Your Doctor QR
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                p: 2,
                bgcolor: 'white',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                mb: 2,
              }}
            >
              {profile?.id && (
                <QRCodeSVG
                  id="doctor-page-qr"
                  value={doctorShareUrl}
                  size={200}
                  level="M"
                  fgColor="#047857"
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  const svg = document.getElementById('doctor-page-qr');
                  if (!svg) return;
                  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${profile?.full_name || 'doctor'}-share-qr.svg`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                Download
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  const svg = document.getElementById('doctor-page-qr');
                  if (!svg) return;
                  const w = window.open('', '_blank');
                  if (!w) return;
                  w.document.write(
                    `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0">${svg.outerHTML}</body></html>`
                  );
                  w.document.close();
                  w.print();
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                Print
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                onClick={handleCopyLink}
                sx={{ fontSize: '0.75rem' }}
              >
                Copy Link
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* QR FAB */}
        <Fab
          aria-label="Your Scan-to-Share QR"
          onClick={() => setQrOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 'calc(144px + env(safe-area-inset-bottom, 0px))',
            right: 20,
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #047857, #10B981)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
            zIndex: 1200,
            '&:hover': {
              background: 'linear-gradient(135deg, #065F46, #047857)',
              transform: 'scale(1.05)',
            },
            transition: 'transform 0.15s ease',
          }}
        >
          <QrCodeIcon sx={{ fontSize: 24 }} />
        </Fab>

        {/* AI Assistant */}
        {profile && (
          <DoctorAIAssistant
            profile={profile}
            doctorProfile={doctorProfile}
            recentPatients={recentPatients}
          />
        )}
      </Box>

      <DoctorBottomNav />

      {snackbar.open && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'grey.900',
            color: 'white',
            px: 3,
            py: 1,
            borderRadius: 2,
            zIndex: 9999,
            fontSize: '0.85rem',
            boxShadow: 4,
          }}
        >
          {snackbar.message}
        </Box>
      )}
    </>
  );
}
