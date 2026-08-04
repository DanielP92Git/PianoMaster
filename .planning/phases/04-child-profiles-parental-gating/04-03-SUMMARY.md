---
phase: 04-child-profiles-parental-gating
plan: 03
subsystem: auth
tags: [supabase, coppa, authorization, data-export, account-deletion, vitest]

# Dependency graph
requires: []
provides:
  - verifyStudentDataAccess parent→child ownership branch (child_profiles-scoped)
  - Completed STUDENT_DATA_TABLES export set (16 tables)
  - deleteChildProfile per-child permanent delete (no signOut)
  - notificationService push-subscription calls unblocked for parents
affects:
  [
    04-child-profiles-parental-gating UI plans (parent data-rights UI,
    delete-child flow,
    export/download UI),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ownership branch inserted between self-check and teacher-connection check in verifyStudentDataAccess, returning isParent:true on a real child_profiles row scoped by parent_id"
    - "Service-layer Vitest mocking idiom: vi.mock('./supabase') + vi.mock('./authorizationUtils'), chained .from().select().eq().maybeSingle()/.single() mock builders returning the intermediate mocks for assertion"

key-files:
  created:
    - src/services/authorizationUtils.test.js
    - src/services/dataExportService.test.js
    - src/services/accountDeletionService.test.js
  modified:
    - src/services/authorizationUtils.js
    - src/services/notificationService.js
    - src/services/dataExportService.js
    - src/services/accountDeletionService.js

key-decisions:
  - "notifications table idColumn corrected to recipient_id (its actual owning FK per migration 20250625120001_add_teacher_schema.sql), not student_id as literally written in the plan's interfaces block — using student_id would have silently produced an empty/errored export row for every parent, defeating the COPPA-04 completeness goal"
  - "deleteChildProfile added as a brand-new export, not merged into requestAccountDeletion — keeps the whole-account 30-day-grace soft-delete flow (with signOut) completely separate from the immediate per-child hard-delete flow (without signOut, D-12)"

patterns-established:
  - "Pattern: service-layer ownership checks call verifyStudentDataAccess once and branch on isOwner/isParent rather than re-deriving auth.uid() comparisons inline"

requirements-completed: [COPPA-03, COPPA-04, COPPA-05]

duration: 24min
completed: 2026-08-04
---

# Phase 04 Plan 03: Data-Rights Service Layer Summary

**Parent→child ownership branch unblocks export/delete/push-notification service calls; export now covers all 16 parent-facing child-scoped tables; new deleteChildProfile permanently removes one child's data via cascade without signing the parent out.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-08-04T12:20:00Z
- **Completed:** 2026-08-04T12:44:42Z
- **Tasks:** 3 (+ 1 formatting fix commit)
- **Files modified:** 7 (4 modified, 3 new test files)

## Accomplishments

- `verifyStudentDataAccess` no longer rejects a parent acting on an owned child — the new `child_profiles` ownership branch sits between the self-check and the teacher-connection query, proven by a behavioral test (owned passes, non-owned rejected, self and teacher paths regression-safe)
- `notificationService.savePushSubscription`/`removePushSubscription` no longer throw `Unauthorized` for a parent managing an owned child's push subscription — self-check replaced with `verifyStudentDataAccess`
- `STUDENT_DATA_TABLES` grew from 10 to 16 tables, adding every parent-facing child-scoped table (`instrument_practice_logs`, `instrument_practice_streak`, `notifications`, `push_subscriptions`, `student_daily_challenges`, `student_unit_progress`); operational/security tables (`rate_limits`, `parental_consent_tokens`) explicitly excluded and documented
- New `deleteChildProfile(childId, confirmationNickname)` permanently deletes one child's data (name-confirmed, cascade-delete via the `students` row trigger) **without** calling `supabase.auth.signOut()`, so the parent stays logged in

## Task Commits

Each task was committed atomically:

1. **Task 1: verifyStudentDataAccess parent→child branch + notificationService self-check replacement** - `3f0a5fda` (feat, tdd)
2. **Task 2: Complete STUDENT_DATA_TABLES + table descriptions + parity test** - `c975cc30` (feat, tdd)
3. **Task 3: deleteChildProfile (no signOut, name-confirmed) + test** - `a7264e2e` (feat, tdd)
4. **Formatting fix** - `b941d03c` (style) — prettier reformat of a `vi.fn().mockResolvedValue()` chain in `dataExportService.test.js` that the pre-commit hook's lint-staged pass didn't fully normalize

_TDD note: each task's RED/GREEN were combined into a single commit per task since the plan's tdd flow here is "write behavior + test together and verify green," matching the plan's `<verify>` blocks (no separate failing-test commit was requested by the plan's action text)._

