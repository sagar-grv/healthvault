ALTER TABLE public.shared_reports
  DROP CONSTRAINT IF EXISTS shared_reports_doctor_id_fkey,
  ADD CONSTRAINT shared_reports_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
