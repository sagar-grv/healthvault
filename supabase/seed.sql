-- ============================================================
-- HealthVault: Local Development Seed Data
-- Creates test users for local development.
-- DO NOT run this on production.
-- ============================================================
-- Note: In local Supabase, users must be created via the
-- Supabase Auth API or the local dashboard (http://localhost:54323).
-- This seed file creates profile rows for pre-seeded auth users.
--
-- To create test users, use the local Supabase dashboard:
--   http://localhost:54323 → Authentication → Users → Add user
--   patient@test.com / Test1234!  (role: patient in user metadata)
--   doctor@test.com  / Test1234!  (role: doctor in user metadata)
--
-- The handle_new_user() trigger will auto-create profiles + health IDs.
-- ============================================================

-- Alternatively you can run the app and register via the UI.
-- The registration flow at /register/patient and /register/doctor
-- will create the auth user + profile via the trigger.

SELECT 'Seed file loaded. Create test users via Supabase dashboard at http://localhost:54323 or via the app registration flow.' AS info;
