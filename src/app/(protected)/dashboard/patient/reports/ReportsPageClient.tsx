'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import BiotechIcon from '@mui/icons-material/Biotech';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { createClient } from '@/lib/supabase/client';
import { Report } from '@/types';
import { REPORT_TYPES, REPORT_TYPE_COLORS } from '@/constants';
import { getAiLanguage } from '@/lib/utils/language';

const ReportDetailDialog = dynamic(() => import('@/components/patient/ReportDetailDialog'), {
  ssr: false,
});
const HealthInterpreter = dynamic(() => import('@/components/patient/HealthInterpreter'), {
  ssr: false,
});

const FILTER_ALL = 'all';

interface ReportsPageClientProps {
  reports: Report[];
}

export default function ReportsPageClient({ reports: initialReports }: ReportsPageClientProps) {
  const router = useRouter();
  const tc = useTranslations('common');
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState(FILTER_ALL);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [interpretingReport, setInterpretingReport] = useState<Report | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as const,
  });

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
    await supabase.storage.from('reports').remove([filePath]);
    await supabase.from('reports').delete().eq('id', reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setSnackbar({ open: true, message: 'Report deleted', severity: 'success' });
  };

  const getTypeColor = (type: string) => REPORT_TYPE_COLORS[type] || REPORT_TYPE_COLORS.other;

  const getTypeLabel = (type: string) => REPORT_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* AppBar */}
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            My Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {reports.length} total
          </Typography>
        </Toolbar>
        {/* Search bar */}
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#F3F4F6',
              borderRadius: 3,
              px: 1.5,
              py: 0.5,
            }}
          >
            <SearchIcon sx={{ fontSize: 20, color: '#9CA3AF', mr: 1 }} />
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
            <AssignmentOutlinedIcon sx={{ fontSize: 56, color: '#D1D5DB', mb: 2 }} />
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
                border: report.is_starred ? '1.5px solid #FCD34D' : '1px solid #E5E7EB',
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
                      sx={{ color: report.is_starred ? '#F59E0B' : '#D1D5DB' }}
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
                      sx={{ color: report.is_shareable ? '#059669' : '#D1D5DB' }}
                    >
                      {report.is_shareable ? (
                        <PublicIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <LockIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>

                    {/* AI Interpret */}
                    <IconButton
                      size="small"
                      onClick={() => setInterpretingReport(report)}
                      sx={{ color: '#059669' }}
                    >
                      <TranslateIcon sx={{ fontSize: 18 }} />
                    </IconButton>

                    {/* AI Analyze */}
                    <IconButton
                      size="small"
                      onClick={() => setViewingReport(report)}
                      sx={{ color: '#7C3AED' }}
                    >
                      <BiotechIcon sx={{ fontSize: 18 }} />
                    </IconButton>

                    {/* Delete */}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(report.id, report.file_path)}
                      sx={{ color: '#D1D5DB', '&:hover': { color: '#EF4444' } }}
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

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={0}>
        <BottomNavigation
          value={1}
          onChange={(_, v) => {
            if (v === 0) router.push('/dashboard/patient');
            if (v === 2) router.push('/dashboard/patient/access-log');
            if (v === 3) router.push('/dashboard/patient/profile');
          }}
          showLabels
        >
          <BottomNavigationAction label={tc('bottomNav.home')} icon={<HomeIcon />} />
          <BottomNavigationAction label="Reports" icon={<AssignmentOutlinedIcon />} />
          <BottomNavigationAction label={tc('bottomNav.accessLog')} icon={<HistoryIcon />} />
          <BottomNavigationAction label={tc('bottomNav.profile')} icon={<PersonIcon />} />
        </BottomNavigation>
      </Paper>

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
          defaultLanguage={getAiLanguage()}
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
