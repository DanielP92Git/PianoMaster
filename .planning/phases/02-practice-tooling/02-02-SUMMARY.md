---
phase: 02-practice-tooling
plan: 02
subsystem: ui
tags: [react, vexflow, sight-reading, comparison-playback, vitest]

# Dependency graph
requires:
  - phase: 02-practice-tooling
    provides: 02-CONTEXT.md / 02-RESEARCH.md / 02-PATTERNS.md design decisions (D-12/D-13/D-14, RESEARCH.md Pitfall 6)
provides:
  - "buildPlayedRendition(patternNotes, performanceResults): pure reconstructor of the child's played rendition for played-vs-correct comparison playback"
  - "VexFlowStaffDisplay playbackHighlightIndex prop: additive outline overlay on a single note during feedback/review"
affects: [02-08 (wires these into SightReadingGame's feedback phase)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure reconstruction module pattern (no React, JSDoc per export) matching scoreCalculator.js shape"
    - "Additive prop overlay pattern for VexFlowStaffDisplay: new highlight logic appended after existing fill loop, never replacing it"

key-files:
  created:
    - src/components/games/sight-reading-game/utils/comparisonPattern.js
    - src/components/games/sight-reading-game/utils/comparisonPattern.test.js
  modified:
    - src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx

key-decisions:
  - "buildPlayedRendition implemented as pure function with zero I/O per T-02-03 mitigation (no raw audio, no persistence, no new PII)"
  - "playbackHighlightIndex overlay uses classList.add + stroke-width bump (VexFlow group styling fallback) rather than a CSS class, matching this file's existing inline-attribute styling convention (no vf-stavenote CSS rules exist anywhere in the codebase)"

patterns-established:
  - "Additive VexFlowStaffDisplay overlay: new visual states extend highlightNote() after the existing getNoteColor loop rather than branching inside it, keeping feedback-phase result coloring untouched"

requirements-completed: [] # PRAC-02 building blocks landed here, but the requirement (audible/visible feedback-phase comparison playback) is not user-observable until Plan 02-08 wires buildPlayedRendition + playbackHighlightIndex into SightReadingGame's feedback phase (02-08-PLAN.md also lists PRAC-02). Deferring the REQUIREMENTS.md checkbox to 02-08 to avoid a false-positive "done" signal.

# Metrics
duration: 12min
completed: 2026-07-10
---

# Phase 02 Plan 02: Comparison Playback Building Blocks Summary

**Pure `buildPlayedRendition` reconstructor (child's rendition from in-memory performanceResults) plus an additive `playbackHighlightIndex` prop on VexFlowStaffDisplay for the played-vs-correct comparison playback (PRAC-02).**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-10T06:07:00Z
- **Completed:** 2026-07-10T06:17:34Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `buildPlayedRendition` reconstructs the child's rendition from `performanceResults`: correct notes offset by real `timeDiff`, wrong-pitch notes at the detected pitch, missed notes omitted (silence — the lesson), rests and unmappable pitches skipped, `noteIndex` carried through for staff-highlight mapping
- Closed RESEARCH.md Pitfall 6: `VexFlowStaffDisplay` now accepts `playbackHighlightIndex` and draws a non-destructive outline/stroke-width overlay on a single note during feedback/review, without disturbing the existing `getNoteColor` result-color fills
- 8/8 new unit tests green covering all seven behavior cases from the plan; full sight-reading-game suite (136/136) still green after the VexFlowStaffDisplay change

## Task Commits

Each task was committed atomically:

1. **Task 1: Create comparisonPattern.js (buildPlayedRendition) + test** - `048d15ac` (feat)
2. **Task 2: Add additive playbackHighlightIndex prop to VexFlowStaffDisplay** - `c221fdb7` (feat)

_Note: Task 1 was TDD-tagged in the plan, but since the reference implementation was provided verbatim in `<action>`, the test suite and implementation were authored together and verified green before commit (equivalent outcome to RED→GREEN, single commit)._

## Files Created/Modified

- `src/components/games/sight-reading-game/utils/comparisonPattern.js` - NEW pure module exporting `buildPlayedRendition(patternNotes, performanceResults)`
- `src/components/games/sight-reading-game/utils/comparisonPattern.test.js` - NEW test file, 8 tests covering all behavior cases (correct/wrong-pitch/missed/rest/unmappable-pitch/empty-input/noteIndex-carry)
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` - Added `playbackHighlightIndex` prop (default `-1`), extended `highlightNote` additively with an outline/stroke-width overlay branch gated on `gamePhase === "feedback" || gamePhase === "review"` and `playbackHighlightIndex >= 0`, added the prop to `highlightNote`'s deps and the effect that invokes it

## Decisions Made

- `buildPlayedRendition` copied verbatim from the plan's verified reference implementation (cross-checked against the live `performanceResults` shape and `useRhythmPlayback.play()`'s consumed fields) — no deviation needed.
- Chose `classList.add("vf-playback-highlight") + stroke-width` bump for the overlay instead of authoring new CSS, since the codebase's existing note-coloring approach in this file is 100% inline SVG attributes (no `.vf-stavenote` CSS rules exist anywhere) — staying consistent with that pattern for the outline overlay.
- Left `PRAC-02` unchecked in `.planning/REQUIREMENTS.md` despite it being listed in this plan's frontmatter `requirements` field: this plan ships isolated, non-user-facing building blocks only. `02-08-PLAN.md` also lists `PRAC-02` in its own frontmatter and is the plan that actually wires `buildPlayedRendition`/`playbackHighlightIndex` into `SightReadingGame.jsx`'s feedback phase, making the comparison playback audible/visible for the first time. Marking the checkbox here would falsely signal the requirement is user-observably complete.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria were met without needing any Rule 1-4 auto-fixes.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `buildPlayedRendition` and `playbackHighlightIndex` are both ready to be wired into `SightReadingGame.jsx`'s feedback phase by Plan 02-08 (per the objective's stated hand-off).
- No blockers. Both artifacts are isolated, pure/additive, and fully test-covered in isolation ahead of integration.

---

_Phase: 02-practice-tooling_
_Completed: 2026-07-10_

## Self-Check: PASSED

- FOUND: src/components/games/sight-reading-game/utils/comparisonPattern.js
- FOUND: src/components/games/sight-reading-game/utils/comparisonPattern.test.js
- FOUND: src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx
- FOUND: commit 048d15ac
- FOUND: commit c221fdb7
