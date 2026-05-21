-- HealthVault: Admin RLS Policies + AI Audit Log
-- Safe to run multiple times — uses DROP IF EXISTS before CREATE

-- ============================================================
-- ADMIN RLS POLICIES (drop first so re-runs don't error)
-- ============================================================

DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admin can view all doctor profiles" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Admin can update any doctor profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Admin can verify doctors" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Admin can view all access logs" ON public.access_logs;
DROP POLICY IF EXISTS "Admin can view all search attempts" ON public.search_attempts;
DROP POLICY IF EXISTS "Admin can view all report analyses" ON public.report_analyses;

-- Profiles: admin can read ALL
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Profiles: admin can delete any user
CREATE POLICY "Admin can delete any profile"
  ON public.profiles FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Reports: admin can read ALL
CREATE POLICY "Admin can view all reports"
  ON public.reports FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Doctor profiles: admin can read ALL
CREATE POLICY "Admin can view all doctor profiles"
  ON public.doctor_profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Doctor profiles: admin can verify/update any doctor
CREATE POLICY "Admin can update any doctor profile"
  ON public.doctor_profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Access logs: admin can read ALL
CREATE POLICY "Admin can view all access logs"
  ON public.access_logs FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Search attempts: admin can read ALL
CREATE POLICY "Admin can view all search attempts"
  ON public.search_attempts FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Report analyses: admin can read ALL (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='report_analyses') THEN
    DROP POLICY IF EXISTS "Admin can view all report analyses" ON public.report_analyses;
    CREATE POLICY "Admin can view all report analyses"
      ON public.report_analyses FOR SELECT
      USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      );
  END IF;
END $$;

-- ============================================================
-- AI AUDIT LOG TABLE
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

ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own audit log" ON public.ai_audit_log;
DROP POLICY IF EXISTS "Admin can view all audit logs" ON public.ai_audit_log;
DROP POLICY IF EXISTS "Users can insert own audit entries" ON public.ai_audit_log;

CREATE POLICY "Users can read own audit log" ON public.ai_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all audit logs" ON public.ai_audit_log
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can insert own audit entries" ON public.ai_audit_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AI RATE LIMITING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_time ON public.ai_usage(user_id, used_at);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own AI usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own AI usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Admin can view all AI usage" ON public.ai_usage;

CREATE POLICY "Users can read own AI usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage" ON public.ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all AI usage" ON public.ai_usage
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Verify everything ran:
SELECT schemaname, tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ai_audit_log', 'ai_usage')
ORDER BY tablename;
