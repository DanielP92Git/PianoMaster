---
phase: 03-parent-only-signup-age-gate
plan: 05
subsystem: auth
tags: [react-query, supabase, coppa, signup]

# Dependency graph
requires:
  - phase: 03-parent-only-signup-age-gate (plans 01, 02)
    provides: i18n auth.signup.successParent key; parents.age_verified_at column (migration 20260803120000)
provides:
  - "useSignup's role === 'parent' branch upserts ONLY { id, display_name, age_verified_at } into parents"
  - "Real unit test coverage proving the parent branch never touches students or promote_placeholder_student"
affects: [03-07 (wizard UI wiring the credentials step to this hook)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN cycle for a mutation hook: mock useMutation's config to synchronously invoke mutationFn/onSuccess/onError, bypassing react-query's internal scheduling in tests"

key-files:
  created: []
  modified:
    - src/features/authentication/useSignup.js
    - src/features/authentication/useSignup.test.js

key-decisions:
  - "Dropped birthYear/parentEmail from useSignup's mutationFn signature entirely rather than ignoring them — no remaining call site (SignupForm.jsx, per Plan 07) passes them once the child-data collection is removed from the wizard, and keeping unused destructured params would be dead code."
  - "return { ...authData, parentEmail } trimmed to return { ...authData } since parentEmail no longer exists as an input — nothing downstream (onSuccess) consumed it."

patterns-established: []

requirements-completed: [SIGNUP-04]

# Metrics
duration: 10min
completed: 2026-08-03
---

# Phase 03 Plan 05: Parent-Only useSignup Branch Summary

**Replaced useSignup's students-upsert + promote_placeholder_student branch with a parents-only upsert `{ id, display_name, age_verified_at }` for role "parent"; filled in useSignup.test.js's it.todo() stubs with real assertions.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-03T20:46:42+03:00
- **Completed:** 2026-08-03T20:54:42+03:00
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- `useSignup.js`'s `role === "parent"` branch now upserts only into `parents` with `{ id, display_name, age_verified_at: new Date().toISOString() }` — zero child data collected (SIGNUP-04, D-04)
- The old `students` upsert (first_name/last_name/date_of_birth/parent_email) and `promote_placeholder_student` RPC call are fully removed from the non-teacher path
- Teacher branch (`from("teachers").upsert(...)`) is byte-for-byte unchanged
- `onSuccess` now selects the `auth.signup.successParent` toast key for the parent role (key already existed in en/he locales from Plan 01)
- `useSignup.test.js` rewritten from 3 `it.todo()` stubs to 4 real assertions covering: parent upsert shape, parent never touching students/rpc, parent with no `parentName` writing `display_name: null`, and teacher branch regression coverage

## Task Commits

Each task was committed atomically (TDD RED → GREEN):

1. **Task 1 (RED): add failing tests for parent-only useSignup branch** - `5d284acd` (test)
2. **Task 1 (GREEN): branch useSignup parent role to write only parents table** - `48c5e167` (feat)

_No REFACTOR commit — implementation was already minimal/clean after GREEN; nothing to clean up._

## Files Created/Modified

- `src/features/authentication/useSignup.js` - Replaced the `students` upsert + `promote_placeholder_student` RPC branch with a `role === "parent"` branch upserting only `parents`; dropped `birthYear`/`parentEmail` params from `mutationFn`; added `normalizedParentName`; extended `onSuccess` toast selection with the `parent` case
- `src/features/authentication/useSignup.test.js` - Replaced 3 `it.todo()` stubs with 4 real tests using a hoisted call-recorder mock for `supabase.from()/upsert()/rpc()` and a `useMutation` mock that synchronously drives `mutationFn`/`onSuccess`

## Decisions Made

- Dropped `birthYear`/`parentEmail` from the mutation's destructured params entirely (not just unused) since no remaining caller passes them once Plan 07 rewires `SignupForm.jsx`'s credentials submit to the new parent-only payload shape (per 03-PATTERNS.md's documented "AFTER" `signup({...})` call).
- Simplified the mutation's return value from `{ ...authData, parentEmail }` to `{ ...authData }` since `parentEmail` is no longer an input and nothing in `onSuccess` read it.

## Deviations from Plan

None - plan executed exactly as written. The plan's literal code snippet was followed verbatim for the parent branch; the only additions beyond the snippet (dropping `birthYear`/`parentEmail` from the signature, trimming the return statement) were necessary consequences of removing the child-data fields the plan explicitly said to omit, not scope changes.

## Issues Encountered

None. The `useMutation` mock in the plan's implied test approach needed one adaptation not spelled out in the plan: the pre-existing mock (`vi.fn(({ mutationFn, onSuccess, onError }) => ({ mutate: vi.fn(), isPending: false }))`) returned a `mutate` that did nothing, making assertions impossible. Replaced it with a mock that captures the `useMutation` config and has `mutate` synchronously invoke `mutationFn(variables).then(onSuccess).catch(onError)`, then `await`ed a microtask flush in each test. This is a test-infrastructure detail consistent with the plan's acceptance criteria ("extend its upsert/rpc recorders"), not a deviation from behavior.

## User Setup Required

None - no external service configuration required. The `parents.age_verified_at` column this plan writes to was already added by Plan 02's migration (`20260803120000_add_parent_age_verified.sql`), already applied per that plan's wave.

## Next Phase Readiness

- `useSignup`'s parent branch is ready for Plan 07 to wire the wizard's credentials step to call `signup({ role: "parent", email, password, parentName })`
- Full test suite verified green post-change: 2179 passed, 9 pre-existing todo, 1 pre-existing skipped file (115/116 test files passed) — no regressions introduced
- No blockers

---

_Phase: 03-parent-only-signup-age-gate_
_Completed: 2026-08-03_

## Self-Check: PASSED

- FOUND: src/features/authentication/useSignup.js
- FOUND: src/features/authentication/useSignup.test.js
- FOUND: .planning/phases/03-parent-only-signup-age-gate/03-05-SUMMARY.md
- FOUND: 5d284acd (test commit)
- FOUND: 48c5e167 (feat commit)
