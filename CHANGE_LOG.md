# HealthVault Security Audit — Change Log

> Date: 2026-06-10
> Session: Security Audit Phases 1-3
> Branch: `feat/terms-and-consent`

---

## Phase 1 — Critical (Production-Blocking)

### 1.1 Fix `searchPatient` fire-and-forget bug

**File**: `src/app/(protected)/dashboard/doctor/actions.ts:41-48`
**Before**: `.then(() => { redirect(url) })` — the `INSERT into search_attempts` was fire-and-forget.
`redirect()` throws `NEXT_REDIRECT`, which drops the unresolved Promise. The rate-limit tracking
row was never written, making `search_attempts` rate limiting ineffective.
**After**: `await supabase.from('search_attempts').insert(...)` before `redirect()`. INSERT completes
atomically.

### 1.2 Remove production SERVICE_ROLE_KEY from env file

**File**: `.env.local.prod`
**Before**: `SUPABASE_SERVICE_ROLE_KEY=eyJ...` was hardcoded in a file that could leak.
**After**: Key removed. Comment added: `# SUPABASE_SERVICE_ROLE_KEY removed — use Vercel Production env vars instead`.

---

## Phase 2 — High Priority

### 2.1 Per-route AI rate-limit buckets

**Files**:

- `src/lib/ai/guardrails.ts` — Added `AIRouteType` type, `AI_HOURLY_LIMIT_PER_ROUTE = 10` constant,
  dual rate-limit check (global 20/hr + per-route 10/hr)
- `src/app/api/doctor-assistant/route.ts` — Removed inline rate-limit copy; now calls shared `checkAIGuardrails()`
- `src/app/api/analyze-report/route.ts` — Passes `'analyze_report'` route type to guardrails
- `src/app/api/interpret-report/route.ts` — Passes `'interpret_report'` route type to guardrails
- `src/app/api/extract-report/route.ts` — Passes `'extract_report'` route type to guardrails
- `src/app/api/explain-report/route.ts` — Passes `'explain_report'` route type to guardrails

**Database**: Added `route_type TEXT NOT NULL DEFAULT 'analyze_report'` column to `ai_usage` table.
**Migration**: `20260610000002_ai_usage_route_type` (applied to production via supabase_apply_migration).

### 2.2 Report upload rate limiting

**Files**:

- `src/app/(protected)/dashboard/patient/actions.ts` — NEW. `checkUploadAllowed()` (50/hr limit),
  `recordUpload()` server actions.
- `src/app/(protected)/dashboard/patient/upload/page.tsx` — Added `checkUploadAllowed()` before upload,
  `recordUpload()` after success.
- `src/app/(protected)/dashboard/patient/PatientDashboardClient.tsx` — Same for camera capture path.

**Database**: Created `upload_attempts` table (id, user_id, uploaded_at) with RLS and index.
**Migration**: `20260610000003_upload_attempts` (applied to production via supabase_apply_migration).

### 2.3 Cleanup cron for ai_usage + ai_audit_log

**Files**:

- `src/app/api/cron/cleanup/route.ts` — NEW. `GET /api/cron/cleanup` deletes rows older than 90 days.
  Protected by `x-vercel-cron` header verification.
- `vercel.json` — Added `crons` section: `"schedule": "0 0 * * *"`, `"path": "/api/cron/cleanup"`.
  Added `maxDuration: 60` to avoid 10s default timeout for cleanup.

### 2.4 report_analyses RLS consistency — SKIPPED

**Decision**: Current RLS policies are correct. Subqueries on `reports` are necessary
because `report_analyses` has no direct `patient_id`. No changes made.

### 2.5 CSP alerting via Sentry

**File**: `src/app/api/csp-report/route.ts`
**Before**: CSP reports were accepted but silently discarded.
**After**:

- Origin/Referer validation against `NEXT_PUBLIC_SITE_URL`
- Rate limit: 10 req/min per IP (in-memory Map — appropriate for edge runtime)
- Body size limit: 10KB
- Violations captured to Sentry via `Sentry.captureMessage('CSP Violation', 'warning')`

---

## Phase 3 — Hardening

### 3.1 Stale root SQL files — DELETED

