-- Allow anon users to view basic doctor info for QR landing page
-- Without these policies, /doctor-share/[id] shows "Doctor not found" for unauthenticated visitors

-- Anon can view doctor_profiles (read-only) for landing page
CREATE POLICY "Anon can view doctor profiles for sharing"
  ON public.doctor_profiles FOR SELECT
  USING (true);

-- Anon can view profiles (read-only) for landing page doctor name
CREATE POLICY "Anon can view doctor names for sharing"
  ON public.profiles FOR SELECT
  USING (true);

-- Patients can delete their own shares (revoke consent)
CREATE POLICY "Patients can delete own shares"
  ON public.shared_reports FOR DELETE
  USING (auth.uid() = patient_id);
