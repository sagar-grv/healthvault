# Last Session — June 28, 2026

## Completed

- **Camera capture stuck after photo — FIXED (PR #80 + #81 merged)**: Two root causes:
  1. `setDetecting(true)` ran unconditionally but `setDetecting(false)` was trapped inside `if(blob)` guard — null blob or exceptions left buttons permanently disabled.
  2. `toBlob()` callbacks silently failed on large canvases (1920x2560) — no timeout, no recovery.
  3. `perspectiveCrop` + `detectDocumentCorners` blocked main thread for 10-30s on mobile.
  4. "Try Again" button only called `startCamera()`, didn't reset `stage` back to camera.
- **Fixes applied**: try/catch around capturePhoto, 5s toBlob timeout, 1024px resolution cap (4x faster), `resetCapture()` that clears ALL state, acceptPage error sets stage=camera, fallback to raw image if cropped toBlob fails, pointerEvents:none on detecting overlay, video element always mounted (prevents black screen on retake).
- **Camera Permissions-Policy fix (PR #79)**: `camera=()` → `camera=(self)` in next.config.mjs.
- **Pre-launch audit completed**: 23 issues found across security, UI/UX, i18n, code quality.

## Files Changed

- `src/components/patient/CameraCapture.tsx` — 3 rounds of fixes (PR #80, #81)
- `next.config.mjs` — line 33: `camera=()` → `camera=(self)`

## What We Learned

- Always check server-side headers (Permissions-Policy, CSP) before writing client-side camera fixes.
- `canvas.toBlob()` callback can silently fail on large canvases — always wrap in Promise with timeout.
- Synchronous pixel processing (perspectiveCrop, detectDocumentCorners) blocks the main thread — cap image resolution before processing.
- When recovering from error, must reset ALL state (stage, corners, URLs, error, detecting) — not just restart camera.
- AI systems (Gemini) are NOT called during camera capture flow — the hang is purely client-side canvas operations.

## Next

- **Wave 3**: Pagination (access log, patient list), ThemeProvider cleanup, password policy enforcement, FK constraints, dedup types, tsconfig strict, validation patterns
- **Wave 4**: Low-priority polish (stale BUGS entries, unused deps, page metadata)

## Blocker

- None
