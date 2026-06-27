# HealthVault

AI-powered medical report management for Indian patients and doctors. Upload reports, get AI-driven insights, and securely share records via a unique Health ID.

## Stack

- **Frontend**: Next.js 15+ (App Router, React Server Components)
- **Database**: Supabase (Postgres 17, RLS, Storage)
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **AI**: Gemini API (report analysis)
- **Deploy**: Vercel
- **CI/CD**: GitHub Actions, Husky + lint-staged, CodeQL

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm run build`     | Production build         |
| `npm run lint`      | ESLint check             |
| `npm run typecheck` | TypeScript check         |
| `npm test`          | Run unit tests           |
| `npm run test:e2e`  | Run Playwright E2E tests |

## Project Structure

| Path                  | Description                              |
| --------------------- | ---------------------------------------- |
| `src/app/(auth)`      | Login, register, password reset          |
| `src/app/(protected)` | Patient & doctor dashboards              |
| `src/app/api`         | API routes (reports, cron, admin)        |
| `src/components`      | Shared UI components                     |
| `src/lib`             | Utilities, Supabase client, CSRF, Gemini |
| `messages/`           | i18n translations (next-intl)            |
| `supabase/`           | Migrations, seed data                    |
| `.opencode/`          | AI development agent protocols           |

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` — Google Gemini API key for AI analysis
- `CRON_SECRET` — Shared secret for cron job authentication
- `NEXT_PUBLIC_SITE_URL` — Deployed URL (for CSRF, redirects)

## Branch Strategy

- `main` — Production. Protected by CI gates.
- `feat/*` — Feature branches. Squash merge to main.
- `fix/*` — Bug fix branches.

## Deployment

Push to `main` → Vercel auto-deploys. See `docs/DEPLOYMENT_FLOW.md` for the full workflow.
