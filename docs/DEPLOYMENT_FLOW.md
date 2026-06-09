# HealthVault — Deployment Flow

> **Default flow for EVERY feature implementation.** No exceptions.

## Overview

Every feature follows this flow. The user is the gatekeeper at two mandatory checkpoints.

```
Agent implements → Local verify → User tests → PR → CI → Merge → Vercel → User verifies production
```

---

## Step 1: Agent Implements

- Create feature branch: `feat/<feature-name>`
- Implement code in small testable increments
- Run local verification: `npm run lint` → `npx tsc --noEmit` → `npm test` → `npm run build`
- All checks must pass before proceeding

---

## Step 2: User Tests Locally

- Run `npm run dev:local`
- User interacts with the feature in dev environment
- User tells agent: **"approve"** or **"change X"**

| User Says  | Agent Action                 |
| ---------- | ---------------------------- |
| "approve"  | Proceed to Step 3            |
| "change X" | Fix issues, return to Step 2 |

**Checkpoint 1: User must approve before PR is created.**

---

## Step 3: PR & CI

- Create PR on GitHub via `gh` CLI or GitHub MCP
- GitHub Actions runs automatically:
  - Lint → Type-check → Unit tests → Build
- All checks must pass
- If CI fails: fix issues, return to Step 2

---

## Step 4: Merge & Deploy

- Squash merge PR to `main`
- Vercel auto-deploys to production
- Wait for deploy to complete

---

## Step 5: User Verifies Production

- User checks live app at `healthvault-dusky.vercel.app`
- User tells agent: **"good"** or **"rollback"**

| User Says  | Agent Action                    |
| ---------- | ------------------------------- |
| "good"     | Feature complete. Next feature. |
| "rollback" | Proceed to Step 6               |

**Checkpoint 2: User must verify on production before moving to next feature.**

---

## Step 6: Rollback (if needed)

```bash
git revert <commit-hash>
git push origin main
```

Vercel auto-redeploys the previous version.

---

## Mandatory User Checkpoints

| Checkpoint       | When                       | Gate              |
| ---------------- | -------------------------- | ----------------- |
| **Checkpoint 1** | After local dev, before PR | User must approve |
| **Checkpoint 2** | After production deploy    | User must verify  |

**Nothing goes to production without user approval.**

---

## Parallel Agents (Sprint Mode)

When running multiple features in parallel:

1. Each agent works on its own feature branch
2. Each agent completes Steps 1-2 independently
3. User reviews all features at Checkpoint 1
4. PRs created after approval
5. Merge and deploy sequentially (one at a time)
6. User verifies each on production (Checkpoint 2)

---

## Quick Reference

```bash
# Step 1: Agent implements
git checkout -b feat/feature-name
# ... implement ...
npm run lint && npx tsc --noEmit && npm test && npm run build

# Step 2: User tests
npm run dev:local
# User says "approve" or "change X"

# Step 3: PR & CI
git push origin feat/feature-name
gh pr create --title "feat: feature-name" --body "Description"
# CI runs automatically

# Step 4: Merge & Deploy
gh pr merge --squash
# Vercel auto-deploys

# Step 5: User verifies
# Check healthvault-dusky.vercel.app
# User says "good" or "rollback"

# Step 6: Rollback (if needed)
git revert <commit-hash>
git push origin main
```
