---
phase: 01-signup-flow-redesign
plan: "01"
subsystem: authentication
tags: [signup, consent, coppa, migration, cleanup]
dependency_graph:
  requires: []
  provides: [clean-signup-contract, active-account-status, birthYear-param]
  affects: [useSignup.js, App.jsx, students-table]
tech_stack:
  added: []
  patterns: [always-active-signup, year-only-dob]
key_files:
  created:
    - supabase/migrations/20260323000001_activate_suspended_consent.sql
  modified:
    - src/features/authentication/useSignup.js
    - src/App.jsx
decisions:
  - "Accept birthYear integer (not dateOfBirth Date) — store as YYYY-01-01 per D-10"
  - "account_status always 'active' at signup — no consent gate (D-13)"
  - "Remove parentEmail and refetchStatus from useAccountStatus destructure (now unused)"
metrics:
  duration: "~4 minutes"
  completed: "2026-03-23T20:35:50Z"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 2
  files_created: 1
---

# Phase 01 Plan 01: Remove Consent Gate from Signup — Summary

**One-liner:** Signup hook now accepts `birthYear` integer, stores DOB as `YYYY-01-01`, and always sets `account_status: 'active'` — no consent emails, no blocking gate.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Clean up useSignup.js — remove consent, accept birthYear, always active | ba1826e | src/features/authentication/useSignup.js |
| 2 | Remove consent pending path from App.jsx | 23d26dd | src/App.jsx |
| 3 | Create SQL migration to activate suspended_consent accounts | 3843524 | supabase/migrations/20260323000001_activate_suspended_consent.sql |

## What Was Built

**useSignup.js (Task 1)**
- Removed `import { sendParentalConsentEmail } from "../../services/consentService"` (no longer called)
- Removed `calculateIsUnder13()` helper function (unused after this change)
- Changed `mutationFn` parameter from `dateOfBirth` (Date object) to `birthYear` (integer)
- `date_of_birth` stored as `` `${birthYear}-01-01` `` (January 1st convention, D-10)
- `account_status` hardcoded to `'active'` — no conditional on age (D-13)
- Removed the `if (isUnder13 && parentEmail)` consent email block (D-05/D-11)
- Simplified `onSuccess` handler: single success toast, navigate to `/`, no `isUnder13` branching
- Return value simplified from `{ ...authData, isUnder13, parentEmail }` to `{ ...authData, parentEmail }`

**App.jsx (Task 2)**
- Removed `import ParentalConsentPending from "./components/auth/ParentalConsentPending"`
- Removed the `suspensionReason === 'consent'` render block (lines 141-151 in original)
- Removed `parentEmail` and `refetchStatus` from `useAccountStatus` destructuring (no longer used)
- Updated comment: "suspended for consent/deletion" → "suspended for deletion"
- `useAccountStatus` hook and deletion suspension path preserved intact

**SQL migration (Task 3)**
- Created `supabase/migrations/20260323000001_activate_suspended_consent.sql`
- One-way `UPDATE students SET account_status = 'active' WHERE account_status = 'suspended_consent'`
- No schema changes (`suspended_consent` enum value stays in check constraint — harmless)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `parentEmail` and `refetchStatus` from useAccountStatus destructure**
- **Found during:** Task 2 lint check
- **Issue:** After removing the consent render block, `parentEmail` and `refetchStatus` were destructured from `useAccountStatus` but never referenced — ESLint warned `no-unused-vars`
- **Fix:** Removed those two bindings from the destructure; `isSuspended`, `suspensionReason`, and `statusLoading` remain
- **Files modified:** `src/App.jsx`
- **Commit:** 23d26dd (included in Task 2 commit)

## Known Stubs

None — all data paths are wired. The signup hook writes `account_status: 'active'` unconditionally; App.jsx renders normally for all active students.

## Self-Check: PASSED

Files created/modified:
- `src/features/authentication/useSignup.js` — FOUND
- `src/App.jsx` — FOUND
- `supabase/migrations/20260323000001_activate_suspended_consent.sql` — FOUND

Commits:
- ba1826e — FOUND
- 23d26dd — FOUND
- 3843524 — FOUND

Build: PASSED (`npm run build` succeeded)
Lint: PASSED (0 errors, 0 warnings on modified files)
