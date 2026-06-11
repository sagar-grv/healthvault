CREATE TABLE IF NOT EXISTS public.shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  message TEXT,
  CONSTRAINT unique_patient_report_doctor UNIQUE (patient_id, report_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_reports_doctor ON public.shared_reports(doctor_id, shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_reports_patient ON public.shared_reports(patient_id, shared_at DESC);

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert own shares"
  ON public.shared_reports FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id
    AND public.get_my_role() = 'patient'
  );

CREATE POLICY "Patients can view own shares"
  ON public.shared_reports FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view shares sent to them"
  ON public.shared_reports FOR SELECT
  USING (
    doctor_id = auth.uid()
    AND public.get_my_role() = 'doctor'
  );

CREATE POLICY "Doctors can update viewed_at"
  ON public.shared_reports FOR UPDATE
  USING (
    doctor_id = auth.uid()
    AND public.get_my_role() = 'doctor'
  )
  WITH CHECK (
    doctor_id = auth.uid()
    AND public.get_my_role() = 'doctor'
  );
