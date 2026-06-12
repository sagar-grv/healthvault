import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@/lib/theme';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShareContent from '@/components/ShareContent';

interface SharePageProps {
  searchParams: Promise<{ hid?: string; exp?: string }>;
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const { hid, exp } = await searchParams;

  if (!hid) {
    return (
      <MUIThemeProvider theme={lightTheme}>
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <WarningAmberIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Invalid Link
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No Health ID provided.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </MUIThemeProvider>
    );
  }

  // Server-side expiry check — reject expired links before rendering
  if (exp) {
    const expiryMs = parseInt(exp, 10);
    if (!isNaN(expiryMs)) {
      // Server timestamp check
      const serverNow = new Date().getTime();
      if (serverNow > expiryMs) {
        const expiredAgo = new Date(expiryMs);
        return (
          <MUIThemeProvider theme={lightTheme}>
            <Box
              sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
              }}
            >
              <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 3 }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <WarningAmberIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Link Expired
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This link expired on {expiredAgo.toLocaleDateString()} at{' '}
                    {expiredAgo.toLocaleTimeString()}.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Ask the patient to share a new link.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </MUIThemeProvider>
        );
      }
    }
  }

  // Pass expiry timestamp to client for countdown display
  return <ShareContent healthId={hid} expiryTimestamp={exp ? parseInt(exp, 10) : undefined} />;
}
