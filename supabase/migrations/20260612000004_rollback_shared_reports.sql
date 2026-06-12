-- Rollback: Remove all push-based sharing (shared_reports) and related RLS policies
-- This undoes the entire sharing data feature

-- Drop RLS policies on shared_reports
DROP POLICY IF EXISTS "Patients can view own shared reports" ON public.shared_reports;
DROP POLICY IF EXISTS "Patients can share reports" ON public.shared_reports;
DROP POLICY IF EXISTS "Patients can delete own shares" ON public.shared_reports;

-- Drop shared_reports table (cascades to policies, indexes, triggers)
DROP TABLE IF EXISTS public.shared_reports CASCADE;

-- Drop RLS policies added for anon doctor lookup (from PR #45)
DROP POLICY IF EXISTS "Anon can view doctor profiles for sharing" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Anon can view doctor names for sharing" ON public.profiles;
