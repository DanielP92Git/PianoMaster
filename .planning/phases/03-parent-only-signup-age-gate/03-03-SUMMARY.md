---
phase: 03-parent-only-signup-age-gate
plan: 03
subsystem: auth
tags: [supabase, react-query, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-identity-schema-expand
    provides: parents table (id PK reusing auth.users id, live in production)
provides:
  - getCurrentUser() parents-table probe as the final fallback after teachers/students, in both metadata-hint orderings
  - isParent boolean on both getCurrentUser() return shapes (resolved and no-profile)
  - isParent exposed through useUser() alongside isTeacher/isStudent
  - Wave 0 unit test coverage of the 3-table role-resolution branch (apiAuth.test.js, did not exist before this plan)
affects:
  [
    03-parent-only-signup-age-gate (later plans consuming isParent: routing/App.jsx TeacherRedirect,
    RoleSelection OAuth completion),
    04-profile-coppa,
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-from-DB-presence probe pattern extended to a third table (parents) as the final fallback — never overrides an existing teacher/student match, never reads user_metadata for authorization"

key-files:
  created:
    - src/services/apiAuth.test.js
  modified:
    - src/services/apiAuth.js
    - src/features/authentication/useUser.js

key-decisions:
  - "Fixed own test expectation during GREEN: the resolved-role return branch (teacher/student/parent) never sets needsRoleSelection as an explicit key — it's absent/undefined (falsy), not literally `false`. Test now asserts toBeFalsy() instead of toBe(false), matching the pre-existing teacher/student return shape rather than inventing a new field."

patterns-established: []

requirements-completed: [SIGNUP-03]

# Metrics
duration: 20min
completed: 2026-08-03
---

# Phase 3 Plan 3: getCurrentUser() Parents Probe + isParent Summary

**Added the `parents` table as the final-fallback probe in `apiAuth.getCurrentUser()`, so self-registered parent accounts (email or OAuth) resolve to `userRole: "parent"` instead of looping on role selection forever — closes the phase's highest-risk structural gap identified in RESEARCH Pitfall 1.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-08-03T17:30:17Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `getCurrentUser()` now probes `parents` as the final fallback in both metadata-hint orderings (`checkTeacherFirst` and the default student-first branch), only when neither `teachers` nor `students` matched
- Both return shapes extended with `isParent` (`false` on the no-profile/`needsRoleSelection: true` path, `userRole === "parent"` on the resolved path)
- The line-90 `SECURITY: Determine user role ONLY from database table presence` comment preserved verbatim — no `user_metadata`/`app_metadata` role trust introduced
- `useUser()` now exposes `isParent` alongside `isTeacher`/`isStudent` — a single added line, no other change to the query key, staleTime, or `isAuthenticated` derivation
- Created `src/services/apiAuth.test.js` (did not exist before — a pre-existing Wave 0 gap), 6 unit tests covering: parent resolution, teacher-only no-regression, student-only no-regression, no-profile-in-any-table fallback, parent-probe-never-overrides-a-real-match ordering guarantee, and parent resolution under the teacher-hint hint-ordering branch

## Task Commits

Each task was committed atomically (TDD RED → GREEN for Task 1):

1. **Task 1 (RED): apiAuth.test.js failing coverage** - `2512e136` (test)
2. **Task 1 (GREEN): parents probe + isParent in apiAuth.js** - `a5d29c6b` (feat)
3. **Task 2: isParent exposed through useUser()** - `b13be398` (feat)

## Files Created/Modified

- `src/services/apiAuth.test.js` - New Wave 0 unit test suite for `getCurrentUser()`'s 3-table role-resolution branch (6 tests)
- `src/services/apiAuth.js` - Added a `parents` probe as the final fallback in both `checkTeacherFirst` branches of `getCurrentUser()`; extended both return shapes with `isParent`
- `src/features/authentication/useUser.js` - Added `isParent: user?.isParent || false` to the hook's return object

## Decisions Made

- **Test expectation fix during GREEN (not a plan deviation, an in-task correction):** my own first draft of the "resolves parent" test asserted `result.needsRoleSelection` to be strictly `false`. Running it against the real implementation showed the resolved-role return branch (mirroring the pre-existing teacher/student behavior) never sets that key at all — it's `undefined`. Changed the assertion to `toBeFalsy()` rather than adding a new `needsRoleSelection: false` key to the implementation, since the plan's task instructions only specified extending the return with `isParent`, not introducing a new field. This keeps the parent branch symmetric with the existing teacher/student branches.

## Deviations from Plan

None — plan executed exactly as written. The test-expectation correction above happened entirely within Task 1's own RED/GREEN cycle (my test, not the plan's spec) and required no changes to `apiAuth.js` beyond what the plan's `<action>` block specified.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The `parents` table already exists in production (Phase 1, applied 2026-07-30); this plan only adds a read probe against it.

## Next Phase Readiness

- `getCurrentUser()` / `useUser()` now have a working, tested contract for parent-role resolution. This is the dependency Plan 06 (routing — `App.jsx`'s `TeacherRedirect`) and Plan 08 (OAuth completion — `RoleSelection.jsx`'s parent-insert branch) both consume per the plan's stated purpose.
- Full suite verified green after both tasks: `npm run test:run` — 113 test files passed, 2166 tests passed, 12 pre-existing todo stubs, 0 failures.
- No blockers for downstream Phase 3 plans that read `isParent` from `useUser()`.

---

_Phase: 03-parent-only-signup-age-gate_
_Completed: 2026-08-03_

## Self-Check: PASSED

- FOUND: src/services/apiAuth.test.js
- FOUND: src/services/apiAuth.js
- FOUND: src/features/authentication/useUser.js
- FOUND: .planning/phases/03-parent-only-signup-age-gate/03-03-SUMMARY.md
- FOUND commit: 2512e136 (test)
- FOUND commit: a5d29c6b (feat)
- FOUND commit: b13be398 (feat)
