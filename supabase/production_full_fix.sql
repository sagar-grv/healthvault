-- ============================================================
-- PRODUCTION DATABASE FIX — Complete Migration Script
-- Applies ALL missing migrations (20240102 through 20260615)
-- to the production Supabase project (ctofuiuogawqcmyedyno).
--
-- Every statement is IDEMPOTENT — safe to run multiple times.
-- Run this in Supabase Dashboard → SQL Editor.
-- ============================================================


-- ============================================================
-- MIGRATION 20240102: Emergency Card + Schema Extensions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.emergency_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  random_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
  allergies TEXT[] DEFAULT '{}',
  conditions TEXT[] DEFAULT '{}',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_emergency_profiles_patient ON public.emergency_profiles(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_profiles_random_id ON public.emergency_profiles(random_id) WHERE is_active = TRUE;

ALTER TABLE public.emergency_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_manage_own_emergency" ON public.emergency_profiles;
CREATE POLICY "patients_manage_own_emergency" ON public.emergency_profiles
  FOR ALL USING (patient_id = auth.uid());

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE public.report_analyses ADD COLUMN IF NOT EXISTS extracted_data JSONB;

CREATE OR REPLACE FUNCTION public.update_emergency_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emergency_profile_updated ON public.emergency_profiles;
CREATE TRIGGER emergency_profile_updated
  BEFORE UPDATE ON public.emergency_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_emergency_profile_timestamp();


-- ============================================================
-- MIGRATION 20240103: Storage Bucket + RLS Policies
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "patients_upload_own_reports" ON storage.objects;
CREATE POLICY "patients_upload_own_reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "patients_read_own_reports" ON storage.objects;
CREATE POLICY "patients_read_own_reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "doctors_read_shareable_reports" ON storage.objects;
CREATE POLICY "doctors_read_shareable_reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND public.get_my_role() = 'doctor'
    AND EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.file_path = name
        AND r.is_shareable = true
    )
  );

DROP POLICY IF EXISTS "patients_delete_own_reports" ON storage.objects;
CREATE POLICY "patients_delete_own_reports"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "patients_update_own_reports" ON storage.objects;
CREATE POLICY "patients_update_own_reports"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Certificates bucket for doctor verification
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "doctors_upload_own_certificates" ON storage.objects;
CREATE POLICY "doctors_upload_own_certificates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "doctors_read_own_certificates" ON storage.objects;
CREATE POLICY "doctors_read_own_certificates"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "admins_read_certificates" ON storage.objects;
CREATE POLICY "admins_read_certificates"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates'
    AND public.get_my_role() = 'admin'
  );


-- ============================================================
-- MIGRATION 20240104: Starred Reports
-- ============================================================

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_reports_starred ON public.reports(patient_id, is_starred) WHERE is_starred = TRUE;


-- ============================================================
-- MIGRATION 20240105: Performance Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_health_id ON profiles(health_id) WHERE health_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_patient_uploaded ON reports(patient_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_patient_shareable ON reports(patient_id, is_shareable, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_patient ON access_logs(patient_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_doctor ON access_logs(doctor_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_attempts_doctor_time ON search_attempts(doctor_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_patient_starred ON reports(patient_id, is_starred) WHERE is_starred = TRUE;


-- ============================================================
-- MIGRATION 20260610: Terms & Consent
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_version text;

CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL DEFAULT 'terms_of_service',
  consent_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own consent logs" ON consent_logs;
CREATE POLICY "Users can read own consent logs"
  ON consent_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consent logs" ON consent_logs;
CREATE POLICY "Users can insert own consent logs"
  ON consent_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted ON profiles(terms_accepted_at);

-- GRANTs for authenticated role
GRANT INSERT ON public.consent_logs TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.doctor_profiles TO authenticated;


-- ============================================================
-- MIGRATION 20260610: AI Usage Route Type
-- ============================================================

ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS route_type TEXT NOT NULL DEFAULT 'analyze_report';
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_route_time ON ai_usage (user_id, route_type, used_at);


-- ============================================================
-- MIGRATION 20260610: Upload Attempts
-- ============================================================

CREATE TABLE IF NOT EXISTS upload_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_attempts_user_time ON upload_attempts (user_id, uploaded_at);
ALTER TABLE upload_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own upload attempts" ON upload_attempts;
CREATE POLICY "Users can read own upload attempts"
  ON upload_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own upload attempts" ON upload_attempts;
CREATE POLICY "Users can insert own upload attempts"
  ON upload_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- MIGRATION 20260613: Shared Reports
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
    ON public.shared_reports FOR ALL TO authenticated
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "doctors_select_their_shares" ON public.shared_reports;
CREATE POLICY "doctors_select_their_shares"
    ON public.shared_reports FOR SELECT TO authenticated
    USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "doctors_update_viewed_at" ON public.shared_reports;
CREATE POLICY "doctors_update_viewed_at"
    ON public.shared_reports FOR UPDATE TO authenticated
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
-- MIGRATION 20260613: Fix Doctor Profile Access + 20260615 Update
-- ============================================================

DROP FUNCTION IF EXISTS public.get_doctor_display_info(UUID);

CREATE OR REPLACE FUNCTION public.get_doctor_display_info(p_doctor_id UUID)
RETURNS TABLE(
  full_name TEXT,
  clinic_name TEXT,
  registration_number TEXT,
  council_name TEXT,
  qualification TEXT,
  specialization TEXT,
  clinic_address TEXT,
  city TEXT,
  verification_state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.full_name,
    dp.clinic_name,
    dp.registration_number,
    dp.council_name,
    dp.qualification,
    dp.specialization,
    dp.clinic_address,
    dp.city,
    dp.verification_state
  FROM public.profiles p
  LEFT JOIN public.doctor_profiles dp ON dp.id = p.id
  WHERE p.id = p_doctor_id AND p.role = 'doctor';
END;
$$;


-- ============================================================
-- MIGRATION 20260615: Doctor Verification System
-- ============================================================

ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS verification_state TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_state IN ('unverified', 'pending', 'admin_verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_method TEXT,
  ADD COLUMN IF NOT EXISTS certificate_path TEXT;

CREATE TABLE IF NOT EXISTS public.doctor_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('nmc_scraper', 'gov_api', 'ai_ocr')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    result JSONB,
    error_message TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_doctor_verifications_doctor ON public.doctor_verifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_verifications_status ON public.doctor_verifications(status);

ALTER TABLE public.doctor_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_view_own_verifications" ON public.doctor_verifications;
CREATE POLICY "doctors_view_own_verifications"
    ON public.doctor_verifications FOR SELECT TO authenticated
    USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "service_insert_verifications" ON public.doctor_verifications;
CREATE POLICY "service_insert_verifications"
    ON public.doctor_verifications FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "service_update_verifications" ON public.doctor_verifications;
CREATE POLICY "service_update_verifications"
    ON public.doctor_verifications FOR UPDATE TO authenticated
    USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "admin_view_all_verifications" ON public.doctor_verifications;
CREATE POLICY "admin_view_all_verifications"
    ON public.doctor_verifications FOR ALL TO authenticated
    USING (public.get_my_role() = 'admin');

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON public.admin_audit_log(target_doctor_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_audit_log" ON public.admin_audit_log;
CREATE POLICY "admin_manage_audit_log"
    ON public.admin_audit_log FOR ALL TO authenticated
    USING (public.get_my_role() = 'admin');


-- ============================================================
-- DONE. All 13 migrations applied. Every statement is
-- idempotent — safe to run even if partially applied.
-- ============================================================
