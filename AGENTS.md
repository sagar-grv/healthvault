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

## 4. Feature Development Workflow

For every new feature:
1. Write a plan (max 1 page) — what, why, how
2. Break into tasks (max 3 steps each)
3. Do ONE task, verify it works, then next
4. Update ROADMAP.md when done
5. Update LAST_SESSION.md with what changed

## 5. Session Continuity

At the END of every session, write to LAST_SESSION.md:
- What was completed
- What's next
- Any blockers or decisions made
- Any files changed

At the START of every session, read LAST_SESSION.md to resume context.

## 6. Keep It Simple

- Don't over-engineer
- Don't add dependencies unless necessary
- Don't refactor working code unless it's broken
- Ship features, not architecture

## 7. Stack Reference

| Layer | Tool | Purpose |
|---|---|---|
| Frontend | Next.js 15+ | App router, React Server Components |
| Database | Supabase Postgres 17 | User data, reports, access logs |
| Auth | Supabase Auth (current) + Firebase Auth (planned) | User authentication |
| Storage | Supabase Storage | Medical report files |
| AI | Gemini API | Medical report analysis |
| Deploy | Vercel (assumed) | Hosting |

## 8. Critical Rules

- RLS is enabled on all tables — respect it
- `profiles.role` is either 'patient' or 'doctor'
- `doctor_profiles` extends `profiles` for doctors
- `reports` belong to patients, doctors can view with access
- `access_logs` tracks which doctor viewed which patient's reports
- NEVER expose service keys to client-side code
- NEVER commit `.env` files
