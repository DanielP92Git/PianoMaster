---
phase: 02-practice-tooling
plan: 08
subsystem: games
tags: [sight-reading, react, vexflow, audio-playback, vitest]

# Dependency graph
requires:
  - phase: 02-practice-tooling
    provides: "02 (buildPlayedRendition + VexFlowStaffDisplay playbackHighlightIndex prop), 06 (FeedbackSummary onCompare/onReview/gradingMode props + two-row D-23 layout), 07 (stable gradingMode/isPracticeMode locals on SightReadingGame.jsx)"
provides:
  - "handleReplayPreview: DISPLAY-phase on-demand replay, unlimited taps, D-11 double-play guard via previewPlaybackTimeoutRef clear"
  - "startComparison: FEEDBACK-phase played-vs-correct comparison playback (yours-then-correct, chained on useRhythmPlayback's onBeatChange(-1) end signal), empty-yours edge case"
  - "playbackHighlightIndex state wired from SightReadingGame.jsx into VexFlowStaffDisplay, driving the moving staff outline across both comparison passes"
affects:
  [
    "02-09 (review-mistakes mode reuses the same FEEDBACK-phase region and GAME_PHASES set this plan touched)",
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Comparison playback chaining via useRhythmPlayback's onBeatChange(-1) end-of-pattern signal (not setTimeout duration math) — reused unmodified per 02-PATTERNS.md Shared Patterns"
    - "Reset-site completeness: every existing setCurrentNoteIndex(...) reset call site (node-change, loadExercisePattern, replayPattern, returnToSetup, beginPerformanceWithPattern, startGame) also resets the new playbackHighlightIndex sibling state, so a leftover comparison highlight can never bleed into a new pattern/attempt"

key-files:
  created:
    - src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx

key-decisions:
  - "playbackHighlightIndex reset alongside currentNoteIndex at all 6 existing reset sites (node-change effect, loadExercisePattern, replayPattern, returnToSetup, beginPerformanceWithPattern, startGame's flushSync block) — not in the plan's literal task text, but a Rule 2 correctness addition: without it, an interrupted comparison (user taps Try Again mid-playback) would leave a stale outline index that could resurface on the next FEEDBACK entry"
  - "startComparison resumes the audio context via audioEngine.resumeAudioContext() before scheduling playback, mirroring beginPerformanceWithPattern's existing pattern, since the Compare tap is a fresh user gesture and the audio context may have suspended since the last performance"
  - "No 'now playing / yours vs correct' divider or metronome tick was added between passes — RESEARCH.md left this as planner discretion ('keep it simple if unsure'); the moving outline plus the pass transition itself is legible enough for an MVP, and unverified audio-cue additions carry more regression risk than value here"
  - "Task 1 (replay) and Task 2 (comparison) were re-sequenced into two clean commits after initial interleaved authoring, by reverting the file to HEAD and reapplying each task's hunks in isolation, so the git history matches the plan's task boundaries exactly"

patterns-established:
  - "Reset-site completeness for sibling highlight/index state: any new index-shaped React state added alongside an existing per-attempt reset value (like currentNoteIndex) must be added to literally every reset call site of its sibling, not just the 'obvious' ones — verified by grep across all 6 sites"

requirements-completed: [PRAC-01, PRAC-02]

# Metrics
duration: 35min
completed: 2026-07-10
---

# Phase 02 Plan 08: Replay + Comparison Playback Summary

**Wires the two on-demand playback features into `SightReadingGame.jsx`: an unlimited-tap DISPLAY-phase "hear it again" replay button with a double-play guard (PRAC-01), and a FEEDBACK-phase yours-then-correct comparison playback with a moving staff outline, chained on the audio-clock end signal rather than a timer guess (PRAC-02).**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-07-10T11:27:00Z (approx, context gathering)
- **Completed:** 2026-07-10T11:40:00Z
- **Tasks:** 3
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- `handleReplayPreview` added: byte-for-byte the existing DISPLAY auto-play call (`rhythmPlayback.play(pattern.notes, ...)`), guarded on `gamePhaseRef.current === GAME_PHASES.DISPLAY`, clearing `previewPlaybackTimeoutRef` first so a fast tap can never double-play against the pending 500ms auto-play timeout (D-11). No cap — unlimited taps (D-08). Rendered as a secondary-styled (`bg-white/10`) sibling button next to the primary green "Start Playing" CTA, visible only in DISPLAY.
- `startComparison` added: reconstructs the child's rendition via `buildPlayedRendition` (02-02), plays it, then chains the correct pattern on `useRhythmPlayback`'s `onBeatChange(-1)` end-of-pattern signal — never a `setTimeout` duration guess. A new `playbackHighlightIndex` state drives the moving staff outline (already-additive in `VexFlowStaffDisplay` from 02-02) across both passes, reset to `-1` on pass completion. If everything was missed (`yours` reconstructs empty), pass 1 is skipped entirely and only the correct pattern plays.
- `FeedbackSummary`'s existing `onCompare` prop (02-06) is wired to `startComparison`; `VexFlowStaffDisplay`'s existing `playbackHighlightIndex` prop (02-02) is wired to the new state.
- `playbackHighlightIndex` reset added at all 6 existing `currentNoteIndex`-reset call sites (Rule 2 — see Decisions) so a comparison interrupted mid-playback can never leave a stale outline.
- New `SightReadingGame.replay.test.jsx` (3 tests, reusing the combo test's mock harness plus a `useRhythmPlayback` play/stop spy mock and `vi.useFakeTimers()`): double-play guard (play called exactly once after replay-tap-then-timer-flush), DISPLAY-only visibility, unlimited taps each calling play.
- Full sight-reading suite green (14 files / 162 tests); full `npm run test:run` green (95 files / 2011 passed, 13 todo, 2 skipped — up from the pre-plan 2008/13/2 baseline by exactly the 3 new tests); `npm run lint` clean (0 errors, 125 pre-existing warnings, none in this plan's files).

## Task Commits

Each task was committed atomically:

1. **Task 1: Replay button + handler (PRAC-01)** - `ea0290d0` (feat)
2. **Task 2: Comparison playback (PRAC-02) — startComparison + staff highlight + wire Compare button** - `029a7523` (feat)
3. **Task 3: Replay double-play regression test** - `f889b3ec` (test)

## Files Created/Modified

- `src/components/games/sight-reading-game/SightReadingGame.jsx` - `handleReplayPreview` + replay button (Task 1); `playbackHighlightIndex` state, `startComparison`, `buildPlayedRendition` import, `VexFlowStaffDisplay`/`FeedbackSummary` prop wiring, and the 6 reset-site additions (Task 2)
- `src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx` - NEW: 3 tests covering the D-11 double-play guard, DISPLAY-only button visibility, and unlimited-tap behavior

## Decisions Made

See frontmatter `key-decisions` for the full list. Highlights:

- Re-sequenced authoring into two clean per-task commits by reverting the working file to HEAD and reapplying each task's hunks in isolation (rather than committing the interleaved diff as-authored), so the git history matches the plan's task boundaries exactly for reviewability.
- Added `playbackHighlightIndex` resets to all 6 sites where `currentNoteIndex` is already reset, closing a correctness gap the plan didn't explicitly call out (an interrupted comparison could otherwise leave a stale highlight index).
- No divider/tick between comparison passes — left as planner discretion per RESEARCH.md, and the simpler implementation carries less regression risk for an MVP.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Reset `playbackHighlightIndex` at every existing `currentNoteIndex` reset site**

- **Found during:** Task 2 implementation, while wiring `startComparison`
- **Issue:** The plan's `startComparison` code example resets `playbackHighlightIndex` to `-1` only on normal pass completion. If a user interrupts a comparison mid-playback (e.g. taps "Try Again" while pass 1 or pass 2 is still playing), the state would remain a stale positive index. On the next FEEDBACK entry, `VexFlowStaffDisplay`'s gate (`gamePhase === "feedback" && playbackHighlightIndex >= 0`) would apply a leftover outline to whatever note happens to sit at that index in the new pattern — a subtle visual bug.
- **Fix:** Added `setPlaybackHighlightIndex(-1)` alongside every existing `setCurrentNoteIndex(...)` reset call: the node-change effect, `loadExercisePattern`, `replayPattern`, `returnToSetup`, `beginPerformanceWithPattern`, and `startGame`'s `flushSync` block (6 sites total, verified by grep).
- **Files modified:** src/components/games/sight-reading-game/SightReadingGame.jsx
- **Verification:** Full sight-reading suite green after the change (162/162); no behavior regression in any existing reset-path test.
- **Committed in:** `029a7523` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 2 — missing critical correctness safeguard)
**Impact on plan:** Necessary for correctness (prevents a stale-highlight visual bug on interrupted comparisons). No scope creep — no new components, no architectural changes, no new props beyond what 02-02/02-06 already established.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both on-demand playback features (PRAC-01 replay, PRAC-02 comparison) are fully wired, tested, and requirements marked complete in `.planning/REQUIREMENTS.md`.
- `GAME_PHASES` was NOT modified in this plan (no `REVIEW` phase added) — that remains 02-09's responsibility per the plan's stated scope boundary.
- `VexFlowStaffDisplay`'s `highlightNote` already gates its comparison-outline branch on `gamePhase === "feedback" || gamePhase === "review"`, so once 02-09 adds the `REVIEW` phase, no further change to that gate is needed.
- Full `npm run test:run` (2011/2011 passed, 13 todo, 2 skipped) and `npm run lint` (0 errors) clean; ready for phase-level verification.

---

_Phase: 02-practice-tooling_
_Completed: 2026-07-10_

## Self-Check: PASSED

- FOUND: src/components/games/sight-reading-game/SightReadingGame.jsx
- FOUND: src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx
- FOUND commit: ea0290d0
- FOUND commit: 029a7523
- FOUND commit: f889b3ec
