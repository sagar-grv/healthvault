'use client';

import { useState, useEffect, useCallback } from 'react';
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
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  const [symptomText, setSymptomText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [vitals, setVitals] = useState<PatientVitals>({});
  const [reports, setReports] = useState<{ id: string; title: string }[]>([]);
  const [attachedReports, setAttachedReports] = useState<string[]>([]);
  const [existingDraft, setExistingDraft] = useState<PreCheckSubmission | null>(null);

  useEffect(() => {
    if (!open) return;
    const init = async () => {
      setLoading(true);
      setError('');
      setActiveStep(0);
      setSuccess(false);
      setSelectedDoctor('');
      setSymptomText('');
      setSelectedSymptoms([]);
      setAttachedReports([]);
      setVitals({});
      setDraftId(null);
      setExistingDraft(null);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: docData } = await supabase.rpc('get_doctor_display_info', {
          p_doctor_id: null,
        });
        if (Array.isArray(docData)) setDoctors(docData.filter((d) => d.full_name));

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
  }, [open]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const saveDraft = useCallback(async () => {
    if (!draftId) return;
    const supabase = createClient();
    await supabase
      .from('pre_check_submissions')
      .update({
        doctor_id: selectedDoctor || null,
        symptoms: selectedSymptoms,
        vitals,
        attached_report_ids: attachedReports,
      })
      .eq('id', draftId);
  }, [draftId, selectedDoctor, selectedSymptoms, vitals, attachedReports]);

  const handleDoctorSelect = async () => {
    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }
    setError('');
    const supabase = createClient();
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

    const supabase = createClient();
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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Select a Doctor
            </Typography>
            <TextField
              select
              fullWidth
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              label="Doctor"
            >
              {doctors.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.full_name}
                  {d.clinic_name ? ` — ${d.clinic_name}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <Button variant="text" onClick={onClose}>
                Cancel
              </Button>
              <Button fullWidth variant="contained" onClick={handleDoctorSelect}>
                Next
              </Button>
            </Box>
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
                {doctors.find((d) => d.id === selectedDoctor)?.full_name || 'Selected'}
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
