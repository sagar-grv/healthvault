-- Allow patients to look up doctor profiles when scanning QR
CREATE POLICY "Patients can view doctor profiles"
  ON public.profiles FOR SELECT
  USING (get_my_role() = 'patient' AND role = 'doctor');

-- Allow public (anon) to look up doctor basic info on landing page
CREATE POLICY "Anyone can view doctor basic info"
  ON public.profiles FOR SELECT
  USING (role = 'doctor');

-- Allow patients to view doctor_profiles (specialty, clinic) when sharing
CREATE POLICY "Patients can view doctor_profiles"
  ON public.doctor_profiles FOR SELECT
  USING (get_my_role() = 'patient');

-- Allow public (anon) to view doctor_profiles on landing page
CREATE POLICY "Anyone can view doctor_profiles"
  ON public.doctor_profiles FOR SELECT
  USING (true);
