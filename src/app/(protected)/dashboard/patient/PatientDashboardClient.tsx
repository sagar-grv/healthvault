'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageIcon from '@mui/icons-material/Language';
import MedicalServicesIcon from '@mui/icons-material/MedicalServicesOutlined';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Report } from '@/types';
import { REPORT_TYPES, REPORT_TYPE_COLORS } from '@/constants';
import { setAiLanguage, syncLanguageFromProfile } from '@/lib/utils/language';
import { optimizeImage, isOptimizableImage } from '@/lib/utils/image-optimizer';
import ThemeToggle from '@/components/ThemeToggle';

// Lazy load heavy dialog components — only loaded when user clicks
const ReportDetailDialog = dynamic(() => import('@/components/patient/ReportDetailDialog'), {
  ssr: false,
});
const CameraCapture = dynamic(() => import('@/components/patient/CameraCapture'), {
  ssr: false,
});
const HealthInterpreter = dynamic(() => import('@/components/patient/HealthInterpreter'), {
  ssr: false,
});
const AddReportSheet = dynamic(() => import('@/components/patient/AddReportSheet'), {
  ssr: false,
});
const LanguagePicker = dynamic(() => import('@/components/patient/LanguagePicker'), {
  ssr: false,
});
const AppointmentShareSheet = dynamic(() => import('@/components/patient/AppointmentShareSheet'), {
  ssr: false,
});

interface PatientDashboardClientProps {
  profile: Profile;
  reports: Report[];
}

