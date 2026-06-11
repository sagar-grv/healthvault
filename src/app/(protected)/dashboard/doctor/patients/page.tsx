import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDoctorPatients } from '../actions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const dynamic = 'force-dynamic';

export default async function DoctorPatientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'doctor') redirect('/dashboard');

  const result = await getDoctorPatients();
  const patients = result.patients ?? [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ px: 2, py: 2.5, maxWidth: 640, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Link href="/dashboard/doctor" style={{ display: 'flex' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </Box>
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon sx={{ fontSize: 20, color: 'success.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Patients
            </Typography>
          </Box>
        </Box>

        {patients.length === 0 ? (
          <Card
            sx={{
              textAlign: 'center',
              py: 4,
              border: '2px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Typography variant="body1" color="text.secondary">
                No patients yet. Search for a patient by Health ID to get started.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card>
            {patients.map((patient, idx) => (
              <Box key={patient.id}>
                <CardActionArea
                  component={Link}
                  href={`/dashboard/doctor/patient/${encodeURIComponent(patient.health_id)}`}
                >
                  <CardContent
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      '&:last-child': { pb: 2 },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: 'rgba(5,150,105,0.15)',
                        color: 'success.main',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                      }}
                    >
                      {patient.full_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                        {patient.full_name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'var(--font-mono)', color: 'text.secondary' }}
                      >
                        {patient.health_id}
                      </Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </CardContent>
                </CardActionArea>
                {idx < patients.length - 1 && <Divider />}
              </Box>
            ))}
          </Card>
        )}
      </Box>
    </Box>
  );
}
