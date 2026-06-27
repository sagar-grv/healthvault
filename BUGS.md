# Known Bugs

## Current Status

- **2026-06-27**: Pre-launch audit completed. All known bugs fixed:
  - Missing middleware restored (`src/middleware.ts` wired to `updateSession`)
  - Auth callback open redirect fixed (validated `next` param)
  - CSRF hardened (no hardcoded prod URL, missing Origin/Referer rejection)
  - Cron cleanup secured (added `CRON_SECRET` validation)
  - Hardcoded prod URLs removed from source (use `NEXT_PUBLIC_SITE_URL`)
  - `.env.example` created with all required env vars

- **2026-06-27**: `CLOUDFLARE_ACCOUNT_ID` — build fails when this env var is not set. Root cause: likely pulled in by `@sentry/nextjs` or Turbopack. Set via `export CLOUDFLARE_ACCOUNT_ID=<your-account-id>` or add to Vercel env vars. Documented in `.env.example` and both `.env.local` files.

- **2026-05-23**: All lint errors resolved. CI pipeline fully green.
  - `admin-guard.ts` unused param — **fixed and no longer applicable** (stale entry removed).

---

_If you encounter a new bug, add it here with:_

- Date discovered
- What happens
- Expected behavior
- Root cause (once found)
- Fix status