export default function PatientDashboardClient({
  profile,
  reports: initialReports,
}: PatientDashboardClientProps) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  const [navValue, setNavValue] = useState(0);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [interpretingReport, setInterpretingReport] = useState<Report | null>(null);
  const [uploadingCamera, setUploadingCamera] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [qrPopupOpen, setQrPopupOpen] = useState(false);

  // Sync language preference from DB profile on mount (cross-device sync)
  useEffect(() => {
    syncLanguageFromProfile(profile.preferred_language);
  }, [profile.preferred_language]);

  const handleCopyId = async () => {
    if (profile.health_id) {
      try {
        await navigator.clipboard.writeText(profile.health_id);
        setSnackbar({ open: true, message: 'Health ID copied!', severity: 'success' });
      } catch {
        setSnackbar({
          open: true,
          message: 'Could not copy. Please copy manually.',
          severity: 'error',
        });
      }
    }
  };

  const handleWhatsAppShare = async () => {
    // Generate QR as image and share via WhatsApp (image only, no text)
    const svgEl = document.getElementById('qr-share-canvas')?.querySelector('svg');
    if (svgEl) {
      try {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          const svgData = new XMLSerializer().serializeToString(svgEl);
          const img = new Image();
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, size, size);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            img.src = url;
          });
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png', 1.0)
          );
          if (blob && navigator.share && navigator.canShare) {
            const file = new File([blob], 'healthvault-qr.png', { type: 'image/png' });
            const shareData = { files: [file] };
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              return;
            }
          }
          // Fallback: download the QR image
          if (blob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'healthvault-qr.png';
            a.click();
            URL.revokeObjectURL(a.href);
            setSnackbar({
              open: true,
              message: 'QR image downloaded. Share it via WhatsApp.',
              severity: 'info',
            });
            return;
          }
        }
      } catch {
        // User cancelled or error — fall through
      }
    }
    // Last fallback: open WhatsApp with text
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`My HealthVault ID is ${profile.health_id}`)}`,
      '_blank'
    );
  };

  const handleToggleShareable = async (reportId: string, currentValue: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('reports')
      .update({ is_shareable: !currentValue })
      .eq('id', reportId);
    if (error) {
      setSnackbar({ open: true, message: 'Failed to update. Try again.', severity: 'error' });
      return;
    }
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, is_shareable: !currentValue } : r))
    );
    setSnackbar({
      open: true,
      message: !currentValue ? t('reportIsNowShareable') : t('reportIsNowPrivate'),
      severity: 'success',
    });
  };

  const handleDeleteReport = async (reportId: string, filePath: string) => {
    const supabase = createClient();
    const [, dbResult] = await Promise.all([
      supabase.storage.from('reports').remove([filePath]),
      supabase.from('reports').delete().eq('id', reportId),
    ]);
    if (dbResult.error) {
      setSnackbar({ open: true, message: 'Failed to delete. Try again.', severity: 'error' });
      return;
    }
    // Close detail dialog if the deleted report is currently open
    if (viewingReport?.id === reportId) setViewingReport(null);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setSnackbar({ open: true, message: 'Report deleted.', severity: 'success' });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace('/login');
  };

  // Handle camera capture — A6: use profile.id instead of auth.getUser()
  //                         A7: parallel thumbnail upload + DB insert
  const handleCameraCapture = async (images: Blob[]) => {
    setShowCamera(false);
    if (!images.length) return;
    setUploadingCamera(true);
    setSnackbar({ open: true, message: t('processingReport'), severity: 'info' });

    try {
      const supabase = createClient();
      // A6: profile.id is already available as a prop — no getUser() needed
      const userId = profile.id;

      const rawBlob = images[0];
      const rawFile = new File([rawBlob], 'camera-capture.jpg', { type: 'image/jpeg' });
      const optimized = isOptimizableImage(rawFile) ? await optimizeImage(rawFile) : null;
      const uploadBlob = optimized?.blob ?? rawBlob;
      const uploadName = optimized?.fileName ?? 'capture.jpg';
      const uploadMime = optimized?.mimeType ?? 'image/jpeg';

      const reportId = crypto.randomUUID();
      const filePath = `${userId}/${reportId}/${uploadName}`;
      const thumbnailPath = optimized?.thumbnail ? `${userId}/${reportId}/thumb.jpg` : null;

      // Upload main file
      const { error: uploadErr } = await supabase.storage
        .from('reports')
        .upload(filePath, uploadBlob, { contentType: uploadMime, upsert: false });

      if (uploadErr) {
        setSnackbar({ open: true, message: t('uploadFailed'), severity: 'error' });
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // A7: Run thumbnail upload + DB insert in parallel
      const [, { data: newReport, error: dbErr }] = await Promise.all([
        thumbnailPath && optimized?.thumbnail
          ? supabase.storage.from('reports').upload(thumbnailPath, optimized.thumbnail, {
              contentType: 'image/jpeg',
              upsert: false,
            })
          : Promise.resolve({ error: null }),
        supabase
          .from('reports')
          .insert({
            id: reportId,
            patient_id: userId,
            title: 'Captured Report',
            report_type: 'other',
            file_path: filePath,
            file_name: uploadName,
            file_size: uploadBlob.size,
            mime_type: uploadMime,
            report_date: today,
            is_shareable: false,
            thumbnail_path: thumbnailPath,
          })
          .select()
          .single(),
      ]);

      if (dbErr) {
        setSnackbar({ open: true, message: 'Failed to save. Try again.', severity: 'error' });
        await supabase.storage.from('reports').remove([filePath]);
        return;
      }

      setReports((prev) => [newReport, ...prev]);
      setSnackbar({ open: true, message: t('reportSaved'), severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: t('somethingWentWrong'), severity: 'error' });
    } finally {
      setUploadingCamera(false);
    }
  };

  const getReportTypeLabel = (type: string) =>
    REPORT_TYPES.find((t) => t.value === type)?.label || type;

  // Get current locale for the chip label and picker highlight
  const getCurrentLocale = () => {
    if (typeof window === 'undefined') return 'en';
    return (
      document.cookie
        .split('; ')
        .find((r) => r.startsWith('hv_locale='))
        ?.split('=')[1] || 'en'
    );
  };

  // Handle language selection from the picker — syncs UI locale AND AI language
  const handleLocaleSelect = useCallback(
    (locale: string) => {
      setLangPickerOpen(false);
      document.cookie = `hv_locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.setItem('hv_preferred_language', locale);
      setAiLanguage(locale);
      router.refresh();
    },
    [router]
  );

  const shareableCount = reports.filter((r) => r.is_shareable).length;

  return (
    <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Simple App Bar */}
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar sx={{ minHeight: '56px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: 'white', fontSize: 11, fontWeight: 800 }}>HV</Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1rem' }}
            >
              HealthVault
            </Typography>
          </Box>
          {/* Language picker chip — tap to open full language selector */}
          <Chip
            icon={<LanguageIcon sx={{ fontSize: '14px !important', color: 'primary.main' }} />}
            label={getCurrentLocale().toUpperCase()}
            onClick={() => setLangPickerOpen(true)}
            size="small"
            sx={{
              mr: 0.5,
              height: 26,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              bgcolor: 'rgba(37,99,235,0.08)',
              color: 'primary.main',
              border: '1px solid rgba(37,99,235,0.25)',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(37,99,235,0.14)' },
            }}
          />
          <ThemeToggle />
          <IconButton
            onClick={() => router.push('/dashboard/patient/profile')}
            aria-label="Profile"
            size="small"
          >
            <PersonIcon sx={{ fontSize: 22 }} />
          </IconButton>
          <IconButton onClick={handleLogout} aria-label="Logout" size="small" sx={{ ml: 0.5 }}>
            <LogoutIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 2.5, maxWidth: 600, mx: 'auto' }}>
        {/* Health ID Card */}
        <Card
          className="health-id-card animate-fade-in-up"
          sx={{
            mb: 3,
            border: 'none',
            borderRadius: 4,
            overflow: 'hidden',
            background:
              'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 40%, #2563EB 70%, #3B82F6 100%)',
            boxShadow: '0 8px 32px rgba(29,78,216,0.35)',
          }}
        >
          <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.65)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'block',
                mb: 1.5,
              }}
            >
              {t('yourHealthId')}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
              {/* Left: ID info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  className="health-id-text"
                  sx={{
                    fontSize: { xs: '1.4rem', sm: '1.65rem' },
                    color: 'white',
                    mb: 0.5,
                    letterSpacing: '0.1em',
                  }}
                >
                  {profile.health_id}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.6)', mb: 2.5, fontSize: '0.875rem' }}
                >
                  {profile.full_name}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 15 }} />}
                    onClick={handleCopyId}
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.25)',
                        transform: 'translateY(-1px)',
                      },
                      fontSize: '0.75rem',
                      py: 0.6,
                    }}
                  >
                    {t('copyId')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<MedicalServicesIcon sx={{ fontSize: 15 }} />}
                    onClick={() => setShareSheetOpen(true)}
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.20)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: 2,
                      fontWeight: 700,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.30)',
                        transform: 'translateY(-1px)',
                      },
                      fontSize: '0.75rem',
                      py: 0.6,
                    }}
                  >
                    Share with Doctor
                  </Button>
                </Box>
              </Box>

              {/* Right: QR Code — tap to enlarge for scanning */}
              <Tooltip title="Tap to show QR for scanning">
                <Box
                  onClick={() => setQrPopupOpen(true)}
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 2.5,
                    p: 1.2,
                    flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                    '&:hover': { transform: 'scale(1.05)' },
                    '&:active': { transform: 'scale(0.97)' },
                  }}
                >
                  <Box id="qr-share-canvas">
                    <QRCodeSVG value={profile.health_id || ''} size={90} level="M" />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.55rem',
                      color: '#64748B',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textAlign: 'center',
                    }}
                  >
                    TAP TO SHOW
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>

        {/* Recent Reports Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h5">Recent Reports</Typography>
            <Typography variant="body2" color="text.secondary">
              {reports.length} loaded · {shareableCount} shareable
            </Typography>
          </Box>
        </Box>

        {/* Reports List — shows 3 most recent reports, or empty state */}
        {reports.length === 0 ? (
          <Card
            className="animate-fade-in-up"
            sx={{
              textAlign: 'center',
              py: 7,
              border: '2px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 4,
                  bgcolor: 'rgba(37,99,235,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <NoteAddIcon sx={{ fontSize: 32, color: '#2563EB' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {t('noReports')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 260, mx: 'auto' }}
              >
                {t('noReportsHint')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/dashboard/patient/upload')}
                size="large"
              >
                {t('upload')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
            className="stagger-children"
          >
            {reports.slice(0, 3).map((report) => {
              const typeColor = REPORT_TYPE_COLORS[report.report_type] || REPORT_TYPE_COLORS.other;
              return (
                <Card
                  key={report.id}
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      '&:last-child': { pb: 2 },
                    }}
                  >
                    {/* Type icon */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2.5,
                        flexShrink: 0,
                        bgcolor: typeColor.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AssignmentOutlinedIcon sx={{ fontSize: 20, color: typeColor.color }} />
                    </Box>

                    {/* Info */}
                    <Box
                      sx={{ flexGrow: 1, minWidth: 0, cursor: 'pointer' }}
                      onClick={() => setViewingReport(report)}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                        {report.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.25 }}>
                        <Chip
                          label={getReportTypeLabel(report.report_type)}
                          size="small"
                          sx={{
                            bgcolor: typeColor.bg,
                            color: typeColor.color,
                            fontWeight: 600,
                            fontSize: '0.68rem',
                            height: 20,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(report.report_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Shareable Toggle */}
                    <Tooltip
                      title={report.is_shareable ? t('shareableWithDoctors') : t('privateOnlyYou')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {report.is_shareable ? (
                          <PublicIcon sx={{ fontSize: 16, color: 'secondary.main', mr: 0.25 }} />
                        ) : (
                          <LockIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.25 }} />
                        )}
                        <Switch
                          checked={report.is_shareable}
                          onChange={() => handleToggleShareable(report.id, report.is_shareable)}
                          size="small"
                          color="secondary"
                        />
                      </Box>
                    </Tooltip>

                    {/* Explain in my language */}
                    <Tooltip title={t('explainInMyLanguage')}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInterpretingReport(report);
                        }}
                        sx={{
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'rgba(37,99,235,0.08)' },
                        }}
                        aria-label="Explain in my language"
                      >
                        <TranslateIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>

                    {/* Delete */}
                    <Tooltip title={t('deleteReport')}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id, report.file_path);
                        }}
                        sx={{
                          color: 'text.disabled',
                          '&:hover': { color: 'error.main', bgcolor: 'rgba(239,68,68,0.08)' },
                        }}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardContent>
                </Card>
              );
            })}
            {/* View All Reports button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => router.push('/dashboard/patient/reports')}
              sx={{ borderRadius: 3, mt: 0.5, color: 'text.secondary', borderColor: 'divider' }}
            >
              View All {reports.length} Reports →
            </Button>
          </Box>
        )}
      </Box>

      {/* FAB — opens Add Report sheet (Scan / Upload) */}
      <Fab
        color="primary"
        aria-label="Add report"
        disabled={uploadingCamera}
        onClick={() => setAddSheetOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
          right: 20,
          width: 60,
          height: 60,
          boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
          '&:hover': { transform: 'scale(1.05)' },
          transition: 'transform 0.15s ease',
        }}
      >
        <AddIcon sx={{ fontSize: 28 }} />
      </Fab>

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={0}>
        <BottomNavigation
          value={navValue}
          onChange={(_, v) => {
            setNavValue(v);
            if (v === 0) router.push('/dashboard/patient');
            if (v === 1) router.push('/dashboard/patient/reports');
            if (v === 2) router.push('/dashboard/patient/access-log');
            if (v === 3) router.push('/dashboard/patient/profile');
          }}
          showLabels
        >
          <BottomNavigationAction label={t('home')} icon={<HomeIcon />} />
          <BottomNavigationAction label="Reports" icon={<AssignmentOutlinedIcon />} />
          <BottomNavigationAction label={t('accessLog')} icon={<HistoryIcon />} />
          <BottomNavigationAction label={t('profile')} icon={<PersonIcon />} />
        </BottomNavigation>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Report Detail Dialog */}
      <ReportDetailDialog
        key={viewingReport?.id ?? 'closed'}
        report={viewingReport}
        open={!!viewingReport}
        onClose={() => setViewingReport(null)}
        onUpdated={(updated) => {
          setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          setSnackbar({ open: true, message: 'Report updated', severity: 'success' });
        }}
        onDeleted={(id) => {
          setReports((prev) => prev.filter((r) => r.id !== id));
          setSnackbar({ open: true, message: 'Report deleted', severity: 'success' });
        }}
      />

      {/* Health Interpreter */}
      {interpretingReport && (
        <HealthInterpreter
          reportId={interpretingReport.id}
          reportTitle={interpretingReport.title}
          open={!!interpretingReport}
          onClose={() => setInterpretingReport(null)}
        />
      )}

      {/* Camera Capture (full screen) */}
      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      {/* Add Report Sheet (Scan + Upload) */}
      <AddReportSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onScanReport={() => setShowCamera(true)}
        onUploadFile={() => router.push('/dashboard/patient/upload')}
      />

      {/* Language Picker */}
      <LanguagePicker
        open={langPickerOpen}
        currentLocale={getCurrentLocale()}
        onClose={() => setLangPickerOpen(false)}
        onSelect={handleLocaleSelect}
      />

      {/* Share with Doctor sheet */}
      <AppointmentShareSheet
        open={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        healthId={profile.health_id || ''}
        onCopy={handleCopyId}
        onWhatsApp={handleWhatsAppShare}
      />

      {/* QR Code Popup — large QR for doctor to scan */}
      <Dialog
        open={qrPopupOpen}
        onClose={() => setQrPopupOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              textAlign: 'center',
              py: 3,
            },
          },
        }}
      >
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Show this QR to your doctor
          </Typography>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 3,
              p: 2.5,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <QRCodeSVG value={profile.health_id || ''} size={220} level="H" />
          </Box>
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '1.3rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'primary.main',
            }}
          >
            {profile.health_id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile.full_name}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setQrPopupOpen(false)}
            sx={{ borderRadius: 2.5, py: 1.4, mt: 1 }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
