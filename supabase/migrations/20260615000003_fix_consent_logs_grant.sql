-- Fix: Grant permissions to authenticated role for all tables
GRANT INSERT ON public.consent_logs TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.doctor_profiles TO authenticated;
