'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { createClient } from '@/lib/supabase/client';
import type { PreCheckSubmission, PatientVitals } from '@/types';

const COMMON_SYMPTOMS = [
  'Fever',
  'Cough',
  'Headache',
  'Body Pain',
  'Fatigue',
  'Nausea',
  'Dizziness',
  'Chest Pain',
  'Shortness of Breath',
  'Abdominal Pain',
  'Diarrhea',
  'Skin Rash',
];

interface DoctorOption {
  id: string;
  full_name: string;
  clinic_name?: string;
}

interface NearbyDoctor extends DoctorOption {
  clinic_address?: string;
  city?: string;
  specialization?: string;
  distance_km?: number;
}

interface PreCheckFormProps {
  open: boolean;
  onClose: () => void;
}

export default function PreCheckForm({ open, onClose }: PreCheckFormProps) {
  const steps = ['Doctor', 'Symptoms', 'Vitals', 'Reports', 'Review'];
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [vitals, setVitals] = useState<PatientVitals>({});
  const [reports, setReports] = useState<{ id: string; title: string }[]>([]);
  const [attachedReports, setAttachedReports] = useState<string[]>([]);
  const [existingDraft, setExistingDraft] = useState<PreCheckSubmission | null>(null);

  // Doctor selection tab state
  const [doctorTab, setDoctorTab] = useState(0);

  // Nearby doctors
  const [nearbyDoctors, setNearbyDoctors] = useState<NearbyDoctor[]>([]);
  const [locatingNearby, setLocatingNearby] = useState(false);
  const [locationError, setLocationError] = useState('');

  // QR scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<{ stop: () => Promise<void> } | null>(null);

  const supabase = createClient();

  const stopScanner = useCallback(async () => {
    const scanner = html5QrCodeRef.current;
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // ignore stop errors
      }
      html5QrCodeRef.current = null;
    }
    setShowScanner(false);
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const init = async () => {
      setLoading(true);
      setError('');
      setActiveStep(0);
      setSuccess(false);
      setSelectedDoctor('');
      setSelectedDoctorName('');
      setSymptomText('');
      setSelectedSymptoms([]);
      setAttachedReports([]);
      setVitals({});
      setDraftId(null);
      setExistingDraft(null);
      setDoctorTab(0);
      setNearbyDoctors([]);
      setLocationError('');
      setShowScanner(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: docData } = await supabase.rpc('get_doctor_display_info', {
          p_doctor_id: null,
        });
        if (Array.isArray(docData)) setDoctors(docData.filter((d: DoctorOption) => d.full_name));

        const { data: reportData } = await supabase
          .from('reports')
          .select('id, title')
          .eq('patient_id', user.id)
          .eq('is_shareable', true)
          .order('uploaded_at', { ascending: false })
          .limit(20);
        if (reportData) setReports(reportData);

        const { data: draft } = await supabase
          .from('pre_check_submissions')
          .select('*')
          .eq('patient_id', user.id)
          .eq('status', 'draft')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        if (draft) {
          setExistingDraft(draft);
          setDraftId(draft.id);
          setSelectedDoctor(draft.doctor_id || '');
          setSelectedSymptoms((draft.symptoms as string[]) || []);
          setVitals((draft.vitals as PatientVitals) || {});
          setAttachedReports((draft.attached_report_ids as string[]) || []);
        }
      }

      setLoading(false);
    };
    init();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startScanner = useCallback(async () => {
    setShowScanner(true);
    setScanning(true);
    setError('');

    // Small delay to ensure the DOM element is rendered
    await new Promise((r) => setTimeout(r, 100));

    if (!scannerRef.current) {
      setScanning(false);
      setError('Scanner element not found');
      return;
    }

    try {
      const mod = await import('html5-qrcode');
      const scanner = new mod.Html5Qrcode('qr-scanner-element');
      html5QrCodeRef.current = scanner as { stop: () => Promise<void> };

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await scanner.stop();
          setScanning(false);
          setShowScanner(false);
          html5QrCodeRef.current = null;

          const prefix = 'hv-doctor:';
          if (!decodedText.startsWith(prefix)) {
            setError('Invalid QR code. Please scan a doctor QR code.');
            return;
          }

          const doctorId = decodedText.slice(prefix.length);
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctorId)) {
            setError('Invalid QR code format.');
            return;
          }

          const { data: docInfo } = await supabase.rpc('get_doctor_display_info', {
            p_doctor_id: doctorId,
          });
          if (!docInfo || !docInfo[0]?.full_name) {
            setError('Doctor not found or not yet verified.');
            return;
          }

          setSelectedDoctor(doctorId);
          setSelectedDoctorName(docInfo[0].full_name);
        },
        () => {
          /* scan failure — keep trying */
        }
      );
    } catch (err) {
      setScanning(false);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setError(
          'Camera access denied. Please allow camera permissions in your browser settings, or use another method.'
        );
      } else {
        setError('Could not start camera. Try the other options below.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findNearbyDoctors = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingNearby(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await supabase.rpc('get_nearby_doctors', {
            p_patient_lat: pos.coords.latitude,
            p_patient_lng: pos.coords.longitude,
            p_radius_km: 25,
          });
          if (Array.isArray(data)) {
            setNearbyDoctors(data);
          }
          if (!data || data.length === 0) {
            setLocationError('No doctors found nearby within 25 km.');
          }
        } catch {
          setLocationError('Could not search for nearby doctors.');
        }
        setLocatingNearby(false);
      },
      () => {
        setLocatingNearby(false);
        setLocationError('Could not get your location. Allow location access and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const saveDraft = useCallback(async () => {
    if (!draftId) return;
    await supabase
      .from('pre_check_submissions')
      .update({
        doctor_id: selectedDoctor || null,
        symptoms: selectedSymptoms,
        vitals,
        attached_report_ids: attachedReports,
      })
      .eq('id', draftId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, selectedDoctor, selectedSymptoms, vitals, attachedReports]);

  const handleDoctorSelect = async () => {
    if (!selectedDoctor) {
      setError('Please select or scan a doctor first.');
      return;
    }
    setError('');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      return;
    }

    if (existingDraft) {
      await supabase
        .from('pre_check_submissions')
        .update({ doctor_id: selectedDoctor })
        .eq('id', existingDraft.id);
      setDraftId(existingDraft.id);
    } else {
      const { data, error: insErr } = await supabase
        .from('pre_check_submissions')
        .insert({ patient_id: user.id, doctor_id: selectedDoctor, status: 'draft' })
        .select()
        .single();
      if (insErr) {
        setError(insErr.message);
        return;
      }
      setDraftId(data.id);
    }
    setActiveStep(1);
  };

  const handleSubmit = async () => {
    if (!draftId) return;
    setSaving(true);
    setError('');

    await saveDraft();

    const { error: subErr } = await supabase
      .from('pre_check_submissions')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', draftId);

    if (subErr) {
      setError(subErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography>Loading...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (success) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircleIcon sx={{ fontSize: 56, color: 'secondary.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Pre-Check Submitted!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your doctor will review this before your visit. You can check the queue status in the
            dashboard.
          </Typography>
          <Button variant="contained" onClick={onClose}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const displayDoctorName =
    selectedDoctorName ||
    doctors.find((d) => d.id === selectedDoctor)?.full_name ||
    nearbyDoctors.find((d) => d.id === selectedDoctor)?.full_name ||
    '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Pre-Check Form
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Stepper activeStep={activeStep} sx={{ px: 3, pt: 1, pb: 2 }} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            {selectedDoctor ? (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Doctor selected: <strong>{displayDoctorName}</strong>
                </Alert>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    variant="text"
                    onClick={() => {
                      setSelectedDoctor('');
                      setSelectedDoctorName('');
                      setError('');
                    }}
                  >
                    Change Doctor
                  </Button>
                  <Button fullWidth variant="contained" onClick={handleDoctorSelect}>
                    Next
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Select a Doctor
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 2 }}
                >
                  Choose how to find your doctor
                </Typography>
                <Tabs
                  value={doctorTab}
                  onChange={(_, v) => {
                    setDoctorTab(v);
                    setError('');
                    setLocationError('');
                  }}
                  sx={{ mb: 2 }}
                >
                  <Tab icon={<MyLocationIcon />} label="Nearby" iconPosition="start" />
                  <Tab icon={<QrCodeScannerIcon />} label="Scan QR" iconPosition="start" />
                  <Tab icon={<PeopleIcon />} label="All Doctors" iconPosition="start" />
                </Tabs>

                {doctorTab === 0 && (
                  <Box>
                    {nearbyDoctors.length === 0 && !locatingNearby && (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<MyLocationIcon />}
                        onClick={findNearbyDoctors}
                        sx={{ mb: 2, py: 1.5 }}
                      >
                        Find Nearby Doctors
                      </Button>
                    )}
                    {locatingNearby && (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CircularProgress size={32} sx={{ mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Getting your location...
                        </Typography>
                      </Box>
                    )}
                    {locationError && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        {locationError}
                      </Alert>
                    )}
                    {nearbyDoctors.map((doc) => (
                      <Box
                        key={doc.id}
                        onClick={() => {
                          setSelectedDoctor(doc.id);
                          setSelectedDoctorName(doc.full_name);
                        }}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          borderRadius: 2,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor:
                            selectedDoctor === doc.id ? 'action.selected' : 'background.paper',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {doc.full_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          {doc.distance_km !== undefined && (
                            <Chip
                              icon={<LocationOnIcon sx={{ fontSize: 13 }} />}
                              label={`${doc.distance_km.toFixed(1)} km`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                          )}
                          {doc.specialization && (
                            <Typography variant="caption" color="text.secondary">
                              {doc.specialization}
                            </Typography>
                          )}
                        </Box>
                        {doc.clinic_name && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            {doc.clinic_name}
                            {doc.city ? `, ${doc.city}` : ''}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {doctorTab === 1 && (
                  <Box>
                    {!showScanner ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <QrCodeScannerIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Scan a doctor&apos;s QR code to quickly select them
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<QrCodeScannerIcon />}
                          onClick={startScanner}
                          disabled={scanning}
                        >
                          {scanning ? 'Starting Camera...' : 'Open Scanner'}
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          ref={scannerRef}
                          id="qr-scanner-element"
                          sx={{ width: '100%', maxWidth: 320, mx: 'auto', mb: 1 }}
                        />
                        {scanning && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 1 }}
                          >
                            Point your camera at the doctor&apos;s QR code
                          </Typography>
                        )}
                        <Button variant="text" size="small" onClick={stopScanner}>
                          Cancel Scanning
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {doctorTab === 2 && (
                  <Box>
                    {doctors.length === 0 ? (
                      <Alert severity="info">No verified doctors found.</Alert>
                    ) : (
                      <TextField
                        select
                        fullWidth
                        value={selectedDoctor}
                        onChange={(e) => {
                          setSelectedDoctor(e.target.value);
                          const doc = doctors.find((d) => d.id === e.target.value);
                          if (doc) setSelectedDoctorName(doc.full_name);
                        }}
                        label="Doctor"
                      >
                        {doctors.map((d) => (
                          <MenuItem key={d.id} value={d.id}>
                            {d.full_name}
                            {d.clinic_name ? ` — ${d.clinic_name}` : ''}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                  <Button variant="text" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button fullWidth variant="contained" onClick={handleDoctorSelect}>
                    Next
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Describe Your Symptoms
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Tap common symptoms or type your own description.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
              {COMMON_SYMPTOMS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  onClick={() => toggleSymptom(s)}
                  variant={selectedSymptoms.includes(s) ? 'filled' : 'outlined'}
                  color={selectedSymptoms.includes(s) ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Details"
              placeholder="Describe any other symptoms, duration, severity..."
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="text" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  saveDraft();
                  setActiveStep(2);
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Vital Signs (Optional)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
              <TextField
                label="Temperature (°F)"
                type="number"
                size="small"
                value={vitals.temperature_f ?? ''}
                onChange={(e) =>
                  setVitals((v) => ({
                    ...v,
                    temperature_f: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
              <TextField
                label="Heart Rate (bpm)"
                type="number"
                size="small"
                value={vitals.heart_rate ?? ''}
                onChange={(e) =>
                  setVitals((v) => ({
                    ...v,
                    heart_rate: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
              <TextField
                label="Blood Pressure (Systolic)"
                type="number"
                size="small"
                value={vitals.blood_pressure_systolic ?? ''}
                onChange={(e) =>
                  setVitals((v) => ({
                    ...v,
                    blood_pressure_systolic: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
              <TextField
                label="Blood Pressure (Diastolic)"
                type="number"
                size="small"
                value={vitals.blood_pressure_diastolic ?? ''}
                onChange={(e) =>
                  setVitals((v) => ({
                    ...v,
                    blood_pressure_diastolic: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
              <TextField
                label="Blood Sugar (mg/dL)"
                type="number"
                size="small"
                value={vitals.blood_sugar_mg ?? ''}
                onChange={(e) =>
                  setVitals((v) => ({
                    ...v,
                    blood_sugar_mg: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
              <TextField
                label="O₂ Saturation (%)"
                type="number"
                size="small"
                slotProps={{ htmlInput: { min: 0, max: 100 } }}
                value={vitals.oxygen_saturation ?? ''}
                onChange={(e) =>
                  setVitals((v) => ({
                    ...v,
                    oxygen_saturation: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="text" onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  saveDraft();
                  setActiveStep(3);
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Attach Reports (Optional)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Select shareable reports to attach for doctor review.
            </Typography>
            {reports.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No shareable reports found. Make reports shareable first.
              </Alert>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                {reports.map((r) => (
                  <FormControlLabel
                    key={r.id}
                    control={
                      <Checkbox
                        checked={attachedReports.includes(r.id)}
                        onChange={() =>
                          setAttachedReports((prev) =>
                            prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                          )
                        }
                      />
                    }
                    label={<Typography variant="body2">{r.title}</Typography>}
                    sx={{ display: 'flex', width: '100%', mx: 0, px: 1, py: 0.25 }}
                  />
                ))}
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="text" onClick={() => setActiveStep(2)}>
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  saveDraft();
                  setActiveStep(4);
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 4 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Review & Submit
            </Typography>
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Selected Doctor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {displayDoctorName || 'Selected'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Symptoms
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {[...selectedSymptoms, ...(symptomText ? [symptomText] : [])].join(', ') ||
                  'None specified'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Reports Attached
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {attachedReports.length > 0
                  ? `${attachedReports.length} report(s) attached`
                  : 'None'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="text" onClick={() => setActiveStep(3)}>
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Submitting...' : 'Submit Pre-Check'}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
