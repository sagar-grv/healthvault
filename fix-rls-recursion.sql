-- ============================================================
-- HealthVault: Fix RLS Infinite Recursion
-- ============================================================
-- ROOT CAUSE: Policies on `profiles` that subquery `profiles`
-- cause PostgreSQL to recurse infinitely when evaluating SELECT.
-- This breaks ALL profile reads → dashboard loop → app broken.
--
-- FIX: Create a SECURITY DEFINER function get_my_role() that
-- reads the current user's role bypassing RLS, then use it in
-- ALL policies that previously did subqueries on profiles.
--
-- SAFE TO RUN: Uses DROP IF EXISTS before every CREATE.
-- No data is modified. Safe to re-run multiple times.
-- ============================================================

-- ============================================================
-- STEP 1: Create SECURITY DEFINER helper function
-- ============================================================
-- This function reads the current authenticated user's role from
-- profiles WITHOUT triggering RLS policy evaluation (SECURITY
-- DEFINER bypasses RLS). This is the key fix.

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
-- STEP 2: Fix `profiles` table policies (THE CORE FIX)
-- These two policies subquery profiles FROM WITHIN profiles →
-- infinite recursion. Replace with get_my_role().
-- ============================================================

DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view patient basic info by health_id" ON public.profiles;

CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admin can delete any profile"
  ON public.profiles FOR DELETE
  USING (public.get_my_role() = 'admin');

-- Fixed: no longer subqueries profiles inside a profiles policy
CREATE POLICY "Doctors can view patient basic info by health_id"
  ON public.profiles FOR SELECT
  USING (
    public.get_my_role() = 'doctor'
    AND role = 'patient'
    AND health_id IS NOT NULL
  );

-- ============================================================
-- STEP 3: Fix `reports` table policies
-- ============================================================

DROP POLICY IF EXISTS "Admin can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Doctors can view shareable reports" ON public.reports;

CREATE POLICY "Admin can view all reports"
  ON public.reports FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Fixed: no longer does EXISTS(SELECT FROM profiles p ...)
CREATE POLICY "Doctors can view shareable reports"
  ON public.reports FOR SELECT
  USING (
    is_shareable = TRUE
    AND public.get_my_role() = 'doctor'
  );

-- ============================================================
-- STEP 4: Fix `doctor_profiles` table policies
-- ============================================================

DROP POLICY IF EXISTS "Admin can view all doctor profiles" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Admin can update any doctor profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Admin can verify doctors" ON public.doctor_profiles;

CREATE POLICY "Admin can view all doctor profiles"
  ON public.doctor_profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admin can update any doctor profile"
  ON public.doctor_profiles FOR UPDATE
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- STEP 5: Fix `access_logs` table policies
-- ============================================================

DROP POLICY IF EXISTS "Admin can view all access logs" ON public.access_logs;

CREATE POLICY "Admin can view all access logs"
  ON public.access_logs FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- STEP 6: Fix `search_attempts` table policies
-- ============================================================

DROP POLICY IF EXISTS "Admin can view all search attempts" ON public.search_attempts;

CREATE POLICY "Admin can view all search attempts"
  ON public.search_attempts FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- STEP 7: Fix `report_analyses` table policies (if it exists)
-- ============================================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'report_analyses'
  ) THEN
    DROP POLICY IF EXISTS "Admin can view all report analyses" ON public.report_analyses;
    EXECUTE '
      CREATE POLICY "Admin can view all report analyses"
        ON public.report_analyses FOR SELECT
        USING (public.get_my_role() = ''admin'')
    ';
  END IF;
END $$;

-- ============================================================
-- STEP 8: Fix `ai_audit_log` table policies (if it exists)
-- ============================================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'ai_audit_log'
  ) THEN
    DROP POLICY IF EXISTS "Admin can view all audit logs" ON public.ai_audit_log;
    EXECUTE '
      CREATE POLICY "Admin can view all audit logs"
        ON public.ai_audit_log FOR SELECT
        USING (public.get_my_role() = ''admin'')
    ';
  END IF;
END $$;

-- ============================================================
-- STEP 9: Fix `ai_usage` table policies (if it exists)
-- ============================================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'ai_usage'
  ) THEN
    DROP POLICY IF EXISTS "Admin can view all AI usage" ON public.ai_usage;
    EXECUTE '
      CREATE POLICY "Admin can view all AI usage"
        ON public.ai_usage FOR SELECT
        USING (public.get_my_role() = ''admin'')
    ';
  END IF;
END $$;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- After running, verify the function exists:
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'get_my_role'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verify policies on profiles no longer have inline subqueries:
SELECT policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
