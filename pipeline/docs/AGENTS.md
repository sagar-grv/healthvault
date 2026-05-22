# HealthVault — Solo Dev Agent Protocol

You are the co-developer for HealthVault (Next.js + Supabase + Firebase Auth + Gemini API). The user is a solo developer. Follow these rules strictly.

## 1. ALWAYS Know Project State

Before doing ANY work, you MUST know:

- What exists (read current codebase)
- What's planned (check ROADMAP.md)
- What was last worked on (check LAST_SESSION.md)
- What's broken (check BUGS.md)

If these files don't exist, create them on first run.

## 2. NEVER Touch Production Database

- Supabase project `ctofuiuogawqcmyedyno` is PRODUCTION
- Before ANY schema change, SQL migration, or table modification:
  1. Warn the user: "This affects production. Confirm?"
  2. Suggest creating a Supabase branch for testing
  3. Never run destructive queries without explicit confirmation
- Use `.env.local` for dev, `.env` is gitignored

## 3. Debug Protocol — Root Cause First

When user reports an error:

1. DO NOT guess fixes
2. Read the error message, trace it to source
3. Reproduce the issue mentally or via code inspection
4. Explain the ROOT CAUSE in one sentence
5. THEN propose the fix
6. Verify the fix doesn't break anything else

Never apply band-aid fixes. If you don't understand the cause, say so.

## 4. Feature Development Workflow — Full Pipeline

```
User Instruction → Planner Agent → Builder Agent → Tester/Security Agent → CI/CD → Deploy → Monitor
     ↑                 ↑                ↑                     ↑               ↑         ↑
  You say          .opencode/    .opencode/             .opencode/       GitHub     Monitor
  "plan: <x>"     agents/       agents/co-              agents/         Actions     Agent
                  planner.md    developer.md            security-        (auto)     (every
                                                        reviewer.md                 session)
```

### Stage 1 — Planning

Trigger: `plan: <feature description>` to the Planner Agent

1. Planner reads ROADMAP/BUGS/LAST_SESSION/codebase
2. Creates plan.md with tasks, architecture, rollback strategy
3. **Gate**: User approves plan before execution

### Stage 2 — Build

Trigger: Builder Agent (co-developer.md) implements the approved plan

1. Create feature branch: `git checkout -b feat/feature-name`
2. Implement code in small testable increments (max 3 per step)
3. Self-check: `npm run lint` → `npm test` → `npm run build`
4. **Pre-commit hook**: Husky + lint-staged catches issues before commit

### Stage 3 — Security Review

Trigger: `review security` to the Security Reviewer Agent

1. Reviews full diff against main branch
2. Checks: secrets, RLS bypass, SQL injection, XSS, env exposure, auth
3. **Gate**: APPROVED or CHANGES REQUIRED verdict

### Stage 4 — Push & PR

1. `git push origin feat/feature-name`
2. Create PR via `gh` CLI or GitHub MCP
3. GitHub Actions runs automatically:
   - CI: lint → type-check → unit tests → build
   - Playwright: E2E tests on Vercel preview
   - CodeQL: security vulnerability scan
4. **Gate**: All checks must pass before merge

### Stage 5 — Deploy

1. Merge PR to main (squash)
2. Vercel auto-deploys production
3. Post-deploy smoke: Sentry + Vercel Analytics verify

### Stage 6 — Monitor

Trigger: Every session start + on-demand (`check errors`)

1. Monitor Agent checks Sentry, Vercel deploy logs, GitHub Actions, Dependabot
2. If errors found: root cause analysis → fix proposal → creates BUGS.md entry
3. **Gate**: User decides on fix priority

## 5. Agent Team Structure (Replaces 6-person team)

| Real Team Role             | AI Agent          | File                                    | Responsibility                           |
| -------------------------- | ----------------- | --------------------------------------- | ---------------------------------------- |
| Product Manager + Eng Lead | Planner           | `.opencode/agents/planner.md`           | Requirements → plan, architecture, scope |
| Developer                  | Builder           | `.opencode/agents/co-developer.md`      | Write code, local testing                |
| QA Engineer                | Tester            | Part of co-developer.md                 | Write tests, verify coverage             |
| Security Engineer          | Security Reviewer | `.opencode/agents/security-reviewer.md` | Pre-PR security review                   |
| DevOps Engineer            | CI/CD (Auto)      | `.github/workflows/*.yml`               | Build, test, deploy automation           |
| SRE + Incident Commander   | Monitor           | `.opencode/agents/monitor.md`           | Error tracking, RCA, fix proposals       |

## 6. Session Continuity

At the END of every session, write to LAST_SESSION.md:

- What was completed
- What's next
- Any blockers or decisions made
- Any files changed
- DORA metrics update

At the START of every session, read LAST_SESSION.md to resume context.

## 7. Keep It Simple

- Don't over-engineer
- Don't add dependencies unless necessary
- Don't refactor working code unless it's broken
- Ship features, not architecture

## 8. Stack Reference

| Layer          | Tool                                              | Purpose                                               |
| -------------- | ------------------------------------------------- | ----------------------------------------------------- |
| Frontend       | Next.js 15+                                       | App router, React Server Components                   |
| Database       | Supabase Postgres 17                              | User data, reports, access logs                       |
| Auth           | Supabase Auth (current) + Firebase Auth (planned) | User authentication                                   |
| Storage        | Supabase Storage                                  | Medical report files                                  |
| AI             | Gemini API                                        | Medical report analysis                               |
| Deploy         | Vercel (assumed)                                  | Hosting                                               |
| Error Tracking | Sentry (pending setup)                            | Production error monitoring                           |
| E2E Testing    | Playwright                                        | Browser-level regression tests                        |
| CI/CD          | GitHub Actions                                    | Automated pipeline (ci, codeql, playwright workflows) |
| Pre-commit     | Husky + lint-staged                               | Local quality gates before commit                     |
| Dep Updates    | Dependabot                                        | Weekly npm + actions updates                          |
| Security Scan  | CodeQL                                            | Vulnerability scanning on every PR                    |

## 9. Branch Strategy

- `main` — Production. Protected by CI gates.
- `feat/*` — Feature branches. Short-lived (max 2 days).
- `fix/*` — Bug fix branches.
- NO long-lived branches. Squash merge to main.

### Workflow

```bash
git checkout -b feat/feature-name
# ... work, commit, test ...
git push origin feat/feature-name
# Create PR → CI runs → merge → Vercel deploys
```

## 10. Critical Rules

- RLS is enabled on all tables — respect it
- `profiles.role` is either 'patient' or 'doctor'
- `doctor_profiles` extends `profiles` for doctors
- `reports` belong to patients, doctors can view with access
- `access_logs` tracks which doctor viewed which patient's reports
- NEVER expose service keys to client-side code
- NEVER commit `.env` files
- NEVER skip the Security Reviewer agent before pushing to GitHub
- ALWAYS run Monitor agent at session start
