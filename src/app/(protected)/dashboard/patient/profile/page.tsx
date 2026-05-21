'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Snackbar from '@mui/material/Snackbar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HistoryIcon from '@mui/icons-material/History';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';

export default function PatientProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [healthId, setHealthId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [shareableCount, setShareableCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setEmail(profile.email || '');
        setHealthId(profile.health_id || '');
      }

      // Get report counts
      const { data: reports } = await supabase
        .from('reports')
        .select('id, is_shareable')
        .eq('patient_id', user.id);

      if (reports) {
        setReportCount(reports.length);
        setShareableCount(reports.filter(r => r.is_shareable).length);
      }

      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone || null })
        .eq('id', user.id);

      if (error) {
        setSnackbar({ open: true, message: 'Failed to save changes.', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Profile updated successfully.', severity: 'success' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Something went wrong.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(healthId);
      setSnackbar({ open: true, message: 'Health ID copied!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Could not copy. Please copy manually.', severity: 'error' });
    }
  };

  const handleWhatsApp = () => {
    const msg = `My HealthVault ID is ${healthId}. Use this to view my medical records on HealthVault.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/patient')} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
            My Profile
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, py: 3, maxWidth: 500, mx: 'auto' }}>

        {/* Avatar + Name */}
        <Card sx={{ mb: 3, textAlign: 'center', py: 3 }}>
          <CardContent>
            <Avatar
              sx={{
                width: 80, height: 80, mx: 'auto', mb: 2,
                bgcolor: 'primary.main', fontSize: '1.75rem', fontWeight: 700,
              }}
            >
              {initials || <PersonIcon sx={{ fontSize: 40 }} />}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {fullName || 'Your Name'}
            </Typography>
            <Typography variant="body2" color="text.secondary">{email}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{reportCount}</Typography>
                <Typography variant="caption" color="text.secondary">Total Reports</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>{shareableCount}</Typography>
                <Typography variant="caption" color="text.secondary">Shared</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>{reportCount - shareableCount}</Typography>
                <Typography variant="caption" color="text.secondary">Private</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Health ID Card */}
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', color: 'white' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BadgeIcon sx={{ fontSize: 20, opacity: 0.8 }} />
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Your Health ID</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2, mb: 2 }}>
              {healthId}
            </Typography>
            <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 1.5, display: 'inline-block', mb: 2 }}>
              <QRCodeSVG value={healthId} size={100} level="M" />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small" variant="contained" startIcon={<ContentCopyIcon />}
                onClick={handleCopyId}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                Copy ID
              </Button>
              <Button
                size="small" variant="contained"
                onClick={handleWhatsApp}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                Share via WhatsApp
              </Button>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.7 }}>
              Share this ID with your doctor to give them access to your reports
            </Typography>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Personal Details
            </Typography>
            <TextField
              fullWidth label="Full Name" value={fullName}
              onChange={e => setFullName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Email" value={email}
              disabled
              helperText="Email cannot be changed"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Phone Number (Optional)" value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              sx={{ mb: 3 }}
            />
            <Button
              variant="contained" fullWidth size="large"
              onClick={handleSave} disabled={saving}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Account</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Role</Typography>
              <Chip label="Patient" color="primary" size="small" />
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">ABHA Integration</Typography>
              <Chip label="Coming Soon" size="small" variant="outlined" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          value={3}
          onChange={(_, v) => {
            if (v === 0) router.push('/dashboard/patient');
            if (v === 1) router.push('/dashboard/patient/upload');
            if (v === 2) router.push('/dashboard/patient/access-log');
          }}
          showLabels
        >
          <BottomNavigationAction label="Home" icon={<HomeIcon />} />
          <BottomNavigationAction label="Upload" icon={<UploadFileIcon />} />
          <BottomNavigationAction label="Access Log" icon={<HistoryIcon />} />
          <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
        </BottomNavigation>
      </Paper>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
