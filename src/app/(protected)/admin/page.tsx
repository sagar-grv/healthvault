import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import ShareIcon from '@mui/icons-material/ShareOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweepOutlined';
import SecurityIcon from '@mui/icons-material/SecurityOutlined';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeartOutlined';
import { getAdminStats } from './actions';

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: 'Doctors', value: stats.totalDoctors ?? 0, icon: <PeopleIcon />, color: '#047857' },
    { label: 'Patients', value: stats.totalPatients ?? 0, icon: <PersonIcon />, color: '#1D4ED8' },
    {
      label: 'Pending Verifications',
      value: stats.pendingVerifications ?? 0,
      icon: <AssignmentIcon />,
      color: '#D97706',
    },
    {
      label: 'Total Reports',
      value: stats.totalReports ?? 0,
      icon: <DescriptionIcon />,
      color: '#7C3AED',
    },
    {
      label: 'Active Shares',
      value: stats.activeShares ?? 0,
      icon: <ShareIcon />,
      color: '#0891B2',
    },
    {
      label: 'Access Logs',
      value: stats.recentAccessLogs ?? 0,
      icon: <VisibilityIcon />,
      color: '#0F766E',
    },
    {
      label: 'Flagged AI Events',
      value: stats.flaggedAiEvents ?? 0,
      icon: <AutoAwesomeIcon />,
      color: '#DC2626',
    },
    {
      label: 'Deleted Accounts',
      value: stats.deletedAccounts ?? 0,
      icon: <DeleteSweepIcon />,
      color: '#B45309',
    },
  ];

  const modules = [
    {
      title: 'Doctor verification queue',
      body: 'Approve, reject, and audit doctor identity claims before patients trust a share.',
      icon: <SecurityIcon />,
    },
    {
      title: 'User and share investigation',
      body: 'Use patient, doctor, active-share, and access-log counts to spot suspicious access.',
      icon: <ShareIcon />,
    },
    {
      title: 'AI safety review',
      body: 'Flagged AI audit events should be reviewed before the product is pushed publicly.',
      icon: <AutoAwesomeIcon />,
    },
    {
      title: 'System health',
      body: `Admin audit events recorded: ${stats.adminAuditEvents ?? 0}. Confirm Sentry and CRON_SECRET in production.`,
      icon: <MonitorHeartIcon />,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Trust operations for doctor verification, sharing, access, AI safety, and account state.
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6 }} key={card.label}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 700, mt: 5, mb: 2 }}>
        Trust operations
      </Typography>
      <Grid container spacing={2}>
        {modules.map((module) => (
          <Grid size={{ xs: 12, md: 6 }} key={module.title}>
            <Card
              sx={{
                height: '100%',
                boxShadow: 'none',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: 'rgba(15,118,110,0.08)',
                    color: '#0F766E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {module.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {module.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {module.body}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
