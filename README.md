# HealthVault

HealthVault is a mobile-first health records product for families managing chronic care. It helps a patient or caregiver turn scattered prescriptions, lab reports, scans, and emergency details into a doctor-ready medical timeline that can be shared safely before a visit.

The product direction is not a generic health locker. Storage is only the foundation. The core workflow is:

1. Upload or scan medical reports.
2. Review a timeline of recent medical history.
3. Prepare and share a concise doctor summary.
4. Let doctors view only shared records.
5. Keep the patient in control with access logs, revocation, emergency info, and deletion controls.

ABDM/ABHA compatibility is a future integration path. HealthVault should remain useful before official ABDM integration is complete.

## Current Stack

- Next.js App Router with React and MUI
- Supabase Auth, Postgres, RLS, and Storage
- Gemini API with NVIDIA fallback for AI-assisted report analysis
- Sentry SDK integration, pending production DSN setup
- Jest unit tests, GitHub Actions CI, CodeQL, Dependabot

## Product Areas

- Patient: report upload, medical timeline, doctor sharing, report explanation, access logs, emergency card, profile controls
- Doctor: Health ID lookup, shared patients, doctor QR, patient context, AI-assisted clinical reference
- Admin: doctor verification, patient/doctor lists, platform overview, audit-backed approval/rejection
- Trust: explicit sharing, access logs, soft delete, public emergency card with minimal data

## Local Development

```bash
npm install
npm run db:start
npm run dev:local
```

Use local Docker Supabase for development. Do not run schema changes or destructive SQL against production without explicit confirmation.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Every feature should pass lint, typecheck, unit tests, and build before user testing. The deployment flow is documented in `docs/DEPLOYMENT_FLOW.md`.

## Environment

Required at build/runtime:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GEMINI_API_KEY`

Recommended production/runtime:

- `NVIDIA_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SENTRY_DSN`
- `CRON_SECRET`

Never expose service role keys to client-side code.

## Release Discipline

- Work on `feat/*` or `fix/*` branches.
- User tests locally before PR.
- Security review before pushing.
- CI must pass before merge.
- Never merge or deploy production changes without explicit user approval.
