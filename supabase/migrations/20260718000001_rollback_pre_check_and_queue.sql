DROP POLICY IF EXISTS "doctors_select_precheck_reports" ON public.pre_check_reports;
DROP POLICY IF EXISTS "patients_manage_own_precheck_reports" ON public.pre_check_reports;
DROP POLICY IF EXISTS "doctors_update_their_prechecks" ON public.pre_check_submissions;
DROP POLICY IF EXISTS "doctors_select_their_prechecks" ON public.pre_check_submissions;
DROP POLICY IF EXISTS "patients_manage_own_prechecks" ON public.pre_check_submissions;
DROP POLICY IF EXISTS "doctors_manage_queue" ON public.queue_entries;
DROP POLICY IF EXISTS "patients_update_own_queue" ON public.queue_entries;
DROP POLICY IF EXISTS "patients_insert_own_queue" ON public.queue_entries;
DROP POLICY IF EXISTS "patients_select_own_queue" ON public.queue_entries;
DROP POLICY IF EXISTS "authenticated_read_rules" ON public.queue_rules;

DROP INDEX IF EXISTS idx_pre_check_submitted;
DROP INDEX IF EXISTS idx_pre_check_doctor;
DROP INDEX IF EXISTS idx_pre_check_patient;
DROP INDEX IF EXISTS idx_queue_waiting;
DROP INDEX IF EXISTS idx_queue_patient;
DROP INDEX IF EXISTS idx_queue_doctor_status;

DROP TABLE IF EXISTS public.pre_check_reports CASCADE;
DROP TABLE IF EXISTS public.pre_check_submissions CASCADE;
DROP TABLE IF EXISTS public.queue_entries CASCADE;
DROP TABLE IF EXISTS public.queue_rules CASCADE;
