---
phase: 08-detection-pipeline
verified: 2026-02-22T18:20:00Z
status: passed
score: 5/5 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 0/5
  gaps_closed:
    - "Eighth notes at 120 BPM register individually — BPM-adaptive timing now computes onFrames/offMs/changeFrames dynamically via calcMicTimingFromBpm"
    - "Quarter notes at 60 BPM do not multi-score — per-note lastScoredRef dedup guard added in both SightReadingGame and NotesRecognitionGame scoring handlers"
    - "Rapid note alternation (C4/D4) does not produce phantom detections — formal IDLE/ARMED/ACTIVE FSM replaces ad-hoc candidateFrames counting"
    - "Bass trail nodes detect A2 and B2 — MIN_MIDI lowered from 48 (C3) to 45 (A2) in usePitchDetection.js"
    - "BPM context flows from game settings into detection hooks — both games compute micTiming via calcMicTimingFromBpm and spread into useMicNoteInput"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Play eighth notes at 120 BPM and observe note registration"
    expected: "Each note registers individually with no merging or skipping"
    why_human: "Requires a real microphone and piano; cannot simulate rAF timing in static analysis"
  - test: "Hold a single quarter note for 2 beats at 60 BPM and observe scoring"
    expected: "Exactly one scoring event fires, not two or more"
    why_human: "Requires live audio to observe multiple-detection behavior with real mic input"
---

# Phase 8: Detection Pipeline Verification Report

**Phase Goal:** All note durations from quarter through sixteenth are detected reliably at 60-120 BPM — onset and note-off timing scale dynamically with the playing tempo and duration, the detection state machine prevents pitch flicker, and the game scoring layer never double-scores one played note
**Verified:** 2026-02-22T18:20:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (Plans 08-01 and 08-02)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Eighth notes at 120 BPM register individually — no fixed-window merging | VERIFIED | `calcMicTimingFromBpm(120, '8')` computes `onFrames=2, offMs=100, changeFrames=3, minInterOnMs=63` — adapts to tempo; both games spread `...micTiming` into `useMicNoteInput` |
| 2 | Quarter notes at 60 BPM do not multi-score for a single key press | VERIFIED | `lastScoredRef` + dedup guard in `handleNoteEvent` (SightReadingGame lines 832-839) and `handleMicNoteEvent` (NotesRecognitionGame lines 1658-1664); window = `minInterOnMs * 2` |
| 3 | Rapid C4/D4 alternation does not produce phantom detections | VERIFIED | `FSM = { IDLE, ARMED, ACTIVE }` enum at module scope in `useMicNoteInput.js` line 15; explicit state transitions in `handlePitchDetected` (IDLE->ARMED->ACTIVE) and `handleLevelChange` (ACTIVE/ARMED->IDLE) |
| 4 | Bass trail nodes detect A2 and B2 | VERIFIED | `const MIN_MIDI = 45; // A2` at line 28 of `usePitchDetection.js`; JSDoc updated to "A2 (MIDI 45) to C6 (MIDI 84)"; A2=MIDI45 and B2=MIDI47 both within range |
| 5 | BPM context flows from game settings into detection hooks automatically | VERIFIED | `SightReadingGame` computes `micTiming` from `gameSettings.tempo` (lines 849-857, falls back to static preset); `NotesRecognitionGame` computes from `settings.tempo || settings.bpm || 90` (lines 1683-1687, always has a value); both spread `...micTiming` into `useMicNoteInput` |

