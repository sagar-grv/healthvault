'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AccountDeletedPage() {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: prof } = await supabase
          .from('profiles')
          .select('deletion_scheduled_at')
          .eq('id', user.id)
          .single();

        const scheduledAt = prof?.deletion_scheduled_at
          ? new Date(prof.deletion_scheduled_at)
          : null;

        if (scheduledAt) {
          const diff = scheduledAt.getTime() - Date.now();
          if (diff <= 0) {
            setTimeLeft('Your account has been permanently deleted.');
          } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            if (hours > 24) {
              const days = Math.floor(hours / 24);
              const remHours = hours % 24;
              setTimeLeft(
                `${days} day${days !== 1 ? 's' : ''} ${remHours} hour${remHours !== 1 ? 's' : ''}`
              );
            } else {
              setTimeLeft(
                `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
              );
            }
          }
        }
      } catch {
        // Best effort
      }
      setLoading(false);
    };

    fetchData();
  }, []);

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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Your account has been scheduled for permanent deletion.
          </Typography>
          {!loading && timeLeft && (
            <Typography variant="body2" color="error" sx={{ fontWeight: 600, mb: 1 }}>
              Time remaining: {timeLeft}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You can log in within the next 72 hours to cancel the deletion. After that, your account
            and all data will be permanently removed.
          </Typography>

          {isAuthenticated ? (
            <Link href="/dashboard" passHref>
              <Button variant="contained" color="secondary" sx={{ fontWeight: 700 }}>
                Go to Dashboard to Cancel Deletion
              </Button>
            </Link>
          ) : (
            <Link href="/login" passHref>
              <Button variant="contained" color="secondary" sx={{ fontWeight: 700 }}>
                Log In to Cancel Deletion
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
