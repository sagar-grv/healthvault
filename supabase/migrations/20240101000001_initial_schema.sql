-- ============================================================
-- Migration 001: Initial Schema
-- HealthVault base tables, functions, triggers, and RLS policies
-- WITH the RLS recursion fix applied from the start.
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  health_id TEXT UNIQUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  hpr_id TEXT,
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
-- 5. SEARCH_ATTEMPTS TABLE
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
-- 6. REPORT_ANALYSES TABLE (AI caching)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  key_findings JSONB NOT NULL DEFAULT '[]',
  abnormal_values JSONB NOT NULL DEFAULT '[]',
  medications_found JSONB NOT NULL DEFAULT '[]',
  recommendation TEXT NOT NULL DEFAULT '',
  model_used TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id)
);

-- ============================================================
-- 7. AI AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT 'analyze_report',
  model_used TEXT,
  file_size_bytes BIGINT,
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_user ON public.ai_audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_flagged ON public.ai_audit_log(flagged) WHERE flagged = TRUE;

-- ============================================================
-- 8. AI USAGE TABLE (rate limiting)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_time ON public.ai_usage(user_id, used_at);

-- ============================================================
-- 9. HELPER FUNCTION: get_my_role()
-- SECURITY DEFINER bypasses RLS — avoids infinite recursion
-- in policies that need to check the current user's role.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 10. HEALTH ID GENERATION FUNCTION
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
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE health_id = new_id) THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- 11. TRIGGER: Auto-create profile on user signup
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
  user_role := NEW.raw_user_meta_data ->> 'role';
  user_name := NEW.raw_user_meta_data ->> 'full_name';

  IF user_role IS NULL OR user_role NOT IN ('patient', 'doctor') THEN
    user_role := 'patient';
  END IF;

  IF user_role = 'patient' THEN
    user_health_id := public.generate_health_id();
  ELSE
    user_health_id := NULL;
  END IF;

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

  IF user_role = 'doctor' THEN
    INSERT INTO public.doctor_profiles (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 12. UPDATED_AT TRIGGER
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

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 13. ROW LEVEL SECURITY — Enable on all tables
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. PROFILES POLICIES
-- NOTE: All role-checking policies use get_my_role() to avoid
-- infinite recursion (never subquery profiles inside profiles).
-- ============================================================

-- Own row access
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Doctors can look up patients by health_id
-- Uses get_my_role() — NOT a subquery on profiles
CREATE POLICY "Doctors can view patient basic info by health_id"
  ON public.profiles FOR SELECT
  USING (
    public.get_my_role() = 'doctor'
    AND role = 'patient'
    AND health_id IS NOT NULL
  );

-- Admin can view/delete all profiles
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admin can delete any profile"
  ON public.profiles FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 15. DOCTOR_PROFILES POLICIES
-- ============================================================
CREATE POLICY "Doctors can view own doctor_profile"
  ON public.doctor_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Doctors can update own doctor_profile"
  ON public.doctor_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can view doctor profiles"
  ON public.doctor_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can view all doctor profiles"
  ON public.doctor_profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admin can update any doctor profile"
  ON public.doctor_profiles FOR UPDATE
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 16. REPORTS POLICIES
-- ============================================================
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

-- Uses get_my_role() — NOT a subquery on profiles
CREATE POLICY "Doctors can view shareable reports"
  ON public.reports FOR SELECT
  USING (
    is_shareable = TRUE
    AND public.get_my_role() = 'doctor'
  );

CREATE POLICY "Admin can view all reports"
  ON public.reports FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 17. ACCESS_LOGS POLICIES
-- ============================================================
CREATE POLICY "Patients can view own access logs"
  ON public.access_logs FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view own access logs"
  ON public.access_logs FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Authenticated can insert access logs"
  ON public.access_logs FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Admin can view all access logs"
  ON public.access_logs FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 18. SEARCH_ATTEMPTS POLICIES
-- ============================================================
CREATE POLICY "Doctors can insert search attempts"
  ON public.search_attempts FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can view own search attempts"
  ON public.search_attempts FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Admin can view all search attempts"
  ON public.search_attempts FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 19. REPORT_ANALYSES POLICIES
-- ============================================================
CREATE POLICY "Patients read own analyses"
  ON public.report_analyses FOR SELECT
  USING (
    report_id IN (SELECT id FROM public.reports WHERE patient_id = auth.uid())
  );

CREATE POLICY "Doctors read shared analyses"
  ON public.report_analyses FOR SELECT
  USING (
    report_id IN (SELECT id FROM public.reports WHERE is_shareable = TRUE)
    AND public.get_my_role() = 'doctor'
  );

CREATE POLICY "Patients insert own analyses"
  ON public.report_analyses FOR INSERT
  WITH CHECK (
    report_id IN (SELECT id FROM public.reports WHERE patient_id = auth.uid())
  );

CREATE POLICY "Patients upsert own analyses"
  ON public.report_analyses FOR UPDATE
  USING (
    report_id IN (SELECT id FROM public.reports WHERE patient_id = auth.uid())
  );

CREATE POLICY "Admin can view all report analyses"
  ON public.report_analyses FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 20. AI_AUDIT_LOG POLICIES
-- ============================================================
CREATE POLICY "Users can read own audit log"
  ON public.ai_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit entries"
  ON public.ai_audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all audit logs"
  ON public.ai_audit_log FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 21. AI_USAGE POLICIES
-- ============================================================
CREATE POLICY "Users can read own AI usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all AI usage"
  ON public.ai_usage FOR SELECT
  USING (public.get_my_role() = 'admin');
