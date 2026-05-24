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
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import BiotechIcon from '@mui/icons-material/Biotech';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageIcon from '@mui/icons-material/Language';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Profile, Report } from '@/types';
import { REPORT_TYPES, REPORT_TYPE_COLORS } from '@/constants';
import { getAiLanguage, syncLanguageFromProfile } from '@/lib/utils/language';

// Lazy load heavy dialog components — only loaded when user clicks
const ReportDetailDialog = dynamic(() => import('@/components/patient/ReportDetailDialog'), {
  ssr: false,
});
const AISummaryDialog = dynamic(() => import('@/components/patient/AISummaryDialog'), {
  ssr: false,
});
const HealthInterpreter = dynamic(() => import('@/components/patient/HealthInterpreter'), {
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
  const [showQR, setShowQR] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [navValue, setNavValue] = useState(0);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [showAISummary, setShowAISummary] = useState(false);
  // New P0 feature states
  const [interpretingReport, setInterpretingReport] = useState<Report | null>(null);

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

  const handleWhatsAppShare = () => {
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

  const handleBulkAction = async (makeSharable: boolean) => {
    const supabase = createClient();
    const ids = Array.from(selectedReports);
    const { error } = await supabase
      .from('reports')
      .update({ is_shareable: makeSharable })
      .in('id', ids);
    if (error) {
      setSnackbar({ open: true, message: 'Failed to update. Try again.', severity: 'error' });
      setBulkMenuAnchor(null);
    } else {
      setReports((prev) =>
        prev.map((r) => (ids.includes(r.id) ? { ...r, is_shareable: makeSharable } : r))
      );
      setSnackbar({ open: true, message: `${ids.length} reports updated`, severity: 'success' });
      setSelectedReports(new Set());
      setBulkMenuAnchor(null);
    }
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

  const getReportTypeLabel = (type: string) =>
    REPORT_TYPES.find((t) => t.value === type)?.label || type;

  // Toggle app UI language between en and hi, then refresh server components
  const handleLocaleSwitch = useCallback(() => {
    const current =
      document.cookie
        .split('; ')
        .find((r) => r.startsWith('hv_locale='))
        ?.split('=')[1] || 'en';
    const next = current === 'en' ? 'hi' : 'en';
    document.cookie = `hv_locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem('hv_preferred_language', next);
    router.refresh(); // re-runs server components → layout.tsx re-reads cookie → new messages
  }, [router]);

  const shareableCount = reports.filter((r) => r.is_shareable).length;
  const starredReports = reports.filter((r) => r.is_starred);

  return (
    <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: '#F9FAFB' }}>
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
          {/* Language toggle chip — tap to switch between EN and HI */}
          <Chip
            icon={<LanguageIcon sx={{ fontSize: '14px !important', color: '#2563EB' }} />}
            label={t('currentLocale')}
            onClick={handleLocaleSwitch}
            size="small"
            sx={{
              mr: 0.5,
              height: 26,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              bgcolor: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#DBEAFE' },
            }}
          />
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

            <Collapse in={showQR}>
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'inline-block',
                  mb: 2.5,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
                className="animate-scale-in"
              >
                <QRCodeSVG value={profile.health_id || ''} size={130} level="M" />
              </Box>
            </Collapse>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                {
                  icon: <ContentCopyIcon sx={{ fontSize: 15 }} />,
                  label: t('copyId'),
                  action: handleCopyId,
                },
                {
                  icon: <QrCode2Icon sx={{ fontSize: 15 }} />,
                  label: showQR ? t('hideQr') : t('showQr'),
                  action: () => setShowQR(!showQR),
                },
                {
                  icon: <ShareIcon sx={{ fontSize: 15 }} />,
                  label: t('share'),
                  action: handleWhatsAppShare,
                },
              ].map((btn) => (
                <Button
                  key={btn.label}
                  size="small"
                  startIcon={btn.icon}
                  onClick={btn.action}
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'translateY(-1px)' },
                    fontSize: '0.75rem',
                    py: 0.6,
                  }}
                >
                  {btn.label}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Starred Reports Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h5">
              {starredReports.length > 0 ? '⭐ Starred Reports' : t('myReports')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {reports.length} total · {shareableCount} shareable
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {reports.length > 0 && (
              <Tooltip title="AI summary of all reports">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<BiotechIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setShowAISummary(true)}
                  sx={{
                    borderColor: '#7C3AED',
                    color: '#7C3AED',
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    py: 0.5,
                    '&:hover': { bgcolor: '#F5F3FF', borderColor: '#6D28D9' },
                  }}
                >
                  AI Insights
                </Button>
              </Tooltip>
            )}
            {selectedReports.size > 0 && (
              <Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                  startIcon={<MoreVertIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {selectedReports.size} selected
                </Button>
                <Menu
                  anchorEl={bulkMenuAnchor}
                  open={Boolean(bulkMenuAnchor)}
                  onClose={() => setBulkMenuAnchor(null)}
                >
                  <MenuItem onClick={() => handleBulkAction(true)}>
                    <PublicIcon sx={{ mr: 1, fontSize: 18, color: 'secondary.main' }} />
                    {t('shareableWithDoctors')}
                  </MenuItem>
                  <MenuItem onClick={() => handleBulkAction(false)}>
                    <LockIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                    {t('privateOnlyYou')}
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>
        </Box>

        {/* Reports List — shows starred reports on home, or empty state */}
        {reports.length === 0 ? (
          <Card
            className="animate-fade-in-up"
            sx={{
              textAlign: 'center',
              py: 7,
              border: '2px dashed #E5E7EB',
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
                  bgcolor: '#EFF6FF',
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
        ) : starredReports.length === 0 ? (
          /* No starred reports — show hint to star + View All */
          <Card
            sx={{
              textAlign: 'center',
              py: 4,
              border: '1.5px dashed #E5E7EB',
              bgcolor: 'transparent',
              boxShadow: 'none',
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 600 }}>
                No starred reports yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Star your important reports to pin them here
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => router.push('/dashboard/patient/reports')}
              >
                View All {reports.length} Reports
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
            className="stagger-children"
          >
            {starredReports.map((report) => {
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
                    <Checkbox
                      checked={selectedReports.has(report.id)}
                      onChange={(e) => {
                        const next = new Set(selectedReports);
                        if (e.target.checked) {
                          next.add(report.id);
                        } else {
                          next.delete(report.id);
                        }
                        setSelectedReports(next);
                      }}
                      size="small"
                      sx={{ p: 0.5 }}
                    />

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
                          <LockIcon sx={{ fontSize: 16, color: '#D1D5DB', mr: 0.25 }} />
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
                        sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
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
                          color: '#D1D5DB',
                          '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' },
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
              sx={{ borderRadius: 3, mt: 0.5, color: '#6B7280', borderColor: '#E5E7EB' }}
            >
              View All {reports.length} Reports →
            </Button>
          </Box>
        )}
      </Box>

      {/* FAB — go directly to upload */}
      <Fab
        color="primary"
        aria-label="Upload report"
        onClick={() => router.push('/dashboard/patient/upload')}
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

      {/* AI Summary Dialog */}
      <AISummaryDialog
        open={showAISummary}
        onClose={() => setShowAISummary(false)}
        reports={reports}
      />

      {/* Health Interpreter */}
      {interpretingReport && (
        <HealthInterpreter
          reportId={interpretingReport.id}
          reportTitle={interpretingReport.title}
          defaultLanguage={getAiLanguage()}
          open={!!interpretingReport}
          onClose={() => setInterpretingReport(null)}
        />
      )}
    </Box>
  );
}
