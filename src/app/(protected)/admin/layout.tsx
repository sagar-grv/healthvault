'use client';

import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';

const navItems = [
  { label: 'Overview', href: '/admin', icon: <DashboardIcon /> },
  { label: 'Verifications', href: '/admin/verifications', icon: <AssignmentIcon /> },
  { label: 'Doctors', href: '/admin/doctors', icon: <PeopleIcon /> },
  { label: 'Patients', href: '/admin/patients', icon: <PersonIcon /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 240,
          bgcolor: 'grey.900',
          color: 'white',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <Box sx={{ px: 3, py: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Admin Panel
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: isActive ? 'white' : 'grey.400',
                  bgcolor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Mobile bottom nav */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'grey.900',
          zIndex: 1200,
          justifyContent: 'space-around',
          py: 1,
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isActive}
              sx={{
                flexDirection: 'column',
                color: isActive ? 'white' : 'grey.500',
                minWidth: 64,
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 0, justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontSize: '0.65rem' } } }}
              />
            </ListItemButton>
          );
        })}
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, pb: { xs: 8, md: 0 }, overflow: 'auto' }}>{children}</Box>
    </Box>
  );
}
