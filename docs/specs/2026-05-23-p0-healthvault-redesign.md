# HealthVault P0 Spec — Intelligent ABHA Companion

**Date:** 2026-05-23
**Author:** Sagar (solo dev)
**Status:** Approved for implementation

---

## Project Identity

> HealthVault is an intelligent health companion that sits ON TOP of ABHA — making government health infrastructure accessible, understandable, and useful for every Indian.

**We don't compete with ABHA. We complement it.**

---

## North Star UX Principle

> "If my grandmother can't use it, it's too complex."

| Rule                         | Meaning                                                 |
| ---------------------------- | ------------------------------------------------------- |
| Max 2 taps to any feature    | No buried menus, no nested navigation                   |
| No jargon                    | "Your sugar report" not "HbA1c Glycated Hemoglobin"     |
| Show, don't ask              | Camera scan > file picker > manual entry                |
| One action per screen        | Each screen does ONE thing clearly                      |
| Always tell what's happening | "Reading your report..." not a spinner                  |
| Forgive mistakes             | Undo, back button, confirmation for destructive actions |
| Works on first try           | No "setup" or "configure" screens                       |
| Visual over text             | Icons + colors + progress bars > walls of text          |

---

## Development Workflow

```
Local Dev (npm run dev with Docker Supabase)
  -> Build features one by one
  -> Test each feature manually + write unit tests
  -> npm run lint + npx tsc --noEmit + npm test + npm run build
      |
Feature Branch (feat/p0-core-features)
  -> Commit working code (small atomic commits)
  -> Push to GitHub
      |
CI/CD (automatic on PR)
  -> Lint -> TypeCheck -> Test -> Build -> CodeQL
      |
PR Review -> Merge to main -> Vercel auto-deploys
```

**Rule:** Never push directly to main. Always feature branch + PR + CI pass.
**Rule:** NEVER touch production Supabase. All dev on Docker local instance.

---

## P0 Features (2 Weeks)

### Feature 1: Smart Report Capture (Camera + Upload)

**What:** Single FAB button with 2 options. AI does the rest.

**User Flow:**

```
Dashboard -> Tap FAB (+)
  |
Bottom sheet:
  [camera icon] Take Photo      <- Opens camera
  [folder icon] Choose from Phone <- Opens gallery/file picker
  |
Camera Mode:
  - Live view with document guide overlay (rectangle frame)
  - "Hold steady over report" instruction
  - [Capture] button
  - Auto-detect edges, auto-crop, auto-enhance
  - "Add another page?" / "That's all"
  |
Processing: "Reading your report..." (2-3 sec)
  |
Result:
  "Blood Test Report - 15 May 2026"
  "Dr. Sharma, City Lab Diagnostics"
  [View Explanation] [Done]
```

**AI Auto-Extracts (zero user input):**

- Report name
- Date
- Doctor name
- Lab/hospital name
- Category (blood test, x-ray, prescription, etc.)
- Key values (test results with normal ranges)

**Multi-page:** "Add another page" after each capture. "That's all" merges into one report.

**Error States:**

- Blurry: "Photo is blurry. Try again?"
- Not medical: "This doesn't look like a medical report. Save anyway?"
- Can't read: "Hard to read. Try better lighting."
- Offline: "Saved! Will read when internet returns."

**Technical:**

- Browser `navigator.mediaDevices.getUserMedia()` for camera access
- Canvas-based edge detection + perspective correction
- Gemini 2.5 Flash for OCR + structured data extraction
- Supabase Storage for optimized images
- Structured data in `report_analyses` table (extended schema)
- Offline: IndexedDB queue, sync on reconnect

---

### Feature 2: AI Health Interpreter (Multi-Language + TTS)

**What:** After report scan, user taps "View Explanation" -> AI explains in their language with voice.

**User Flow:**

```
Report captured -> [View Explanation]
  |
Language selector (first time only, remembers preference):
  Hindi | English | Tamil | Telugu | Marathi | Bengali |
  Gujarati | Kannada | Malayalam | Punjabi | Odia | Assamese
  |
AI Explanation:
  "Your blood sugar (HbA1c) is 7.2%"
  "This is slightly above normal (normal: below 5.7%)"
  "This means your diabetes needs better control."
  "Talk to your doctor about adjusting medicine or diet."
  |
  [speaker icon Listen] -> TTS reads aloud in chosen language
  |
  [Ask a question] -> follow-up chat about this report
```

**Key Rules:**

- Never diagnose - always "Talk to your doctor about..."
- Use analogies: "Think of cholesterol like fat clogging a pipe"
- Highlight abnormal in RED, normal in GREEN
- Show normal range next to every value

**Technical:**

- Gemini 2.5 Flash with medical explanation system prompt
- Language stored in `profiles.preferred_language`
- Web Speech API (`speechSynthesis`) for TTS
- All 12+ Indian languages via Gemini text generation

