'use client';

import Chip from '@mui/material/Chip';
import type { ClaimType } from '@/types/evidence';

const CONFIG: Record<
  ClaimType,
  { label: string; color: 'success' | 'info' | 'warning' | 'default' }
> = {
  document_fact: { label: 'From Report', color: 'success' },
  general_information: { label: 'General Info', color: 'info' },
  ai_interpretation: { label: 'AI Interpretation', color: 'warning' },
  unknown: { label: 'Unverified', color: 'default' },
};

export default function EvidenceBadge({ claimType }: { claimType: ClaimType }) {
  const c = CONFIG[claimType] ?? CONFIG.unknown;
  return <Chip label={c.label} color={c.color} size="small" variant="outlined" />;
}
