import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DoctorSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If logged in as patient, go straight to dashboard to share
  if (user) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role === 'patient') {
      redirect('/dashboard/patient');
    }
  }

  const { data: doctorProfile } = await supabase
    .from('doctor_profiles')
    .select('id, qualification, specialization, clinic_name, city')
    .eq('id', id)
    .single();

  const { data: profile } = doctorProfile
    ? await supabase.from('profiles').select('full_name').eq('id', id).single()
    : { data: null };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              bgcolor: 'rgba(5,150,105,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <MedicalServicesIcon sx={{ fontSize: 32, color: 'success.main' }} />
          </Box>

          {doctorProfile ? (
            <>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {profile?.full_name || 'Doctor'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {doctorProfile.qualification || 'Medical Professional'}
                {doctorProfile.specialization ? ` · ${doctorProfile.specialization}` : ''}
                {doctorProfile.clinic_name ? ` at ${doctorProfile.clinic_name}` : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                wants you to share your medical reports
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  color="secondary"
                  fullWidth
                  size="large"
                >
                  Log In to Share
                </Button>
                <Button component={Link} href="/register" variant="outlined" fullWidth>
                  Create an Account
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Doctor not found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The QR code you scanned does not match any registered doctor.
              </Typography>
              <Button
                component={Link}
                href="/login"
                variant="contained"
                color="secondary"
                fullWidth
              >
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
