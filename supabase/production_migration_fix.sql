-- ============================================================
-- PRODUCTION MIGRATION FIX
-- Combined SQL from 5 missing migrations. All statements use
-- IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS — safe
-- to run on production even if partially applied.
-- ============================================================

-- ============================================================
-- MIGRATION 1: 20260610000001_terms_consent
-- ============================================================

-- Add terms acceptance columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_version text;

-- Ensure consent_logs table exists with correct columns
CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL DEFAULT 'terms_of_service',
  consent_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Add any missing columns (in case table existed from prior migration)
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS consent_version text;
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS accepted_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS user_agent text;

-- Enable RLS on consent_logs (safe to run multiple times)
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop existing to avoid conflicts, then recreate)
DROP POLICY IF EXISTS "Users can read own consent logs" ON consent_logs;
CREATE POLICY "Users can read own consent logs"
  ON consent_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consent logs" ON consent_logs;
CREATE POLICY "Users can insert own consent logs"
  ON consent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted ON profiles(terms_accepted_at);

-- ============================================================
-- MIGRATION 2: 20260610000002_ai_usage_route_type
-- ============================================================

-- Add route_type column to ai_usage for per-route rate limiting
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS route_type TEXT NOT NULL DEFAULT 'analyze_report';

-- Index for per-route rate limit queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_route_time ON ai_usage (user_id, route_type, used_at);

-- ============================================================
-- MIGRATION 3: 20260610000003_upload_attempts
-- ============================================================

-- Create upload_attempts table for upload rate limiting
CREATE TABLE IF NOT EXISTS upload_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate limit queries (user + time window)
CREATE INDEX IF NOT EXISTS idx_upload_attempts_user_time ON upload_attempts (user_id, uploaded_at);

-- Enable RLS
ALTER TABLE upload_attempts ENABLE ROW LEVEL SECURITY;

-- RLS: users can only see their own attempts
CREATE POLICY "Users can read own upload attempts"
  ON upload_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: users can only insert their own attempts
CREATE POLICY "Users can insert own upload attempts"
  ON upload_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- MIGRATION 4: 20260613000001_shared_reports
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shared_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_ids UUID[] NOT NULL DEFAULT '{}',
    shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    UNIQUE(patient_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_reports_doctor ON public.shared_reports(doctor_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_patient ON public.shared_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_unviewed ON public.shared_reports(doctor_id) WHERE viewed_at IS NULL;

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_manage_own_shares" ON public.shared_reports;
CREATE POLICY "patients_manage_own_shares"
    ON public.shared_reports
    FOR ALL
    TO authenticated
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "doctors_select_their_shares" ON public.shared_reports;
CREATE POLICY "doctors_select_their_shares"
    ON public.shared_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "doctors_update_viewed_at" ON public.shared_reports;
CREATE POLICY "doctors_update_viewed_at"
    ON public.shared_reports
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = doctor_id)
    WITH CHECK (auth.uid() = doctor_id);

CREATE OR REPLACE FUNCTION public.share_reports_with_doctor(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_report_ids UUID[]
)
RETURNS public.shared_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_result public.shared_reports;
BEGIN
    -- Only the patient themselves can create shares
    IF auth.uid() <> p_patient_id THEN
        RAISE EXCEPTION 'Not authorized to share reports for another patient';
    END IF;

    INSERT INTO public.shared_reports (patient_id, doctor_id, report_ids)
    VALUES (p_patient_id, p_doctor_id, p_report_ids)
    ON CONFLICT (patient_id, doctor_id)
    DO UPDATE SET
        report_ids = EXCLUDED.report_ids,
        shared_at = NOW(),
        viewed_at = NULL
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

-- ============================================================
-- MIGRATION 5: 20260613000002_fix_doctor_profile_access
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_doctor_display_info(p_doctor_id UUID)
RETURNS TABLE(full_name TEXT, clinic_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT p.full_name, dp.clinic_name
  FROM public.profiles p
  LEFT JOIN public.doctor_profiles dp ON dp.id = p.id
  WHERE p.id = p_doctor_id AND p.role = 'doctor';
END;
$$;

-- ============================================================
-- MIGRATION 6: 20260615000003_fix_consent_logs_grant
-- (Needed for authenticated role access)
-- ============================================================

GRANT INSERT ON public.consent_logs TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.doctor_profiles TO authenticated;

-- ============================================================
-- DONE. All statements are idempotent (IF NOT EXISTS, etc.)
-- ============================================================
