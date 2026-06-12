'use client';

import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarTodayOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Report } from '@/types';
import { REPORT_TYPES, REPORT_TYPE_COLORS } from '@/constants';
import { createClient } from '@/lib/supabase/client';
import ReportAnalysisCard from '@/components/patient/ReportAnalysisCard';
import PatientInsightsCard from '@/components/doctor/PatientInsightsCard';
import {
  markShareViewed,
  getSharedReportDetails,
} from '@/app/(protected)/dashboard/doctor/actions';

interface SharedWithMePanelProps {
  open: boolean;
  onClose: () => void;
  shareId: string | null;
  onShareViewed?: (shareId: string) => void;
}

type DateFilter = 'all' | '7d' | '30d' | '90d';

export default function SharedWithMePanel({
  open,
  onClose,
  shareId,
  onShareViewed,
}: SharedWithMePanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientHealthId, setPatientHealthId] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [now] = useState(() => Date.now());

  // Fetch share details when panel opens
  useEffect(() => {
    if (!open || !shareId) return;

    let cancelled = false;

    const loadShare = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getSharedReportDetails(shareId);
        if (cancelled) return;

        if ('error' in res) {
          setError(res.error ?? 'Failed to load shared reports');
          setLoading(false);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patientData = (res.share as Record<string, any>)?.patient;
        const patient = Array.isArray(patientData) ? patientData[0] : patientData;
        setPatientName(patient?.full_name || 'Unknown Patient');
        setPatientHealthId(patient?.health_id || '');
        setReports(res.reports || []);
        setTypeFilter('all');
        setDateFilter('all');
        setSearchQuery('');
        setLoading(false);

        // Mark as viewed
        markShareViewed(shareId);
        onShareViewed?.(shareId);
      } catch {
        if (!cancelled) {
          setError('Failed to load shared reports');
          setLoading(false);
        }
      }
    };

    loadShare();
    return () => {
      cancelled = true;
    };
  }, [open, shareId, onShareViewed]);

  // Filter reports
  const filteredReports = useMemo(() => {
    let result = reports;

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.report_type === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const daysMap: Record<DateFilter, number> = { all: 0, '7d': 7, '30d': 30, '90d': 90 };
      const cutoff = now - daysMap[dateFilter] * 24 * 60 * 60 * 1000;
      result = result.filter((r) => new Date(r.report_date).getTime() >= cutoff);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.report_type.toLowerCase().includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    return result;
  }, [reports, typeFilter, dateFilter, searchQuery, now]);

  // Get unique report types for filter
  const reportTypes = useMemo(() => {
    const types = new Set(reports.map((r) => r.report_type));
    return Array.from(types);
  }, [reports]);

  // View report file
  const handleViewReport = async (report: Report) => {
    setViewingReport(report);
    setFileUrl(null);
    setLoadingFile(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.storage
        .from('reports')
        .createSignedUrl(report.file_path, 3600);
      setFileUrl(data?.signedUrl || null);
    } catch {
      setFileUrl(null);
    } finally {
      setLoadingFile(false);
    }
  };

  const getReportTypeLabel = (type: string) =>
    REPORT_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <>
      {/* Main Panel — Full Screen Dialog */}
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen
        slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
      >
        <AppBar position="sticky" color="inherit" elevation={0}>
          <Toolbar>
            <IconButton edge="start" onClick={onClose}>
              <CloseIcon />
            </IconButton>
            <Box sx={{ ml: 1, flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {loading ? 'Loading...' : patientName}
              </Typography>
              {!loading && patientHealthId && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontFamily: 'var(--font-mono)',
                    display: 'block',
                    lineHeight: 1,
                    mt: -0.25,
                  }}
                >
                  {patientHealthId}
                </Typography>
              )}
            </Box>
            {!loading && reports.length > 0 && (
              <Chip
                label={`${filteredReports.length} / ${reports.length}`}
                size="small"
                color="primary"
                sx={{ mr: 1 }}
              />
            )}
          </Toolbar>
          <Divider />
        </AppBar>

        <Box sx={{ px: 2, py: 3, maxWidth: 600, mx: 'auto', width: '100%' }}>
          {/* Loading */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <Box
                className="skeleton"
                sx={{ width: '100%', height: 120, borderRadius: 3, mb: 2 }}
              />
            </Box>
          )}

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              {/* Patient Info Card */}
              <Card
                className="animate-fade-in-up"
                sx={{
                  mb: 2.5,
                  bgcolor: 'rgba(5,150,105,0.08)',
                  border: '1px solid rgba(5,150,105,0.30)',
                }}
              >
                <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      background: 'linear-gradient(135deg, #047857, #10B981)',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      boxShadow: '0 4px 12px rgba(5,150,105,0.40)',
                    }}
                  >
                    {patientName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {patientName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Shared {reports.length} report{reports.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: 14 }} />}
                    label="Verified Share"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </CardContent>
              </Card>

              {/* Access logged notice */}
              <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2.5 }}>
                This access is logged. {patientName.split(' ')[0]} can see that you viewed their
                records.
              </Alert>

              {/* AI Clinical Insights */}
              {reports.length > 0 && (
                <Box sx={{ mb: 2.5 }} className="animate-fade-in-up">
                  <PatientInsightsCard reports={reports} patientName={patientName} />
                </Box>
              )}

              {/* Filters */}
              {reports.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    mb: 2,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                  className="animate-fade-in-up"
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FilterListIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Filters
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 16 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <TextField
                    size="small"
                    select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {reportTypes.map((t) => (
                      <MenuItem key={t} value={t}>
                        {getReportTypeLabel(t)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    sx={{ minWidth: 100 }}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                    <MenuItem value="90d">Last 90 Days</MenuItem>
                  </TextField>
                </Box>
              )}

              {/* No reports */}
              {reports.length === 0 && (
                <Card
                  sx={{
                    textAlign: 'center',
                    py: 6,
                    border: '2px dashed',
                    borderColor: 'divider',
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 4,
                        bgcolor: 'rgba(37,99,235,0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <InfoOutlinedIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      No Reports Shared
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patientName.split(' ')[0]} hasn&apos;t shared any reports yet.
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* No filtered results */}
              {reports.length > 0 && filteredReports.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No reports match your current filters. Try adjusting your search.
                </Alert>
              )}

              {/* Report cards */}
              {filteredReports.length > 0 && (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                  className="stagger-children"
                >
                  {filteredReports.map((report) => {
                    const typeColor =
                      REPORT_TYPE_COLORS[report.report_type] || REPORT_TYPE_COLORS.other;
                    return (
                      <Card
                        key={report.id}
                        onClick={() => handleViewReport(report)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            '&:last-child': { pb: 2 },
                          }}
                        >
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2.5,
                              flexShrink: 0,
                              bgcolor: typeColor.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <DescriptionIcon sx={{ fontSize: 22, color: typeColor.color }} />
                          </Box>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarTodayIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(report.report_date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </Typography>
                              </Box>
                            </Box>
                            {report.notes && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                sx={{ display: 'block', mt: 0.25 }}
                              >
                                {report.notes}
                              </Typography>
                            )}
                          </Box>
                          <OpenInNewIcon
                            sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </>
          )}
        </Box>
      </Dialog>

      {/* Report Viewer Dialog — Full Screen */}
      <Dialog
        open={!!viewingReport}
        onClose={() => {
          setViewingReport(null);
          setFileUrl(null);
        }}
        fullScreen
        slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
      >
        <AppBar position="sticky" color="inherit" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => {
                setViewingReport(null);
                setFileUrl(null);
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ ml: 1, flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" noWrap>
                {viewingReport?.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {viewingReport ? getReportTypeLabel(viewingReport.report_type) : ''}
              </Typography>
            </Box>
            {fileUrl && (
              <IconButton
                component="a"
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in new tab"
              >
                <OpenInNewIcon />
              </IconButton>
            )}
          </Toolbar>
          <Divider />
        </AppBar>
        <DialogContent sx={{ p: 0 }}>
          {loadingFile && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Box className="skeleton" sx={{ width: '100%', height: 60, mb: 2 }} />
              <Box className="skeleton" sx={{ width: '80%', height: 400 }} />
            </Box>
          )}
          {!loadingFile && fileUrl && viewingReport?.mime_type === 'application/pdf' && (
            <iframe
              src={fileUrl}
              style={{ width: '100%', height: 'calc(100vh - 64px)', border: 'none' }}
              title="Report PDF"
            />
          )}
          {!loadingFile && fileUrl && viewingReport?.mime_type?.startsWith('image/') && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={viewingReport?.title || 'Report'}
                style={{ maxWidth: '100%', height: 'auto', borderRadius: 12 }}
              />
            </Box>
          )}
          {!loadingFile && !fileUrl && viewingReport !== null && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
              <Typography color="error">Unable to load document. Please try again.</Typography>
            </Box>
          )}
          {!loadingFile && viewingReport && (
            <Box sx={{ px: 2, pb: 3 }}>
              <ReportAnalysisCard reportId={viewingReport.id} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
