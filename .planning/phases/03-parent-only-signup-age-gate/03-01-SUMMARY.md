---
phase: 03-parent-only-signup-age-gate
plan: 01
subsystem: auth
tags: [i18n, age-verification, coppa, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-identity-schema-expand
    provides: parent-first account architecture context (v4.0 milestone)
provides:
  - isUnder18 age-gate helper (Wave 0 boundary-tested)
  - Full EN+HE i18n copy contract for all new Phase 3 auth strings (dobGate, ageBlock, role.parent, credentials.submitParent, parentNameLabel, successParent, parentPlaceholder)
affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07, 03-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Age-boundary unit tests computed relative to new Date() at test time (never hardcoded calendar dates) so they never go stale"
    - "i18n copy authored interface-first, ahead of the components that consume it, to eliminate later file-ownership conflicts"

key-files:
  created:
    - src/utils/ageUtils.test.js
  modified:
    - src/utils/ageUtils.js
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "dobGate reuses auth.signup.ageGate.continue/errorInvalid rather than duplicating a dobGate.continue/errorInvalid pair, per plan instruction"
  - "Legacy auth.signup.role.student/studentDesc/submitStudent keys left in place (still parity-matched, now unused) rather than deleted, to avoid touching downstream plans' assumptions"
  - "OAuth completion screen (Plan 08) will reuse dobGate/ageBlock/role namespaces — no parallel roleSelection.dob* set was created"

patterns-established:
  - "Boundary-correctness threat mitigation (T-03-02) verified via 3 relative-date test cases: 18-today (allowed), 17y364d (blocked), 18y1d (allowed)"

requirements-completed: [SIGNUP-01, SIGNUP-02, SIGNUP-03, SIGNUP-04, SIGNUP-05]

# Metrics
duration: 25min
completed: 2026-08-03
---

# Phase 03 Plan 01: Age Helper + i18n Copy Contract Summary

**`isUnder18` age-gate helper with Wave 0 boundary tests, plus the full EN+HE i18n copy contract (16 new keys, exact parity) for every new Phase 3 auth string — DOB gate, under-18 block screen, Parent/Teacher role relabel, and post-signup parent placeholder.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-03T17:08:00Z (approx, from STATE.md handoff)
- **Completed:** 2026-08-03T17:33:24Z
- **Tasks:** 2 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- `isUnder18` exported from `src/utils/ageUtils.js` as a sibling to `isUnder13`, following the exact TDD RED→GREEN cycle (failing test committed first, then implementation)
- `src/utils/ageUtils.test.js` created — 9 tests covering `isUnder18` (3 boundary cases), `isValidDOB` (3 cases), `dobPartsToDate` (1 case), plus 2 regression-guard tests for the pre-existing `calculateAge`/`isUnder13` exports
- 16 new i18n keys authored in both `src/locales/en/common.json` and `src/locales/he/common.json` with exact key-path parity, covering the DOB gate, the under-18 block screen, the Parent/Teacher role relabel, the parent credentials CTA, the parent success toast, and the post-signup parent placeholder
- Full test suite verified green post-change: 113 test files passed / 2 skipped, 2169 tests passed, 0 failures

## Task Commits

Each task was committed atomically (Task 1 followed the TDD RED→GREEN cycle per `tdd="true"`):

1. **Task 1 (RED): failing test for isUnder18** - `0c301220` (test)
2. **Task 1 (GREEN): implement isUnder18** - `13520785` (feat)
3. **Task 2: EN+HE copy contract for Phase 3 auth strings** - `f2b7cd84` (feat)

_TDD task produced 2 commits (test → feat); no refactor commit needed — the implementation was a single 8-line function copied verbatim in doc-comment style from `isUnder13`._

## Files Created/Modified

- `src/utils/ageUtils.test.js` - New Vitest suite; boundary dates computed relative to `new Date()` at test time
- `src/utils/ageUtils.js` - Added `isUnder18(birthDate)`, unchanged bodies for `calculateAge`/`isValidDOB`/`dobPartsToDate`
- `src/locales/en/common.json` - Added `auth.signup.dobGate.*`, `auth.signup.ageBlock.*`, `auth.signup.role.parent(Desc)`, `auth.signup.credentials.submitParent`, `auth.signup.parentNameLabel`, `auth.signup.successParent`, top-level `parentPlaceholder.*`
- `src/locales/he/common.json` - Mirrored EN additions with natural, RTL-appropriate Hebrew copy

## Decisions Made

- Reused `auth.signup.ageGate.continue` and `auth.signup.ageGate.errorInvalid` for the DOB gate rather than duplicating a `dobGate.continue`/`dobGate.errorInvalid` pair — both already exist and match the plan's explicit non-blocking FLAG instruction.
- Left the legacy `auth.signup.role.student`/`studentDesc`/`submitStudent` keys untouched (still parity-matched between locales, now unused after the Parent/Teacher relabel) — deleting them was out of this plan's scope and risked breaking any still-referencing code in downstream plans not yet executed.
- Placed `parentPlaceholder` as a new top-level locale key (sibling to `compose`, `boss`, etc.) rather than nesting it under `auth`, matching the plan's explicit instruction ("a new top-level `parentPlaceholder`").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, downgraded to scoped verification] Plan's full-file i18n parity acceptance script reported pre-existing failures unrelated to this plan's new keys**

- **Found during:** Task 2 (running the acceptance-criteria parity script)
- **Issue:** The plan's Task 2 acceptance criterion is a script that diffs _every_ EN vs HE key path and expects `PARITY OK` (exit 0). Running it surfaced 7 pre-existing mismatches — all i18next pluralization suffixes (`_two`, `_many`) used by Hebrew's dual/plural grammar with no English equivalent (`dashboard.streak.dayLabel_*`, `gameSettings.difficulty.levels.*.bars_two`, `gameSettings.gridSize.pairs_two`, `gameSettings.noteSelection.selectedCount_two`). Confirmed present in the phase's pre-plan base commit (`320ffd4e`) via `git show`, so not introduced by this plan.
- **Fix:** Did NOT fix the pre-existing gap (out of scope per scope-boundary rule — unrelated files, pre-dates this plan). Instead ran a scoped parity check limited to the 16 keys this plan actually added, which confirmed exact EN/HE parity. Logged the pre-existing gap to `.planning/phases/03-parent-only-signup-age-gate/deferred-items.md` for future triage.
- **Files modified:** `.planning/phases/03-parent-only-signup-age-gate/deferred-items.md` (new)
- **Verification:** Scoped parity check (16/16 new keys matched); `grep -c` counts for `dobGate`/`ageBlock`/`parentPlaceholder` in both locales; both files parse as valid JSON
- **Committed in:** Not committed as part of a task commit — `deferred-items.md` is committed alongside this SUMMARY.md in the plan-metadata commit (worktree mode excludes it from STATE.md/ROADMAP.md updates, which remain the orchestrator's responsibility)

---

**Total deviations:** 1 (documentation-only — logged a pre-existing, out-of-scope i18n gap rather than fixing or ignoring it silently)
**Impact on plan:** None on this plan's deliverables. All 5 of Task 2's literal acceptance-criteria greps/JSON-validity checks pass; the one script that also touches unrelated pre-existing content is documented with a scoped substitute proving this plan's own keys are fully parity-correct.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `isUnder18` is available for Plans 03-02 through 03-08 (and the OAuth completion screen in 03-08) to import directly from `src/utils/ageUtils.js`
- All `t("auth.signup.dobGate.*")`, `t("auth.signup.ageBlock.*")`, `t("auth.signup.role.parent")`, `t("auth.signup.credentials.submitParent")`, `t("auth.signup.parentNameLabel")`, `t("auth.signup.successParent")`, and `t("parentPlaceholder.*")` keys exist in both locales — no downstream plan needs to touch the shared locale files or re-derive date math
- No blockers for Wave 2/3 plans in this phase

---

_Phase: 03-parent-only-signup-age-gate_
_Completed: 2026-08-03_

## Self-Check: PASSED

- FOUND: src/utils/ageUtils.js
- FOUND: src/utils/ageUtils.test.js
- FOUND: src/locales/en/common.json
- FOUND: src/locales/he/common.json
- FOUND: commit 0c301220 (test: RED)
- FOUND: commit 13520785 (feat: GREEN)
- FOUND: commit f2b7cd84 (feat: locale copy contract)
- FOUND: .planning/phases/03-parent-only-signup-age-gate/03-01-SUMMARY.md
- FOUND: .planning/phases/03-parent-only-signup-age-gate/deferred-items.md
