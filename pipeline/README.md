# Solo Dev Pipeline — Production CI/CD + AI Agent Team

> **Replace a 6-person engineering team with AI agents + automation + human-in-the-loop.**
> Works with ANY tech stack. Built for solo developers, by a solo developer.

---

## What Is This?

A complete, production-grade development pipeline that any solo developer can drop into their project. It gives you:

- **4 AI agents** that act as your PM, Security Engineer, SRE, and QA
- **4 GitHub Actions workflows** for automated CI/CD + security
- **Pre-commit hooks** that catch issues before they reach Git
- **Project management docs** that keep your AI agents context-aware
- **A config file** (`pipeline.json`) that tells all agents about your stack

All from a single command: `.\pipeline\setup.ps1`

---

## Quick Start

```powershell
# 1. Copy the pipeline folder into your project root
# 2. Run setup — it asks about your stack and generates everything
.\pipeline\setup.ps1

# 3. Install dependencies
npm install --save-dev husky lint-staged prettier
npx husky init

# 4. Push to GitHub — CI/CD activates automatically
git push origin main
```

That's it. 10 minutes and you have a production pipeline.

---

## 📁 Structure

```
your-project/
├── pipeline.json              ← Config — all agents read this
├── AGENTS.md                  ← Solo Dev Agent Protocol
├── ROADMAP.md                 ← Feature tracker
├── BUGS.md                    ← Bug tracker
├── LAST_SESSION.md            ← Session continuity
│
├── .github/
│   ├── dependabot.yml         ← Weekly dependency updates
│   └── workflows/
│       ├── ci.yml             ← lint → typecheck → test → build
│       ├── codeql.yml         ← Security vulnerability scan
│       └── playwright.yml     ← E2E tests on preview
│
├── .opencode/agents/
│   ├── planner.md             ← PM + Engineering Lead
│   ├── security-reviewer.md   ← Security Engineer
│   ├── monitor.md             ← SRE + Incident Commander
│   └── co-developer.md        ← Developer (Builder)
│
└── .husky/pre-commit          ← Pre-commit quality gate
```

---

## 🔄 The Pipeline Flow

```
You say "plan: <feature>"
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ ① PLANNER AGENT (planner.md)                                     │
│   Reads ROADMAP/BUGS → writes plan.md → User approves            │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ ② BUILDER AGENT (co-developer.md)                                │
│   Creates feat/xxx branch → implements → lint/test/build         │
│   Pre-commit: Husky catches issues before commit                 │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ ③ SECURITY REVIEWER (security-reviewer.md)                       │
│   Reviews diff for secrets, injection, XSS, auth, env exposure   │
│   Verdict: APPROVED or CHANGES REQUIRED                          │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ ④ GITHUB ACTIONS (CI/CD — automated)                             │
│   ┌──────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌──────────┐    │
│   │  Lint    │ │ Type   │ │ Tests │ │ CodeQL │ │ Playwright│   │
│   │          │ │ Check  │ │       │ │Security│ │   E2E    │    │
│   └──────────┘ └────────┘ └───────┘ └────────┘ └──────────┘    │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ ⑤ AUTO-DEPLOY                                                    │
│   Merge PR → main → Deploys → Monitoring verifies                │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ ⑥ MONITOR AGENT (monitor.md)                                     │
│   Every session: checks health, CI/CD, dependencies, bugs        │
│   If errors: root cause analysis → BUGS.md → fix PR             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI Agent Team (Replaces 6 People)

| Real Team Role             | AI Agent              | How to Invoke                  | What It Does                                                 |
| -------------------------- | --------------------- | ------------------------------ | ------------------------------------------------------------ |
| Product Manager + Eng Lead | **Planner**           | Say `plan: <feature>`          | Reads state → writes plan with tasks, architecture, rollback |
| Developer                  | **Builder**           | (default agent)                | Writes code, runs tests, commits                             |
| QA Engineer                | **Builder**           | `npm test` after build         | Ensures test coverage                                        |
| Security Engineer          | **Security Reviewer** | Say `review security`          | 10-category security audit → APPROVED or CHANGES REQUIRED    |
| DevOps Engineer            | **GitHub Actions**    | Auto on PR                     | CI pipeline + CodeQL + E2E                                   |
| SRE + Incident Commander   | **Monitor**           | Session start + `check errors` | Checks health, RCA, updates BUGS.md, tracks DORA metrics     |

---

## 🔧 Setup Options

### Interactive Mode (Recommended)

```powershell
.\pipeline\setup.ps1
```

Answers 15-20 questions about your project. Takes ~5 minutes.

### Headless Mode (CI / Reproducible)

```powershell
# Create a config file, then:
.\pipeline\setup.ps1 -ConfigFile my-project.json -Force
```

See `pipeline\template\pipeline.json` for the expected format.

### HealthVault Reference

This pipeline was built for **[HealthVault](https://github.com/sagar-grv/healthvault)** — a medical report management platform. The project root files (`.github/`, `.opencode/agents/`, etc.) are a **live example** of what setup.ps1 generates. Use them as a reference.

---

## What setup.ps1 Asks You

| Category       | Questions                                                 | Example Default              |
| -------------- | --------------------------------------------------------- | ---------------------------- |
| **Project**    | Name, description                                         | "MyApp", "A web application" |
| **Frontend**   | Next.js, Vite, Nuxt, SvelteKit, Remix                     | Next.js 15+                  |
| **Database**   | Supabase, Firebase, MongoDB, PostgreSQL, SQLite           | Supabase Postgres            |
| **Auth**       | Supabase Auth, Firebase Auth, Clerk, Auth0, NextAuth      | Supabase Auth                |
| **AI**         | Gemini, OpenAI, Claude, or none                           | Optional                     |
| **Deploy**     | Vercel, Netlify, Fly.io, Railway, Cloudflare, self-hosted | Vercel                       |
| **E2E**        | Playwright, Cypress, or none                              | Playwright                   |
| **Monitoring** | Sentry, LogRocket, Datadog, PostHog, or none              | Sentry                       |
| **CI/CD**      | Node version, package manager, build/test/lint commands   | 20, npm, npm run build       |
| **Database**   | Project ID, region, RLS toggle                            | —                            |
| **GitHub**     | Username, repo name                                       | —                            |
| **Vercel**     | Project ID for preview deployments                        | —                            |
| **Secrets**    | Build-time env vars for GitHub Actions                    | —                            |

---

## 🔐 Required GitHub Secrets

After pushing to GitHub, add these in **Settings → Secrets and variables → Actions**:

| Secret                                               | Value                       |
| ---------------------------------------------------- | --------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` (or your public URL)      | From your project dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or your public key) | From your project dashboard |

