'use client';

import Chip from '@mui/material/Chip';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlined from '@mui/icons-material/HelpOutlined';

interface VerificationBadgeProps {
  state: string;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

const stateConfig: Record<
  string,
  {
    label: string;
    color: 'success' | 'warning' | 'error' | 'default';
    icon: React.ReactNode;
    sx?: Record<string, unknown>;
  }
> = {
  admin_verified: {
    label: 'Verified',
    color: 'success',
    icon: <VerifiedIcon sx={{ fontSize: 14 }} />,
  },
  auto_verified: {
    label: 'Auto-Verified',
    color: 'success',
    icon: <VerifiedIcon sx={{ fontSize: 14 }} />,
  },
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: <PendingIcon sx={{ fontSize: 14 }} />,
  },
  rejected: {
    label: 'Rejected',
    color: 'error',
    icon: <CancelIcon sx={{ fontSize: 14 }} />,
  },
  unverified: {
    label: 'Unverified',
    color: 'default',
    icon: <HelpOutlined sx={{ fontSize: 14 }} />,
  },
};

/**
 * Display a doctor's verification status badge.
 * Used in patient-side views to show trust indicators.
 */
export default function VerificationBadge({
  state,
  size = 'small',
  showLabel = true,
}: VerificationBadgeProps) {
  const config = stateConfig[state] ?? stateConfig.unverified;

  if (!showLabel && (state === 'admin_verified' || state === 'auto_verified')) {
    return <VerifiedIcon sx={{ fontSize: size === 'small' ? 18 : 22, color: 'success.main' }} />;
  }

  return (
    <Chip
      icon={config.icon as React.ReactElement}
      label={config.label}
      color={config.color}
      size={size}
      sx={{ fontWeight: 600, ...config.sx }}
    />
  );
}
