CREATE TABLE public.queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id),
  priority_score INTEGER DEFAULT 0,
  priority_reasons JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'completed', 'cancelled', 'no_show')),
  checked_in_at TIMESTAMPTZ DEFAULT now(),
  consultation_started_at TIMESTAMPTZ,
  consultation_ended_at TIMESTAMPTZ,
  pre_check_id UUID REFERENCES public.pre_check_submissions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.queue_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('age', 'condition', 'vital', 'pre_check')),
  condition_config JSONB NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_queue_doctor_status ON public.queue_entries(doctor_id, status);
CREATE INDEX idx_queue_patient ON public.queue_entries(patient_id);
CREATE INDEX idx_queue_waiting ON public.queue_entries(doctor_id, priority_score DESC) WHERE status = 'waiting';

ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_select_own_queue"
  ON public.queue_entries FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "patients_insert_own_queue"
  ON public.queue_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "patients_update_own_queue"
  ON public.queue_entries FOR UPDATE TO authenticated
  USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "doctors_manage_queue"
  ON public.queue_entries FOR ALL TO authenticated
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "authenticated_read_rules"
  ON public.queue_rules FOR SELECT TO authenticated
  USING (TRUE);

INSERT INTO public.queue_rules (rule_name, rule_type, condition_config, points) VALUES
  ('Senior Citizen', 'age', '{"min_age": 60}', 20),
  ('Critical Emergency', 'condition', '{"conditions": ["heart_disease", "stroke", "epilepsy", "severe_asthma", "chest_pain"]}', 30),
  ('High Blood Pressure', 'vital', '{"vital": "blood_pressure_systolic", "operator": ">=", "value": 160}', 15),
  ('High Fever', 'vital', '{"vital": "temperature_f", "operator": ">=", "value": 101}', 10),
  ('Pre-Check Completed', 'pre_check', '{"status": "submitted"}', 5);
