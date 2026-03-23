---
phase: 01-signup-flow-redesign
plan: "03"
subsystem: auth
tags: [react, signup, wizard, coppa, role-selection, multi-step]

# Dependency graph
requires:
  - phase: 01-signup-flow-redesign
    provides: "Plan 01 — useSignup.js accepts birthYear integer, always-active signup"
  - phase: 01-signup-flow-redesign
    provides: "Plan 02 — AgeGate (onSubmit integer year) and ParentEmailStep (onSkip prop)"
provides:
  - "SignupForm.jsx — role-first multi-step wizard (4 steps student, 2 steps teacher)"
  - "StepDots progress indicator showing step count per role"
  - "Complete back navigation for all step transitions"
affects:
  - "Phase 01 visual verification (Task 2 checkpoint)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-first wizard: role selection is Step 1, determines downstream step count"
    - "Step sequence constants (STUDENT_STEPS / TEACHER_STEPS) drive StepDots and navigation"
    - "Downstream state reset on role change prevents stale state on back-navigation"

key-files:
  created: []
  modified:
    - src/components/auth/SignupForm.jsx
    - src/components/auth/SignupForm.test.jsx

key-decisions:
  - "Role selection as Step 1 (not buried in credentials step) — D-01 to D-03"
  - "STUDENT_STEPS / TEACHER_STEPS constants drive StepDots and back-navigation logic"
  - "isUnder13 derived from birthYear integer (current year - birthYear < 13)"
  - "handleParentEmailSkip sets parentEmail null before navigating to credentials"
  - "handleBackFromCredentials checks role+isUnder13 to choose correct back target"

patterns-established:
  - "Step wizard pattern: useState('role') initial step, setStep() for all transitions"
  - "Direct role-card click navigates immediately (no Continue button needed)"

requirements-completed: [D-01, D-02, D-03, D-04, D-08, D-09, D-15]

# Metrics
duration: ~7min
completed: "2026-03-23"
---

# Phase 01 Plan 03: SignupForm Wizard — Summary

**Role-first 4-step student wizard (role, birth-year, parent-email, credentials) and 2-step teacher wizard (role, credentials) with StepDots, back navigation, and Google OAuth on credentials step**

## Status: CHECKPOINT — Awaiting Visual Verification (Task 2)

Task 1 complete and committed. Task 2 is a human-verify checkpoint requiring browser testing.

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-23T20:53:27Z
- **Task 1 completed:** 2026-03-23T20:55:00Z
- **Tasks:** 1 of 2 complete (Task 2 = checkpoint)
- **Files modified:** 2

## Accomplishments

- SignupForm.jsx fully rewritten: role-first wizard with 4-step student path and 2-step teacher path
- StepDots progress indicator (4 dots students, 2 dots teachers) using STUDENT_STEPS/TEACHER_STEPS constants
- All back navigation wired: birth-year->role, parent-email->birth-year, credentials->(role|parent-email|birth-year depending on role+age)
- Google OAuth (SocialLogin) on credentials step receives role prop
- Signup calls useSignup with birthYear integer and parentEmail string|null
- Removed dobData/dateOfBirth — replaced with birthYear integer throughout
- SignupForm.test.jsx updated: 11 real passing tests (was 1 real + 10 stubs)

## Task Commits

1. **Task 1: Rewrite SignupForm.jsx as role-first multi-step wizard** - `13b8046` (feat)

## Files Created/Modified

- `src/components/auth/SignupForm.jsx` — Complete rewrite: role-first wizard, StepDots, 4-step student path, 2-step teacher path, back navigation, Google OAuth on credentials step
- `src/components/auth/SignupForm.test.jsx` — Updated: 11 real tests replacing 1 real + 10 stubs (deviation — test update required by first-step change)

## Decisions Made

- Role selection is Step 1: clicking Student/Teacher card immediately navigates (no Continue button) — matches existing `RoleSelection.jsx` card-click pattern
- STUDENT_STEPS/TEACHER_STEPS arrays drive both StepDots count and back-navigation logic, single source of truth
- isUnder13 derived at render time from birthYear integer (not stored as boolean) — avoids stale state
- `handleParentEmailSkip` sets parentEmail to null before navigating to credentials (D-07)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated SignupForm.test.jsx to match new first step**
- **Found during:** Task 1 (after rewrite, before commit)
- **Issue:** Existing real test asserted `age-gate` is rendered on initial mount. After rewrite, first step is `role` (Student/Teacher cards). Test would fail if not updated.
- **Fix:** Updated the real test to assert role selection buttons exist on first render. Converted all 10 `.todo` stubs into 10 real passing tests covering the full wizard navigation matrix.
- **Files modified:** `src/components/auth/SignupForm.test.jsx`
- **Verification:** `npx vitest run src/components/auth/SignupForm.test.jsx` — 11 tests pass
- **Committed in:** 13b8046 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug: broken test for changed initial step)
**Impact on plan:** Required fix — test would have been silently broken after wizard rewrite. Converting stubs to real tests improves plan coverage without scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SignupForm.jsx implements complete wizard per D-01 through D-15
- AgeGate and ParentEmailStep APIs consumed correctly (integer year, onSkip prop)
- useSignup called with birthYear integer and parentEmail string|null
- Build passes, 11 tests pass, lint clean
- Ready for visual verification (Task 2 checkpoint)

---
*Phase: 01-signup-flow-redesign*
*Completed: 2026-03-23 (Task 1 complete — Task 2 checkpoint pending)*
