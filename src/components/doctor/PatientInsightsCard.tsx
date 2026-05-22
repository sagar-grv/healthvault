'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MedicationIcon from '@mui/icons-material/Medication';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { Report } from '@/types';
import { REPORT_TYPE_COLORS } from '@/constants';

interface InsightSummary {
  reportId: string;
  reportTitle: string;
  reportType: string;
  summary: string;
  abnormalValues: { name: string; value: string; normal_range: string; status: string }[];
  medications: string[];
  error?: string;
}

interface PatientInsightsCardProps {
  reports: Report[];
  patientName: string;
}

export default function PatientInsightsCard({ reports, patientName }: PatientInsightsCardProps) {
  const [insights, setInsights] = useState<InsightSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Deduplicated medications across all reports
  const allMedications = [...new Set(insights.flatMap((i) => i.medications).filter(Boolean))];

  // All abnormal values across all reports
  const allAbnormal = insights.flatMap((i) =>
    (i.abnormalValues ?? []).filter((v) => v.status !== 'normal')
  );

  const criticalCount = allAbnormal.filter(
    (v) => v.status === 'critical' || v.status === 'high'
  ).length;

  const analyzeReports = async () => {
    if (reports.length === 0) return;
    setLoading(true);
    setStarted(true);
    setInsights([]);
    setProgress(0);

    const results: InsightSummary[] = [];

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

        if (res.ok && data.analysis) {
          const a = data.analysis;
          results.push({
            reportId: report.id,
            reportTitle: report.title,
            reportType: report.report_type,
            summary: a.summary ?? '',
            abnormalValues: a.abnormal_values ?? [],
            medications: a.medications_found ?? [],
          });
        } else {
          results.push({
            reportId: report.id,
            reportTitle: report.title,
            reportType: report.report_type,
            summary: '',
            abnormalValues: [],
            medications: [],
            error: data.error ?? 'Analysis unavailable',
          });
        }
      } catch {
        results.push({
          reportId: report.id,
          reportTitle: report.title,
          reportType: report.report_type,
          summary: '',
          abnormalValues: [],
          medications: [],
          error: 'Network error',
        });
      }

      setInsights([...results]);

      // Brief pause between requests to respect rate limits
      if (i < reports.length - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    setProgress(100);
    setLoading(false);
  };

  if (reports.length === 0) return null;

  // Not started yet — show CTA
  if (!started) {
    return (
      <Card
        sx={{
          mb: 2.5,
          border: '1px solid #C4B5FD',
          bgcolor: '#F5F3FF',
          boxShadow: '0 2px 12px rgba(124,58,237,0.12)',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 20, color: '#7C3AED' }} />
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#4C1D95' }}>
                AI Clinical Insights
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Analyze {reports.length} shared report{reports.length !== 1 ? 's' : ''} before the
                appointment
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            fullWidth
            startIcon={<AutoAwesomeIcon />}
            onClick={analyzeReports}
            sx={{
              bgcolor: '#7C3AED',
              '&:hover': { bgcolor: '#6D28D9' },
              fontWeight: 700,
            }}
          >
            Generate AI Insights for {patientName.split(' ')[0]}
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            For clinical reference only — not a substitute for professional judgment
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        mb: 2.5,
        border: `1px solid ${criticalCount > 0 ? '#FCA5A5' : '#C4B5FD'}`,
        bgcolor: criticalCount > 0 ? '#FFF7F7' : '#F5F3FF',
        boxShadow: `0 2px 12px ${criticalCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.1)'}`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: loading ? 1.5 : 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon
              sx={{ fontSize: 18, color: criticalCount > 0 ? '#DC2626' : '#7C3AED' }}
            />
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: criticalCount > 0 ? '#7F1D1D' : '#4C1D95' }}
            >
              AI Clinical Insights
            </Typography>
            {!loading && insights.length > 0 && (
              <Chip
                label={`${insights.filter((i) => !i.error).length}/${reports.length} analyzed`}
                size="small"
                sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontSize: '0.65rem', height: 18 }}
              />
            )}
          </Box>
          <IconButton size="small" onClick={() => setExpanded((e) => !e)} sx={{ color: '#6D28D9' }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Progress bar while loading */}
        {loading && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 600 }}>
                Analyzing {insights.length + 1} of {reports.length}…
              </Typography>
              <Typography variant="caption" sx={{ color: '#7C3AED' }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                borderRadius: 2,
                height: 5,
                bgcolor: '#EDE9FE',
                '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED' },
              }}
            />
          </Box>
        )}

        <Collapse in={expanded}>
          {/* Summary stats row */}
          {!loading && insights.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, mb: 2, flexWrap: 'wrap' }}>
              {criticalCount > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                  }}
                >
                  <WarningAmberIcon sx={{ fontSize: 16, color: '#DC2626' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#DC2626' }}>
                    {criticalCount} abnormal value{criticalCount !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: '#F0FDF4',
                    border: '1px solid #A7F3D0',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                  }}
                >
                  <TaskAltIcon sx={{ fontSize: 16, color: '#059669' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>
                    No critical values
                  </Typography>
                </Box>
              )}
              {allMedications.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                  }}
                >
                  <MedicationIcon sx={{ fontSize: 16, color: '#2563EB' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563EB' }}>
                    {allMedications.length} medication{allMedications.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Per-report summaries */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {insights.map((ins) => {
              const c = REPORT_TYPE_COLORS[ins.reportType] ?? REPORT_TYPE_COLORS.other;
              const hasAbnormal =
                ins.abnormalValues.filter((v) => v.status !== 'normal').length > 0;
              return (
                <Box
                  key={ins.reportId}
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 2,
                    border: `1px solid ${hasAbnormal ? '#FED7AA' : '#E5E7EB'}`,
                    p: 1.5,
                  }}
                >
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: ins.error ? 0 : 0.75 }}
                  >
                    <Chip
                      label={ins.reportType.replace('_', ' ')}
                      size="small"
                      sx={{ bgcolor: c.bg, color: c.color, fontSize: '0.6rem', height: 16 }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 600, flexGrow: 1 }} noWrap>
                      {ins.reportTitle}
                    </Typography>
                    {hasAbnormal && (
                      <WarningAmberIcon sx={{ fontSize: 14, color: '#D97706', flexShrink: 0 }} />
                    )}
                  </Box>

                  {ins.error ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      {ins.error}
                    </Typography>
                  ) : (
                    <>
                      {ins.summary && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ lineHeight: 1.55, display: 'block' }}
                        >
                          {ins.summary}
                        </Typography>
                      )}
                      {ins.abnormalValues.filter((v) => v.status !== 'normal').length > 0 && (
                        <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {ins.abnormalValues
                            .filter((v) => v.status !== 'normal')
                            .map((av, i) => (
                              <Chip
                                key={i}
                                label={`${av.name}: ${av.value} (${av.status})`}
                                size="small"
                                sx={{
                                  bgcolor: av.status === 'critical' ? '#FEE2E2' : '#FFF7ED',
                                  color: av.status === 'critical' ? '#DC2626' : '#D97706',
                                  fontSize: '0.62rem',
                                  height: 18,
                                  fontWeight: 600,
                                }}
                              />
                            ))}
                        </Box>
                      )}
                      {ins.medications.length > 0 && (
                        <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {ins.medications.map((med, i) => (
                            <Chip
                              key={i}
                              label={med}
                              size="small"
                              sx={{
                                bgcolor: '#EFF6FF',
                                color: '#2563EB',
                                fontSize: '0.62rem',
                                height: 18,
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              );
            })}

            {/* Loading skeletons for pending reports */}
            {loading &&
              Array.from({ length: reports.length - insights.length }).map((_, i) => (
                <Box
                  key={`sk-${i}`}
                  sx={{ bgcolor: 'white', borderRadius: 2, border: '1px solid #E5E7EB', p: 1.5 }}
                >
                  <Skeleton variant="text" width="55%" height={14} sx={{ mb: 0.75 }} />
                  <Skeleton variant="text" width="90%" height={12} />
                  <Skeleton variant="text" width="70%" height={12} />
                </Box>
              ))}
          </Box>

          {/* All medications list */}
          {!loading && allMedications.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  mb: 0.75,
                }}
              >
                All Active Medications
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {allMedications.map((med, i) => (
                  <Chip
                    key={i}
                    label={med}
                    size="small"
                    sx={{
                      bgcolor: '#DBEAFE',
                      color: '#1D4ED8',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                    }}
                  />
                ))}
              </Box>
            </>
          )}

          {/* Re-analyze button */}
          {!loading && (
            <Box sx={{ mt: 1.5, textAlign: 'right' }}>
              <Button
                size="small"
                startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                onClick={analyzeReports}
                sx={{ color: '#7C3AED', fontSize: '0.75rem' }}
              >
                Re-analyze
              </Button>
            </Box>
          )}

          {/* Disclaimer */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1, fontStyle: 'italic', opacity: 0.7 }}
          >
            AI analysis for clinical reference only. Not a substitute for professional medical
            judgment.
          </Typography>
        </Collapse>
      </CardContent>
    </Card>
  );
}
