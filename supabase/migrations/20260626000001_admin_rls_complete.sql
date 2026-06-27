-- ============================================================
-- Close all admin RLS gaps before real users hit the app.
-- 8 tables were missing admin policies entirely or partially.
-- Also deduplicates duplicate storage certificate policies.
-- ============================================================

-- ============================================================
-- 1. PROFILES — admin INSERT + UPDATE (SELECT + DELETE existed)
-- ============================================================
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
CREATE POLICY "Admin can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 2. DOCTOR_PROFILES — admin INSERT + DELETE (SELECT + UPDATE existed)
-- ============================================================
DROP POLICY IF EXISTS "Admin can insert doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Admin can insert doctor profiles"
  ON public.doctor_profiles FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admin can delete doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Admin can delete doctor profiles"
  ON public.doctor_profiles FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 3. REPORTS — admin DELETE (SELECT existed)
-- ============================================================
DROP POLICY IF EXISTS "Admin can delete any report" ON public.reports;
CREATE POLICY "Admin can delete any report"
  ON public.reports FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 4. SHARED_REPORTS — admin SELECT + UPDATE + DELETE (none existed)
-- ============================================================
DROP POLICY IF EXISTS "Admin can view all shares" ON public.shared_reports;
CREATE POLICY "Admin can view all shares"
  ON public.shared_reports FOR SELECT
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admin can update any share" ON public.shared_reports;
CREATE POLICY "Admin can update any share"
  ON public.shared_reports FOR UPDATE
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admin can delete any share" ON public.shared_reports;
CREATE POLICY "Admin can delete any share"
  ON public.shared_reports FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 5. UPLOAD_ATTEMPTS — admin SELECT (none existed)
-- ============================================================
DROP POLICY IF EXISTS "Admin can view upload attempts" ON public.upload_attempts;
CREATE POLICY "Admin can view upload attempts"
  ON public.upload_attempts FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 6. FAMILY_PROFILES — admin SELECT (none existed)
-- ============================================================
DROP POLICY IF EXISTS "Admin can view family profiles" ON public.family_profiles;
CREATE POLICY "Admin can view family profiles"
  ON public.family_profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 7. EMERGENCY_PROFILES — admin SELECT (none existed)
-- ============================================================
DROP POLICY IF EXISTS "Admin can view emergency profiles" ON public.emergency_profiles;
CREATE POLICY "Admin can view emergency profiles"
  ON public.emergency_profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 8. STORAGE: reports bucket — admin SELECT + DELETE (none existed)
-- ============================================================
DROP POLICY IF EXISTS "Admin can view all report files" ON storage.objects;
CREATE POLICY "Admin can view all report files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reports'
    AND public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admin can delete any report file" ON storage.objects;
CREATE POLICY "Admin can delete any report file"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'reports'
    AND public.get_my_role() = 'admin'
  );

-- ============================================================
-- 9. STORAGE: certificates bucket — deduplicate policies
-- There were two identical SELECT policies:
--   "Admin can view all certificates" (public role)
--   "admins_read_certificates" (authenticated role)
-- Keep one clean policy on authenticated (modern pattern).
-- ============================================================
DROP POLICY IF EXISTS "Admin can view all certificates" ON storage.objects;
DROP POLICY IF EXISTS "admins_read_certificates" ON storage.objects;

DROP POLICY IF EXISTS "Admin can view doctor certificates" ON storage.objects;
CREATE POLICY "Admin can view doctor certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND public.get_my_role() = 'admin'
  );
