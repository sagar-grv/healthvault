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

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  high: { bg: '#FEF2F2', color: '#DC2626', label: 'High' },
  low: { bg: '#EFF6FF', color: '#2563EB', label: 'Low' },
  critical: { bg: '#FFF1F2', color: '#BE123C', label: 'Critical' },
  normal: { bg: '#F0FDF4', color: '#15803D', label: 'Normal' },
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
      <Card sx={{ mt: 2, border: '1px solid #E0E7FF', bgcolor: '#F5F3FF' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoAwesomeIcon sx={{ fontSize: 18, color: '#7C3AED' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED' }}>
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
            borderColor: '#7C3AED',
            color: '#7C3AED',
            '&:hover': { bgcolor: '#F5F3FF', borderColor: '#6D28D9' },
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
        border: `1px solid ${hasAbnormal ? '#FCA5A5' : '#C4B5FD'}`,
        bgcolor: hasAbnormal ? '#FFF7F7' : '#F5F3FF',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <AutoAwesomeIcon sx={{ fontSize: 18, color: '#7C3AED' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#7C3AED', flexGrow: 1 }}>
            AI Analysis
          </Typography>
          <Chip
            label="Gemini"
            size="small"
            sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontSize: '0.65rem', height: 20 }}
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
              <WarningAmberIcon sx={{ fontSize: 15, color: '#D97706' }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: '#D97706',
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
                  bgcolor: 'white',
                  borderRadius: 1.5,
                  border: '1px solid #FEE2E2',
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
                color: '#374151',
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
                <Typography variant="caption" sx={{ color: '#7C3AED', mt: 0.1, flexShrink: 0 }}>
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
              <MedicationIcon sx={{ fontSize: 15, color: '#0369A1' }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: '#0369A1',
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
                  sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontSize: '0.72rem' }}
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
              <InfoOutlinedIcon sx={{ fontSize: 14, color: '#6B7280', mt: 0.2, flexShrink: 0 }} />
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