**Deleted files** (all superseded by `supabase/migrations/20240101000001_initial_schema.sql`):

- `supabase-migration.sql` — Outdated. Missing `admin` role, had infinite-recursion RLS.
- `supabase-ai-admin-migration.sql` — All content already in initial migration.
- `supabase-admin-rls-migration.sql` — All content already in initial migration.
- `fix-rls-recursion.sql` — Already applied to production (`get_my_role()` exists).

**Retained but unchanged**:

- `supabase-admin-setup.sql` — Still useful as reference for future admin UI setup.

### 3.2 Emergency rate limiter — SKIPPED

**Decision**: In-memory Map rate limiters on `csp-report` and `emergency/[id]` routes are
architecturally correct. These run on Vercel Edge Runtime where DB queries add 50-200ms latency.
The 10/min/IP threshold is appropriate for public endpoints. No changes made.

### 3.3 CSRF protections

**New file**: `src/lib/csrf.ts` — Shared `validateOrigin(request)` helper that checks
Origin/Referer header against `NEXT_PUBLIC_SITE_URL`. Returns 403 on mismatch.

**Files modified** (added import + CSRF check at top of POST handler):

- `src/app/api/analyze-report/route.ts`
- `src/app/api/interpret-report/route.ts`
- `src/app/api/extract-report/route.ts`
- `src/app/api/explain-report/route.ts`
- `src/app/api/doctor-assistant/route.ts`

**Already had CSRF**: `src/app/api/csp-report/route.ts` (was already done in Phase 2.5)

### 3.4 Profile RLS — SKIPPED

**Decision**: `UPDATE` policy on `profiles` already has `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`.
`INSERT` is trigger-based via `handle_new_user()`. No changes needed.

---

## Database Migrations Summary

| Migration ID                         | Purpose                                         | Production Status | Local File            |
| ------------------------------------ | ----------------------------------------------- | ----------------- | --------------------- |
| `20260610000001_terms_consent`       | T&C consent_logs table + profile columns        | ✅ Applied        | ✅ Exists             |
| `20260610000002_ai_usage_route_type` | Add route_type to ai_usage for per-route limits | ✅ Applied        | ✅ Created in Phase 3 |
| `20260610000003_upload_attempts`     | Upload rate-limiting table with RLS             | ✅ Applied        | ✅ Created in Phase 3 |

---

## Git Status

**Branch**: `feat/terms-and-consent`
**Base**: `main`
**New files**:

- `src/app/(protected)/dashboard/patient/actions.ts`
- `src/app/api/cron/cleanup/route.ts`
- `src/lib/csrf.ts`
- `supabase/migrations/20260610000002_ai_usage_route_type.sql`
- `supabase/migrations/20260610000003_upload_attempts.sql`

**Modified files** (our session):

- `src/app/(protected)/dashboard/doctor/actions.ts` — await fix
- `src/app/(protected)/dashboard/patient/PatientDashboardClient.tsx` — upload rate limit
- `src/app/(protected)/dashboard/patient/upload/page.tsx` — upload rate limit
- `src/app/api/analyze-report/route.ts` — route type + CSRF
- `src/app/api/csp-report/route.ts` — Sentry CSP
- `src/app/api/doctor-assistant/route.ts` — shared guardrails + CSRF
- `src/app/api/explain-report/route.ts` — route type + CSRF
- `src/app/api/extract-report/route.ts` — route type + CSRF
- `src/app/api/interpret-report/route.ts` — route type + CSRF
- `src/lib/ai/guardrails.ts` — per-route limits
- `vercel.json` — cron + maxDuration
- `.env.local.prod` — removed service key

**Deleted files**:

- `fix-rls-recursion.sql`
- `supabase-admin-rls-migration.sql`
- `supabase-ai-admin-migration.sql`
- `supabase-migration.sql`

**Not modified (from original T&C feature branch)**:

- All T&C feature files (terms page, modals, consent actions, etc.)

---

## Build Verification

```bash
npm run build
# ✓ Compiled successfully in 5.4s
# ✓ Completed runAfterProductionCompile in 635ms
# ✓ Finished TypeScript in 6.6s
# ✓ 28 routes generated
# 0 errors, 0 warnings
```
