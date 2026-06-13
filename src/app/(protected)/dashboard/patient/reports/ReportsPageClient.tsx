'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Report } from '@/types';
import { REPORT_TYPES, REPORT_TYPE_COLORS } from '@/constants';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import ListSubheader from '@mui/material/ListSubheader';
import ThemeToggle from '@/components/ThemeToggle';

const ReportDetailDialog = dynamic(() => import('@/components/patient/ReportDetailDialog'), {
  ssr: false,
});
const HealthInterpreter = dynamic(() => import('@/components/patient/HealthInterpreter'), {
  ssr: false,
});

const FILTER_ALL = 'all';
const PAGE_SIZE = 20;

interface ReportsPageClientProps {
  reports: Report[];
  totalCount: number;
  initialHasMore: boolean;
}

export default function ReportsPageClient({
  reports: initialReports,
  totalCount,
  initialHasMore,
}: ReportsPageClientProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [filterType, setFilterType] = useState(searchParams.get('type') ?? FILTER_ALL);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [interpretingReport, setInterpretingReport] = useState<Report | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as const,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<Report | null>(null);
  const [shareConfirm, setShareConfirm] = useState<Report | null>(null);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const supabase = createClient();
      const { data: more } = await supabase
        .from('reports')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .range(reports.length, reports.length + PAGE_SIZE - 1);
      if (more) {
        setReports((prev) => [...prev, ...more]);
        setHasMore(more.length === PAGE_SIZE);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  // Filtered + searched reports
  const filtered = useMemo(() => {
    let list = reports;
    if (filterType !== FILTER_ALL) {
      list = list.filter((r) => r.report_type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q));
    }
    return list;
  }, [reports, filterType, search]);

  // Group filtered reports by month/year
  const grouped = useMemo(() => {
    const groups: Record<string, Report[]> = {};
    for (const report of filtered) {
      const d = new Date(report.report_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(report);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (filterType !== FILTER_ALL) params.set('type', filterType);
    const qs = params.toString();
    router.replace(`/dashboard/patient/reports${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [search, filterType, router]);

  const handleToggleStar = async (reportId: string, current: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('reports')
      .update({ is_starred: !current })
      .eq('id', reportId);
    if (!error) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, is_starred: !current } : r))
      );
    }
  };

  const handleToggleShareable = async (reportId: string, current: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('reports')
      .update({ is_shareable: !current })
      .eq('id', reportId);
    if (!error) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, is_shareable: !current } : r))
      );
      setSnackbar({
        open: true,
        message: !current ? 'Report is now shareable' : 'Report is now private',
        severity: 'success',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const supabase = createClient();
    await Promise.all([
      supabase.storage.from('reports').remove([deleteConfirm.file_path]),
      supabase.from('reports').delete().eq('id', deleteConfirm.id),
    ]);
    setReports((prev) => prev.filter((r) => r.id !== deleteConfirm.id));
    setDeleteConfirm(null);
    setSnackbar({ open: true, message: 'Report deleted', severity: 'success' });
  };

  const getTypeColor = (type: string) => REPORT_TYPE_COLORS[type] || REPORT_TYPE_COLORS.other;

  const getTypeLabel = (type: string) => REPORT_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            My Reports
          </Typography>
          <ThemeToggle />
          <Typography variant="body2" color="text.secondary">
            {totalCount} total
          </Typography>
        </Toolbar>
        {/* Search bar */}
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'action.hover',
              borderRadius: 3,
              px: 1.5,
              py: 0.5,
            }}
          >
            <SearchIcon sx={{ fontSize: 20, color: 'text.disabled', mr: 1 }} />
            <InputBase
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, fontSize: '0.9rem' }}
            />
          </Box>
        </Box>
        {/* Filter chips */}
        <Box
          sx={{
            px: 2,
            pb: 1.5,
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Chip
            label="All"
            size="small"
            variant={filterType === FILTER_ALL ? 'filled' : 'outlined'}
            color={filterType === FILTER_ALL ? 'primary' : 'default'}
            onClick={() => setFilterType(FILTER_ALL)}
            sx={{ fontWeight: 600 }}
          />
          {REPORT_TYPES.map((type) => {
            const c = REPORT_TYPE_COLORS[type.value] || REPORT_TYPE_COLORS.other;
            return (
              <Chip
                key={type.value}
                label={type.label}
                size="small"
                variant={filterType === type.value ? 'filled' : 'outlined'}
                onClick={() => setFilterType(filterType === type.value ? FILTER_ALL : type.value)}
                sx={{
                  fontWeight: 600,
                  bgcolor: filterType === type.value ? c.bg : undefined,
                  color: filterType === type.value ? c.color : undefined,
                  borderColor: c.color,
                  flexShrink: 0,
                }}
              />
            );
          })}
        </Box>
      </AppBar>

      <Breadcrumbs sx={{ px: 2, pt: 1.5 }} aria-label="breadcrumb">
        <Link
          href="/dashboard/patient"
          style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.8rem' }}
        >
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8rem' }}>
          My Reports
        </Typography>
      </Breadcrumbs>

      <Box sx={{ px: 2, py: 2 }}>
        {/* Empty state */}
        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {search ? 'No reports match your search' : 'No reports yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Tap + on the home screen to add your first report
            </Typography>
          </Box>
        )}

        {/* Report cards — grouped by month/year */}
        {grouped.map(([monthKey, monthReports]) => {
          const [year, monthNum] = monthKey.split('-');
          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString(
            'en-IN',
            { month: 'long', year: 'numeric' }
          );
          return (
            <Box key={monthKey} sx={{ mb: 2 }}>
              <ListSubheader
                sx={{
                  bgcolor: 'transparent',
                  px: 0,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  lineHeight: 2,
                }}
              >
                {monthName}
              </ListSubheader>
              {monthReports.map((report) => {
                const typeColor = getTypeColor(report.report_type);
                return (
                  <Card
                    key={report.id}
                    sx={{
                      mb: 1.5,
                      borderRadius: 3,
                      border: report.is_starred ? '1.5px solid' : '1px solid',
                      borderColor: report.is_starred ? 'warning.light' : 'divider',
                      boxShadow: report.is_starred ? '0 2px 8px rgba(251,191,36,0.15)' : 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => setViewingReport(report)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            bgcolor: typeColor.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <AssignmentOutlinedIcon sx={{ fontSize: 22, color: typeColor.color }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              lineHeight: 1.3,
                              mb: 0.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {report.title}
                          </Typography>
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                          >
                            <Chip
                              label={getTypeLabel(report.report_type)}
                              size="small"
                              sx={{
                                bgcolor: typeColor.bg,
                                color: typeColor.color,
                                fontWeight: 600,
                                fontSize: '0.65rem',
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
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStar(report.id, report.is_starred)}
                            sx={{ color: report.is_starred ? 'warning.main' : 'text.disabled' }}
                          >
                            {report.is_starred ? (
                              <StarIcon sx={{ fontSize: 20 }} />
                            ) : (
                              <StarBorderIcon sx={{ fontSize: 20 }} />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setShareConfirm(report)}
                            sx={{ color: report.is_shareable ? 'success.main' : 'text.disabled' }}
                          >
                            {report.is_shareable ? (
                              <PublicIcon sx={{ fontSize: 18 }} />
                            ) : (
                              <LockIcon sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setInterpretingReport(report)}
                            sx={{ color: 'primary.main' }}
                            aria-label="Explain in my language"
                          >
                            <TranslateIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirm(report)}
                            sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                          >
                            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          );
        })}

        {/* Load more */}
        {hasMore && !search && filterType === FILTER_ALL && (
          <Button
            fullWidth
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loadingMore}
            sx={{ mt: 1, mb: 2, borderRadius: 3, borderColor: 'divider', color: 'text.secondary' }}
            startIcon={loadingMore ? <CircularProgress size={16} /> : undefined}
          >
            {loadingMore ? 'Loading…' : `Load more (${totalCount - reports.length} remaining)`}
          </Button>
        )}
      </Box>

      {/* Dialogs */}
      <ReportDetailDialog
        key={viewingReport?.id ?? 'closed'}
        report={viewingReport}
        open={!!viewingReport}
        onClose={() => setViewingReport(null)}
        onUpdated={(updated) =>
          setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        }
        onDeleted={(id) => setReports((prev) => prev.filter((r) => r.id !== id))}
      />

      {interpretingReport && (
        <HealthInterpreter
          reportId={interpretingReport.id}
          reportTitle={interpretingReport.title}
          open={!!interpretingReport}
          onClose={() => setInterpretingReport(null)}
        />
      )}

      {/* Share confirmation */}
      <Dialog open={!!shareConfirm} onClose={() => setShareConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {shareConfirm?.is_shareable ? 'Make report private?' : 'Share report?'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {shareConfirm?.is_shareable
              ? `This will make ${shareConfirm?.title} private. Doctors will no longer be able to view it.`
              : `This will make ${shareConfirm?.title} visible to your doctors. They will be able to access it through your Health ID.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (shareConfirm) {
                handleToggleShareable(shareConfirm.id, shareConfirm.is_shareable);
              }
              setShareConfirm(null);
            }}
            color={shareConfirm?.is_shareable ? 'warning' : 'success'}
            variant="contained"
          >
            {shareConfirm?.is_shareable ? 'Make Private' : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
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
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
