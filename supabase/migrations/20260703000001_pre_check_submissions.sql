CREATE TABLE public.pre_check_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id),
  symptoms JSONB DEFAULT '[]'::jsonb,
  vitals JSONB DEFAULT '{}'::jsonb,
  existing_conditions TEXT[] DEFAULT '{}',
  current_medications TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  past_surgeries TEXT[] DEFAULT '{}',
  family_history TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_key_findings JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  doctor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.pre_check_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_check_id UUID NOT NULL REFERENCES public.pre_check_submissions(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'previous_report',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pre_check_id, report_id)
);

CREATE INDEX idx_pre_check_patient ON public.pre_check_submissions(patient_id);
CREATE INDEX idx_pre_check_doctor ON public.pre_check_submissions(doctor_id);
CREATE INDEX idx_pre_check_submitted ON public.pre_check_submissions(doctor_id, submitted_at DESC) WHERE status = 'submitted';

ALTER TABLE public.pre_check_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_check_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_manage_own_prechecks"
  ON public.pre_check_submissions FOR ALL TO authenticated
  USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "doctors_select_their_prechecks"
  ON public.pre_check_submissions FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "doctors_update_their_prechecks"
  ON public.pre_check_submissions FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "patients_manage_own_precheck_reports"
  ON public.pre_check_reports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pre_check_submissions WHERE id = pre_check_id AND patient_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pre_check_submissions WHERE id = pre_check_id AND patient_id = auth.uid()));

CREATE POLICY "doctors_select_precheck_reports"
  ON public.pre_check_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pre_check_submissions WHERE id = pre_check_id AND doctor_id = auth.uid()));
