'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import Badge from '@mui/material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import { createClient } from '@/lib/supabase/client';

export default function DoctorBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let stopped = false;

    const fetchUnseen = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || stopped) return;
      const { count } = await supabase
        .from('shared_reports')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .is('viewed_at', null);
      if (!stopped) setUnseenCount(count ?? 0);
    };

    fetchUnseen();
    const interval = setInterval(fetchUnseen, 30000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, []);

  const navValue =
    pathname === '/dashboard/doctor' ? 0 : pathname === '/dashboard/doctor/patients' ? 1 : 2;

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }} elevation={0}>
      <BottomNavigation
        value={navValue}
        onChange={(_, v) => {
          if (v === 0) router.push('/dashboard/doctor');
          if (v === 1) router.push('/dashboard/doctor/patients');
          if (v === 2) router.push('/dashboard/doctor/profile');
        }}
        showLabels
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction
          label="Patients"
          icon={
            <Badge badgeContent={unseenCount} color="error" max={99}>
              <PeopleIcon />
            </Badge>
          }
        />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
