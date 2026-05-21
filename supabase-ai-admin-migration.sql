-- Run this in Supabase SQL editor to enable AI analysis storage
-- and to set your admin account

-- 1. Create report_analyses table
CREATE TABLE IF NOT EXISTS report_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  key_findings JSONB NOT NULL DEFAULT '[]',
  abnormal_values JSONB NOT NULL DEFAULT '[]',
  medications_found JSONB NOT NULL DEFAULT '[]',
  recommendation TEXT NOT NULL DEFAULT '',
  model_used TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id)
);

-- 2. Enable RLS
ALTER TABLE report_analyses ENABLE ROW LEVEL SECURITY;

-- 3. Patients can read analyses of their own reports
CREATE POLICY "Patients read own analyses" ON report_analyses
  FOR SELECT USING (
    report_id IN (
      SELECT id FROM reports WHERE patient_id = auth.uid()
    )
  );

-- 4. Doctors can read analyses of shareable reports
CREATE POLICY "Doctors read shared analyses" ON report_analyses
  FOR SELECT USING (
    report_id IN (
      SELECT id FROM reports WHERE is_shareable = true
    )
  );

-- 5. Service role can insert/update (used by API route with service key)
-- No INSERT policy needed for anon/user — only the server-side API writes here
-- The API route uses the standard user client which is authenticated as the user,
-- so we also need an insert policy for the report owner:
CREATE POLICY "Patients insert own analyses" ON report_analyses
  FOR INSERT WITH CHECK (
    report_id IN (
      SELECT id FROM reports WHERE patient_id = auth.uid()
    )
  );

CREATE POLICY "Patients upsert own analyses" ON report_analyses
  FOR UPDATE USING (
    report_id IN (
      SELECT id FROM reports WHERE patient_id = auth.uid()
    )
  );

-- 6. Set your account as admin (replace with your actual email)
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
