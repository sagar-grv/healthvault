-- ============================================================
-- DOCTOR VERIFICATION SYSTEM
-- Migration: 20260615000001_doctor_verification.sql
-- ============================================================

-- 1. Add verification columns to doctor_profiles
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS verification_state TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_state IN ('unverified', 'pending', 'auto_verified', 'admin_verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Migrate existing is_verified data
UPDATE public.doctor_profiles
SET verification_state = 'admin_verified', verified_at = created_at
WHERE is_verified = TRUE;

-- Drop old column
ALTER TABLE public.doctor_profiles DROP COLUMN IF EXISTS is_verified;

-- 2. Create doctor_verifications table
CREATE TABLE IF NOT EXISTS public.doctor_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('nmc_scrape', 'ai_ocr', 'gov_api', 'admin_review')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'error')),
  request_payload JSONB,
  response_payload JSONB,
  confidence_score NUMERIC(3,2),
  error_message TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_verifications_doctor ON public.doctor_verifications(doctor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_doctor_verifications_status ON public.doctor_verifications(status) WHERE status = 'pending';

-- 3. Create admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON public.admin_audit_log(admin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_log(action, created_at);

-- 4. Enable RLS
ALTER TABLE public.doctor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for doctor_verifications
CREATE POLICY "Doctors can view own verification history"
  ON public.doctor_verifications FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Admin can view all verifications"
  ON public.doctor_verifications FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admin can insert verifications"
  ON public.doctor_verifications FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "System can insert verifications"
  ON public.doctor_verifications FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- 6. RLS Policies for admin_audit_log
CREATE POLICY "Admin can view all audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admin can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');
