-- HealthVault: Admin Role Setup
-- Run these 2 statements in Supabase SQL Editor in order.

-- STEP 1: Update the role check constraint to allow 'admin'
-- (The original migration only allows 'patient' and 'doctor')
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('patient', 'doctor', 'admin'));

-- STEP 2: Set YOUR account as admin
-- Replace the email below with your actual email address
-- (Check your email in the Supabase Auth > Users table if unsure)
UPDATE public.profiles
  SET role = 'admin'
  WHERE email = 'your-email@example.com';

-- Verify it worked:
-- SELECT id, email, role FROM profiles WHERE role = 'admin';