**Score: 5/5 truths verified**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/micInputPresets.js` | `calcMicTimingFromBpm` utility function | VERIFIED | Exported at line 17; full implementation with beatMs, noteMs, four derived params with floor values; JSDoc with example output |
| `src/hooks/useMicNoteInput.js` | IDLE/ARMED/ACTIVE FSM replacing candidateFrames | VERIFIED | `FSM` enum at line 15; `fsmState` in `stateRef.current`; `handlePitchDetected` uses explicit FSM branch per state; `fsmState` in debug object |
| `src/hooks/usePitchDetection.js` | `MIN_MIDI = 45` covering A2 | VERIFIED | Line 28: `const MIN_MIDI = 45; // A2`; JSDoc describes range as "A2 (MIDI 45)" |
| `src/components/games/sight-reading-game/SightReadingGame.jsx` | BPM-derived timing + per-note dedup | VERIFIED | Imports `calcMicTimingFromBpm` (line 10); `micTiming` useMemo (line 849); `...micTiming` spread in useMicNoteInput (line 863); `lastScoredRef` (line 787); dedup guard in `handleNoteEvent` (lines 832-839) |
| `src/components/games/notes-master-games/NotesRecognitionGame.jsx` | BPM-derived timing + per-note dedup | VERIFIED | Imports `calcMicTimingFromBpm` (line 28); `micTiming` useMemo (line 1683); `...micTiming` spread in useMicNoteInput (line 1698); `lastScoredRef` (line 635); dedup guard in `handleMicNoteEvent` (lines 1658-1664) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `micInputPresets.js` | `SightReadingGame.jsx` | `import { calcMicTimingFromBpm }` | WIRED | Import at line 10; useMemo at line 849 computes timing from `gameSettings.tempo` |
| `micInputPresets.js` | `NotesRecognitionGame.jsx` | `import { calcMicTimingFromBpm }` | WIRED | Import at line 28; useMemo at line 1683 with 90 BPM fallback |
| `gameSettings.tempo` | `useMicNoteInput` params | `micTiming` useMemo spread | WIRED | SightReadingGame: `gameSettings?.tempo || gameSettings?.bpm` -> `calcMicTimingFromBpm` -> `...micTiming`; NotesRecognitionGame: `settings?.tempo || settings?.bpm || 90` |
| `handleNoteEvent` | scoring dedup | `lastScoredRef` guard | WIRED | Lines 832-839: checks `last.pitch === event.pitch && now - last.time < minScoreInterval * 2` before calling `handleNoteDetectedRef.current` |
| `handleMicNoteEvent` | scoring dedup | `lastScoredRef` guard | WIRED | Lines 1658-1664: checks dedup before calling `handleAnswerSelect` |
| `usePitchDetection.frequencyToNote` | A2/B2 detection | `MIN_MIDI = 45` | WIRED | A2=MIDI45 and B2=MIDI47 both >= 45; notes pass through `frequencyToNote` filter |
| `FSM` enum | `useMicNoteInput` state machine | `fsmState` in `stateRef` | WIRED | `FSM.IDLE/ARMED/ACTIVE` used in `handlePitchDetected` and `handleLevelChange`; explicit transitions with emit calls |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PIPE-01 | 08-01 | Dynamic `onFrames` scales with BPM and note duration | SATISFIED | `calcMicTimingFromBpm`: `onFrames = Math.max(2, Math.round(noteMs * 0.15 / 16.7))` — tempo-dependent |
| PIPE-02 | 08-01 | Dynamic `offMs` scales with BPM and note duration | SATISFIED | `calcMicTimingFromBpm`: `offMs = Math.max(60, Math.round(noteMs * 0.4))` — scales with noteMs |
| PIPE-03 | 08-01 | Formal IDLE/ARMED/ACTIVE FSM in `useMicNoteInput` | SATISFIED | `const FSM = { IDLE: 'IDLE', ARMED: 'ARMED', ACTIVE: 'ACTIVE' }` at module scope; `fsmState` field in stateRef; explicit state transitions in two callbacks |
| PIPE-04 | 08-01 | Full piano frequency map covers A2, B2 and full trail pool | SATISFIED | `MIN_MIDI = 45` (A2); MIDI 45=A2 and MIDI 47=B2 both in [45, 84] range |
| PIPE-05 | 08-02 | BPM/duration context propagated from game components into hooks | SATISFIED | Both games import `calcMicTimingFromBpm`, compute `micTiming` from settings, spread into `useMicNoteInput` |
| PIPE-06 | 08-02 | Per-note debouncing in game scoring layer prevents double-scoring | SATISFIED | `lastScoredRef` + `minInterOnMs * 2` dedup guard in both `handleNoteEvent` and `handleMicNoteEvent` before scoring calls |

All six PIPE requirements satisfied. REQUIREMENTS.md status table confirms all as Complete.

---

## Commit Verification

All four commits documented in SUMMARYs confirmed present in git log:

| Commit | Description |
|--------|-------------|
| `7f4a2e5` | feat(08-01): add calcMicTimingFromBpm utility and lower MIN_MIDI to A2 |
| `ed91205` | feat(08-01): refactor useMicNoteInput to formal IDLE/ARMED/ACTIVE FSM |
| `3316948` | feat(08-02): wire BPM timing and per-note scoring dedup into SightReadingGame |
| `a6026ab` | feat(08-02): wire BPM timing and per-note scoring dedup into NotesRecognitionGame |

---

## Anti-Patterns Found

No new anti-patterns found in the modified files. The pre-existing test failure in `SightReadingGame.micRestart.test.jsx` (1 of 30 tests) was confirmed pre-existing before Phase 08 changes by both plan summaries and is not a regression from this phase's work.

---

## Human Verification Required

### 1. Eighth Note Merging at 120 BPM

**Test:** At 120 BPM, play eighth notes repeatedly (C4, D4, C4, D4...) with mic detection active in SightReadingGame
**Expected:** Each note registers as a distinct scoring event
**Why human:** Requires live audio; static analysis cannot simulate rAF frame timing with actual mic latency

### 2. Long Note Double-Scoring at 60 BPM

**Test:** At 60 BPM, hold a single quarter note for its full duration in SightReadingGame
**Expected:** Exactly one scoring event fires per held note
**Why human:** Double-scoring depends on live pitch detection stability and mic hardware behavior

---

## Re-verification Summary

All five gaps from the initial verification (score 0/5) have been closed by Plans 08-01 and 08-02.

**Plan 08-01 closed gaps 1, 3, 4, and 5 (foundation):**
- Added `calcMicTimingFromBpm` to `src/hooks/micInputPresets.js` (PIPE-01, PIPE-02)
- Refactored `useMicNoteInput` to formal IDLE/ARMED/ACTIVE FSM (PIPE-03)
- Lowered `MIN_MIDI` from 48 to 45 in `src/hooks/usePitchDetection.js` (PIPE-04)

**Plan 08-02 closed gaps 2 and 5 (wiring):**
- Wired `calcMicTimingFromBpm` from game settings into `useMicNoteInput` in both games (PIPE-05)
- Added `lastScoredRef` per-note scoring dedup in both game scoring handlers (PIPE-06)

No regressions detected. External APIs for all three hooks (`useMicNoteInput`, `usePitchDetection`, `micInputPresets`) are backward-compatible — `MIC_INPUT_PRESETS` object unchanged, hook prop signatures unchanged, return shapes unchanged.

---

*Verified: 2026-02-22T18:20:00Z*
*Verifier: Claude (gsd-verifier)*
