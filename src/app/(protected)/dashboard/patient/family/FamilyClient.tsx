'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Avatar from '@mui/material/Avatar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { addFamilyMember, removeFamilyMember } from './actions';
import type { FamilyMember } from '@/types';

const RELATIONSHIPS = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

interface FamilyClientProps {
  members: FamilyMember[];
}

export default function FamilyClient({ members: initialMembers }: FamilyClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [addOpen, setAddOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleAdd = async () => {
    if (!memberName.trim() || !relationship) return;
    setSaving(true);
    setError('');
    const result = await addFamilyMember({
      memberName: memberName.trim(),
      relationship,
      dateOfBirth: dateOfBirth || undefined,
      bloodGroup: bloodGroup || undefined,
    });
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    setAddOpen(false);
    setMemberName('');
    setRelationship('');
    setDateOfBirth('');
    setBloodGroup('');
    setSaving(false);
    router.refresh();
  };

  const handleRemove = async (id: string) => {
    const result = await removeFamilyMember(id);
    setSnackbar({
      open: true,
      message: result.success ? 'Family member removed.' : 'Failed to remove.',
      severity: result.success ? 'success' : 'error',
    });
    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => router.push('/dashboard/patient')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Family members
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={() => setAddOpen(true)}
        >
          Add
        </Button>
      </Box>

      {members.length === 0 ? (
        <Card sx={{ boxShadow: 'none', border: '1px dashed', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              Manage health for your family
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add parents, spouse, or children to keep their records alongside yours.
            </Typography>
            <Button variant="outlined" onClick={() => setAddOpen(true)}>
              Add first family member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {members.map((member) => (
            <Card
              key={member.id}
              sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
            >
              <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                  {member.member_name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {member.member_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {RELATIONSHIPS.find((r) => r.value === member.relationship)?.label ||
                      member.relationship}
                    {member.blood_group ? ` · ${member.blood_group}` : ''}
                  </Typography>
                </Box>
                <IconButton size="small" color="error" onClick={() => handleRemove(member.id)}>
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add family member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full name"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            select
            label="Relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            sx={{ mb: 2 }}
          >
            {RELATIONSHIPS.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type="date"
            label="Date of birth (optional)"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Blood group (optional)"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
          >
            {BLOOD_GROUPS.map((bg) => (
              <MenuItem key={bg} value={bg}>
                {bg}
              </MenuItem>
            ))}
          </TextField>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!memberName.trim() || !relationship || saving}
          >
            {saving ? 'Adding...' : 'Add member'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
