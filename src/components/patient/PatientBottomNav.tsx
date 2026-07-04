'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import { useTranslations } from 'next-intl';

type TabItem = {
  labelKey: string | null;
  label: string;
  icon: React.ReactNode;
  route: string;
};

const TABS: TabItem[] = [
  { labelKey: 'bottomNav.home', label: 'Home', icon: <HomeIcon />, route: '/dashboard/patient' },
  {
    labelKey: null,
    label: 'Reports',
    icon: <AssignmentOutlinedIcon />,
    route: '/dashboard/patient/reports',
  },
  {
    labelKey: null,
    label: 'Activity',
    icon: <HistoryIcon />,
    route: '/dashboard/patient/access-log',
  },
  {
    labelKey: 'bottomNav.profile',
    label: 'Profile',
    icon: <PersonIcon />,
    route: '/dashboard/patient/profile',
  },
];

export default function PatientBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const isActive = useCallback(
    (route: string) =>
      route === '/dashboard/patient'
        ? pathname === route
        : pathname === route || pathname.startsWith(route + '/'),
    [pathname]
  );

  const renderTab = (tab: TabItem) => {
    const active = isActive(tab.route);
    return (
      <Box
        key={tab.route}
        onClick={() => router.push(tab.route)}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
          height: '100%',
          cursor: 'pointer',
          color: active ? 'primary.main' : 'text.secondary',
          position: 'relative',
          transition: 'color 0.2s',
        }}
      >
        {active && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: '20%',
              height: 2.5,
              bgcolor: 'primary.main',
              borderRadius: '0 0 3px 3px',
            }}
          />
        )}
        <Box
          sx={{
            transition: 'transform 0.2s',
            transform: active ? 'translateY(-1px) scale(1.1)' : 'translateY(0) scale(1)',
          }}
        >
          {tab.icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.6rem',
            fontWeight: active ? 700 : 600,
            lineHeight: 1,
            transition: 'font-weight 0.2s',
          }}
        >
          {tab.labelKey ? t(tab.labelKey) : tab.label}
        </Typography>
      </Box>
    );
  };

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: 'background.paper',
          transform: mounted ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
        elevation={0}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            height: 64,
            px: 0.5,
            pt: 0.5,
            position: 'relative',
          }}
        >
          {TABS.map((tab) => renderTab(tab))}
        </Box>
      </Paper>
    </>
  );
}
