'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import { useTranslations } from 'next-intl';

const ROUTES = [
  '/dashboard/patient',
  '/dashboard/patient/reports',
  '/dashboard/patient/access-log',
  '/dashboard/patient/profile',
] as const;

function tabIndex(pathname: string): number {
  const idx = ROUTES.findIndex((r) => pathname === r);
  return idx >= 0 ? idx : 0;
}

export default function PatientBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');

  const handleChange = useCallback(
    (_: React.SyntheticEvent, v: number) => {
      router.push(ROUTES[v]);
    },
    [router]
  );

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={0}>
      <BottomNavigation value={tabIndex(pathname)} onChange={handleChange} showLabels>
        <BottomNavigationAction label={t('bottomNav.home')} icon={<HomeIcon />} />
        <BottomNavigationAction label="Reports" icon={<AssignmentOutlinedIcon />} />
        <BottomNavigationAction label={t('bottomNav.accessLog')} icon={<HistoryIcon />} />
        <BottomNavigationAction label={t('bottomNav.profile')} icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
