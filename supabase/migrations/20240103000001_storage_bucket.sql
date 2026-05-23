-- ============================================================
-- Migration 003: Storage Bucket + RLS Policies
-- Creates the 'reports' storage bucket and access policies.
-- This was missing from migration 001 (was created manually in prod).
-- ============================================================

-- Create reports storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,                    -- private: not publicly accessible
  10485760,                 -- 10MB max file size
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS Policies on storage.objects
-- ============================================================

-- Patients can upload to their own folder (user_id/report_id/filename)
CREATE POLICY "patients_upload_own_reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Patients can read their own files
CREATE POLICY "patients_read_own_reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Doctors can read files of patients they have access to
-- (patient must have is_shareable=true on the report)
CREATE POLICY "doctors_read_shareable_reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND public.get_my_role() = 'doctor'
    AND EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.file_path = name
        AND r.is_shareable = true
    )
  );

-- Patients can delete their own files
CREATE POLICY "patients_delete_own_reports"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Patients can update their own files (for upsert operations)
CREATE POLICY "patients_update_own_reports"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
