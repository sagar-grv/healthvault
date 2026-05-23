-- ============================================================
-- Migration 002: P0 Features — Emergency Card + Schema Extensions
-- ============================================================

-- ============================================================
-- 1. EMERGENCY_PROFILES TABLE
-- Public emergency card data (blood group, allergies, conditions)
-- Accessible without authentication via random_id
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

-- Only one emergency profile per patient
CREATE UNIQUE INDEX IF NOT EXISTS idx_emergency_profiles_patient ON public.emergency_profiles(patient_id);
-- Fast lookup by random_id (public access)
CREATE INDEX IF NOT EXISTS idx_emergency_profiles_random_id ON public.emergency_profiles(random_id) WHERE is_active = TRUE;

-- RLS on emergency_profiles
ALTER TABLE public.emergency_profiles ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own emergency profile
CREATE POLICY "patients_manage_own_emergency" ON public.emergency_profiles
  FOR ALL USING (patient_id = auth.uid());

-- Public read access via random_id (for emergency page — no auth)
-- This is handled via a public API route, not direct Supabase access

-- ============================================================
-- 2. EXTEND PROFILES — Add preferred_language
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';

-- ============================================================
-- 3. EXTEND REPORTS — Add thumbnail_path (already in types)
-- ============================================================
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

-- ============================================================
-- 4. EXTEND REPORT_ANALYSES — Add extracted_data JSONB
-- Stores structured extraction from Gemini (test values, categories)
-- ============================================================
ALTER TABLE public.report_analyses
  ADD COLUMN IF NOT EXISTS extracted_data JSONB;

-- ============================================================
-- 5. Updated_at trigger for emergency_profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_emergency_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emergency_profile_updated
  BEFORE UPDATE ON public.emergency_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_emergency_profile_timestamp();
