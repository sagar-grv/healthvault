# Known Bugs

## Current Status

- **2026-06-23**: Local checks pass for lint, typecheck, tests, and build. The `CLOUDFLARE_ACCOUNT_ID` env var is referenced in build config but its root cause was never found. If it re-appears, run `git bisect` to find the commit that introduced the dependency. Environment-specific — works without it locally.
- **2026-06-23**: Playwright E2E is referenced in older roadmap text, but no active root `.github/workflows/playwright.yml` exists. Fix by adding real E2E coverage or keeping the roadmap honest.
- **2026-06-23**: Public/cron route hardening is in progress. `CRON_SECRET` should be configured in production once deployed.

## Watch List

- Persistent rate limiting is still needed for public emergency, signout, and verification-sensitive flows.
- Explicit `shared_reports` access should remain the primary doctor access model; broad report `is_shareable` access needs continued review.
- Sentry DSN must be added in Vercel before production monitoring is actually live.

---

When adding a bug, include:

- Date discovered
- What happens
- Expected behavior
- Root cause once known
- Fix status
