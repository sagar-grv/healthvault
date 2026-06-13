'use client';

import { useState, useEffect, useMemo } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupIcon from '@mui/icons-material/PeopleOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import SharedWithMePanel from '@/components/doctor/SharedWithMePanel';
import { getPatientsSharedWithMe } from '../actions';

interface PatientInfo {
  id: string;
  full_name: string;
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

export default function PatientsClient() {
  const router = useRouter();
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPatientsSharedWithMe();
      if (result.error) {
        setError(result.error);
      } else {
        setShares(result.shares);
      }
    } catch {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getPatientsSharedWithMe();
        if (!cancelled) {
          if (result.error) {
            setError(result.error);
          } else {
            setShares(result.shares);
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load patients');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter + group shares by patient
  const filteredPatients = useMemo(() => {
    let filtered = shares;

    // Search by patient name or health ID
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.patient?.full_name?.toLowerCase().includes(q) ||
          s.patient?.health_id?.toLowerCase().includes(q)
      );
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((s) => new Date(s.shared_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((s) => new Date(s.shared_at) <= to);
    }

    // Sort
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

  const totalReports = shares.reduce((sum, s) => sum + s.report_ids.length, 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/doctor')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ ml: 1, flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Shared Patients
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1, mt: -0.25 }}
            >
              Patients who shared their reports with you
            </Typography>
          </Box>
          <IconButton
            onClick={() => {
              loadData();
            }}
            disabled={loading}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Search & Filter Bar */}
      <Box sx={{ px: 2, pt: 2, maxWidth: 640, mx: 'auto' }}>
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
      </Box>

      <Box sx={{ px: 2, py: 3, maxWidth: 640, mx: 'auto' }}>
        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card
            sx={{
              textAlign: 'center',
              py: 5,
              border: '1px solid',
              borderColor: 'error.light',
              bgcolor: 'error.50',
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Typography variant="h6" color="error" sx={{ mb: 1 }}>
                Error Loading Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {error}
              </Typography>
              <IconButton
                onClick={() => {
                  loadData();
                }}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Stats */}
            {filteredPatients.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
              </Box>
            )}

            {/* Empty State */}
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
                    (sum, s) => sum + s.report_ids.length,
                    0
                  );
                  const hasNew = patientShares.some((s) => !s.viewed_at);
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
                                {new Date(latestShare.shared_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
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
          </>
        )}
      </Box>

      {/* Shared With Me Panel — opens when a patient is selected */}
      <SharedWithMePanel
        open={!!selectedShareId}
        onClose={() => setSelectedShareId(null)}
        shareId={selectedShareId}
        onShareViewed={(sid) => {
          setShares((prev) =>
            prev.map((s) => (s.id === sid ? { ...s, viewed_at: new Date().toISOString() } : s))
          );
        }}
      />
    </Box>
  );
}
