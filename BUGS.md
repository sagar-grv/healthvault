# Known Bugs

## Current Status

- **2026-05-23**: All lint errors resolved (9 files fixed). CI pipeline fully green.
- `admin-guard.ts:15` — `_path` function param unused (lint _warning_ only, does not block CI).

- **2026-06-15**: `CLOUDFLARE_ACCOUNT_ID` missing — build fails when this env var is not set. Set via `export CLOUDFLARE_ACCOUNT_ID=<your-account-id>`. Root cause: TBD. Fix status: pending.

---

_If you encounter a new bug, add it here with:_

If you encounter a new bug, add it here with:

- Date discovered
- What happens
- Expected behavior
- Root cause (once found)
- Fix status
