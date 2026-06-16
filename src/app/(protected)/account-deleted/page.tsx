import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Link from 'next/link';

export default function AccountDeletedPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Account Scheduled for Deletion
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your account has been scheduled for permanent deletion. You can still log in within the
            next 72 hours to cancel the deletion. After that, your account and all data will be
            permanently removed.
          </Typography>
          <Link href="/login" passHref>
            <Button variant="contained" color="secondary" sx={{ fontWeight: 700 }}>
              Log In to Cancel Deletion
            </Button>
          </Link>
        </CardContent>
      </Card>
    </Box>
  );
}
