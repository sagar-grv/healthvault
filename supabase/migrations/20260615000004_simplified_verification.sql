-- ============================================================
-- SIMPLIFIED VERIFICATION — Remove AI/auto states, add cert upload
-- Migration: 20260615000004_simplified_verification.sql
-- ============================================================

-- 1. Add certificate_path column to doctor_profiles
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS certificate_path TEXT;

-- 2. Drop and recreate verification_state CHECK without 'auto_verified'
ALTER TABLE public.doctor_profiles
  DROP CONSTRAINT IF EXISTS doctor_profiles_verification_state_check;

ALTER TABLE public.doctor_profiles
  ADD CONSTRAINT doctor_profiles_verification_state_check
  CHECK (verification_state IN ('unverified', 'pending', 'admin_verified', 'rejected'));

-- Migrate any existing 'auto_verified' rows to 'admin_verified'
UPDATE public.doctor_profiles
SET verification_state = 'admin_verified'
WHERE verification_state = 'auto_verified';

-- 3. Drop and recreate doctor_verifications method CHECK without 'ai_ocr'
ALTER TABLE public.doctor_verifications
  DROP CONSTRAINT IF EXISTS doctor_verifications_method_check;

ALTER TABLE public.doctor_verifications
  ADD CONSTRAINT doctor_verifications_method_check
  CHECK (method IN ('nmc_scrape', 'gov_api', 'admin_review'));

-- 4. Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('certificates', 'certificates', false, 10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- 5. RLS Policies for certificates bucket
-- Doctors can upload their own certificates
CREATE POLICY "Doctors can upload own certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Doctors can view their own certificates
CREATE POLICY "Doctors can view own certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin can view all certificates
CREATE POLICY "Admin can view all certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND public.get_my_role() = 'admin'
  );
