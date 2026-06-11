'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import InboxIcon from '@mui/icons-material/Inbox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
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

  const handleMarkViewed = async (shareId: string) => {
    await markSharedReportViewed(shareId);
    setLocalReports((prev) =>
      prev.map((r) => (r.id === shareId ? { ...r, viewed_at: new Date().toISOString() } : r))
    );
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
          Shared with Me {localReports.length > 0 && `(${localReports.length})`}
        </Typography>
      </Box>
      <Card>
        {localReports.slice(0, 5).map((report, idx) => (
          <Box key={report.id}>
            <CardActionArea
              onClick={() => {
                if (report.patient_health_id) {
                  router.push(
                    `/dashboard/doctor/patient/${encodeURIComponent(report.patient_health_id)}`
                  );
                }
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:last-child': { pb: 2 },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: report.viewed_at ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.25)',
                    color: '#8B5CF6',
                    fontSize: '0.85rem',
                    fontWeight: 700,
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
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {report.report_title || 'Report'}
                    {report.report_type && ` · ${report.report_type.replace(/_/g, ' ')}`}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <AccessTimeIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">
                      {timeAgo(report.shared_at)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                  {!report.viewed_at ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ fontSize: '0.65rem', py: 0.2, minWidth: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkViewed(report.id);
                      }}
                      startIcon={<VisibilityOffIcon sx={{ fontSize: 14 }} />}
                    >
                      Mark Read
                    </Button>
                  ) : (
                    <Chip
                      icon={<VisibilityIcon sx={{ fontSize: 13 }} />}
                      label="Seen"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', height: 22, color: 'text.disabled' }}
                    />
                  )}
                  <ArrowForwardIcon
                    sx={{ fontSize: 14, color: 'text.disabled', alignSelf: 'center' }}
                  />
                </Box>
              </CardContent>
            </CardActionArea>
            {idx < Math.min(localReports.length, 5) - 1 && <Divider />}
          </Box>
        ))}
      </Card>
    </Box>
  );
}
