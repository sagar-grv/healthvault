import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
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
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Overview of HealthVault platform
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
    </Box>
  );
}
