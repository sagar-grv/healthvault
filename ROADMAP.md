# HealthVault Roadmap

## Product Direction

HealthVault is becoming a trusted medical timeline and doctor-visit preparation product for families managing chronic care. The first beachhead is caregivers managing recurring records for elderly parents, diabetes, heart disease, kidney disease, pregnancy, and similar long-running care.

Core promise: **prepare and share the right medical history before a doctor visit in 60 seconds.**

## Completed

- [x] Supabase project setup and production deployment
- [x] Base schema: profiles, doctor profiles, reports, access logs, search attempts
- [x] RLS policies on core tables
- [x] Patient report upload and camera capture flow
- [x] Report viewing and AI-assisted analysis/explanation
- [x] Doctor Health ID lookup
- [x] Explicit doctor QR sharing via `shared_reports`
- [x] Patient access log and revoke flow
- [x] Doctor shared-patients view
- [x] Emergency medical card with public minimal-data page
- [x] Doctor verification and admin approval/rejection flow
- [x] Soft delete with 72-hour cancellation window
- [x] Sentry SDK installed
- [x] GitHub Actions CI, CodeQL, Dependabot, Husky/lint-staged

## Current Productization Sprint

- [ ] Replace generic health-locker positioning with family chronic-care visit preparation
- [ ] Redesign patient dashboard around actions: visit prep, upload, timeline, shares, emergency, family, trust
- [ ] Redesign doctor dashboard around shared patients, fast lookup, verification, and patient context
- [ ] Expand admin dashboard into trust operations overview
- [ ] Harden cron and public emergency routes
- [ ] Add missing E2E coverage or remove stale Playwright claims
- [ ] Add persistent rate limiting for public and verification-sensitive routes

## Next Product Sprints

### Sprint 2: Patient Product Loop

- [ ] Medical timeline grouped by report date and type
- [ ] Doctor visit pack / doctor summary
- [ ] Trust center for active shares, access logs, revoke, export/delete
- [ ] Emergency card polish
- [ ] Family profiles v1

### Sprint 3: Doctor Product Loop

- [ ] One-page doctor-facing patient context
- [ ] Recent patient contexts
- [ ] Abnormal trend preview
- [ ] AI assistant as secondary, context-aware support

### Sprint 4: Admin Trust Operations

- [ ] Doctor verification queue polish
- [ ] User search by email, Health ID, role, status
- [ ] Active shares viewer
- [ ] Access logs viewer
- [ ] AI usage and flagged audit viewer
- [ ] Deleted accounts queue
- [ ] System health page
- [ ] Admin audit log viewer

## Deferred

- [ ] Firebase Auth migration
- [ ] Native Android/iOS apps
- [ ] Offline on-device AI
- [ ] Push notifications
- [ ] Full ABDM integration
- [ ] Broad analytics dashboard

## Backlog

- [ ] Time-limited sharing backed by database expiry
- [ ] Hindi and Indian-language UX completion
- [ ] Export doctor summary as PDF
- [ ] QR scanner camera detection polish
- [ ] Sentry account and production `SENTRY_DSN`
- [ ] Sentry SDK deprecation cleanup
- [ ] Dependabot high-risk major updates
