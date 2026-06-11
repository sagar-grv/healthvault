'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import InboxIcon from '@mui/icons-material/Inbox';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { markSharedReportViewed } from '@/app/(protected)/dashboard/doctor/actions';

interface SharedReport {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_health_id?: string;
  report_title?: string;
  report_type?: string;
  shared_at: string;
  viewed_at: string | null;
}

interface SharedWithMeSectionProps {
  reports: SharedReport[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function SharedWithMeSection({ reports }: SharedWithMeSectionProps) {
  const router = useRouter();
  const [localReports, setLocalReports] = useState(reports);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const unreadCount = localReports.filter((r) => !r.viewed_at).length;

  const handleMarkViewed = async (shareId: string) => {
    setMarkingId(shareId);
    await markSharedReportViewed(shareId);
    setLocalReports((prev) =>
      prev.map((r) => (r.id === shareId ? { ...r, viewed_at: new Date().toISOString() } : r))
    );
    setMarkingId(null);
    router.refresh();
  };

  const handleViewRecords = (healthId: string) => {
    router.push(`/dashboard/doctor/patient/${encodeURIComponent(healthId)}`);
  };

  if (localReports.length === 0) {
    return (
      <Card
        sx={{
          mb: 3,
          textAlign: 'center',
          py: 4,
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'transparent',
          boxShadow: 'none',
        }}
      >
        <CardContent>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 3,
              bgcolor: 'rgba(139,92,246,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <InboxIcon sx={{ fontSize: 28, color: '#8B5CF6' }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            No shared reports yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, mx: 'auto' }}>
            When patients share reports with you, they&apos;ll appear here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 3 }} className="animate-fade-in-up">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <InboxIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.75rem',
          }}
        >
          Shared with Me
        </Typography>
        {unreadCount > 0 && (
          <Chip
            label={`${unreadCount} new`}
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: '0.6rem', ml: 'auto' }}
          />
        )}
      </Box>

      <Card>
        {localReports.slice(0, 5).map((report, idx) => (
          <Box key={report.id}>
            <CardContent
              sx={{
                p: 2,
                '&:last-child': { pb: 2 },
                bgcolor: !report.viewed_at ? 'rgba(139,92,246,0.04)' : 'transparent',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: !report.viewed_at ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.12)',
                    color: '#8B5CF6',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    mt: 0.25,
                  }}
                >
                  {(report.patient_name || 'U').charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {report.patient_name || 'Unknown'}
                    </Typography>
                    {!report.viewed_at && (
                      <Chip
                        label="New"
                        size="small"
                        color="primary"
                        sx={{ height: 18, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ display: 'block' }}
                  >
                    Shared {report.report_title || 'a report'}
                    {report.report_type && ` (${report.report_type.replace(/_/g, ' ')})`}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">
                      {timeAgo(report.shared_at)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    sx={{
                      fontSize: '0.65rem',
                      py: 0.3,
                      minWidth: 80,
                      whiteSpace: 'nowrap',
                    }}
                    onClick={() =>
                      report.patient_health_id && handleViewRecords(report.patient_health_id)
                    }
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 12 }} />}
                  >
                    View Records
                  </Button>

                  {!report.viewed_at ? (
                    <Button
                      size="small"
                      variant="text"
                      color="inherit"
                      sx={{
                        fontSize: '0.6rem',
                        py: 0.1,
                        minWidth: 0,
                        color: 'text.secondary',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkViewed(report.id);
                      }}
                      disabled={markingId === report.id}
                      startIcon={<VisibilityIcon sx={{ fontSize: 12 }} />}
                    >
                      {markingId === report.id ? '...' : 'Mark Seen'}
                    </Button>
                  ) : (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: 12 }} />}
                      label="Seen"
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.6rem',
                        height: 22,
                        color: 'success.main',
                        borderColor: 'success.main',
                      }}
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
            {idx < Math.min(localReports.length, 5) - 1 && <Divider />}
          </Box>
        ))}
      </Card>
    </Box>
  );
}
