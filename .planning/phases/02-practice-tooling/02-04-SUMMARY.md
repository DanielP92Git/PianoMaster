---
phase: 02-practice-tooling
plan: 04
subsystem: i18n
tags: [i18next, vitest, locale-parity, sight-reading]

# Dependency graph
requires: []
provides:
  - "sight-reading-parity.test.js EN<->HE gate for sightReading.* namespace"
  - "Canonical sightReading.controls.replay/modePractice/modeTest/modeToggleLabel/compare/review keys (EN+HE)"
  - "Canonical sightReading.summary.practiceNotScored key (EN+HE)"
  - "New sightReading.compare.{yours,correct} and sightReading.review.{title,instruction,progress,playIt,skip,done} subtrees (EN+HE)"
affects: [02-05, 02-06, 02-07, 02-08, 02-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "collectPaths recursive set-difference locale parity gate (copied from scaffolding-card-parity.test.js template)"

key-files:
  created:
    - src/locales/__tests__/sight-reading-parity.test.js
  modified:
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Extended the existing sightReading.* namespace rather than forking a new top-level namespace, per D-24 in the plan interfaces"
  - "Landed the parity gate (Task 1) before adding strings (Task 2) so the new keys are gated by the test from the moment they're authored"

patterns-established:
  - "Locale parity gate: two-direction collectPaths set-difference against a single namespace, reusable per-namespace template"

requirements-completed: [I18N-01]

# Metrics
duration: 5min
completed: 2026-07-10
---

# Phase 02 Plan 04: Sight-Reading Locale Infrastructure Summary

**EN<->HE parity gate for `sightReading.*` plus all Phase 02 practice-tooling strings (replay, practice/test mode toggle, compare, review-mistakes) authored at exact path parity in both locales.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-10T09:15:02Z (approx, from prior git commit timestamp)
- **Completed:** 2026-07-10T09:17:25+03:00
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Created `src/locales/__tests__/sight-reading-parity.test.js`, a two-direction EN<->HE set-difference gate scoped to the `sightReading.*` namespace (mirrors the existing `scaffolding-card-parity.test.js` template), green at 52/52 before any new keys were added
- Authored all canonical Phase 02 strings inside the existing `sightReading.*` namespace in both `en/common.json` and `he/common.json`: `controls.replay/modePractice/modeTest/modeToggleLabel/compare/review`, `summary.practiceNotScored`, and new `compare.{yours,correct}` / `review.{title,instruction,progress,playIt,skip,done}` subtrees
- Hebrew translations authored following existing diacritic/RTL conventions; no pre-existing HE strings altered
- Parity gate remains green after the additions (verified via `npx vitest run sight-reading-parity`), giving downstream plans 02-05 through 02-09 a stable, pre-authored key contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the sightReading EN↔HE parity gate (Wave 0)** - `ad072f98` (test)
2. **Task 2: Author all phase EN + HE strings under sightReading.\*** - `685e1439` (feat)

**Plan metadata:** (pending — see final commit in orchestrator merge)

## Files Created/Modified

- `src/locales/__tests__/sight-reading-parity.test.js` - New EN<->HE parity gate for `sightReading.*` (copied from scaffolding-card-parity template)
- `src/locales/en/common.json` - Added `controls.replay/modePractice/modeTest/modeToggleLabel/compare/review`, `summary.practiceNotScored`, `compare.*`, `review.*` under `sightReading`
- `src/locales/he/common.json` - Matching Hebrew translations at identical paths

## Decisions Made

- Extended the existing `sightReading.*` namespace (D-24) rather than creating a new top-level namespace — keeps all sight-reading strings discoverable in one place
- Sequenced Task 1 (gate) before Task 2 (strings) so the parity gate immediately protects the new additions instead of being added retroactively

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All canonical `sightReading.*` keys referenced by plans 02-06 through 02-09 (replay, practice/test mode, compare, review-mistakes UI) now exist in both locales at exact path parity, gated by a static Vitest check
- No blockers for downstream plans in this phase

---

_Phase: 02-practice-tooling_
_Completed: 2026-07-10_

## Self-Check: PASSED

- FOUND: src/locales/**tests**/sight-reading-parity.test.js
- FOUND: src/locales/en/common.json
- FOUND: src/locales/he/common.json
- FOUND commit: ad072f98
- FOUND commit: 685e1439
