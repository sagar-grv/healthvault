'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { createClient } from '@/lib/supabase/client';
import { Report } from '@/types';
import { REPORT_TYPES, REPORT_TYPE_COLORS } from '@/constants';
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
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState(FILTER_ALL);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [interpretingReport, setInterpretingReport] = useState<Report | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as const,
  });

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

  const handleDelete = async (reportId: string, filePath: string) => {
    const supabase = createClient();
    // Run storage remove + DB delete in parallel (was sequential — risk of orphan rows)
    await Promise.all([
      supabase.storage.from('reports').remove([filePath]),
      supabase.from('reports').delete().eq('id', reportId),
    ]);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
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

        {/* Report cards */}
        {filtered.map((report) => {
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
                  {/* Type indicator */}
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

                  {/* Content */}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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

                  {/* Actions */}
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Star */}
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

                    {/* Share toggle */}
                    <IconButton
                      size="small"
                      onClick={() => handleToggleShareable(report.id, report.is_shareable)}
                      sx={{ color: report.is_shareable ? 'success.main' : 'text.disabled' }}
                    >
                      {report.is_shareable ? (
                        <PublicIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <LockIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>

                    {/* Explain */}
                    <IconButton
                      size="small"
                      onClick={() => setInterpretingReport(report)}
                      sx={{ color: 'primary.main' }}
                      aria-label="Explain in my language"
                    >
                      <TranslateIcon sx={{ fontSize: 18 }} />
                    </IconButton>

                    {/* Delete */}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(report.id, report.file_path)}
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
