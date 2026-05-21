-- HealthVault Database Migration
-- Run this in Supabase SQL Editor to set up all tables, functions, triggers, and RLS policies

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  health_id TEXT UNIQUE, -- HV-XXXX-XXXX for patients, NULL for doctors
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for health_id lookups (doctors searching patients)
CREATE INDEX IF NOT EXISTS idx_profiles_health_id ON public.profiles(health_id) WHERE health_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================
-- 2. DOCTOR_PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_number TEXT,
  council_name TEXT,
  qualification TEXT,
  specialization TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  city TEXT,
  hpr_id TEXT, -- Future ABDM integration
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('prescription', 'lab_report', 'scan', 'discharge_summary', 'vaccination', 'other')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT NOT NULL,
  thumbnail_path TEXT,
  notes TEXT,
  report_date DATE NOT NULL,
  is_shareable BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_patient_id ON public.reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_shareable ON public.reports(patient_id, is_shareable) WHERE is_shareable = TRUE;

-- ============================================================
-- 4. ACCESS_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  reports_viewed UUID[] NOT NULL DEFAULT '{}',
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_patient ON public.access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_doctor ON public.access_logs(doctor_id);

-- ============================================================
-- 5. SEARCH_ATTEMPTS TABLE (for rate limiting & abuse detection)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.search_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  searched_health_id TEXT NOT NULL,
  found BOOLEAN NOT NULL DEFAULT FALSE,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_attempts_doctor ON public.search_attempts(doctor_id, searched_at);

-- ============================================================
-- 6. HEALTH ID GENERATION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_health_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := '2345679ABCDEFGHJKMNPQRSTUVWXYZ';
  result TEXT := '';
  i INTEGER;
  new_id TEXT;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    new_id := 'HV-' || substr(result, 1, 4) || '-' || substr(result, 5, 4);
    
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE health_id = new_id) THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- 7. TRIGGER: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
  user_health_id TEXT;
BEGIN
  -- Get role and name from user metadata (set during signup)
  user_role := NEW.raw_user_meta_data ->> 'role';
  user_name := NEW.raw_user_meta_data ->> 'full_name';
  
  -- Default to patient if role not specified
  IF user_role IS NULL OR user_role NOT IN ('patient', 'doctor') THEN
    user_role := 'patient';
  END IF;
  
  -- Generate Health ID for patients only
  IF user_role = 'patient' THEN
    user_health_id := public.generate_health_id();
  ELSE
    user_health_id := NULL;
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, role, full_name, email, phone, health_id, onboarding_complete)
  VALUES (
    NEW.id,
    user_role,
    COALESCE(user_name, ''),
    COALESCE(NEW.email, ''),
    NEW.phone,
    user_health_id,
    FALSE
  );
  
  -- Create doctor_profiles row for doctors
  IF user_role = 'doctor' THEN
    INSERT INTO public.doctor_profiles (id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_attempts ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Doctors can search patients by health_id (read name + health_id only)
CREATE POLICY "Doctors can view patient basic info by health_id"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'doctor'
    )
    AND role = 'patient'
    AND health_id IS NOT NULL
  );

-- DOCTOR_PROFILES POLICIES
-- Doctors can view and update their own profile
CREATE POLICY "Doctors can view own doctor_profile"
  ON public.doctor_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Doctors can update own doctor_profile"
  ON public.doctor_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Anyone authenticated can view doctor profiles (for display purposes)
CREATE POLICY "Authenticated users can view doctor profiles"
  ON public.doctor_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- REPORTS POLICIES
-- Patients can CRUD their own reports
CREATE POLICY "Patients can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can delete own reports"
  ON public.reports FOR DELETE
  USING (auth.uid() = patient_id);

-- Doctors can view shareable reports (when they know the patient_id from health_id search)
CREATE POLICY "Doctors can view shareable reports"
  ON public.reports FOR SELECT
  USING (
    is_shareable = TRUE
    AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'doctor'
    )
  );

-- ACCESS_LOGS POLICIES
-- Patients can view their own access logs
CREATE POLICY "Patients can view own access logs"
  ON public.access_logs FOR SELECT
  USING (auth.uid() = patient_id);

-- Doctors can view their own access history
CREATE POLICY "Doctors can view own access logs"
  ON public.access_logs FOR SELECT
  USING (auth.uid() = doctor_id);

-- Authenticated users can insert access logs (system-triggered)
CREATE POLICY "Authenticated can insert access logs"
  ON public.access_logs FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- SEARCH_ATTEMPTS POLICIES
-- Doctors can insert their own search attempts
CREATE POLICY "Doctors can insert search attempts"
  ON public.search_attempts FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- Doctors can view their own search attempts (for rate limiting check)
CREATE POLICY "Doctors can view own search attempts"
  ON public.search_attempts FOR SELECT
  USING (auth.uid() = doctor_id);

-- ============================================================
-- 10. STORAGE BUCKET
-- ============================================================
-- Note: Run this separately or via Supabase dashboard
-- Storage bucket 'reports' should be created as PRIVATE
-- with the following policies:

-- INSERT policy: Authenticated patients can upload to their own folder
-- Path format: {user_id}/{report_id}/{filename}

-- SELECT policy: 
--   - Patients can access their own files
--   - Doctors can access files for shareable reports (via signed URLs from server)

-- ============================================================
-- DONE
-- ============================================================
