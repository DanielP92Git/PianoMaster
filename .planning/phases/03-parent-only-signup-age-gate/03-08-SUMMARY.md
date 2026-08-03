---
phase: 03-parent-only-signup-age-gate
plan: 08
subsystem: auth
tags: [react, react-query, supabase, oauth, coppa, age-gate]

# Dependency graph
requires:
  - phase: 03-parent-only-signup-age-gate (plans 01-04)
    provides: ageUtils.isUnder18, AgeGate.jsx (open-field M/D/Y), AgeBlockScreen.jsx, parents.age_verified_at column, getCurrentUser() parents probe
provides:
  - Gated OAuth completion screen (RoleSelection.jsx) closing the roadmap's OAuth-bypass gap — every brand-new Google signup now passes role -> 18+ DOB before any profile row is written
  - Rewritten RoleSelection.test.jsx proving DOB gates the insert and under-18 signs out with zero insert
affects: [phase-04-profile-coppa, phase-06-live-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Internal two-step state machine (role -> dob-gate) inside an existing AuthShell frame, with a local StepDots component mirroring SignupForm's progress-dot convention"
    - "Insert-gated-behind-verification: useMutation's mutationFn is only invoked from a child component's onSubmit callback (AgeGate), never from the role-pick click itself"

key-files:
  created: []
  modified:
    - src/components/auth/RoleSelection.jsx
    - src/components/auth/RoleSelection.test.jsx

key-decisions:
  - "Followed PATTERNS.md verbatim for the mutationFn parent-branch insert and the under-18 logout()+setBlocked branch"
  - "Kept the outer heading/subtitle static across both internal steps (role, dob-gate) rather than swapping subtitle text per step, since AgeGate already renders its own step-specific instructional paragraph — avoids duplicated on-screen copy while still satisfying UI-SPEC's StepDots continuous-flow requirement"
  - "onBackToLogin resets local component state only (no explicit navigation call) — per the plan's note that losing the session in handleUnder18 is what actually returns the user to /login at the App.jsx level"

patterns-established:
  - "Insert-gated-behind-verification: pair a useMutation's mutationFn with a step machine so it can only be invoked from the terminal verification step's onSubmit, never from an earlier selection step"

requirements-completed: [SIGNUP-03]

# Metrics
duration: 24min
completed: 2026-08-03
---

# Phase 3 Plan 08: OAuth Completion Age Gate Summary

**Retrofitted RoleSelection.jsx (the screen every brand-new Google OAuth signup lands on) into a role -> 18+ DOB gated completion flow, closing the roadmap's named OAuth-bypass compliance gap.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-08-03T17:58:00Z
- **Completed:** 2026-08-03T18:22:14Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `RoleSelection.jsx` now runs a two-step internal state machine (role pick -> `AgeGate` DOB step) inside its existing `AuthShell` frame, with a `StepDots` progress affordance mirroring `SignupForm`'s convention
- The Supabase insert (`createProfile`) is only ever invoked from `AgeGate`'s `onSubmit` (18+ verified) — never from a role-card click — closing the gap where a brand-new Google signup previously wrote a profile row with zero age check
- Under-18 users are signed out via the project's `logout()` wrapper (clears session + user-scoped localStorage) and shown `AgeBlockScreen`; no profile row is ever created for them, leaving the Google-created `auth.users` row profile-less and inert for RLS deny-all
- Parent branch now inserts `{ id, display_name, age_verified_at }` into `parents`, replacing the old zero-age-check `students` insert
- No trust of OAuth `signup_mode`/`queryParams`/`user_metadata?.role` anywhere in the file (grep-gated)
- `RoleSelection.test.jsx` rewritten with 8 tests covering: both roles offered, DOB step gated behind role selection, zero insert on role-click-alone, zero insert on reaching the DOB step without submitting, 18+ parent -> `parents` insert with `age_verified_at`, 18+ teacher -> `teachers` insert, under-18 parent-branch signs out once + renders block screen + zero insert, under-18 teacher-branch signs out once + zero insert

## Task Commits

Each task was committed atomically:

1. **Task 1: Retrofit RoleSelection into a gated DOB + role completion flow** - `e8da99c7` (feat)
2. **Task 2: Rewrite RoleSelection.test.jsx for the gated flow** - `2c1bcbe0` (test)

## Files Created/Modified

- `src/components/auth/RoleSelection.jsx` - Retrofitted into a two-step (role -> DOB) internal state machine; parent branch writes `parents` instead of `students`; under-18 signs out via `logout()` and renders `AgeBlockScreen`
- `src/components/auth/RoleSelection.test.jsx` - Rewritten: 8 tests replacing the old 6-test file's zero-age-check assertions with DOB-gates-insert / under-18-signs-out-with-zero-insert coverage

## Decisions Made

- Reused the Plan 01 i18n keys (`auth.signup.dobGate.*`, `auth.signup.ageBlock.*`, `auth.signup.role.*`) for the role cards and DOB step instead of the pre-existing `auth.roleSelection.student`/`teacher` keys, per the plan's D-02/D-06 role-relabel requirement — no new i18n keys added
- Kept `auth.roleSelection.title`/`subtitle`/`successMessage`/`errorGeneric` unchanged (still apply to this screen as a whole, not renamed by this phase)
- StepDots shows 2 dots (role, dob-gate) rather than reusing `SignupForm`'s exported component (not exported for reuse) — a small local sibling was authored using the identical visual treatment

## Deviations from Plan

None - plan executed exactly as written. The mutationFn parent-branch insert and under-18 logout branch match `03-PATTERNS.md`'s verbatim code samples.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The roadmap's named OAuth-bypass pitfall is closed: no unguarded path from a brand-new Google signup to a profile row exists anywhere in the codebase (button-side `socialAuth()` unchanged per D-05; the gate lives entirely at the post-callback, profile-less-session screen)
- `npx vitest run src/components/auth/RoleSelection.test.jsx`: 8/8 passed
- Full suite: `npx vitest run` — 2183 passed, 0 failed, 9 todo (pre-existing), 1 file skipped (pre-existing `TrailNodeModal.test.jsx`)
- `npx eslint src/components/auth/RoleSelection.jsx src/components/auth/RoleSelection.test.jsx` — zero errors/warnings
- Manual/device verification (live Google OAuth round-trip forcing a new account through DOB+role; under-18 signed out + blocked) remains phase-level UAT, out of scope for this autonomous plan per the plan's own `<verification>` section

## Self-Check: PASSED

- FOUND: src/components/auth/RoleSelection.jsx
- FOUND: src/components/auth/RoleSelection.test.jsx
- FOUND: .planning/phases/03-parent-only-signup-age-gate/03-08-SUMMARY.md
- FOUND commit: e8da99c7 (feat)
- FOUND commit: 2c1bcbe0 (test)

---

_Phase: 03-parent-only-signup-age-gate_
_Completed: 2026-08-03_
