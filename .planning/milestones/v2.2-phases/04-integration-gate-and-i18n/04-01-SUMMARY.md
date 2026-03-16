---
phase: 04-integration-gate-and-i18n
plan: 01
subsystem: ui
tags: [trail, vexflow, midi, enharmonic, subscription-gate, vitest]

# Dependency graph
requires:
  - phase: 03-bass-accidentals-content
    provides: "trebleUnit4/5 and bassUnit4/5 node files ready to wire in"
provides:
  - "expandedNodes.js wired with trebleUnit4/5 and bassUnit4/5 — 36 new accidental nodes live on trail (129 total)"
  - "SightReadingGame.jsx uses MIDI comparison at anti-cheat and scoring sites — enharmonic mic detection handled"
  - "Enharmonic test suite (12 tests) proving all 5 pairs resolve equal via noteToMidi"
  - "Subscription gate default-deny confirmed for all 36 new accidental nodes (INTG-02)"
affects: [SightReadingGame, expandedNodes, subscriptionConfig, TrailMap]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MIDI comparison for pitch matching: noteToMidi(detected) === noteToMidi(expected) instead of string equality"
    - "Anti-cheat guard uses same MIDI comparison so flat-form notes in pool don't trigger false cheat detection"
    - "Null guard pattern: detectedMidi != null before comparison to prevent null === null false matches"

key-files:
  created:
    - src/components/games/sight-reading-game/__tests__/enharmonicMatching.test.js
  modified:
    - src/data/expandedNodes.js
    - src/components/games/sight-reading-game/SightReadingGame.jsx

key-decisions:
  - "SEMITONE_MAP and noteToMidi duplicated verbatim in test file (not exported from SightReadingGame.jsx) — pure function test of existing local logic"
  - "Both anti-cheat (line ~1610) and scoring (line ~1688) patched atomically — fixing only one would leave enharmonic false-cheat-detection bug active"
  - "Default-deny confirmed: no new accidental node IDs added to FREE_NODE_IDS in subscriptionConfig.js"
  - "Trail grows from 93 to 129 nodes after wiring — XP variance warning pre-existing and non-blocking"

patterns-established:
  - "Enharmonic pitch matching: always use noteToMidi MIDI number comparison, never string equality for pitch comparison"
  - "TDD RED phase: pure function tests pass immediately when testing existing correct logic (not a failure — the existing MIDI math was already correct)"

requirements-completed: [INTG-01, INTG-02, INTG-03]

# Metrics
duration: 4min
completed: 2026-03-16
---

# Phase 04 Plan 01: Integration, Gate, and i18n — Plan 01 Summary

**36 new accidental nodes (trebleUnit4/5 + bassUnit4/5) wired into trail via expandedNodes.js, plus MIDI-based enharmonic pitch matching fixes in SightReadingGame so mic-detected C#4 correctly scores against Db4 in note pool**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-16T16:29:02Z
- **Completed:** 2026-03-16T16:32:41Z
- **Tasks:** 2 (TDD task + wiring task)
- **Files modified:** 3 created/modified (+ 1 test file created)

## Accomplishments
- Wired trebleUnit4Nodes (8 sharps nodes), trebleUnit5Nodes (10 flats/boss nodes), bassUnit4Nodes (8 sharps nodes), and bassUnit5Nodes (10 flats/boss nodes) into EXPANDED_NODES, EXPANDED_TREBLE_NODES, and EXPANDED_BASS_NODES — trail grows from 93 to 129 nodes
- Fixed SightReadingGame.jsx at both comparison sites (anti-cheat gate and scoring) to use MIDI-based enharmonic comparison — mic always reports sharp-form (C#4), note pool may contain flat-form (Db4), previously scored as wrong
- Added 12-test enharmonic test suite covering all 5 enharmonic pairs (C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb), non-enharmonic inequality, and null safety
- Confirmed subscription gate default-deny: no new accidental node IDs appear in FREE_NODE_IDS (INTG-02)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: enharmonic test file** - `fd069f3` (test)
2. **Task 1 GREEN: SightReadingGame MIDI fixes** - `08ad440` (feat)
3. **Task 2: wire units into expandedNodes.js** - `b361313` (feat)

**Plan metadata:** TBD (docs: complete plan)

_Note: TDD task had RED commit (test) + GREEN commit (feat). No refactor needed._

## Files Created/Modified
- `src/components/games/sight-reading-game/__tests__/enharmonicMatching.test.js` - 12 tests proving all 5 enharmonic pairs, non-enharmonic inequality, and null safety via noteToMidi
- `src/components/games/sight-reading-game/SightReadingGame.jsx` - MIDI comparison at anti-cheat (line ~1610) and scoring (line ~1688)
- `src/data/expandedNodes.js` - 4 new imports + spreads into 3 export arrays; file header updated to reflect Units 1-5

## Decisions Made
- SEMITONE_MAP and noteToMidi duplicated verbatim in test file — they are local to SightReadingGame.jsx (not exported), so the test file independently verifies the pure function logic
- Both anti-cheat and scoring sites fixed atomically — if only one were fixed, Db4-in-pool would still trigger false cheat detection while scoring correctly (or vice versa)
- Subscription gate requires no code changes — default-deny means any node ID not in FREE_NODE_IDS is premium-only; confirmed via grep
- TDD RED phase: tests passed immediately because noteToMidi already handled enharmonics correctly via SEMITONE_MAP — the fix was at the USAGE SITES (string equality → MIDI comparison), not in the function itself

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected test MIDI value expectations during RED phase**
- **Found during:** Task 1 (TDD RED phase)
- **Issue:** Test expected C#4 = MIDI 49, but actual formula `(octave+1)*12 + semi` gives C#4 = 61 (same convention as standard MIDI where C4=60). The SEMITONE_MAP was correct; test assertions had wrong expected constants.
- **Fix:** Updated test expectations to correct MIDI values per formula (C4=60, C#4=61, D#4=63, F#4=66, G#4=68, A#4=70, C4=60, D4=62)
- **Files modified:** `src/components/games/sight-reading-game/__tests__/enharmonicMatching.test.js`
- **Verification:** All 12 tests pass after correction
- **Committed in:** fd069f3 (included in RED commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test assertion bug)
**Impact on plan:** Trivial correction to MIDI arithmetic in test expectations. No scope creep.

## Issues Encountered
- Initial test MIDI values used standard General MIDI convention (C4=48) instead of the formula-derived convention used in this codebase (C4=60 where formula is `(octave+1)*12+semi`). Corrected immediately.

## User Setup Required
None - no external service configuration required.

## Self-Check

- FOUND: src/components/games/sight-reading-game/__tests__/enharmonicMatching.test.js
- FOUND: src/data/expandedNodes.js (contains trebleUnit4Nodes import)
- FOUND: src/components/games/sight-reading-game/SightReadingGame.jsx (contains noteToMidi at scoring sites)
- FOUND commit: fd069f3 (Task 1 RED — enharmonic test file)
- FOUND commit: 08ad440 (Task 1 GREEN — SightReadingGame MIDI fixes)
- FOUND commit: b361313 (Task 2 — expandedNodes.js wiring)

## Self-Check: PASSED

## Next Phase Readiness
- All 36 new accidental nodes wired into trail — visible and playable
- Subscription gate confirmed default-deny for all 36 new nodes — premium content protected
- Enharmonic mic scoring fixed — flat notes score correctly in Sight Reading exercises
- Phase 04 Plan 01 complete; Plan 02 (i18n translations) was already executed

---
*Phase: 04-integration-gate-and-i18n*
*Completed: 2026-03-16*
