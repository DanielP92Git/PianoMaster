---
phase: 08-audio-infrastructure-rhythm-games
plan: "01"
subsystem: audio-rhythm-utils
tags: [audio, vexflow, rhythm, tdd, hooks, utils]
dependency_graph:
  requires: []
  provides:
    - usePianoSampler (src/hooks/usePianoSampler.js)
    - rhythmVexflowHelpers (src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js)
    - rhythmTimingUtils (src/components/games/rhythm-games/utils/rhythmTimingUtils.js)
  affects:
    - Plans 02 and 03 (RhythmReadingGame and RhythmDictationGame depend on all three modules)
tech_stack:
  added: []
  patterns:
    - Web Audio API 2-oscillator synthesis with ADSR envelope
    - Binary rhythm pattern to VexFlow StaveNote conversion
    - Tempo-scaled timing thresholds (ported from MetronomeTrainer)
key_files:
  created:
    - src/hooks/usePianoSampler.js
    - src/hooks/usePianoSampler.test.js
    - src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js
    - src/components/games/rhythm-games/utils/rhythmVexflowHelpers.test.js
    - src/components/games/rhythm-games/utils/rhythmTimingUtils.js
    - src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js
  modified: []
decisions:
  - "usePianoSampler uses 2 oscillators (fundamental + 2nd harmonic at 0.4 gain) with 5ms attack, 80ms decay ADSR"
  - "calculateTimingThresholds ported exactly from MetronomeTrainer BASE_TIMING_THRESHOLDS (50/75/125ms at 120 BPM) with Math.pow(120/tempo, 0.3) scaling"
  - "generateDistractors uses alternating SWAP_LONGER/SWAP_SHORTER maps, compensates adjacent beat to preserve total measure duration"
  - "beatsToVexNotes uses keys=['b/4'] and Stem.UP for all rhythm-only notes per D-01 convention"
metrics:
  duration: "6 minutes"
  completed_date: "2026-03-27"
  tasks: 2
  files: 6
---

# Phase 08 Plan 01: Audio Infrastructure + Rhythm Utilities Summary

**One-liner:** Web Audio 2-oscillator piano synthesis hook + binary-to-VexFlow rhythm converter + tempo-scaled timing thresholds, all with TDD test coverage.

## What Was Built

Three shared utility modules that both RhythmReadingGame (Plan 02) and RhythmDictationGame (Plan 03) depend on:

1. **`usePianoSampler`** — React hook synthesizing piano-like tones via 2 Web Audio oscillators (fundamental + 2nd harmonic) with ADSR envelope. Uses shared `audioContextRef` from `useAudioContext()` — never creates its own AudioContext. iOS resume guard calls `ctx.resume()` synchronously when `ctx.state === 'suspended'`. Exports `NOTE_FREQS` (24 notes C3–B4) and `noteNameToHz()` helper.

2. **`rhythmVexflowHelpers`** — Converts binary pattern arrays from `RhythmPatternGenerator.getPattern()` into VexFlow `StaveNote` objects. `binaryPatternToBeats()` parses run-length encoding (1=onset, 0=sustain). `beatsToVexNotes()` maps duration units to VexFlow codes, all notes at `b/4` with `Stem.UP`, dotted notes get `Dot.buildAndAttach()`.

3. **`rhythmTimingUtils`** — Ported `calculateTimingThresholds()` from MetronomeTrainer (50/75/125ms at 120 BPM, `Math.pow(120/tempo, 0.3)` scaling). `generateDistractors()` creates N patterns each differing by one duration swap while preserving total measure duration. `schedulePatternPlayback()` sequences `playNote` calls via `audioContext.currentTime` offsets.

## Test Results

- 12 tests: `usePianoSampler.test.js` — PASS
- 7 tests: `rhythmVexflowHelpers.test.js` — PASS
- 10 tests: `rhythmTimingUtils.test.js` — PASS
- **29 total new tests, all passing**
- Full suite: 354 passing (4 pre-existing failures unrelated to this plan — missing VITE_SUPABASE_URL env)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | d50aa3a | feat(08-01): add usePianoSampler hook with oscillator synthesis |
| Task 2 | b8cd4c4 | feat(08-01): add rhythm utility modules with VexFlow helpers and timing utils |

## Deviations from Plan

None — plan executed exactly as written.

- `calculateTimingThresholds` base values matched MetronomeTrainer exactly (50/75/125ms, not 50/100/150ms as suggested in plan comments)
- `applySwap` helper extracted as private function for cleaner `generateDistractors` implementation

## Known Stubs

None — all three modules are fully implemented and functional. No placeholder data or hardcoded empty values.

## Self-Check: PASSED

Files created:
- src/hooks/usePianoSampler.js ✓
- src/hooks/usePianoSampler.test.js ✓
- src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js ✓
- src/components/games/rhythm-games/utils/rhythmVexflowHelpers.test.js ✓
- src/components/games/rhythm-games/utils/rhythmTimingUtils.js ✓
- src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js ✓

Commits: d50aa3a, b8cd4c4 — both present in git log.
