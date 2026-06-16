-- Soft delete support for HealthVault
-- Adds deleted_at and deletion_scheduled_at columns to profiles
-- Used for 72-hour cooldown period before permanent account deletion

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;

-- Partial index for active (non-deleted) accounts — speeds up all admin/user queries
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(id) WHERE deleted_at IS NULL;

-- Index for finding accounts scheduled for deletion (used by cleanup cron)
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled ON public.profiles(deletion_scheduled_at)
  WHERE deletion_scheduled_at IS NOT NULL AND deleted_at IS NULL;
