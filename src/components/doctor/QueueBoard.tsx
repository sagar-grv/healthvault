'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleIcon from '@mui/icons-material/People';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { createClient } from '@/lib/supabase/client';
import PriorityBadge from './PriorityBadge';
import type { QueueEntry } from '@/types';
import { updateQueueEntryStatus, getQueueStats } from '@/app/(protected)/dashboard/doctor/actions';

interface QueueBoardProps {
  doctorId: string;
}

export default function QueueBoard({ doctorId }: QueueBoardProps) {
  const [entries, setEntries] = useState<
    (QueueEntry & { patient?: { full_name?: string; health_id?: string } | null })[]
  >([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{
    waiting: number;
    todayCompleted: number;
    inConsultation: number;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/queue');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
      const statResult = await getQueueStats();
      if (statResult.stats) setStats(statResult.stats);
    } catch {
      setError('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/queue');
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
        }
        const statResult = await getQueueStats();
        if (!cancelled && statResult.stats) setStats(statResult.stats);
      } catch {
        if (!cancelled) setError('Failed to load queue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const channel = createClient()
      .channel('queue-board')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `doctor_id=eq.${doctorId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    const timer = setInterval(() => setNow(Date.now()), 60000);

    return () => {
      cancelled = true;
      channel.unsubscribe();
      clearInterval(timer);
    };
  }, [doctorId, loadData]);

  const handleAction = async (entryId: string, status: string) => {
    setActionLoading(entryId);
    setError('');
    const result = await updateQueueEntryStatus(entryId, status);
    if (result.error) setError(result.error);
    setActionLoading(null);
  };

  const filteredEntries = useMemo(() => {
    return tab === 0
      ? entries.filter((e) => e.status === 'waiting')
      : tab === 1
        ? entries.filter((e) => e.status === 'in_consultation')
        : entries.filter((e) => e.status === 'completed');
  }, [entries, tab]);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getWaitTime = (checkedInAt: string, referenceTime: number) => {
    const diff = referenceTime - new Date(checkedInAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <PeopleIcon /> Queue
          {stats && (
            <Chip
              label={`${stats.waiting} waiting`}
              size="small"
              color="primary"
              sx={{ fontWeight: 600, height: 22, fontSize: '0.7rem' }}
            />
          )}
        </Typography>
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={loadData}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {stats && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Card sx={{ flex: 1, boxShadow: 'none', bgcolor: 'primary.main', color: 'white' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {stats.waiting}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Waiting
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, boxShadow: 'none', bgcolor: 'warning.main', color: 'white' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {stats.inConsultation}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                In Consult
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, boxShadow: 'none', bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {stats.todayCompleted}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, minHeight: 0 }}>
        <Tab label="Waiting" sx={{ minHeight: 0, py: 0.5 }} />
        <Tab label="In Consultation" sx={{ minHeight: 0, py: 0.5 }} />
        <Tab label="Completed" sx={{ minHeight: 0, py: 0.5 }} />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Loading queue...
        </Typography>
      ) : filteredEntries.length === 0 ? (
        <Card sx={{ boxShadow: 'none', bgcolor: 'action.hover', textAlign: 'center', py: 4 }}>
          <CardContent>
            <Typography color="text.secondary">
              {tab === 0
                ? 'No patients waiting'
                : tab === 1
                  ? 'No active consultations'
                  : 'No completed consultations today'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              sx={{
                transition: 'all 0.2s',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      entry.status === 'in_consultation' ? (
                        <MedicalServicesIcon
                          sx={{
                            fontSize: 14,
                            color: 'warning.main',
                            bgcolor: 'white',
                            borderRadius: '50%',
                          }}
                        />
                      ) : undefined
                    }
                  >
                    <Avatar
                      sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.8rem' }}
                    >
                      {getInitials(entry.patient?.full_name)}
                    </Avatar>
                  </Badge>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {entry.patient?.full_name || 'Unknown Patient'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <AccessTimeIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {getWaitTime(entry.checked_in_at, now)}
                      </Typography>
                      {entry.patient?.health_id && (
                        <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                          · {entry.patient.health_id}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <PriorityBadge score={entry.priority_score} reasons={entry.priority_reasons} />
                </Box>
                {entry.pre_check_id && (
                  <Chip
                    label="Pre-Checked"
                    size="small"
                    icon={<CheckCircleIcon sx={{ fontSize: 12 }} />}
                    sx={{
                      mt: 1,
                      height: 20,
                      fontSize: '0.65rem',
                      bgcolor: 'rgba(5,150,105,0.1)',
                      color: 'secondary.main',
                      fontWeight: 600,
                    }}
                  />
                )}
                {tab <= 1 && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.75,
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {tab === 0 && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleAction(entry.id, 'in_consultation')}
                        disabled={actionLoading === entry.id}
                        sx={{ fontSize: '0.7rem', py: 0.4 }}
                      >
                        Start Consultation
                      </Button>
                    )}
                    {tab === 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleAction(entry.id, 'cancelled')}
                        disabled={actionLoading === entry.id}
                        sx={{ fontSize: '0.7rem', py: 0.4 }}
                      >
                        <CancelIcon sx={{ fontSize: 14, mr: 0.25 }} /> Cancel
                      </Button>
                    )}
                    {tab === 1 && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          onClick={() => handleAction(entry.id, 'completed')}
                          disabled={actionLoading === entry.id}
                          sx={{ fontSize: '0.7rem', py: 0.4 }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 14, mr: 0.25 }} /> Complete
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => handleAction(entry.id, 'no_show')}
                          disabled={actionLoading === entry.id}
                          sx={{ fontSize: '0.7rem', py: 0.4 }}
                        >
                          No Show
                        </Button>
                      </>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
