# Known Bugs

## Pre-existing Lint Issues (not blocking, but should be fixed)

### `set-state-in-effect` warnings (4 instances)

- `login/page.tsx:28` — `setError()` called directly inside `useEffect`
- `DoctorAIAssistant.tsx:102` — `setHasUnread()` called directly inside `useEffect`
- `QRScannerDialog.tsx:43` — `setScanState()`, `setError()`, `setTorchOn()` called directly inside `useEffect`
- `ReportDetailDialog.tsx:82` — `handleOpen()` (which calls `setState`) called inside `useEffect`
- **Fix**: Use `useEffect` return values or move state updates to event handlers instead

### `no-explicit-any` (5 instances)

- `analyze-report/route.ts:127,136,220` — API route type safety
- `QRScannerDialog.tsx:26,129` — Scanner callback types
- `AISummaryDialog.tsx:86` — Dialog state type
- **Fix**: Replace `any` with proper TypeScript types

### `no-unused-vars` (3 instances)

- `PatientDashboardClient.tsx:317`
- `doctor-assistant/route.ts:202`
- `PatientInsightsCard.tsx:3`
- `admin-guard.ts:15`
- **Fix**: Remove or use the variables

### `no-unused-expressions` (1 instance)

- `PatientDashboardClient.tsx:317`

---

## None (critical) as of 2026-05-23

All critical issues resolved. Pre-existing lint warnings noted above for cleanup in a future tech debt pass.

If you encounter a new bug, add it here with:

- Date discovered
- What happens
- Expected behavior
- Root cause (once found)
- Fix status
