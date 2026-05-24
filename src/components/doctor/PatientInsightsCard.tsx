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

  const allMedications = [...new Set(insights.flatMap((i) => i.medications).filter(Boolean))];

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

      if (i < reports.length - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    setProgress(100);
    setLoading(false);
  };

  if (reports.length === 0) return null;

  // ── Not started — CTA card ─────────────────────────────────────────────────
  if (!started) {
    return (
      <Card
        sx={{
          mb: 2.5,
          border: '1px solid rgba(124,58,237,0.35)',
          bgcolor: 'rgba(124,58,237,0.06)',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'rgba(124,58,237,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
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
            color="secondary"
            fullWidth
            startIcon={<AutoAwesomeIcon />}
            onClick={analyzeReports}
            sx={{ fontWeight: 700 }}
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

  // ── Results / loading card ─────────────────────────────────────────────────
  return (
    <Card
      sx={{
        mb: 2.5,
        border: `1px solid ${criticalCount > 0 ? 'rgba(239,68,68,0.40)' : 'rgba(124,58,237,0.35)'}`,
        bgcolor: criticalCount > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(124,58,237,0.06)',
        boxShadow: `0 2px 12px ${criticalCount > 0 ? 'rgba(239,68,68,0.10)' : 'rgba(124,58,237,0.10)'}`,
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
              sx={{
                fontSize: 18,
                color: criticalCount > 0 ? 'error.main' : 'secondary.main',
              }}
            />
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              AI Clinical Insights
            </Typography>
            {!loading && insights.length > 0 && (
              <Chip
                label={`${insights.filter((i) => !i.error).length}/${reports.length} analyzed`}
                size="small"
                sx={{
                  bgcolor: 'rgba(124,58,237,0.12)',
                  color: 'secondary.main',
                  fontSize: '0.65rem',
                  height: 18,
                }}
              />
            )}
          </Box>
          <IconButton
            size="small"
            onClick={() => setExpanded((e) => !e)}
            sx={{ color: 'secondary.main' }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Progress bar */}
        {loading && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                Analyzing {insights.length + 1} of {reports.length}…
              </Typography>
              <Typography variant="caption" sx={{ color: 'secondary.main' }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                borderRadius: 2,
                height: 5,
                bgcolor: 'rgba(124,58,237,0.15)',
                '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' },
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
                    bgcolor: 'rgba(239,68,68,0.10)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                  }}
                >
                  <WarningAmberIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {criticalCount} abnormal value{criticalCount !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: 'rgba(5,150,105,0.10)',
                    border: '1px solid rgba(5,150,105,0.30)',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                  }}
                >
                  <TaskAltIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
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
                    bgcolor: 'rgba(37,99,235,0.10)',
                    border: '1px solid rgba(37,99,235,0.25)',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                  }}
                >
                  <MedicationIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
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
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: `1px solid ${hasAbnormal ? 'rgba(234,88,12,0.35)' : 'transparent'}`,
                    outline: hasAbnormal ? 'none' : '1px solid',
                    outlineColor: 'divider',
                    p: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: ins.error ? 0 : 0.75,
                    }}
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
                      <WarningAmberIcon
                        sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0 }}
                      />
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
                                  bgcolor:
                                    av.status === 'critical'
                                      ? 'rgba(239,68,68,0.12)'
                                      : 'rgba(234,88,12,0.10)',
                                  color: av.status === 'critical' ? 'error.main' : 'warning.main',
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
                                bgcolor: 'rgba(37,99,235,0.10)',
                                color: 'primary.main',
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

            {/* Loading skeletons */}
            {loading &&
              Array.from({ length: reports.length - insights.length }).map((_, i) => (
                <Box
                  key={`sk-${i}`}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 1.5,
                  }}
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
                  color: 'text.primary',
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
                      bgcolor: 'rgba(37,99,235,0.12)',
                      color: 'primary.main',
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
                sx={{ color: 'secondary.main', fontSize: '0.75rem' }}
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
