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

## In Progress

- [ ] Firebase Auth integration (Google Sign-In + Email)

## Planned

- [ ] Sentry error tracking setup (create account, add DSN)
- [ ] QR Scanner (re-enable camera detection)
- [ ] Family Profiles (manage reports for family members)

## Backlog

- [ ] Emergency QR Card (public shareable page)
- [ ] Time-limited sharing links
- [ ] Push notifications
- [ ] Hindi i18n
- [ ] Analytics dashboard
- [ ] Export reports as PDF
