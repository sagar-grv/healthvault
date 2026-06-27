'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';

type TabItem = {
  labelKey: string;
  icon: React.ReactNode;
  route: string;
};

const TABS: TabItem[] = [
  { labelKey: 'dashboard', icon: <HomeIcon />, route: '/dashboard/doctor' },
  { labelKey: 'patients', icon: <SearchIcon />, route: '/dashboard/doctor/patients' },
  { labelKey: 'profile', icon: <PersonIcon />, route: '/dashboard/doctor/profile' },
];

export default function DoctorBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('doctorBottomNav');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const isActive = useCallback(
    (route: string) =>
      route === '/dashboard/doctor'
        ? pathname === route
        : pathname === route || pathname.startsWith(route + '/'),
    [pathname]
  );

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px 16px 0 0',
        transform: mounted ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
        overflow: 'visible',
      }}
      elevation={0}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          height: 64,
          pb: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {TABS.map((tab) => {
          const active = isActive(tab.route);
          return (
            <Box
              key={tab.route}
              onClick={() => router.push(tab.route)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.3,
                py: 0.5,
                px: 3,
                cursor: 'pointer',
                position: 'relative',
                minWidth: 64,
                color: active ? 'secondary.main' : 'text.disabled',
                transition: 'color 0.2s',
                '&:hover': { color: active ? 'secondary.main' : 'text.secondary' },
              }}
            >
              {active && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24,
                    height: 3,
                    borderRadius: '0 0 3px 3px',
                    bgcolor: 'secondary.main',
                  }}
                />
              )}
              {tab.icon}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.68rem',
                  lineHeight: 1,
                }}
              >
                {t(tab.labelKey)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
