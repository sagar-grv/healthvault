'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageIcon from '@mui/icons-material/Language';
import MedicalServicesIcon from '@mui/icons-material/MedicalServicesOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Profile, Report } from '@/types';
import { REPORT_TYPES, REPORT_TYPE_COLORS } from '@/constants';
import { checkUploadAllowed, recordUpload } from '@/app/(protected)/dashboard/patient/actions';
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
  const searchParams = useSearchParams();
  const t = useTranslations('dashboard');
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [interpretingReport, setInterpretingReport] = useState<Report | null>(null);
  const [uploadingCamera, setUploadingCamera] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const [shareConfirmReport, setShareConfirmReport] = useState<Report | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Report | null>(null);

  // Show snackbar on successful upload redirect
  useEffect(() => {
    if (searchParams.get('uploaded') === '1') {
      requestAnimationFrame(() => {
        setSnackbar({ open: true, message: 'Report uploaded successfully!', severity: 'success' });
      });
      const url = new URL(window.location.href);
      url.searchParams.delete('uploaded');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

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
    const message = `My HealthVault ID is ${profile.health_id}. Use this to view my medical records on HealthVault.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
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

  // Handle camera capture — uploads all captured pages as separate reports
  const handleCameraCapture = async (images: Blob[], captureTitle?: string) => {
    setShowCamera(false);
    if (!images.length) return;
    setUploadingCamera(true);
    setSnackbar({ open: true, message: t('processingReport'), severity: 'info' });

    try {
      const rateCheck = await checkUploadAllowed();
      if (!rateCheck.allowed) {
        setSnackbar({
          open: true,
          message: rateCheck.error || 'Upload limit reached',
          severity: 'error',
        });
        return;
      }

      const supabase = createClient();
      const userId = profile.id;
      const today = new Date().toISOString().split('T')[0];

      const rawBlob = images[0];
      const isPdf = rawBlob.type === 'application/pdf';
      const rawFile = new File([rawBlob], isPdf ? 'scan.pdf' : 'camera-capture.jpg', {
        type: rawBlob.type,
      });
      const optimized = !isPdf && isOptimizableImage(rawFile) ? await optimizeImage(rawFile) : null;
      const uploadBlob = optimized?.blob ?? rawBlob;
      const uploadName = optimized?.fileName ?? (isPdf ? 'scan.pdf' : 'capture.jpg');
      const uploadMime = optimized?.mimeType ?? rawBlob.type;

      const reportId = crypto.randomUUID();
      const filePath = `${userId}/${reportId}/${uploadName}`;
      const thumbnailPath = optimized?.thumbnail ? `${userId}/${reportId}/thumb.jpg` : null;

      const { error: uploadErr } = await supabase.storage
        .from('reports')
        .upload(filePath, uploadBlob, { contentType: uploadMime, upsert: false });

      if (uploadErr) {
        setSnackbar({ open: true, message: t('uploadFailed'), severity: 'error' });
        return;
      }

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
            title: captureTitle || 'Captured Report',
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
      await recordUpload();
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
              component={Link}
              href="/dashboard/patient"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
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
          <IconButton
            onClick={() => setLogoutDialogOpen(true)}
            aria-label="Logout"
            size="small"
            sx={{ ml: 0.5 }}
          >
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
                <NoteAddIcon sx={{ fontSize: 32, color: 'primary.main' }} />
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
                          onChange={() => setShareConfirmReport(report)}
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
                          setDeleteConfirm(report);
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

      {/* Share confirmation dialog */}
      <Dialog
        open={!!shareConfirmReport}
        onClose={() => setShareConfirmReport(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {shareConfirmReport?.is_shareable ? 'Make report private?' : 'Share report?'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {shareConfirmReport?.is_shareable
              ? `This will make ${shareConfirmReport?.title} private. Doctors will no longer be able to view it.`
              : `This will make ${shareConfirmReport?.title} visible to your doctors. They will be able to access it through your Health ID.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareConfirmReport(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (shareConfirmReport) {
                handleToggleShareable(shareConfirmReport.id, shareConfirmReport.is_shareable);
              }
              setShareConfirmReport(null);
            }}
            color={shareConfirmReport?.is_shareable ? 'warning' : 'success'}
            variant="contained"
          >
            {shareConfirmReport?.is_shareable ? 'Make Private' : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete report?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (deleteConfirm) {
                handleDeleteReport(deleteConfirm.id, deleteConfirm.file_path);
              }
              setDeleteConfirm(null);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Log out of HealthVault?</DialogTitle>
        <DialogContent>
          <Typography>You can always log back in to access your health records.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Log Out
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}
