---
phase: 15-production-qa
plan: 03
subsystem: ui
tags: [pwa, service-worker, coppa, account-deletion, i18n]

# Dependency graph
requires:
  - phase: 15-02
    provides: QA checklist with B-02 and B-03 blockers identified

provides:
  - Fixed SW fetch handler that caches /assets/*.js for offline PWA (B-03 closed)
  - Student settings page with Account section and Delete My Account button (B-02 closed)
  - AccountDeletionModal wired to student flow with parent gate (COPPA compliance)
  - EN/HE i18n keys for account deletion UI

affects: [15-04, QA re-test of B-02 and B-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AccountDeletionModal reused from teacher flow in student settings with parent gate guard"
    - "isDevRequest flag pattern for SW to distinguish dev vs production JS requests"

key-files:
  created: []
  modified:
    - public/sw.js
    - src/pages/AppSettings.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "SW: Remove blanket .js/script/module skip; replace with isDevRequest that only excludes Vite dev patterns — production /assets/*.js now reaches cache-first handler"
  - "Bump SW cache to pianomaster-v8 to force existing SWs to drop stale v7 cache"
  - "Reuse existing parentConsentGranted state from push_subscriptions for delete gate — no new DB columns needed"
  - "Separate showDeleteParentGate state from showParentGate to keep weekend-pass and delete flows independent"

patterns-established:
  - "AccountDeletionModal can be used from student context (not just teacher) — pass user.id as student_id, display name as student_name"
  - "Parent gate (ParentGateMath) guards destructive student actions that require parental consent under COPPA"

requirements-completed: [QA-07]

# Metrics
duration: 5min
completed: 2026-03-21
---

# Phase 15 Plan 03: QA Gap Closure (B-02 + B-03) Summary

**Removed blanket JS skip from service worker enabling offline PWA, and wired AccountDeletionModal into student settings behind a COPPA parent gate**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-21T23:11:33Z
- **Completed:** 2026-03-21T23:15:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- B-03 closed: Production JS bundles (`/assets/*.js`) now reach the SW cache-first handler; offline PWA works after first load
- B-02 closed: Student settings page has an "Account" section with a "Delete My Account" button guarded by ParentGateMath (COPPA)
- AccountDeletionModal correctly receives `student_id` (user.id) and `student_name` (built from user_metadata) for the name-confirmation flow
- EN and HE i18n keys added for all new account deletion UI elements

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix B-03 -- Allow production JS bundles through SW cache** - `20e8379` (fix)
2. **Task 2: Fix B-02 -- Wire AccountDeletionModal into student settings page** - `8bb12cd` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `public/sw.js` - Removed blanket .js/script/module skip; added isDevRequest guard; bumped cache to v8
- `src/pages/AppSettings.jsx` - Added AccountDeletionModal import, state vars, handlers, Account section JSX, modal render
- `src/locales/en/common.json` - Added accountDeletionTitle, deleteAccountButton, deleteAccountDescription
- `src/locales/he/common.json` - Added matching Hebrew translations for account deletion keys

## Decisions Made
- Removed blanket `.js` / `script` / `module` destination skip from SW fetch handler and replaced with `isDevRequest` that only skips Vite-specific patterns — this is the minimal change that closes B-03 without breaking HMR
- Bumped `CACHE_NAME` from `pianomaster-v7` to `pianomaster-v8` to force existing service workers to invalidate their old cache and re-fetch with the corrected handler
- Reused `parentConsentGranted` state (from existing `push_subscriptions` query) as the gate for the delete flow — no new DB columns or queries needed; the same upsert pattern writes consent if not yet granted
- Used a separate `showDeleteParentGate` state (not the existing `showParentGate`) to keep the weekend-pass flow and delete flow fully independent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- B-02 and B-03 blockers are resolved; the 21 previously-skipped QA items can now be re-tested
- SW cache v8 will be picked up on next deploy to Netlify; existing installed PWAs will upgrade on next visit
- The full account deletion flow (name confirmation, 30-day grace period, cancel deletion) works from student perspective via the existing accountDeletionService

## Known Stubs

None - all code is fully wired. AccountDeletionModal retrieves live deletion status from `getAccountDeletionStatus()` and submits via `requestAccountDeletion()`.

---
*Phase: 15-production-qa*
*Completed: 2026-03-21*
