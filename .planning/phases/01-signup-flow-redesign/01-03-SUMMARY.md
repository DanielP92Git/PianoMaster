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
  - "Toast fix: success message no longer references email confirmation"
affects:
  - "Any future auth flow changes must preserve the role-first wizard pattern"

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
    - src/features/authentication/useSignup.js
    - src/components/auth/ParentEmailStep.test.jsx

key-decisions:
  - "Role selection as Step 1 (not buried in credentials step) — D-01 to D-03"
  - "STUDENT_STEPS / TEACHER_STEPS constants drive StepDots and back-navigation logic"
  - "isUnder13 derived from birthYear integer (current year - birthYear < 13)"
  - "handleParentEmailSkip sets parentEmail null before navigating to credentials"
  - "handleBackFromCredentials checks role+isUnder13 to choose correct back target"
  - "Removed misleading email confirmation toast — accounts are immediately active (D-13)"

patterns-established:
  - "Step wizard pattern: useState('role') initial step, setStep() for all transitions"
  - "Direct role-card click navigates immediately (no Continue button needed)"

requirements-completed: [D-01, D-02, D-03, D-04, D-08, D-09, D-15]

# Metrics
duration: ~10min
completed: "2026-03-24"
---

# Phase 01 Plan 03: SignupForm Wizard Rewrite Summary

**Role-first 4-step student wizard (role, birth-year, parent-email, credentials) and 2-step teacher wizard (role, credentials) with StepDots, back navigation, and Google OAuth on credentials step**

## Performance

- **Duration:** ~10 min (including checkpoint verification)
- **Started:** 2026-03-23T20:53:27Z
- **Completed:** 2026-03-23T22:33:36Z
- **Tasks:** 2 of 2 complete
- **Files modified:** 4

## Accomplishments

- SignupForm.jsx fully rewritten: role-first wizard with 4-step student path and 2-step teacher path
- StepDots progress indicator (4 dots students, 2 dots teachers) using STUDENT_STEPS/TEACHER_STEPS constants
- All back navigation wired: birth-year->role, parent-email->birth-year, credentials->(role|parent-email|birth-year depending on role+age)
- Google OAuth (SocialLogin) on credentials step receives role prop
- Signup calls useSignup with birthYear integer and parentEmail string|null
- SignupForm.test.jsx updated: 11 real passing tests (was 1 real + 10 stubs)
- Removed misleading email confirmation toast from useSignup.js success handler
- Visual verification approved: all signup flow paths (student under-13, student 13+, teacher) working correctly

## Task Commits

1. **Task 1: Rewrite SignupForm.jsx as role-first multi-step wizard** - `13b8046` (feat)
2. **Task 2: Visual verification checkpoint** - approved by user
3. **Post-checkpoint fix: Remove misleading toast + fix test placeholder** - `7a5ed27` (fix)

## Files Created/Modified

- `src/components/auth/SignupForm.jsx` -- Complete rewrite: role-first wizard, StepDots, 4-step student path, 2-step teacher path, back navigation, Google OAuth on credentials step
- `src/components/auth/SignupForm.test.jsx` -- Updated: 11 real tests replacing 1 real + 10 stubs (deviation -- test update required by first-step change)
- `src/features/authentication/useSignup.js` -- Removed misleading "Please check your email to confirm your account" from success toast (accounts are immediately active per D-13)
- `src/components/auth/ParentEmailStep.test.jsx` -- Fixed placeholder text assertion to match actual component

## Decisions Made

- Role selection is Step 1: clicking Student/Teacher card immediately navigates (no Continue button) -- matches existing RoleSelection.jsx card-click pattern
- STUDENT_STEPS/TEACHER_STEPS arrays drive both StepDots count and back-navigation logic, single source of truth
- isUnder13 derived at render time from birthYear integer (not stored as boolean) -- avoids stale state
- handleParentEmailSkip sets parentEmail to null before navigating to credentials (D-07)
- Removed email confirmation toast: accounts are immediately active (D-13), old toast was misleading

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated SignupForm.test.jsx to match new first step**
- **Found during:** Task 1 (after rewrite, before commit)
- **Issue:** Existing real test asserted age-gate is rendered on initial mount. After rewrite, first step is role (Student/Teacher cards). Test would fail if not updated.
- **Fix:** Updated the real test to assert role selection buttons exist on first render. Converted all 10 .todo stubs into 10 real passing tests covering the full wizard navigation matrix.
- **Files modified:** src/components/auth/SignupForm.test.jsx
- **Verification:** `npx vitest run src/components/auth/SignupForm.test.jsx` -- 11 tests pass
- **Committed in:** 13b8046 (Task 1 commit)

**2. [Rule 1 - Bug] Removed misleading email confirmation toast**
- **Found during:** Post-checkpoint review
- **Issue:** useSignup.js success toast said "Please check your email to confirm your account" but accounts are immediately active (D-13). This would confuse users.
- **Fix:** Simplified toast to just "account created successfully!" without email confirmation instruction.
- **Files modified:** src/features/authentication/useSignup.js
- **Verification:** Code review confirms toast no longer references email confirmation
- **Committed in:** 7a5ed27 (post-checkpoint fix)

**3. [Rule 1 - Bug] Fixed ParentEmailStep.test.jsx placeholder assertion**
- **Found during:** Post-checkpoint review
- **Issue:** Test used regex `/email/i` which could match multiple elements. Actual placeholder is "parent@example.com".
- **Fix:** Changed assertion to match exact placeholder text.
- **Files modified:** src/components/auth/ParentEmailStep.test.jsx
- **Committed in:** 7a5ed27 (post-checkpoint fix)

---

**Total deviations:** 3 auto-fixed (all Rule 1 -- bugs: broken/misleading behavior)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all functionality is wired and working.

## Next Phase Readiness

- Signup flow redesign is complete across all 4 plans (00-03)
- Phase 01 is fully done: test scaffolds, consent removal, sub-component updates, wizard rewrite
- All requirements D-01 through D-15 addressed across the phase
- Build passes, all tests pass, lint clean
- Visually verified and approved

## Self-Check: PASSED

- All 4 referenced files exist on disk
- Commit 13b8046 (Task 1 wizard rewrite) verified in git log
- Commit 7a5ed27 (toast fix + test fix) verified in git log

---
*Phase: 01-signup-flow-redesign*
*Completed: 2026-03-24*