## Files Created/Modified

- `src/services/authorizationUtils.js` - Added parent→child ownership branch to `verifyStudentDataAccess`
- `src/services/authorizationUtils.test.js` - New: behavioral proof of owned-passes/non-owned-rejected/self/unauthenticated
- `src/services/notificationService.js` - `savePushSubscription`/`removePushSubscription` now call `verifyStudentDataAccess` instead of a raw `user.id !== studentId` check
- `src/services/dataExportService.js` - `STUDENT_DATA_TABLES` extended to 16 entries + matching `getTableDescription()` cases + Open-Q2 exclusion comment
- `src/services/dataExportService.test.js` - New: completeness/parity assertions + `exportStudentData` smoke test covering the added tables
- `src/services/accountDeletionService.js` - New `deleteChildProfile` export (ownership check, name confirmation, `students` delete, no signOut)
- `src/services/accountDeletionService.test.js` - New: happy path (delete called, signOut not called), wrong-nickname rejection, non-owner rejection

## Decisions Made

- Corrected `notifications` table's `idColumn` from the plan's literal `student_id` to the schema's actual `recipient_id` FK column (see Deviations)
- Kept `deleteChildProfile` fully separate from `requestAccountDeletion` per the plan's explicit instruction — no shared code path, no risk of accidentally adding `signOut()` to the per-child flow via refactor

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected `notifications` table idColumn to `recipient_id`**

- **Found during:** Task 2 (Complete STUDENT_DATA_TABLES)
- **Issue:** The plan's interfaces block specified `notifications(student_id)`, but `supabase/migrations/20250625120001_add_teacher_schema.sql` defines the table's owning FK column as `recipient_id UUID NOT NULL REFERENCES auth.users(id)`, and the child_profiles cascade migration confirms `notifications_recipient_id_child_profiles_fkey ... FOREIGN KEY (recipient_id)`. Using `student_id` as written would query a nonexistent column, silently returning an error the export code swallows into an empty/errored row — defeating the COPPA-04 "complete export" goal for exactly the table it was meant to add.
- **Fix:** Set `{ table: 'notifications', idColumn: 'recipient_id' }` and added an inline comment explaining the correction and citing the migration file.
- **Files modified:** `src/services/dataExportService.js`
- **Verification:** `exportStudentData` smoke test asserts `notifications` is present in `tablesIncluded` and the result object; all 16-table completeness assertions pass.
- **Committed in:** `c975cc30` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary for the export to actually be complete for the `notifications` table rather than silently degrading to an empty/error row. No scope creep — same task, same file, same acceptance intent (parity/completeness).

**Note on acceptance-criteria wording:** Task 2's acceptance criteria included `grep -c "rate_limits" src/services/dataExportService.js` is 0. The task's own action text simultaneously instructs adding the inline comment `// Excluded by D-11/Open-Q2: rate_limits, parental_consent_tokens ...`, which necessarily contains the string `rate_limits`. The functional requirement — `rate_limits` is not in the `STUDENT_DATA_TABLES` array and is never queried — is met and covered by the parity test's `EXCLUDED_TABLES` assertion; only the literal grep count (which counts the documentation comment, not the array) reads 1 instead of 0. Not a code defect, just a plan-authoring wording tension between two acceptance-criteria bullets.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The data-rights service layer (`verifyStudentDataAccess`, `exportStudentData`/`getExportedDataTypes`/`getDataSummary`, `deleteChildProfile`) is parent-ready and directly callable by UI plans in this phase (parent data export UI, per-child delete UI, push-notification settings)
- `requestAccountDeletion` (whole-account, 30-day grace, signOut) is untouched and remains available for the account-level deletion flow
- No blockers for downstream plans in this wave/phase

---

_Phase: 04-child-profiles-parental-gating_
_Completed: 2026-08-04_

## Self-Check: PASSED

All 7 code files (4 modified, 3 new test files) confirmed present on disk. All 4 commit hashes (`3f0a5fda`, `c975cc30`, `a7264e2e`, `b941d03c`) confirmed present in git log.
