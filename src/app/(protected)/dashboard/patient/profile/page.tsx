'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LanguageIcon from '@mui/icons-material/Language';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { getAiLanguage, setAiLanguage, setPreferredLanguage } from '@/lib/utils/language';
import ThemeToggle from '@/components/ThemeToggle';

const EmergencyCardSetup = dynamic(() => import('@/components/patient/EmergencyCardSetup'), {
  ssr: false,
});

const ALL_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
];

export default function PatientProfilePage() {
  const router = useRouter();
  const t = useTranslations('profile');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [healthId, setHealthId] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [shareableCount, setShareableCount] = useState(0);
  const [hasEmergencyCard, setHasEmergencyCard] = useState(false);
  const [showEmergencySetup, setShowEmergencySetup] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    const fetchAll = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [profileRes, reportsRes, emergencyRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('reports').select('id, is_shareable').eq('patient_id', user.id),
        supabase.from('emergency_profiles').select('id').eq('patient_id', user.id).maybeSingle(),
      ]);

      if (profileRes.data) {
        setFullName(profileRes.data.full_name || '');
        setPhone(profileRes.data.phone || '');
        setEmail(profileRes.data.email || '');
        setHealthId(profileRes.data.health_id || '');
      }
      if (reportsRes.data) {
        setReportCount(reportsRes.data.length);
        setShareableCount(reportsRes.data.filter((r) => r.is_shareable).length);
      }
      setHasEmergencyCard(!!emergencyRes.data);
      setLanguage(getAiLanguage());
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone || null })
        .eq('id', user.id);
      if (error) {
        setSnackbar({ open: true, message: t('saveError'), severity: 'error' });
      } else {
        setSnackbar({ open: true, message: t('saveSuccess'), severity: 'success' });
      }
    } catch {
      setSnackbar({ open: true, message: t('saveUnknownError'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(healthId);
      setSnackbar({ open: true, message: t('copySuccess'), severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: t('copyError'), severity: 'error' });
    }
  };

  const handleWhatsApp = () => {
    const msg = t('whatsAppMessage', { healthId });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleLanguageChange = async (locale: string) => {
    setLanguage(locale);
    await setPreferredLanguage(locale);
    setAiLanguage(locale);
    router.refresh();
  };

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 12, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.push('/dashboard/patient')}
            aria-label="Back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 700, flexGrow: 1 }}>
            {t('pageTitle')}
          </Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 2.5, maxWidth: 520, mx: 'auto' }}>
        {/* ── Hero Identity Card ───────────────────────────────────────── */}
        <Card
          sx={{
            mb: 2,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #3B82F6 100%)',
            boxShadow: '0 8px 32px rgba(29,78,216,0.3)',
            overflow: 'visible',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Avatar row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {initials || <PersonIcon sx={{ fontSize: 32 }} />}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2, mb: 0.25 }}
                  noWrap
                >
                  {fullName || t('nameFallback')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }} noWrap>
                  {email}
                </Typography>
              </Box>
            </Box>

            {/* Stats row */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mb: 2.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 2.5,
                p: 1.5,
              }}
            >
              {[
                { value: reportCount, label: t('totalReports') },
                { value: shareableCount, label: t('shared') },
                { value: reportCount - shareableCount, label: t('private') },
              ].map((stat, i) => (
                <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography
                    sx={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem' }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Health ID */}
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.55)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'block',
                mb: 0.5,
              }}
            >
              {t('yourHealthId')}
            </Typography>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: '1.3rem',
                letterSpacing: '0.1em',
                fontFamily: 'monospace',
                mb: 2,
              }}
            >
              {healthId}
            </Typography>

            {/* QR + action buttons */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 1, flexShrink: 0 }}>
                <QRCodeSVG value={healthId} size={80} level="M" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon sx={{ fontSize: 15 }} />}
                  onClick={handleCopyId}
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  {t('copyId')}
                </Button>
                <Button
                  size="small"
                  startIcon={<ShareIcon sx={{ fontSize: 15 }} />}
                  onClick={handleWhatsApp}
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  {t('shareWhatsApp')}
                </Button>
              </Box>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', mt: 1.5 }}
            >
              {t('shareHint')}
            </Typography>
          </CardContent>
        </Card>

        {/* ── Personal Details ─────────────────────────────────────────── */}
        <Card sx={{ mb: 2, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t('personalDetails')}
            </Typography>
            <TextField
              fullWidth
              label={t('fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              sx={{ mb: 2 }}
              slotProps={{
                input: { endAdornment: <EditIcon sx={{ fontSize: 16, color: 'text.disabled' }} /> },
              }}
            />
            <TextField
              fullWidth
              label={t('email')}
              value={email}
              disabled
              helperText={t('emailHelperText')}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              sx={{ mb: 2 }}
            />

            {/* Language preference */}
            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <InputLabel>{t('languagePreference')}</InputLabel>
              <Select
                value={language}
                label={t('languagePreference')}
                onChange={(e) => handleLanguageChange(e.target.value)}
                startAdornment={
                  <LanguageIcon sx={{ fontSize: 18, color: 'primary.main', mr: 1 }} />
                }
              >
                {ALL_LANGUAGES.map((l) => (
                  <MenuItem key={l.code} value={l.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 600 }}>{l.native}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {l.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSave}
              disabled={saving}
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              {saving ? <CircularProgress size={22} color="inherit" /> : t('saveChanges')}
            </Button>
          </CardContent>
        </Card>

        {/* ── Emergency Card ───────────────────────────────────────────── */}
        <Card
          sx={{
            mb: 2,
            borderRadius: 3,
            border: hasEmergencyCard
              ? '1.5px solid rgba(5,150,105,0.4)'
              : '1.5px solid rgba(239,68,68,0.4)',
            bgcolor: hasEmergencyCard ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.06)',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: hasEmergencyCard ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {hasEmergencyCard ? (
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
                ) : (
                  <LocalHospitalIcon sx={{ color: 'error.main', fontSize: 24 }} />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {hasEmergencyCard ? t('emergencyCardConfigured') : t('emergencyCard')}
                  </Typography>
                  {hasEmergencyCard && (
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(5,150,105,0.15)',
                        color: 'success.dark',
                        fontWeight: 700,
                        height: 20,
                        fontSize: '0.65rem',
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5, lineHeight: 1.4 }}
                >
                  {hasEmergencyCard ? t('emergencyCardConfiguredDesc') : t('emergencyCardDesc')}
                </Typography>
                <Button
                  variant={hasEmergencyCard ? 'outlined' : 'contained'}
                  size="small"
                  onClick={() => setShowEmergencySetup(true)}
                  sx={
                    hasEmergencyCard
                      ? {
                          borderColor: 'success.main',
                          color: 'success.main',
                          borderRadius: 2,
                          '&:hover': { bgcolor: 'rgba(5,150,105,0.08)' },
                        }
                      : {
                          bgcolor: 'error.main',
                          borderRadius: 2,
                          '&:hover': { bgcolor: 'error.dark' },
                        }
                  }
                >
                  {hasEmergencyCard ? t('updateEmergencyCard') : t('setupEmergencyCard')}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* ── Account ─────────────────────────────────────────────────── */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              {t('account')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('abhaIntegration')}
              </Typography>
              <Chip
                label={t('comingSoon')}
                size="small"
                variant="outlined"
                sx={{ borderColor: 'divider', color: 'text.disabled' }}
              />
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Role
              </Typography>
              <Chip label={t('rolePatient')} color="primary" size="small" />
            </Box>
          </CardContent>
        </Card>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'error.light', mt: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: 'error.main' }}>
              Danger Zone
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => setDeleteConfirmOpen(true)}
              sx={{ borderRadius: 2, py: 1 }}
            >
              Delete My Account
            </Button>
          </CardContent>
        </Card>

        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>Delete your account?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              This will permanently delete:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 1 }}>
              <li>
                <Typography variant="body2">Your profile</Typography>
              </li>
              <li>
                <Typography variant="body2">
                  {reportCount} uploaded report{reportCount !== 1 ? 's' : ''}
                </Typography>
              </li>
              <li>
                <Typography variant="body2">All doctor access history</Typography>
              </li>
              <li>
                <Typography variant="body2">Emergency contact profile</Typography>
              </li>
            </Box>
            <Alert severity="error" sx={{ mt: 1 }}>
              This cannot be undone. You will be signed out immediately.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                const { deleteAccount } =
                  await import('@/app/(protected)/dashboard/patient/actions');
                const result = await deleteAccount();
                if (result.error) {
                  setSnackbar({ open: true, message: result.error, severity: 'error' });
                  setDeleting(false);
                  setDeleteConfirmOpen(false);
                } else {
                  router.replace('/');
                }
              }}
            >
              {deleting ? <CircularProgress size={20} color="inherit" /> : 'Yes, Delete Account'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Emergency Card Setup Dialog */}
      <EmergencyCardSetup
        open={showEmergencySetup}
        onClose={() => {
          setShowEmergencySetup(false);
          // Refresh emergency card status after setup
          const supabase = createClient();
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase
                .from('emergency_profiles')
                .select('id')
                .eq('patient_id', user.id)
                .maybeSingle()
                .then(({ data }) => setHasEmergencyCard(!!data));
            }
          });
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
