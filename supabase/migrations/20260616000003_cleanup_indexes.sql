-- Remove duplicate database indexes
-- These duplicates were created when initial schema and performance_indexes migration
-- both defined the same indexes. Keeping only the performance_indexes versions which
-- include additional columns for better query coverage.

-- Duplicate 1: idx_profiles_health_id (initial_schema) vs idx_profiles_health_id (performance_indexes)
-- Keep the performance_indexes version (has same definition but added later)
DROP INDEX IF EXISTS public.idx_profiles_health_id;

-- Duplicate 2: idx_access_logs_patient (initial_schema: patient_id)
-- vs idx_access_logs_patient (performance_indexes: patient_id, searched_at DESC)
DROP INDEX IF EXISTS public.idx_access_logs_patient;

-- Duplicate 3: idx_access_logs_doctor (initial_schema: doctor_id)
-- vs idx_access_logs_doctor (performance_indexes: doctor_id, searched_at DESC)
DROP INDEX IF EXISTS public.idx_access_logs_doctor;

-- Duplicate 4: idx_reports_starred (add_starred_reports.sql)
-- vs idx_reports_patient_starred (performance_indexes.sql)
-- Keep idx_reports_patient_starred (has patient_id prefix for better selectivity)
DROP INDEX IF EXISTS public.idx_reports_starred;
