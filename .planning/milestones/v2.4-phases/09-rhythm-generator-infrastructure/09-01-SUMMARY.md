---
phase: 09-rhythm-generator-infrastructure
plan: 01
subsystem: ui
tags: [rhythm, 6/8, compound-time, metronome, pattern-generator, timing, vexflow]

# Dependency graph
requires:
  - phase: []
    provides: "No prior phase dependency — fixes a root constant bug"
provides:
  - "Fixed SIX_EIGHT constant: beats=2 (not 6), subdivisions=6"
  - "Compound-aware secondsPerSixteenth in patternBuilder (beatDuration/unitsPerBeat)"
  - "Fixed generatePattern and getPattern fallback: subdivisions-aware position multiplier"
  - "Fixed convertFractionalToBinary: uses subdivisions??beats for 6-slot fractional patterns"
  - "MetronomeTrainer: 4-compound-beat count-in for 6/8, compound-aware tap evaluation"
  - "MetronomeDisplay: 6 subdivision circles for 6/8 with positions 1 and 4 visually accented"
  - "rhythmGenerator: compound-time beat close allows single eighth to fill 6-unit beat remainder"
affects: [10-syncopation-nodes, rhythm-game-content, 6/8-node-data]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "subdivisions??beats pattern: compound time properties use explicit subdivisions field; simple time falls back to beats"
    - "compound-time beat close: single eighth allowed when it exactly fills remaining beat space"
    - "unitsPerBeat-based secondsPerSixteenth: timing calculations use resolvedSignature.unitsPerBeat, not hardcoded /4"

key-files:
  created: []
  modified:
    - src/components/games/rhythm-games/RhythmPatternGenerator.js
    - src/components/games/sight-reading-game/utils/patternBuilder.js
    - src/components/games/sight-reading-game/utils/rhythmGenerator.js
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
    - src/components/games/rhythm-games/components/MetronomeDisplay.jsx
    - src/components/games/sight-reading-game/utils/rhythmGenerator.test.js
    - src/components/games/sight-reading-game/utils/patternBuilder.test.js

key-decisions:
  - "SIX_EIGHT.beats changed 6→2; new subdivisions:6 field added so downstream consumers can still access the 6-position grid without division"
  - "generatePattern position multiplier uses measureLength/(subdivisions??beats): 4/4 gives 16/4=4 (unchanged), 6/8 gives 12/6=2 (correct eighth-note mapping)"
  - "rhythmGenerator fillBeatSimple compound-time close: single eighth allowed when leftInBeat===eighthUnits — handles q+8 fills within 6-unit compound beats"
  - "MetronomeTrainer count-in: isCompound ? beats*2 : beats — 2-measure count-in for 6/8, 1-measure for simple time"
  - "MetronomeTrainer compound metronome: subdivisionDur = beatDur/3 (3 eighth-note subdivisions per dotted-quarter beat)"

patterns-established:
  - "subdivisions??beats: any code computing per-subdivision multipliers should use this pattern to remain compound-time safe"
  - "isCompound guard: MetronomeTrainer uses isCompound flag before switching to subdivision-based scheduling"

requirements-completed: [RFIX-01]

# Metrics
duration: 15min
completed: 2026-03-18
---

# Phase 09 Plan 01: Fix 6/8 Compound Beat Model Summary

**SIX_EIGHT constant fixed from beats:6 to beats:2 with subdivisions:6, cascading correct timing through patternBuilder, rhythmGenerator, MetronomeTrainer count-in/tap-eval, and MetronomeDisplay subdivision circles**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-18T20:59:00Z
- **Completed:** 2026-03-18T21:08:00Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Fixed the root cause: `SIX_EIGHT.beats` changed from 6 to 2, `subdivisions: 6` added — all downstream consumers now derive correct `unitsPerBeat=6` via `durationConstants.buildTimeSignatureGrid`
- Fixed patternBuilder: `secondsPerSixteenth = beatDurationSeconds / unitsPerBeat` (not `/4`) — 6/8 at 60 BPM now gives 0.1667s per sixteenth, not 0.25s
- Fixed MetronomeTrainer: count-in plays 4 compound beats for 6/8; tap evaluation uses compound-aware beat positions; visual/audio metronome tracks 6 subdivisions with downbeat accents at positions 1 and 4
- Fixed MetronomeDisplay: shows `subdivisions??beats` circles; accented positions from `strongBeats` array; beats 1 and 4 larger for 6/8
- Added 6 new tests proving 6/8 correctness: total units=12, beat indices span 0-1, unitsPerBeat=6, timing ~0.1667s/sixteenth
- All 175 tests pass; production build clean

