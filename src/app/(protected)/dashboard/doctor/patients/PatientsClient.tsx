'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupIcon from '@mui/icons-material/PeopleOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import SharedWithMePanel from '@/components/doctor/SharedWithMePanel';

interface PatientInfo {
  id: string;
  full_name: string | null;
  health_id: string | null;
}

interface ShareRecord {
  id: string;
  patient_id: string;
  report_ids: string[];
  shared_at: string;
  viewed_at: string | null;
  patient: PatientInfo | null;
}

interface AccessLogRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  reports_viewed: string[];
  searched_at: string;
  patient: PatientInfo | null;
}

interface SearchAttemptRecord {
  id: string;
  doctor_id: string;
  searched_health_id: string;
  found: boolean;
  searched_at: string;
  patient: PatientInfo | null;
}

interface PatientsClientProps {
  shares: ShareRecord[];
  accessLogs: AccessLogRecord[];
  searchAttempts: SearchAttemptRecord[];
  warning: string | null;
}

type ActivityItem =
  | {
      id: string;
      kind: 'view';
      timestamp: string;
      title: string;
      subtitle: string;
      details: string;
      patient: PatientInfo | null;
    }
  | {
      id: string;
      kind: 'search';
      timestamp: string;
      title: string;
      subtitle: string;
      details: string;
      patient: PatientInfo | null;
    };

function formatDisplayDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatActivityTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PatientsClient({
  shares: initialShares,
  accessLogs,
  searchAttempts,
  warning,
}: PatientsClientProps) {
  const router = useRouter();
  const [shares, setShares] = useState(initialShares);
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [isRefreshing, startRefreshing] = useTransition();

  const filteredPatients = useMemo(() => {
    let filtered = shares;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (share) =>
          share.patient?.full_name?.toLowerCase().includes(q) ||
          share.patient?.health_id?.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((share) => new Date(share.shared_at) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((share) => new Date(share.shared_at) <= to);
    }

    if (sortBy === 'alpha') {
      filtered = [...filtered].sort((a, b) => {
        const nameA = a.patient?.full_name || '';
        const nameB = b.patient?.full_name || '';
        return nameA.localeCompare(nameB);
      });
    } else {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.shared_at).getTime() - new Date(a.shared_at).getTime()
      );
    }

    const map = new Map<string, { patient: PatientInfo; shares: ShareRecord[] }>();
    for (const share of filtered) {
      if (!share.patient) continue;
      const existing = map.get(share.patient_id);
      if (existing) {
        existing.shares.push(share);
      } else {
        map.set(share.patient_id, { patient: share.patient, shares: [share] });
      }
    }

    return Array.from(map.values());
  }, [shares, searchQuery, sortBy, dateFrom, dateTo]);

  const activityItems = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();

    const items: ActivityItem[] = [
      ...accessLogs.map((log) => ({
        id: `view-${log.id}`,
        kind: 'view' as const,
        timestamp: log.searched_at,
        title: log.patient?.full_name || 'Unknown Patient',
        subtitle: log.patient?.health_id || 'No Health ID',
        details: `${log.reports_viewed.length} report${log.reports_viewed.length === 1 ? '' : 's'} viewed`,
        patient: log.patient,
      })),
      ...searchAttempts.map((attempt) => ({
        id: `search-${attempt.id}`,
        kind: 'search' as const,
        timestamp: attempt.searched_at,
        title: attempt.patient?.full_name || attempt.searched_health_id,
        subtitle: attempt.patient?.health_id || attempt.searched_health_id,
        details: attempt.found ? 'Patient found' : 'Patient not found',
        patient: attempt.patient,
      })),
    ];

    const filtered = q
      ? items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q) ||
            item.details.toLowerCase().includes(q)
        )
      : items;

    return [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [accessLogs, searchAttempts, historyQuery]);

  const totalReports = shares.reduce((sum, share) => sum + share.report_ids.length, 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/doctor')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ ml: 1, flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Patients
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1, mt: -0.25 }}
            >
              Shared patients and access history
            </Typography>
          </Box>
          <IconButton
            onClick={() => startRefreshing(() => router.refresh())}
            disabled={isRefreshing}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, pt: 2, maxWidth: 640, mx: 'auto' }}>
        {warning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {warning}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <Card
            sx={{
              flex: 1,
              textAlign: 'center',
              bgcolor: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.25)',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h3" sx={{ color: 'primary.main', mb: 0.25 }}>
                {filteredPatients.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Patients
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              flex: 1,
              textAlign: 'center',
              bgcolor: 'rgba(5,150,105,0.08)',
              border: '1px solid rgba(5,150,105,0.30)',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h3" sx={{ color: 'success.dark', mb: 0.25 }}>
                {totalReports}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Reports
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              flex: 1,
              textAlign: 'center',
              bgcolor: 'rgba(14,165,233,0.08)',
              border: '1px solid rgba(14,165,233,0.25)',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h3" sx={{ color: 'info.main', mb: 0.25 }}>
                {activityItems.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Activity
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ px: 2, pb: 3, maxWidth: 640, mx: 'auto' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Shared Patients
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Patients who shared their reports with you
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or health ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setFilterOpen(!filterOpen)}>
                    <FilterListIcon
                      sx={{ color: filterOpen ? 'primary.main' : 'text.secondary', fontSize: 20 }}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <Collapse in={filterOpen}>
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              mt: 1.5,
              mb: 1,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <TextField
              select
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'alpha')}
              sx={{ minWidth: 120 }}
              slotProps={{
                select: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SortIcon sx={{ fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
            >
              <MenuItem value="recent">Most Recent</MenuItem>
              <MenuItem value="alpha">A–Z</MenuItem>
            </TextField>
            <TextField
              size="small"
              type="date"
              label="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: new Date().toISOString().split('T')[0] },
              }}
              sx={{ minWidth: 130 }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: new Date().toISOString().split('T')[0] },
              }}
              sx={{ minWidth: 130 }}
            />
          </Box>
        </Collapse>

        {filteredPatients.length === 0 ? (
          <Card
            className="animate-fade-in-up"
            sx={{
              textAlign: 'center',
              py: 7,
              border: '2px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 4,
                  bgcolor: 'rgba(37,99,235,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <GroupIcon sx={{ fontSize: 32, color: '#2563EB' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {searchQuery || dateFrom || dateTo ? 'No matches found' : 'No shares yet'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 280, mx: 'auto' }}
              >
                {searchQuery || dateFrom || dateTo
                  ? 'Try adjusting your search or filters.'
                  : 'When patients scan your QR code and share their reports, they will appear here.'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box className="stagger-children">
            {filteredPatients.map(({ patient, shares: patientShares }) => {
              const reportCount = patientShares.reduce(
                (sum, share) => sum + share.report_ids.length,
                0
              );
              const hasNew = patientShares.some((share) => !share.viewed_at);
              const latestShare = patientShares[0];

              return (
                <Box key={patient.id} sx={{ mb: 2 }}>
                  <Card>
                    <CardActionArea onClick={() => setSelectedShareId(latestShare.id)}>
                      <CardContent
                        sx={{
                          p: 2.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          '&:last-child': { pb: 2.5 },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: 'rgba(5,150,105,0.15)',
                            color: 'success.main',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                          }}
                        >
                          {patient.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                              {patient.full_name || 'Unknown Patient'}
                            </Typography>
                            {hasNew && (
                              <Chip
                                label="New"
                                size="small"
                                color="warning"
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'var(--font-mono)',
                              color: 'text.secondary',
                              fontWeight: 500,
                              display: 'block',
                            }}
                          >
                            {patient.health_id || 'No Health ID'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reportCount} report{reportCount !== 1 ? 's' : ''} · Shared{' '}
                            {formatDisplayDate(latestShare.shared_at)}
                          </Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Box sx={{ px: 2, pb: 3, maxWidth: 640, mx: 'auto' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Access History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Searches and patient records you opened
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search history by patient name or health ID..."
          value={historyQuery}
          onChange={(e) => setHistoryQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />

        {activityItems.length === 0 ? (
          <Card
            className="animate-fade-in-up"
            sx={{
              textAlign: 'center',
              py: 7,
              border: '2px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 4,
                  bgcolor: 'rgba(14,165,233,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <VisibilityIcon sx={{ fontSize: 32, color: '#0284C7' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                No access history yet
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 280, mx: 'auto' }}
              >
                When you search for patients or open their shared reports, the activity will appear
                here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box className="stagger-children">
            {activityItems.map((item) => {
              const title = item.title;
              const subtitle = item.subtitle;
              const initials = title?.charAt(0)?.toUpperCase() || '?';
              const isSearch = item.kind === 'search';
              const canOpenPatient = !!item.patient?.health_id;

              return (
                <Card key={item.id} sx={{ mb: 2, overflow: 'hidden' }}>
                  {canOpenPatient ? (
                    <CardActionArea
                      onClick={() =>
                        router.push(
                          `/dashboard/doctor/patient/${encodeURIComponent(item.patient?.health_id || '')}`
                        )
                      }
                    >
                      <CardContent
                        sx={{
                          p: 2.25,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          '&:last-child': { pb: 2.25 },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: isSearch ? 'rgba(14,165,233,0.15)' : 'rgba(5,150,105,0.15)',
                            color: isSearch ? 'info.main' : 'success.main',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                            <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                              {title}
                            </Typography>
                            <Chip
                              label={isSearch ? 'Search' : 'View'}
                              size="small"
                              sx={{ height: 18, fontSize: '0.6rem' }}
                              color={isSearch ? 'info' : 'success'}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'var(--font-mono)',
                              color: 'text.secondary',
                              fontWeight: 500,
                              display: 'block',
                            }}
                          >
                            {subtitle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.details} · {formatActivityTime(item.timestamp)}
                          </Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </CardContent>
                    </CardActionArea>
                  ) : (
                    <CardContent
                      sx={{
                        p: 2.25,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        '&:last-child': { pb: 2.25 },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: isSearch ? 'rgba(14,165,233,0.15)' : 'rgba(5,150,105,0.15)',
                          color: isSearch ? 'info.main' : 'success.main',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                        }}
                      >
                        {initials}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                            {title}
                          </Typography>
                          <Chip
                            label={isSearch ? 'Search' : 'View'}
                            size="small"
                            sx={{ height: 18, fontSize: '0.6rem' }}
                            color={isSearch ? 'info' : 'success'}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'var(--font-mono)',
                            color: 'text.secondary',
                            fontWeight: 500,
                            display: 'block',
                          }}
                        >
                          {subtitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.details} · {formatActivityTime(item.timestamp)}
                        </Typography>
                      </Box>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      <SharedWithMePanel
        open={!!selectedShareId}
        onClose={() => setSelectedShareId(null)}
        shareId={selectedShareId}
        onShareViewed={(sid) => {
          setShares((prev) =>
            prev.map((share) =>
              share.id === sid ? { ...share, viewed_at: new Date().toISOString() } : share
            )
          );
        }}
      />
    </Box>
  );
}
