-- Security RLS fix: Scope report_analyses access to explicit sharing relationships
-- Also adds admin consent_logs read policy for HIPAA audit trail

-- Drop the overly permissive policy that allowed ANY doctor to read ANY shareable analysis
DROP POLICY IF EXISTS "Doctors read shared analyses" ON public.report_analyses;

-- New policy: doctors can read analyses for reports they have explicit access to
-- Access granted if:
--   1. The report is shareable (patient made it public), OR
--   2. The patient has explicitly shared with this doctor via shared_reports table
CREATE POLICY "Doctors read shared analyses" ON public.report_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_analyses.report_id
      AND (
        r.is_shareable = TRUE
        OR EXISTS (
          SELECT 1 FROM public.shared_reports sr
          WHERE sr.patient_id = r.patient_id
          AND sr.doctor_id = auth.uid()
          AND r.id = ANY(sr.report_ids)
        )
      )
    )
  );

-- Consent logs: add admin read policy for HIPAA audit trail
-- (was missing — admins need to verify consent records for compliance)
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all consent logs" ON public.consent_logs;
CREATE POLICY "Admins can view all consent logs" ON public.consent_logs
  FOR SELECT USING (public.get_my_role() = 'admin');
