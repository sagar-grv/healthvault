'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { PriorityReason } from '@/types';

interface PriorityBadgeProps {
  score: number;
  reasons?: PriorityReason[];
  size?: 'small' | 'medium';
}

function getPriorityColor(score: number): 'error' | 'warning' | 'success' {
  if (score >= 25) return 'error';
  if (score >= 10) return 'warning';
  return 'success';
}

function getPriorityLabel(score: number): string {
  if (score >= 25) return 'Critical';
  if (score >= 15) return 'High';
  if (score >= 5) return 'Medium';
  return 'Normal';
}

export default function PriorityBadge({ score, reasons, size = 'small' }: PriorityBadgeProps) {
  const color = getPriorityColor(score);
  const label = getPriorityLabel(score);

  const badge = (
    <Chip
      label={`${label} (+${score})`}
      color={color}
      size={size}
      sx={{
        fontWeight: 700,
        fontSize: size === 'small' ? '0.68rem' : '0.8rem',
        height: size === 'small' ? 22 : 28,
      }}
    />
  );

  if (!reasons || reasons.length === 0) return badge;

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            Priority Breakdown
          </Typography>
          {reasons.map((r, i) => (
            <Typography
              key={i}
              variant="caption"
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
            >
              <span>{r.description || r.rule}</span>
              <span style={{ fontWeight: 700 }}>+{r.points}</span>
            </Typography>
          ))}
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              mt: 0.5,
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>+{score}</span>
          </Typography>
        </Box>
      }
      arrow
      placement="right"
    >
      {badge}
    </Tooltip>
  );
}
