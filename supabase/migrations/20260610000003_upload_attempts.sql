-- Create upload_attempts table for upload rate limiting
CREATE TABLE IF NOT EXISTS upload_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate limit queries (user + time window)
CREATE INDEX IF NOT EXISTS idx_upload_attempts_user_time ON upload_attempts (user_id, uploaded_at);

-- Enable RLS
ALTER TABLE upload_attempts ENABLE ROW LEVEL SECURITY;

-- RLS: users can only see their own attempts
CREATE POLICY "Users can read own upload attempts"
  ON upload_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: users can only insert their own attempts
CREATE POLICY "Users can insert own upload attempts"
  ON upload_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
