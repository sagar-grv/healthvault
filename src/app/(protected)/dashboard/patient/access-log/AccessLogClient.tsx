'use client';

import { useState, useMemo } from 'react';
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
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  const locale = useLocale();
  const [shares, setShares] = useState(initialShares);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [revokeConfirm, setRevokeConfirm] = useState<{ open: boolean; shareId: string | null }>({
    open: false,
    shareId: null,
  });

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

  // Group logs by doctor
  const groupedLogs = useMemo(() => {
    const filtered = searchQuery.trim()
      ? logs.filter((l) => l.doctor_name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : logs;

    const map = new Map<string, { doctorName: string; logs: AccessLog[]; totalReports: number }>();
    for (const log of filtered) {
      const key = log.doctor_id;
      const existing = map.get(key);
      const count = (log.reports_viewed || []).length;
      if (existing) {
        existing.logs.push(log);
        existing.totalReports += count;
      } else {
        map.set(key, { doctorName: log.doctor_name, logs: [log], totalReports: count });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.logs[0].searched_at).getTime() - new Date(a.logs[0].searched_at).getTime()
    );
  }, [logs, searchQuery]);

  const uniqueDoctors = new Set(logs.map((l) => l.doctor_id)).size;

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
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
                {uniqueDoctors}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('uniqueDoctors')}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search */}
        {logs.length > 0 && (
          <TextField
            fullWidth
            size="small"
            placeholder="Search by doctor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        )}

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

        {/* Grouped by doctor */}
        {groupedLogs.length === 0 && logs.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No doctors match your search.
          </Alert>
        )}

        {groupedLogs.length > 0 && (
          <Box className="stagger-children">
            {groupedLogs.map((group) => {
              const expanded = expandedDoctor === group.doctorName;
              const hasShare = shares.find(
                (s) => s.doctor?.full_name?.toLowerCase() === group.doctorName.toLowerCase()
              );
              return (
                <Card key={group.doctorName} sx={{ mb: 2, overflow: 'hidden' }}>
                  <CardContent
                    onClick={() => setExpandedDoctor(expanded ? null : group.doctorName)}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      cursor: 'pointer',
                      transition: 'bgcolor 0.15s',
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:last-child': { pb: expanded ? 1 : 2 },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #047857, #10B981)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                      }}
                    >
                      {group.doctorName.replace('Dr. ', '').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                        Dr. {group.doctorName.replace('Dr. ', '')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Chip
                          label={formatRelativeTime(group.logs[0].searched_at)}
                          size="small"
                          sx={{
                            bgcolor: 'action.hover',
                            color: 'text.secondary',
                            fontWeight: 500,
                            height: 20,
                            fontSize: '0.68rem',
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {group.logs.length} visit{group.logs.length !== 1 ? 's' : ''}
                          {' · '}
                          {group.totalReports} report{group.totalReports !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Box>
                    {hasShare && (
                      <Button
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRevokeConfirm({ open: true, shareId: hasShare.id });
                        }}
                        sx={{ textTransform: 'none', flexShrink: 0, mr: 1 }}
                      >
                        Revoke
                      </Button>
                    )}
                    <Box
                      sx={{
                        transition: 'transform 0.25s',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'text.disabled',
                      }}
                    >
                      <ExpandMoreIcon />
                    </Box>
                  </CardContent>
                  <Collapse in={expanded}>
                    <Divider />
                    <Box sx={{ px: 2, py: 1.5 }}>
                      {group.logs.map((log, idx) => (
                        <Box
                          key={log.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 1,
                            borderBottom: idx < group.logs.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider',
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatFullTime(log.searched_at)}
                            </Typography>
                          </Box>
                          <Chip
                            icon={<VisibilityIcon sx={{ fontSize: 12 }} />}
                            label={`${(log.reports_viewed || []).length} reports`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.65rem' }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={revokeConfirm.open}
        onClose={() => setRevokeConfirm({ open: false, shareId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Revoke access?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This doctor will no longer be able to view the shared reports. You can re-share later if
            needed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setRevokeConfirm({ open: false, shareId: null })} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!revokeConfirm.shareId) return;
              const result = await revokeShare(revokeConfirm.shareId);
              if (result.error) {
                setSnackbar({ open: true, message: result.error, severity: 'error' });
              } else {
                setShares((prev) => prev.filter((s) => s.id !== revokeConfirm.shareId));
                setSnackbar({ open: true, message: 'Share revoked', severity: 'success' });
              }
              setRevokeConfirm({ open: false, shareId: null });
            }}
          >
            Revoke
          </Button>
        </DialogActions>
      </Dialog>

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
