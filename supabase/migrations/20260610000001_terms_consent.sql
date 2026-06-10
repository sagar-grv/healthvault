-- Add terms acceptance columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_version text;

-- Ensure consent_logs table exists with correct columns
CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL DEFAULT 'terms_of_service',
  consent_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Add any missing columns (in case table existed from prior migration)
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS consent_version text;
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS accepted_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS user_agent text;

-- Enable RLS on consent_logs (safe to run multiple times)
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop existing to avoid conflicts, then recreate)
DROP POLICY IF EXISTS "Users can read own consent logs" ON consent_logs;
CREATE POLICY "Users can read own consent logs"
  ON consent_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consent logs" ON consent_logs;
CREATE POLICY "Users can insert own consent logs"
  ON consent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted ON profiles(terms_accepted_at);
