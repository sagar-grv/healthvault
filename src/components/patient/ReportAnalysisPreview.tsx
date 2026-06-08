'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface AnalysisData {
  summary?: string | null;
  key_findings?: string[] | null;
  abnormal_values?: unknown[] | null;
  confidence?: number | null;
  recommendation?: string | null;
}

interface ReportAnalysisPreviewProps {
  analysis: AnalysisData;
  sx?: object;
}

function getConfidenceColor(confidence: number): { color: string; bg: string } {
  if (confidence >= 0.7) return { color: '#059669', bg: 'rgba(5,150,105,0.08)' };
  if (confidence >= 0.4) return { color: '#d97706', bg: 'rgba(217,119,6,0.08)' };
  return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)' };
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.7) return 'High confidence';
  if (confidence >= 0.4) return 'Medium confidence';
  return 'Low confidence — verify with doctor';
}

export default function ReportAnalysisPreview({ analysis, sx }: ReportAnalysisPreviewProps) {
  const confidence = analysis.confidence ?? 0;
  const confStyle = getConfidenceColor(confidence);
  const confPercent = Math.round(confidence * 100);
  const findingsCount = analysis.key_findings?.length ?? 0;
  const hasAbnormal = (analysis.abnormal_values?.length ?? 0) > 0;
  const summary = analysis.summary ?? '';

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.25,
        borderRadius: 2,
        bgcolor: 'rgba(16,185,129,0.04)',
        border: '1px solid',
        borderColor: 'rgba(16,185,129,0.12)',
        ...sx,
      }}
    >
      {/* Confidence badge + AI icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <AutoAwesomeIcon sx={{ fontSize: 14, color: '#10b981' }} />
        <Chip
          label={`${confPercent}% — ${getConfidenceLabel(confidence)}`}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 600,
            bgcolor: confStyle.bg,
            color: confStyle.color,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
        {hasAbnormal && (
          <Chip
            icon={<WarningAmberIcon sx={{ fontSize: 12 }} />}
            label="Abnormal values"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 600,
              bgcolor: 'rgba(220,38,38,0.08)',
              color: '#dc2626',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        )}
      </Box>

      {/* Truncated summary */}
      {summary && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
          }}
        >
          {summary}
        </Typography>
      )}

      {/* Findings count */}
      {findingsCount > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}
        >
          {findingsCount} key {findingsCount === 1 ? 'finding' : 'findings'}
        </Typography>
      )}
    </Box>
  );
}
