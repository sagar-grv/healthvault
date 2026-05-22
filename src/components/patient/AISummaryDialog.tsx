'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { Report } from '@/types';
import { REPORT_TYPE_COLORS } from '@/constants';

interface AISummaryDialogProps {
  open: boolean;
  onClose: () => void;
  reports: Report[];
}

interface ReportSummary {
  reportId: string;
  title: string;
  reportType: string;
  summary: string;
  abnormalCount: number;
  medicationsCount: number;
  error?: string;
}

export default function AISummaryDialog({ open, onClose, reports }: AISummaryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState<ReportSummary[]>([]);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleAnalyzeAll = async () => {
    setLoading(true);
    setStarted(true);
    setGlobalError('');
    setSummaries([]);
    setProgress(0);

    const results: ReportSummary[] = [];

    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      setProgress(Math.round((i / reports.length) * 100));

      try {
        const res = await fetch('/api/analyze-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId: report.id }),
        });
        const data = await res.json();

        if (!res.ok) {
          results.push({
            reportId: report.id,
            title: report.title,
            reportType: report.report_type,
            summary: '',
            abnormalCount: 0,
            medicationsCount: 0,
            error: data.error ?? 'Analysis failed',
          });
        } else {
          const a = data.analysis;
          results.push({
            reportId: report.id,
            title: report.title,
            reportType: report.report_type,
            summary: a.summary ?? '',
            abnormalCount: (a.abnormal_values ?? []).filter(
              (v: { status?: string }) => v.status !== 'normal'
            ).length,
            medicationsCount: (a.medications_found ?? []).length,
          });
        }
      } catch {
        results.push({
          reportId: report.id,
          title: report.title,
          reportType: report.report_type,
          summary: '',
          abnormalCount: 0,
          medicationsCount: 0,
          error: 'Could not analyze',
        });
      }

      // Update UI after each report
      setSummaries([...results]);
    }

    setProgress(100);
    setLoading(false);
  };

  const handleClose = () => {
    // Don't reset state so results persist if user reopens
    onClose();
  };

  const totalAbnormal = summaries.reduce((sum, s) => sum + s.abnormalCount, 0);
  const totalMeds = summaries.reduce((sum, s) => sum + s.medicationsCount, 0);
  const analyzedCount = summaries.filter((s) => !s.error).length;

  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid #E5E7EB' }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={handleClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
          <Box sx={{ ml: 1, flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              AI Health Insights
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Summary of all your reports
            </Typography>
          </Box>
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 13 }} />}
            label="Gemini AI"
            size="small"
            sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 600 }}
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 3, maxWidth: 600, mx: 'auto', pb: 10 }}>
        {/* Not started yet */}
        {!started && (
          <Card sx={{ mb: 3, border: '1px solid #C4B5FD', bgcolor: '#F5F3FF' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 4,
                  bgcolor: '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 30, color: '#7C3AED' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Analyze {reports.length} Report{reports.length !== 1 ? 's' : ''}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 320, mx: 'auto' }}
              >
                Gemini AI will read each report and extract key findings, abnormal values, and
                medications. Results are cached — each report is only analyzed once.
              </Typography>
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                This may take {Math.ceil(reports.length * 3)}–{Math.ceil(reports.length * 8)}{' '}
                seconds depending on report size and AI load.
              </Alert>
              <Button
                variant="contained"
                size="large"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleAnalyzeAll}
                sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, px: 4 }}
              >
                Start AI Analysis
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1.5 }}
              >
                For informational purposes only — not medical advice
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Loading progress */}
        {loading && (
          <Card sx={{ mb: 3, border: '1px solid #C4B5FD', bgcolor: '#F5F3FF' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <CircularProgress size={20} sx={{ color: '#7C3AED' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED' }}>
                  Analyzing reports… {summaries.length}/{reports.length}
                </Typography>
              </Box>
              <Box sx={{ height: 6, bgcolor: '#EDE9FE', borderRadius: 3, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${progress}%`,
                    bgcolor: '#7C3AED',
                    borderRadius: 3,
                    transition: 'width 0.4s ease',
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Global error */}
        {globalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {globalError}
          </Alert>
        )}

        {/* Summary stats (shown when at least 1 complete) */}
        {summaries.length > 0 && !loading && (
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
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
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#059669' }}>
                  {analyzedCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Reports Analyzed
                </Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                flex: 1,
                textAlign: 'center',
                bgcolor: totalAbnormal > 0 ? '#FFF7ED' : '#F0FDF4',
                border: `1px solid ${totalAbnormal > 0 ? '#FED7AA' : '#A7F3D0'}`,
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: totalAbnormal > 0 ? '#EA580C' : '#059669' }}
                >
                  {totalAbnormal}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Abnormal Values
                </Typography>
              </CardContent>
            </Card>
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
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#2563EB' }}>
                  {totalMeds}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Medications Found
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Per-report results */}
        {summaries.length > 0 && (
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mb: 1.5,
              }}
            >
              Report Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {summaries.map((s) => {
                const c = REPORT_TYPE_COLORS[s.reportType] ?? REPORT_TYPE_COLORS.other;
                return (
                  <Card
                    key={s.reportId}
                    sx={{
                      border: s.error
                        ? '1px solid #FCA5A5'
                        : s.abnormalCount > 0
                          ? '1px solid #FED7AA'
                          : '1px solid #E5E7EB',
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: s.error ? 0 : 0.75,
                        }}
                      >
                        <Chip
                          label={s.reportType.replace('_', ' ')}
                          size="small"
                          sx={{ bgcolor: c.bg, color: c.color, fontSize: '0.65rem', height: 18 }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }} noWrap>
                          {s.title}
                        </Typography>
                        {!s.error && s.abnormalCount > 0 && (
                          <WarningAmberIcon
                            sx={{ fontSize: 16, color: '#D97706', flexShrink: 0 }}
                          />
                        )}
                        {!s.error && s.abnormalCount === 0 && (
                          <TaskAltIcon sx={{ fontSize: 16, color: '#059669', flexShrink: 0 }} />
                        )}
                      </Box>
                      {s.error ? (
                        <Typography variant="caption" color="error">
                          {s.error}
                        </Typography>
                      ) : (
                        <>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.5, fontSize: '0.82rem' }}
                          >
                            {s.summary}
                          </Typography>
                          {(s.abnormalCount > 0 || s.medicationsCount > 0) && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.75 }}>
                              {s.abnormalCount > 0 && (
                                <Chip
                                  label={`${s.abnormalCount} abnormal`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#FFF7ED',
                                    color: '#EA580C',
                                    fontSize: '0.65rem',
                                    height: 18,
                                  }}
                                />
                              )}
                              {s.medicationsCount > 0 && (
                                <Chip
                                  label={`${s.medicationsCount} medication${s.medicationsCount !== 1 ? 's' : ''}`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#EFF6FF',
                                    color: '#2563EB',
                                    fontSize: '0.65rem',
                                    height: 18,
                                  }}
                                />
                              )}
                            </Box>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Loading placeholders for remaining reports */}
              {loading &&
                Array.from({ length: reports.length - summaries.length }).map((_, i) => (
                  <Card key={`skeleton-${i}`}>
                    <CardContent sx={{ p: 2 }}>
                      <Skeleton variant="text" width="60%" height={18} sx={{ mb: 0.75 }} />
                      <Skeleton variant="text" width="90%" height={14} />
                      <Skeleton variant="text" width="70%" height={14} />
                    </CardContent>
                  </Card>
                ))}
            </Box>
          </Box>
        )}

        {/* Re-analyze button after done */}
        {started && !loading && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleAnalyzeAll}
              sx={{ borderColor: '#7C3AED', color: '#7C3AED' }}
            >
              Re-analyze All
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Cached results load instantly. New reports will be analyzed fresh.
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