---

### Feature 3: Emergency Medical Card

**What:** Public page with QR. No login to view. Setup in 30 seconds.

**Setup Flow:**

```
First-time: "Set up Emergency Card? Takes 30 seconds."
  |
Blood group (dropdown: A+, A-, B+, B-, O+, O-, AB+, AB-)
  |
Any allergies? [Yes/No] -> type if yes
  |
Critical conditions? [Diabetes] [Asthma] [Heart Disease] [Epilepsy] [None]
  |
Emergency contact (name + phone number)
  |
Done! QR generated.
  [Share QR] [Print QR] [Save to Home Screen]
```

**Public Page (`/emergency/[randomId]`):**

- Name, Blood group, Allergies, Conditions, Emergency Contact with [Call Now]
- HealthVault branding
- No login required to view

**Security:**

- Minimal info only (no reports, no full history)
- Unique random ID (not guessable)
- Patient can disable/delete anytime

**Technical:**

- New `emergency_profiles` table with RLS
- Public API route (no auth)
- `qrcode.react` for QR generation
- Service worker caches for offline

---

### Feature 4: PWA Setup (Install + Offline)

**What:** Installable on home screen. Offline viewing of reports and emergency card.

**Offline Capabilities:**
| Feature | Offline |
|---------|---------|
| View cached reports | Yes |
| Emergency card | Yes |
| Camera scan (queued) | Yes |
| AI explanation | Cached only |
| Upload | Queued, syncs when online |

**Technical:**

- Service worker (custom)
- `manifest.json` with icons, theme color
- IndexedDB for report cache + upload queue
- Background sync for queued uploads
- Offline banner: "You're offline. Some features need internet."

---

### Feature 5: File Optimization Pipeline

**What:** Client-side optimization before upload. Real progress. Retry on failure.

**Pipeline:**
| Step | What | Result |
|------|------|--------|
| 1 | Resize (max 1920px width) | ~70% reduction |
| 2 | Quality (JPEG 80%) | Further 50% reduction |
| 3 | Thumbnail (200px for list) | Fast list rendering |

**Numbers:**
| Original | After | Reduction |
|----------|-------|-----------|
| Phone photo 8 MB | ~400 KB | 95% |
| Phone photo 5 MB | ~300 KB | 94% |
| PDF 2 MB | 2 MB (kept) | 0% |

**Technical:**

- Canvas API: `canvas.toBlob('image/jpeg', 0.8)`
- Real progress: `XMLHttpRequest` with `upload.onprogress`
- IndexedDB queue for offline
- Exponential backoff retry (3 attempts)
- Thumbnail stored separately

---

### Feature 6: Page Load Optimization

**What:** Every page < 2 seconds on 3G.

**Changes:**
| Category | Fix |
|----------|-----|
| Lazy loading | `next/dynamic` for dialogs + heavy components |
| Fonts | Remove JetBrains Mono, reduce to 2 fonts |
| Next.js config | `optimizePackageImports` for MUI |
| Static pages | Landing + emergency card = ISR/static |
| Thumbnails | 200px in list, full on tap |
| Images | `next/image` with blur placeholder |

---

## CI/CD Fixes (Part of P0)

| #   | Fix                                              |
| --- | ------------------------------------------------ |
| 1   | Confirm GitHub secrets (SUPABASE_URL + ANON_KEY) |
| 2   | Remove Playwright workflow (no tests exist)      |
| 3   | Add branch protection on main                    |

---

## Database Migrations (Local Docker Supabase)

| Table                | Change | Purpose                                                          |
| -------------------- | ------ | ---------------------------------------------------------------- |
| `emergency_profiles` | NEW    | Blood group, allergies, conditions, emergency contact, random_id |
| `report_analyses`    | EXTEND | Add `extracted_data` JSONB column                                |
| `profiles`           | EXTEND | Add `preferred_language` column (default: 'en')                  |

---

## P1 Features (Weeks 3-4)

| #   | Feature                                                         |
| --- | --------------------------------------------------------------- |
| 7   | Family Linking (request-based mutual access, selective sharing) |
| 8   | Health Scheme Advisor (AI chat, 3-4 questions, eligibility)     |
| 9   | Policy Awareness (AI voice guidance, all languages)             |
| 10  | Health Trend Tracker (compare reports over time, charts)        |

---

## What We DON'T Build (ABHA does it)

- Health ID creation
- Record storage/locker
- Consent management
- OPD token generation
- Hospital/Doctor registration

---

## Success Metrics

| Metric                     | Target       |
| -------------------------- | ------------ |
| Scan + explanation time    | < 60 seconds |
| Emergency card setup       | < 30 seconds |
| Page load (3G)             | < 2 seconds  |
| Upload time for photo (3G) | < 5 seconds  |
| User 7-day retention       | > 40%        |
