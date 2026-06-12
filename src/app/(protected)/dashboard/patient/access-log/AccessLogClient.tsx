'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import HomeIcon from '@mui/icons-material/Home';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import GroupIcon from '@mui/icons-material/PeopleOutlined';
import { AccessLog } from '@/types';
import { revokeShare } from '../actions';

interface ShareInfo {
  id: string;
  doctor_id: string;
  report_ids: string[];
  shared_at: string;
  viewed_at: string | null;
  doctor: { full_name: string; clinic_name: string | null } | null;
}

interface AccessLogClientProps {
  logs: AccessLog[];
  shares: ShareInfo[];
}

export default function AccessLogClient({ logs, shares: initialShares }: AccessLogClientProps) {
  const router = useRouter();
  const t = useTranslations('accessLog');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [shares, setShares] = useState(initialShares);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Relative time — inside component to access t()
  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('daysAgo', { count: diffDays });

    // Use locale-aware date formatting
    const displayLocale = locale === 'hi' ? 'hi-IN' : 'en-IN';
    return date.toLocaleDateString(displayLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFullTime = (dateStr: string) => {
    const displayLocale = locale === 'hi' ? 'hi-IN' : 'en-IN';
    return new Date(dateStr).toLocaleString(displayLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/patient')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ ml: 1 }}>
            <Typography variant="h6">{t('pageTitle')}</Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1, mt: -0.25 }}
            >
              {t('pageSubtitle')}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 3, maxWidth: 600, mx: 'auto' }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Card
            sx={{
              flex: 1,
              textAlign: 'center',
              bgcolor: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.25)',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h3" sx={{ color: 'primary.main', mb: 0.25 }}>
                {logs.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('totalViews')}
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              flex: 1,
              textAlign: 'center',
              bgcolor: 'rgba(5,150,105,0.08)',
              border: '1px solid rgba(5,150,105,0.30)',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h3" sx={{ color: 'success.dark', mb: 0.25 }}>
                {new Set(logs.map((l) => l.doctor_id)).size}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('uniqueDoctors')}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Empty State */}
        {logs.length === 0 && (
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
                  bgcolor: 'rgba(5,150,105,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <ShieldOutlinedIcon sx={{ fontSize: 32, color: '#059669' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {t('noViewsHeading')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 260, mx: 'auto' }}>
                {t('noViewsBody')}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {logs.length > 0 && (
          <Box className="stagger-children">
            {logs.map((log) => (
              <Box key={log.id} sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                {/* Avatar */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pt: 0.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #047857, #10B981)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                    }}
                  >
                    {log.doctor_name.replace('Dr. ', '').charAt(0).toUpperCase()}
                  </Avatar>
                </Box>

                {/* Content */}
                <Card sx={{ flex: 1 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Dr. {log.doctor_name.replace('Dr. ', '')}
                      </Typography>
                      <Chip
                        label={formatRelativeTime(log.searched_at)}
                        size="small"
                        sx={{
                          bgcolor: 'action.hover',
                          color: 'text.secondary',
                          fontWeight: 500,
                          fontSize: '0.68rem',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formatFullTime(log.searched_at)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <VisibilityIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {t('viewedReports', { count: (log.reports_viewed || []).length })}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}

        {/* Shared With Section */}
        {shares.length > 0 && (
          <Box sx={{ mt: 4 }} className="animate-fade-in-up">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: '0.75rem',
                }}
              >
                Shared With
              </Typography>
              <Chip
                label={shares.length}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Box>
            <Card>
              {shares.map((share, idx) => (
                <Box key={share.id}>
                  <CardContent
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      '&:last-child': { pb: 2 },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: 'rgba(5,150,105,0.15)',
                        color: 'success.main',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                      }}
                    >
                      {share.doctor?.full_name?.charAt(0)?.toUpperCase() || 'D'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                        Dr. {share.doctor?.full_name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {share.report_ids.length} report{share.report_ids.length !== 1 ? 's' : ''} ·
                        Shared{' '}
                        {new Date(share.shared_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {share.viewed_at ? ' · Viewed' : ' · Not viewed'}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      onClick={async () => {
                        const result = await revokeShare(share.id);
                        if (result.error) {
                          setSnackbar({ open: true, message: result.error, severity: 'error' });
                          return;
                        }
                        setShares((prev) => prev.filter((s) => s.id !== share.id));
                        setSnackbar({ open: true, message: 'Share revoked', severity: 'success' });
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      Revoke
                    </Button>
                  </CardContent>
                  {idx < shares.length - 1 && <Divider />}
                </Box>
              ))}
            </Card>
          </Box>
        )}
      </Box>

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={0}>
        <BottomNavigation
          value={2}
          onChange={(_, v) => {
            if (v === 0) router.push('/dashboard/patient');
            if (v === 1) router.push('/dashboard/patient/upload');
            if (v === 3) router.push('/dashboard/patient/profile');
          }}
          showLabels
        >
          <BottomNavigationAction label={tc('bottomNav.home')} icon={<HomeIcon />} />
          <BottomNavigationAction label={tc('bottomNav.upload')} icon={<UploadFileIcon />} />
          <BottomNavigationAction label={tc('bottomNav.accessLog')} icon={<HistoryIcon />} />
          <BottomNavigationAction label={tc('bottomNav.profile')} icon={<PersonIcon />} />
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
    </Box>
  );
}