Any custom env vars you specified during setup also need their secrets added.

---

## 📊 DORA Metrics

| Metric              | How to Track                  | Solo Dev Target |
| ------------------- | ----------------------------- | --------------- |
| Deploy Frequency    | Deploy platform logs          | Multiple/week   |
| Lead Time           | Plan → merged PR time         | < 1 day         |
| Change Failure Rate | Errors / deploys (monitoring) | < 15%           |
| MTTR                | Error → fix deployed          | < 1 hour        |

Tracked by the Monitor Agent at every session start.

---

## 🛡️ Security Gates (Staged)

| Gate                                 | What It Catches                                                | When              | Who      |
| ------------------------------------ | -------------------------------------------------------------- | ----------------- | -------- |
| Husky pre-commit                     | Secrets in staged files, lint errors, type errors              | `git commit`      | 💻 Local |
| Security Reviewer                    | RLS bypass, SQL injection, XSS, env exposure, auth bugs        | `review security` | 🤖 AI    |
| CI (lint → typecheck → test → build) | Code quality, broken tests, build failures                     | PR created        | ⚙️ Auto  |
| CodeQL                               | 100+ vulnerability classes (injection, crypto, path traversal) | PR + main         | ⚙️ Auto  |
| Dependabot                           | Vulnerable npm/GitHub Actions dependencies                     | Weekly            | ⚙️ Auto  |
| Monitor Agent                        | Error trends, performance regression, bug debt                 | Every session     | 🤖 AI    |

---

## 🤖 How AI Agents Work

All agents read `pipeline.json` at session start to understand your project:

```json
{
  "project": { "name": "MyApp", "description": "..." },
  "stack": {
    "frontend": "Next.js 15+",
    "database": "Supabase Postgres",
    "auth": "Supabase Auth",
    "deploy": "Vercel"
  },
  "ci": {
    "buildCommand": "npm run build",
    "testCommand": "npm test"
  }
}
```

This makes the agents **fully stack-agnostic**. A single agent file works for Next.js + Supabase, React + Firebase, SvelteKit + MongoDB — any combination.

### How Agents Adapt

| Agent                 | Adapts to                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Planner**           | Reads DB type → warns about migrations. Checks stack → suggests appropriate architecture                      |
| **Security Reviewer** | Reads DB type → checks RLS (Supabase) or Firestore Rules (Firebase). Reads auth → checks auth patterns        |
| **Monitor**           | Reads deploy platform → checks deploy logs. Reads monitoring → checks error tracker. Reads GitHub → checks CI |
| **Builder**           | Reads build/lint/test commands → runs the right ones                                                          |

---

## 🔧 Commands

```bash
npm run lint        # ESLint / linter
npm run typecheck   # TypeScript check
npm test            # Run tests
npm run build       # Build project
npm run format      # Prettier format
```

Pre-commit hook runs `lint-staged` automatically on `git commit`.

---

## 📝 License

Free to use, modify, and share. Built for the solo developer community.

Made by following the [Solo Dev Agent Protocol](AGENTS.md) — the same system that built this pipeline.
