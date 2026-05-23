'use client';

import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import HomeIcon from '@mui/icons-material/Home';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import { AccessLog } from '@/types';

interface AccessLogClientProps {
  logs: AccessLog[];
}

export default function AccessLogClient({ logs }: AccessLogClientProps) {
  const router = useRouter();
  const t = useTranslations('accessLog');
  const tc = useTranslations('common');
  const locale = useLocale();

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
              bgcolor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h3" sx={{ color: '#1D4ED8', mb: 0.25 }}>
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
              bgcolor: '#F0FDF4',
              border: '1px solid #A7F3D0',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h3" sx={{ color: '#047857', mb: 0.25 }}>
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
                  bgcolor: '#F0FDF4',
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
                          bgcolor: '#F3F4F6',
                          color: '#6B7280',
                          fontWeight: 500,
                          fontSize: '0.68rem',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formatFullTime(log.searched_at)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <VisibilityIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
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
    </Box>
  );
}
