-- ============================================================
-- Migration 004: Add is_starred to reports + reports page support
-- ============================================================

-- Add is_starred column so patients can pin important reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast starred reports query
CREATE INDEX IF NOT EXISTS idx_reports_starred
  ON public.reports(patient_id, is_starred)
  WHERE is_starred = TRUE;
