'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const COMMON_CONDITIONS = [
  'Diabetes',
  'Asthma',
  'Heart Disease',
  'Epilepsy',
  'Hypertension',
  'Thyroid',
];

interface EmergencyProfile {
  id: string;
  random_id: string;
  blood_group: string | null;
  allergies: string[];
  conditions: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_active: boolean;
}

interface EmergencyCardSetupProps {
  open: boolean;
  onClose: () => void;
}

export default function EmergencyCardSetup({ open, onClose }: EmergencyCardSetupProps) {
  const [step, setStep] = useState(0);
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedProfile, setSavedProfile] = useState<EmergencyProfile | null>(null);
  const [existingProfile, setExistingProfile] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load existing profile on open
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('emergency_profiles')
        .select('*')
        .eq('patient_id', user.id)
        .single();

      if (data) {
        setExistingProfile(data);
        setSavedProfile(data);
        setBloodGroup(data.blood_group || '');
        setAllergies(data.allergies || []);
        setConditions(data.conditions || []);
        setContactName(data.emergency_contact_name || '');
        setContactPhone(data.emergency_contact_phone || '');
        setStep(4); // Show QR directly
      }
      setLoading(false);
    };
    load();
  }, [open]);

  const addAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const toggleCondition = (condition: string) => {
    setConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Please login again.');
        return;
      }

      const payload = {
        patient_id: user.id,
        blood_group: bloodGroup || null,
        allergies,
        conditions,
        emergency_contact_name: contactName || null,
        emergency_contact_phone: contactPhone || null,
        is_active: true,
      };

      let result;
      if (existingProfile) {
        result = await supabase
          .from('emergency_profiles')
          .update(payload)
          .eq('id', existingProfile.id)
          .select()
          .single();
      } else {
        result = await supabase.from('emergency_profiles').insert(payload).select().single();
      }

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setSavedProfile(result.data);
      setStep(4);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const getEmergencyUrl = () => {
    if (!savedProfile) return '';
    const base =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return `${base}/emergency/${savedProfile.random_id}`;
  };

  const copyLink = async () => {
    const url = getEmergencyUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCard = async () => {
    const url = getEmergencyUrl();
    if (navigator.share) {
      await navigator.share({
        title: 'My Emergency Medical Card',
        text: 'Scan this QR in an emergency to see my medical info',
        url,
      });
    } else {
      copyLink();
    }
  };

  const renderStep = () => {
    if (loading) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      );
    }

    switch (step) {
      case 0: // Blood Group
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              What is your blood group?
            </Typography>
            <TextField
              select
              fullWidth
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              label="Blood Group"
            >
              {BLOOD_GROUPS.map((bg) => (
                <MenuItem key={bg} value={bg}>
                  {bg}
                </MenuItem>
              ))}
            </TextField>
            <Button fullWidth variant="contained" onClick={() => setStep(1)} sx={{ mt: 3 }}>
              Next
            </Button>
          </Box>
        );

      case 1: // Allergies
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Any allergies?
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., Penicillin"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
              />
              <Button variant="outlined" onClick={addAllergy}>
                Add
              </Button>
            </Box>
            {allergies.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                {allergies.map((a, i) => (
                  <Chip
                    key={i}
                    label={a}
                    onDelete={() => setAllergies(allergies.filter((_, idx) => idx !== i))}
                    sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: 'warning.dark' }}
                  />
                ))}
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="text" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button fullWidth variant="contained" onClick={() => setStep(2)}>
                {allergies.length === 0 ? 'No Allergies' : 'Next'}
              </Button>
            </Box>
          </Box>
        );

      case 2: // Conditions
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Any medical conditions?
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {COMMON_CONDITIONS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  onClick={() => toggleCondition(c)}
                  variant={conditions.includes(c) ? 'filled' : 'outlined'}
                  color={conditions.includes(c) ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="text" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button fullWidth variant="contained" onClick={() => setStep(3)}>
                {conditions.length === 0 ? 'None' : 'Next'}
              </Button>
            </Box>
          </Box>
        );

      case 3: // Emergency Contact
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Emergency contact
            </Typography>
            <TextField
              fullWidth
              label="Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g., Sunita"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g., 9876543210"
              type="tel"
              sx={{ mb: 2 }}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="text" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button fullWidth variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Create Emergency Card'}
              </Button>
            </Box>
          </Box>
        );

      case 4: // QR Code + Share
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Emergency Card Ready!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Print this QR or keep it on your phone for emergencies.
            </Typography>

            {savedProfile && (
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  display: 'inline-block',
                  mb: 2,
                  border: '2px solid',
                  borderColor: 'divider',
                  position: 'relative',
                }}
              >
                <QRCodeSVG value={getEmergencyUrl()} size={180} level="M" includeMargin />
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    fontWeight: 600,
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                  }}
                >
                  HealthVault Emergency
                </Typography>
              </Box>
            )}

            {/* Summary preview */}
            {savedProfile && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  bgcolor: 'rgba(220,38,38,0.04)',
                  borderRadius: 2,
                  border: '1px solid rgba(220,38,38,0.15)',
                  textAlign: 'left',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: '#DC2626', display: 'block', mb: 0.5 }}
                >
                  This card shows:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {savedProfile.blood_group && (
                    <Chip
                      label={`Blood: ${savedProfile.blood_group}`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  )}
                  {savedProfile.allergies?.length > 0 && (
                    <Chip
                      label={`${savedProfile.allergies.length} allergies`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  )}
                  {savedProfile.conditions?.length > 0 && (
                    <Chip
                      label={`${savedProfile.conditions.length} conditions`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  )}
                  {savedProfile.emergency_contact_phone && (
                    <Chip
                      label="Emergency contact"
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  )}
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                onClick={copyLink}
                sx={{ py: 1.25 }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={shareCard}
                sx={{ py: 1.25 }}
              >
                Share
              </Button>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ py: 1.25, mb: 1 }}
            >
              Print QR Code
            </Button>

            <Button
              variant="text"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 14 }} />}
              onClick={() => setStep(0)}
              sx={{ mt: 0.5 }}
            >
              Edit Card
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalHospitalIcon sx={{ color: '#DC2626' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Emergency Card
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>{renderStep()}</DialogContent>
    </Dialog>
  );
}
