'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MedicationIcon from '@mui/icons-material/Medication';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface AbnormalValue {
  name: string;
  value: string;
  normal_range: string;
  status: string;
}

interface AnalysisResult {
  summary: string;
  key_findings: string[];
  abnormal_values: AbnormalValue[];
  medications_found: string[];
  recommendation: string;
}

interface ReportAnalysisCardProps {
  reportId: string;
  cachedAnalysis?: AnalysisResult | null;
}

// rgba-based colors — work on both light and dark backgrounds
const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  high: { bg: 'rgba(239,68,68,0.12)', color: 'error.main', label: 'High' },
  low: { bg: 'rgba(37,99,235,0.10)', color: 'primary.main', label: 'Low' },
  critical: { bg: 'rgba(190,18,60,0.14)', color: 'error.dark', label: 'Critical' },
  normal: { bg: 'rgba(5,150,105,0.10)', color: 'success.main', label: 'Normal' },
};

function AbnormalChip({ status }: { status: string }) {
  const s = STATUS_COLORS[status.toLowerCase()] ?? STATUS_COLORS.normal;
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem' }}
    />
  );
}

export default function ReportAnalysisCard({ reportId, cachedAnalysis }: ReportAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(cachedAnalysis ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyzed, setAnalyzed] = useState(!!cachedAnalysis);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Analysis failed. Please try again.');
        return;
      }
      setAnalysis(data.analysis);
      setAnalyzed(true);
    } catch {
      setError('Could not connect to AI service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card
        sx={{
          mt: 2,
          border: '1px solid rgba(124,58,237,0.25)',
          bgcolor: 'rgba(124,58,237,0.06)',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoAwesomeIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main' }}>
              AI is reading your report…
            </Typography>
          </Box>
          <Skeleton variant="text" width="90%" height={16} sx={{ mb: 0.75 }} />
          <Skeleton variant="text" width="75%" height={16} sx={{ mb: 0.75 }} />
          <Skeleton variant="text" width="60%" height={16} />
        </CardContent>
      </Card>
    );
  }

  // Analyze button (not yet analyzed)
  if (!analyzed || !analysis) {
    return (
      <Box sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <Button
          variant="outlined"
          fullWidth
          startIcon={<AutoAwesomeIcon />}
          onClick={handleAnalyze}
          sx={{
            borderColor: 'secondary.main',
            color: 'secondary.main',
            '&:hover': {
              bgcolor: 'rgba(124,58,237,0.08)',
              borderColor: 'secondary.dark',
            },
          }}
        >
          {error ? 'Retry Analysis' : 'Analyze with AI'}
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 0.75 }}
        >
          Uses Gemini AI — for reference only, not medical advice
        </Typography>
      </Box>
    );
  }

  // Analysis results
  const hasAbnormal = analysis.abnormal_values?.length > 0;

  return (
    <Card
      sx={{
        mt: 2,
        border: `1px solid ${hasAbnormal ? 'rgba(239,68,68,0.40)' : 'rgba(124,58,237,0.35)'}`,
        bgcolor: hasAbnormal ? 'rgba(239,68,68,0.06)' : 'rgba(124,58,237,0.06)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <AutoAwesomeIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: 'secondary.main', flexGrow: 1 }}
          >
            AI Analysis
          </Typography>
          <Chip
            label="Gemini"
            size="small"
            sx={{
              bgcolor: 'rgba(124,58,237,0.12)',
              color: 'secondary.main',
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        </Box>

        {/* Summary */}
        <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.55 }}>
          {analysis.summary}
        </Typography>

        {/* Abnormal values */}
        {hasAbnormal && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
              <WarningAmberIcon sx={{ fontSize: 15, color: 'warning.main' }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'warning.main',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Values Outside Range
              </Typography>
            </Box>
            {analysis.abnormal_values.map((av, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 0.75,
                  px: 1.5,
                  py: 0.75,
                  bgcolor: 'background.paper',
                  borderRadius: 1.5,
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                <Box sx={{ minWidth: 0, mr: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }} noWrap>
                    {av.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Normal: {av.normal_range}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                    {av.value}
                  </Typography>
                  <AbnormalChip status={av.status} />
                </Box>
              </Box>
            ))}
          </>
        )}

        {/* Key findings */}
        {analysis.key_findings?.length > 0 && (
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
              Key Findings
            </Typography>
            {analysis.key_findings.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 0.75, mb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'secondary.main', mt: 0.1, flexShrink: 0 }}
                >
                  •
                </Typography>
                <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                  {f}
                </Typography>
              </Box>
            ))}
          </>
        )}

        {/* Medications */}
        {analysis.medications_found?.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
              <MedicationIcon sx={{ fontSize: 15, color: 'primary.main' }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Medications Found
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {analysis.medications_found.map((med, i) => (
                <Chip
                  key={i}
                  label={med}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(37,99,235,0.10)',
                    color: 'primary.main',
                    fontSize: '0.72rem',
                  }}
                />
              ))}
            </Box>
          </>
        )}

        {/* Recommendation */}
        {analysis.recommendation && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
              <InfoOutlinedIcon
                sx={{ fontSize: 14, color: 'text.disabled', mt: 0.2, flexShrink: 0 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontStyle: 'italic', lineHeight: 1.5 }}
              >
                {analysis.recommendation}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
