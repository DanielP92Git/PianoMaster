---
phase: 02-practice-tooling
plan: 06
subsystem: ui
tags: [react, sight-reading, feedback-panel, layout, i18n]

# Dependency graph
requires:
  - phase: 02-practice-tooling
    provides: "01 (calculateOverallScore mode arg), 04 (GRADING_MODES constants + i18n keys)"
provides:
  - "FeedbackSummary two-row D-23 layout with onCompare/onReview/gradingMode props"
  - "SightReadingLayout 'review' phase contract + dedicated guidance region"
affects: [02-07, 02-08, 02-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Presentational components receive new handler props guarded with && (wired by game in later waves)"
    - "Row 1 (learn, lighter styling) above Row 2 (navigate, GameActionButton CTAs) per D-23"

key-files:
  created: []
  modified:
    - src/components/games/sight-reading-game/components/FeedbackSummary.jsx
    - src/components/games/sight-reading-game/components/SightReadingLayout.jsx

key-decisions:
  - "hasMistakes derived from breakdown.wrongPitch + breakdown.missed (not a separate prop) — single source of truth, matches plan's PREFER guidance"
  - "Review guidance rendered inline below the staff card (new 'review-guidance' data-sr-region), mirroring how the feedbackPanel is docked inline — not the fixed-top overlay used for count-in/performance incidental hints"

patterns-established:
  - "Compare/Review row uses plain <button> with text-xs font-medium text-white/80 + hover, not GameActionButton — visually lighter than primary CTAs per D-23 hierarchy"

requirements-completed: [PRAC-02, PRAC-03, PRAC-04]

# Metrics
duration: 15min
completed: 2026-07-10
---

# Phase 02 Plan 06: FeedbackSummary Two-Row Layout + SightReadingLayout Review Phase Summary

**Restructured FeedbackSummary into the owner-selected two-row D-23 layout (Compare/Review learn row above Try Again/Next navigate row) and taught SightReadingLayout to treat "review" as a real phase with a dedicated guidance region.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-10T~07:27Z
- **Completed:** 2026-07-10T07:42:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- FeedbackSummary now exposes `onCompare`, `onReview`, `gradingMode` props (all optional, backward-compatible) and renders a new secondary "learn" row above the unchanged primary "navigate" row
- Review button is hidden (not disabled) on a clean run via `hasMistakes = breakdown.wrongPitch + breakdown.missed > 0` (D-20)
- `gradingMode` threaded into the fallback `calculateOverallScore(...)` call so displayed score always matches the active grading mode
- Practice-mode "not scored" notice added (D-06) — accuracy bars/stars still render unconditionally
- SightReadingLayout's phase contract comment now lists `"review"`; an explicit `isReviewPhase` branch renders `guidance` in a dedicated inline region (`data-sr-region="review-guidance"`) instead of relying on the silent fixed-top-overlay fallback
- Layout remains presentational — no `ReviewDrillPanel` import added

## Task Commits

Each task was committed atomically:

1. **Task 1: Restructure FeedbackSummary into the two-row D-23 layout + new props + notice** - `3a7ff0b8` (feat)
2. **Task 2: Add REVIEW phase to SightReadingLayout contract + guidance routing** - `3021ec5a` (feat)

**Plan metadata:** (this commit) `docs: complete plan`

## Files Created/Modified

- `src/components/games/sight-reading-game/components/FeedbackSummary.jsx` - Two-row D-23 layout (Compare/Review learn row + unchanged Try Again/Next navigate row), `gradingMode` threaded into score fallback, practice-mode notice
- `src/components/games/sight-reading-game/components/SightReadingLayout.jsx` - `"review"` added to phase contract; explicit `isReviewPhase` guidance routing (inline dedicated region, not fixed overlay)

## Decisions Made

- `hasMistakes` derived from the already-computed `breakdown` object rather than accepting a separate prop, per the plan's stated preference — keeps a single source of truth for "clean run" detection
- Review guidance placed in the same inline-below-card slot pattern as `feedbackPanel` (new `data-sr-region="review-guidance"`), rather than overlaying it on top of other content, so the future `ReviewDrillPanel` (02-09) has full width and is fully interactive
- Compare/Review buttons styled as plain `<button>` elements (not `GameActionButton`) at the `text-xs font-medium text-white/80` scale used by breakdown chips, to visually distinguish the "learn" row from the primary CTA row per D-23's hierarchy intent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Both shared presentational files (FeedbackSummary + SightReadingLayout) now expose the props/phase contract that plans 02-07/02-08/02-09 need to wire actual handlers (compare-playback, review-mistakes drill, review phase transition). No further edits to these two files should be needed in those plans — they only need to pass callbacks/JSX through the now-established props.

---

_Phase: 02-practice-tooling_
_Completed: 2026-07-10_

## Self-Check: PASSED

- FOUND: src/components/games/sight-reading-game/components/FeedbackSummary.jsx
- FOUND: src/components/games/sight-reading-game/components/SightReadingLayout.jsx
- FOUND: commit 3a7ff0b8
- FOUND: commit 3021ec5a
