-- Migration 005: Performance indexes
-- Non-destructive: all indexes use IF NOT EXISTS
-- Applied: 2026-05-24

-- 1. Doctor patient search — biggest single fix
--    Every doctor search does WHERE health_id = 'HV-...' on full profiles table scan
CREATE INDEX IF NOT EXISTS idx_profiles_health_id
  ON profiles(health_id)
  WHERE health_id IS NOT NULL;

-- 2. Patient dashboard + reports page initial load
--    SELECT * FROM reports WHERE patient_id = ? ORDER BY uploaded_at DESC
CREATE INDEX IF NOT EXISTS idx_reports_patient_uploaded
  ON reports(patient_id, uploaded_at DESC);

-- 3. Doctor patient view — shareable reports
--    SELECT * FROM reports WHERE patient_id = ? AND is_shareable = true ORDER BY report_date DESC
CREATE INDEX IF NOT EXISTS idx_reports_patient_shareable
  ON reports(patient_id, is_shareable, report_date DESC);

-- 4. Patient access log page
--    SELECT * FROM access_logs WHERE patient_id = ? ORDER BY searched_at DESC
CREATE INDEX IF NOT EXISTS idx_access_logs_patient
  ON access_logs(patient_id, searched_at DESC);

-- 5. Doctor dashboard recent patients
--    SELECT * FROM access_logs WHERE doctor_id = ? ORDER BY searched_at DESC LIMIT 10
CREATE INDEX IF NOT EXISTS idx_access_logs_doctor
  ON access_logs(doctor_id, searched_at DESC);

-- 6. Doctor search rate-limit check — most impactful for search latency
--    SELECT COUNT(*) FROM search_attempts WHERE doctor_id = ? AND searched_at >= ?
CREATE INDEX IF NOT EXISTS idx_search_attempts_doctor_time
  ON search_attempts(doctor_id, searched_at DESC);

-- 7. Home dashboard recent reports (replaces starred filter)
--    SELECT * FROM reports WHERE patient_id = ? ORDER BY uploaded_at DESC LIMIT 3
--    (covered by idx_reports_patient_uploaded above, but adding partial for starred still)
CREATE INDEX IF NOT EXISTS idx_reports_patient_starred
  ON reports(patient_id, is_starred)
  WHERE is_starred = true;
