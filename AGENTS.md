# HealthVault — Solo Dev Agent Protocol

You are the co-developer for HealthVault (Next.js + Supabase + Firebase Auth + Gemini API). The user is a solo developer. Follow these rules strictly.

## 1. ALWAYS Know Project State

Before doing ANY work, you MUST know:

- What exists (read current codebase)
- What's planned (check ROADMAP.md)
- What was last worked on (check LAST_SESSION.md)
- What's broken (check BUGS.md)

If these files don't exist, create them on first run.

## 2. NEVER Merge to Production Without User Approval

- **NEVER** create PRs, merge PRs, or push to `main` without explicit user approval
- **NEVER** relax branch protection and merge silently — user must test locally first
- The deployment flow has TWO mandatory user checkpoints:
  1. **After local dev**: User tests features on `localhost` → approves → THEN create PR
  2. **After PR + CI green**: User reviews PR → approves → THEN merge
- If CI is green but user hasn't tested, WAIT. Do not auto-merge.
- Dependabot PRs: Ask user before merging, even if CI passes
- **This overrides everything. No exceptions.**

## 3. NEVER Touch Production Database

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

> **MANDATORY:** Every feature follows the deployment flow in `docs/DEPLOYMENT_FLOW.md`.
> The user has TWO mandatory checkpoints: (1) after local dev, (2) after production deploy.
> Nothing goes to production without user approval.

```
User Instruction → Planner Agent → Builder Agent → User Tests → PR → CI → Merge → Vercel → User Verifies
     ↑                 ↑                ↑              ↑          ↑     ↑        ↑           ↑
  You say          .opencode/    .opencode/        YOU TEST    GitHub  Auto   Vercel    YOU VERIFY
  "plan: <x>"     agents/       agents/co-        locally     CLI    green  auto      production
                  planner.md    developer.md      dev env             merge  deploy
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

### Stage 5 — User Reviews PR

1. **USER reviews the PR and tests on Vercel preview**
2. **USER explicitly approves**: "merge it" / "approve" / "ship it"
3. **Only THEN** merge PR to main (squash)
4. Vercel auto-deploys production
5. Post-deploy smoke: Sentry + Vercel Analytics verify

### Stage 5a — Deploy (REQUIRES USER APPROVAL)

> **CRITICAL**: Do NOT merge PRs without user saying "merge", "approve", "ship", or similar explicit approval.
> CI being green is NOT approval. The user must test and approve.

### Stage 6 — Monitor

Trigger: Every session start + on-demand (`check errors`)

1. Monitor Agent checks Sentry, Vercel deploy logs, GitHub Actions, Dependabot
2. If errors found: root cause analysis → fix proposal → creates BUGS.md entry
3. **Gate**: User decides on fix priority

## 5. Agent Team Structure (Replaces 6-person team)

### Core Development Agents

| Real Team Role             | AI Agent          | File                                    | Responsibility                           |
| -------------------------- | ----------------- | --------------------------------------- | ---------------------------------------- |
| Product Manager + Eng Lead | Planner           | `.opencode/agents/planner.md`           | Requirements → plan, architecture, scope |
| Developer                  | Builder           | `.opencode/agents/co-developer.md`      | Write code, local testing                |
| QA Engineer                | Tester            | Part of co-developer.md                 | Write tests, verify coverage             |
| Security Engineer          | Security Reviewer | `.opencode/agents/security-reviewer.md` | Pre-PR security review                   |
| DevOps Engineer            | CI/CD (Auto)      | `.github/workflows/*.yml`               | Build, test, deploy automation           |
| SRE + Incident Commander   | Monitor           | `.opencode/agents/monitor.md`           | Error tracking, RCA, fix proposals       |

### Multi-Model Pipeline Agents (Decoupled AI Stages)

| Pipeline Stage | AI Agent        | File                                  | NVIDIA Model                                                                                      | Responsibility                                            |
| -------------- | --------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Stage 1        | UX Psychologist | `.opencode/agents/ux-psychologist.md` | `deepseek-ai/deepseek-r1`                                                                         | Validate user flow for cognitive friction before planning |
| Stage 2        | Architect       | `.opencode/agents/architect.md`       | `z-ai/glm-5.1` (primary), `moonshotai/kimi-k2.6` (fallback)                                       | Map DB→API→Frontend dependency order before coding        |
| Stage 3        | Layout Engineer | `.opencode/agents/layout-engineer.md` | `qwen/qwen-2.5-coder-32b-instruct` (primary), `nvidia/llama-3.3-nemotron-70b-instruct` (fallback) | Spatial-aware frontend refactoring without breaking state |

### Pipeline Integration with Feature Workflow

```
"plan: <feature>"
  → Stage 1: UX Psychologist validates flow (deepseek-r1)     [GATE: PASS/REVISE]
  → Stage 2: Architect maps dependencies (glm-5.1)            [GATE: LOW/MEDIUM/HIGH risk]
  → Planner creates plan from validated flow + dependency map
  → Builder implements in dependency order
  → Stage 3: Layout Engineer refactors UI (qwen-2.5-coder)     [IF NEEDED]
  → Security Reviewer audits before push
  → CI/CD runs on push
  → User approves → merge → deploy
```

### Pipeline Code

All pipeline model routing is in `src/lib/ai/multi-model-pipeline.ts`:

- `callThoughtAI(productContext, currentUserFlow, proposedFlow)` — Stage 1
- `callArchAI(techStack, approvedFlow, dbSchema, apiRoutes, frontendCoupling)` — Stage 2
- `callLayoutAI(currentLayoutMap, desiredLayoutMap, componentCode)` — Stage 3

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

- **NEVER merge PRs to main without explicit user approval ("merge"/"approve"/"ship")**
- RLS is enabled on all tables — respect it
- `profiles.role` is either 'patient' or 'doctor'
- `doctor_profiles` extends `profiles` for doctors
- `reports` belong to patients, doctors can view with access
- `access_logs` tracks which doctor viewed which patient's reports
- NEVER expose service keys to client-side code
- NEVER commit `.env` files
- NEVER skip the Security Reviewer agent before pushing to GitHub
- ALWAYS run Monitor agent at session start
- **ALWAYS follow `docs/DEPLOYMENT_FLOW.md` for every feature**
