# HealthVault

An AI-assisted health-record management project with patient/doctor interfaces, report interpretation and record-sharing workflows. Built with Next.js, React, TypeScript, Supabase and Gemini, with optional NVIDIA model fallback.

This is a software project, not a clinically validated medical service or certified medical device. AI output can be wrong and must not replace a clinician's advice.

## Implemented areas

- Patient and doctor account flows with Supabase Auth.
- Report capture/upload, report management and AI analysis routes.
- Health IDs, QR sharing, shared-report views and access logs.
- Emergency-card routes and multilingual interfaces.
- Doctor-verification workflow, admin review and database migrations.
- Security-related middleware, origin checks, RLS policies and audit tables.

The presence of these controls does not prove a deployed instance is secure or a doctor's credentials are authentic. Deployment configuration, database policies and external verification services must be checked separately.

## Architecture

```text
Next.js patient / doctor UI -> API routes -> Supabase Auth, Postgres and Storage
                                        -> Gemini / optional NVIDIA provider
```

## Local setup

Requirements: Node.js 20+, npm and a separate development Supabase environment. Use synthetic records, not real patient data.

```bash
git clone https://github.com/sagar-grv/healthvault.git
cd healthvault
npm ci
cp .env.example .env.local
```

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, server-only `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GEMINI_API_KEY` and `NEXT_PUBLIC_SITE_URL`. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development. Optional services include NVIDIA, Sentry, cron and government-data verification. Never put service-role/provider secrets in client-exposed `NEXT_PUBLIC_*` variables.

Database schema is in `supabase/migrations/`. For a disposable local environment with Docker and Supabase CLI:

```bash
npm run db:start
npm run db:reset
npm run dev
```

`db:reset` deletes/recreates the local database and applies migrations/seed data. Do not run it against a production or shared database. Set `.env.local` to the local URL/keys printed by Supabase before starting the app. Review seed scripts before use.

Open `http://localhost:3000`. The `dev:prod` script deliberately copies production settings; use plain `npm run dev` for isolated development.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The audit inspected these scripts and their source configuration; it did not rerun the complete application or certify passing tests.

## Privacy and limits

- AI interpretation sends report content/context to the configured provider. Do not describe this as on-device or zero-data-sharing.
- Provider fallback can also fail. It is not a zero-downtime promise.
- Emergency-card endpoints are intentionally accessible without login; review exactly what a user makes visible.
- Doctor-verification integrations depend on external data and configuration. They are not a guarantee of verified identity.
- The repository includes translations; translation coverage does not establish medical accuracy in each language.
- No actual product screenshots were found in this checkout. Add real redacted screenshots only after inspecting their content.

See [SECURITY.md](SECURITY.md) and [deployment flow](docs/DEPLOYMENT_FLOW.md) for further context.

## License

[MIT](LICENSE).
