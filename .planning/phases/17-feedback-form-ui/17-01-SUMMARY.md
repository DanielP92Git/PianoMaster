---
phase: 17
plan: "01"
subsystem: settings-ui
tags: [feedback-form, parent-gate, honeypot, cooldown, i18n, rtl, settings]
dependency_graph:
  requires:
    - "supabase/functions/send-feedback (Phase 16)"
    - "src/components/settings/ParentGateMath.jsx"
    - "src/services/supabase.js"
  provides:
    - "FeedbackForm component (four-state machine)"
    - "EN/HE feedback translation keys under pages.settings.feedback.*"
  affects:
    - "src/pages/AppSettings.jsx"
tech_stack:
  added: []
  patterns:
    - "Four-state component state machine (idle/gated/form/success)"
    - "Honeypot anti-spam with absolute-position hiding"
    - "Recursive setTimeout cooldown with cleanup on unmount"
    - "Inline error banners (not toasts) per design system"
    - "RTL via dir attribute + flex-row-reverse"
key_files:
  created:
    - src/components/settings/FeedbackForm.jsx
    - src/components/settings/FeedbackForm.test.jsx
  modified:
    - src/pages/AppSettings.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
decisions:
  - "Submit button always uses onClick={handleSubmit} (not form onSubmit) for retry button compatibility"
  - "Cooldown expiry test uses honeypot path for synchronous success + fake timer loop to avoid async complexity"
  - "ESLint __APP_VERSION__ guard extracted to variable before body object to satisfy eslint-disable placement"
metrics:
  duration_minutes: 8
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 3
  tests_added: 17
  tests_total_after: 228
  completed_date: "2026-03-23"
---

# Phase 17 Plan 01: Feedback Form UI Summary

**One-liner:** Four-state feedback form component (idle/gated/form/success) with ParentGateMath COPPA gate, honeypot anti-spam, 5-minute cooldown timer, inline error banners, and full EN/HE i18n integrated below the Logout section in AppSettings.

---

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create FeedbackForm component and i18n translation keys | 6f2e710 | FeedbackForm.jsx, en/common.json, he/common.json |
| 2 | Integrate FeedbackForm into AppSettings and create unit tests | 3339036 | AppSettings.jsx, FeedbackForm.test.jsx |

---

## What Was Built

### FeedbackForm.jsx

A self-contained `src/components/settings/FeedbackForm.jsx` component with:

**Four-state machine:**
- `idle` — centered "Send Feedback" button (MessageSquare icon, glass style)
- `gated` — ParentGateMath overlay fires fresh every time (D-01, no persistence per D-02)
- `form` — glass card with type dropdown (bug/suggestion/other), message textarea, submit button
- `success` — CheckCircle icon + thank you text + 5-minute countdown

**Anti-spam:**
- Honeypot field (`name="website"`) hidden via absolute positioning + opacity:0 (SPAM-03)
- If filled: synchronous fake success without Edge Function call, cooldown starts

**Cooldown timer (SPAM-05, D-12, D-16):**
- 300 seconds (5 minutes) tracked in React state (not localStorage, per-session only)
- Recursive `setTimeout` with cleanup on unmount (prevents stale closure warnings)
- Cooldown expiry transitions directly to idle state

**Error handling (D-13 through D-15):**
- `rate_limit` (429): friendly inline banner, no retry button
- `server` (5xx): friendly inline banner, no retry button
- `network` (throws): friendly inline banner + inline "Retry" button
- Dismiss X button clears any error banner

**Additional features:**
- Character counter showing trimmed length (Pitfall 4) with color thresholds: amber-300 at 900+, red-300 at 980+
- Submit disabled when trimmed length < 10
- `__APP_VERSION__` injected via Vite define for version field in POST body
- `animate-fadeIn` with `motion-reduce:animate-none` for reduced-motion support
- RTL: `dir` attribute on form container, `flex-row-reverse` on icon+text rows, `dir` on `<select>` (Pitfall 5)

### i18n Keys

17 keys added under `pages.settings.feedback.*` in both `en/common.json` and `he/common.json`.

### AppSettings.jsx Integration

FeedbackForm imported and rendered after the Logout div (before `AccountDeletionModal`), using the existing `isRTL` variable from the page.

### FeedbackForm.test.jsx

17 unit tests covering all 8 requirement IDs:
- FORM-01: state machine transitions (4 tests)
- FORM-02: type dropdown options
- FORM-03: character counter and submit disabled below minimum
- FORM-04: success state, cooldown decrements, cooldown expiry resets to idle
- FORM-05: rate limit banner, server error banner, network error + retry button
- SPAM-03: honeypot skips Edge Function
- SPAM-05: submit disabled when message too short
- I18N-01: RTL dir attribute
- Error dismiss clears banner

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESLint `__APP_VERSION__` no-undef false positive with inline eslint-disable**
- **Found during:** Task 1 (lint check)
- **Issue:** Inline `// eslint-disable-next-line no-undef` inside object literal was flagged as "unused directive" while the actual `__APP_VERSION__` reference was still flagged as undefined
- **Fix:** Extracted the version guard to a `const appVersion =` variable before the `supabase.functions.invoke` call, so the eslint-disable directive is on its own line
- **Files modified:** `src/components/settings/FeedbackForm.jsx`
- **Commit:** 6f2e710

**2. [Rule 1 - Bug] Cooldown expiry test with fake timers**
- **Found during:** Task 2 (test iteration)
- **Issue:** `vi.runAllTimers()` / `vi.runAllTimersAsync()` only ran one tick of the recursive setTimeout, showing "Wait 4:59" instead of expiring
- **Fix:** Test redesigned to use honeypot path (synchronous success, no async invoke) + a loop of 300x `vi.advanceTimersByTime(1000)` wrapped in `act()`. This reliably tests the mechanism without async Promise timing issues.
- **Files modified:** `src/components/settings/FeedbackForm.test.jsx`
- **Commit:** 3339036

---

## Verification Results

1. `npx vitest run src/components/settings/FeedbackForm.test.jsx` — 17/17 tests pass
2. `npx vitest run` — 228/228 tests pass (17 new + 211 existing)
3. `npm run lint` — 0 errors, 0 warnings
4. `npm run build` — build succeeds
5. `grep "feedback" src/locales/en/common.json` — 17 keys present under pages.settings.feedback
6. `grep "FeedbackForm" src/pages/AppSettings.jsx` — import and usage both present

---

## Known Stubs

None — FeedbackForm is fully wired to the Edge Function via `supabase.functions.invoke('send-feedback')`. All form fields, error states, and i18n keys are complete.

---

## Self-Check: PASSED

- [x] `src/components/settings/FeedbackForm.jsx` exists: FOUND
- [x] `src/components/settings/FeedbackForm.test.jsx` exists: FOUND
- [x] `src/pages/AppSettings.jsx` contains `FeedbackForm`: FOUND
- [x] `src/locales/en/common.json` contains `"sendFeedback": "Send Feedback"`: FOUND
- [x] `src/locales/he/common.json` contains `"sendFeedback": "שלח משוב"`: FOUND
- [x] Commit 6f2e710 exists: FOUND
- [x] Commit 3339036 exists: FOUND
