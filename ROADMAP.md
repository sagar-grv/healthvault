# HealthVault Roadmap

## Completed

- [x] Supabase project setup (ctofuiuogawqcmyedyno)
- [x] Database schema: profiles, doctor_profiles, reports, access_logs, search_attempts
- [x] RLS policies on all tables
- [x] Supabase MCP configured and working
- [x] Firebase MCP configured and working
- [x] Gemini API integration for medical report analysis
- [x] Patient report upload flow
- [x] Doctor patient search by Health ID
- [x] Report viewing with AI analysis
- [x] Access control (doctor can only view with permission)
- [x] Mobile responsive design
- [x] Doctor AI Assistant
- [x] Local Supabase Docker dev environment
- [x] Production deployment on Vercel
- [x] GitHub repo connected with auto-deploy

### CI/CD Pipeline (Industry Standard)

- [x] Dependabot — weekly dependency updates
- [x] GitHub Actions CI — lint → type-check → test → build
- [x] CodeQL — automated security vulnerability scanning
- [x] Playwright E2E — browser tests on Vercel preview deployments
- [x] Pre-commit hooks — Husky + lint-staged (shift-left quality)

### AI Agents (Replaces 6-person team)

- [x] Planner Agent — product manager + eng lead (`.opencode/agents/planner.md`)
- [x] Security Reviewer Agent — security engineer (`.opencode/agents/security-reviewer.md`)
- [x] Monitor Agent — SRE + incident commander (`.opencode/agents/monitor.md`)

### Infrastructure & Security

- [x] Sentry `@sentry/nextjs` SDK installed + configured (env-var DSN)
- [x] Branch protection — 1 review + CI + CodeQL + admin enforcement
- [x] GitHub Secrets — Supabase URL + anon key + Vercel project ID
- [x] CodeQL path filter widened (root `.ts` files)
- [x] Playwright E2E — Vercel preview URL via secret
- [x] Dependabot safe PRs merged (ts-jest, supabase-js, react, setup-node)
- [x] `src/.env.local.example` docs for all env vars

## In Progress

- [ ] Firebase Auth integration (Google Sign-In + Email)

## Planned

- [ ] **Sentry Account**: Create account at sentry.io → add `SENTRY_DSN` to Vercel env vars → monitoring goes live
- [ ] QR Scanner (re-enable camera detection)
- [ ] Family Profiles (manage reports for family members)

## Backlog

- [ ] Dependabot high-risk PRs: eslint v10, typescript v6, @types/node v25, codeql v4, checkout v6
- [ ] Emergency QR Card (public shareable page)
- [ ] Time-limited sharing links
- [ ] Push notifications
- [ ] Hindi i18n
- [ ] Analytics dashboard
- [ ] Export reports as PDF
- [ ] Sentry SDK deprecation cleanup: `disableLogger` → `treeshake.removeDebugLogging`, `automaticVercelMonitors` → `webpack.*`