## Task Commits

Each task was committed atomically:

1. **TDD RED - failing 6/8 tests** - `0bb87fc` (test)
2. **Task 1: Fix SIX_EIGHT, patternBuilder timing, generatePattern fallback** - `60356dd` (feat)
3. **Task 2: Fix MetronomeTrainer compound count-in, tap eval, visual display** - `d1aa4dd` (feat)

## Files Created/Modified

- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — SIX_EIGHT beats:2 subdivisions:6; generatePattern uses subdivisions-aware multiplier; getPattern fallback and convertFractionalToBinary fixed
- `src/components/games/sight-reading-game/utils/patternBuilder.js` — secondsPerSixteenth = beatDurationSeconds / unitsPerBeat
- `src/components/games/sight-reading-game/utils/rhythmGenerator.js` — compound-time beat close: allows single eighth to fill 6-unit compound beat remainder
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — count-in isCompound guard; unitsPerBeat for tap eval at both locations; compound subdivision scheduling/visual tracking
- `src/components/games/rhythm-games/components/MetronomeDisplay.jsx` — subdivisions??beats display count; strongBeats-based accent detection; different circle sizes for accented vs unaccented
- `src/components/games/sight-reading-game/utils/rhythmGenerator.test.js` — 3 new 6/8 tests (total units, beat span, resolves to unitsPerBeat=6)
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js` — 3 new 6/8 tests (timing ~0.1667, 4/4 regression 0.75, total units=12)

## Decisions Made

- Used `subdivisions ?? beats` pattern throughout: simple time has no `subdivisions` field, so `??` falls back to `beats` keeping 4/4/3/4/2/4 unchanged
- `rhythmGenerator` compound-time close: the "no orphaned eighth" rule is relaxed when an eighth exactly fills the last slot of a compound beat, since this is a beat boundary (not syncopation)
- `MetronomeTrainer` count-in: `beats * 2` for compound time gives 4 compound beats (2 measures) — enough to feel the dotted-quarter pulse before playing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] rhythmGenerator fillBeatSimple could not close 6-unit compound beats**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** `fillBeatSimple` enforced the "eighths must be paired" rule, preventing a single eighth from closing a compound beat after a quarter note (4+2=6). The function broke at leftInBeat=2 with only eighth available
- **Fix:** Added compound-time close case: if eighth fits exactly (leftInBeat === eighthUnits), allow a single eighth to close the beat — this is a beat boundary, not syncopation
- **Files modified:** `src/components/games/sight-reading-game/utils/rhythmGenerator.js`
- **Verification:** `generateRhythmEvents({timeSignature:'6/8',...})` produces 12 total units; all 43 rhythm+patternBuilder tests pass
- **Committed in:** `60356dd` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Essential fix for correctness — without it, 6/8 patterns were under-filled (8 units instead of 12). No scope creep.

## Issues Encountered

None beyond the auto-fixed deviation above.

## Next Phase Readiness

- 6/8 infrastructure is now correct end-to-end: pattern generation, timing, metronome visual, count-in, tap evaluation
- Phase 09-02 (VexFlow beam grouping for 6/8) can proceed — the beat model is now stable
- Phase 10 (syncopation nodes) and any 6/8 rhythm trail node data are unblocked

---
*Phase: 09-rhythm-generator-infrastructure*
*Completed: 2026-03-18*
