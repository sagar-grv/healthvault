-- Add route_type column to ai_usage for per-route rate limiting
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS route_type TEXT NOT NULL DEFAULT 'analyze_report';

-- Index for per-route rate limit queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_route_time ON ai_usage (user_id, route_type, used_at);
