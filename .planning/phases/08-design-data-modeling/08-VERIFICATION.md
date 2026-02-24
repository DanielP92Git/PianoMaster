---
phase: 08-detection-pipeline
verified: 2026-02-24T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 5/5
  gaps_closed: []
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
**Verified:** 2026-02-24T00:00:00Z
**Status:** passed
**Re-verification:** Yes — regression check against previous pass (2026-02-22)

## Regression Check Context

The previous verification (2026-02-22) reported status `passed` with score 5/5 and no gaps. This run is a regression check triggered by the presence of uncommitted working-tree changes to two files:

- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — `micTiming` useMemo block moved earlier in the file (before `handleMicNoteEvent` instead of after). This is a declaration-order refactor only: the deps array, computation, and `...micTiming` spread into `useMicNoteInput` are identical. No phase 08 logic changed.
- `src/contexts/AudioContextProvider.jsx` — Eager AudioContext initialization added to prevent mid-playback context switching. This file is not a phase 08 artifact and does not affect the detection pipeline contract.

No regressions found. All five truths remain verified.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Eighth notes at 120 BPM register individually — no fixed-window merging | VERIFIED | `calcMicTimingFromBpm(120, '8')` computes `onFrames=2, offMs=100, changeFrames=3, minInterOnMs=63`; both games spread `...micTiming` into `useMicNoteInput` |
| 2 | Quarter notes at 60 BPM do not multi-score for a single key press | VERIFIED | `lastScoredRef` + dedup guard in `handleNoteEvent` (SightReadingGame lines 832-839) and `handleMicNoteEvent` (NotesRecognitionGame lines 1661-1669); window = `minInterOnMs * 2` |
| 3 | Rapid C4/D4 alternation does not produce phantom detections | VERIFIED | `const FSM = { IDLE: 'IDLE', ARMED: 'ARMED', ACTIVE: 'ACTIVE' }` at `useMicNoteInput.js` line 15; explicit state transitions in `handlePitchDetected` (IDLE->ARMED->ACTIVE) and silence handler (ACTIVE/ARMED->IDLE) |
| 4 | Bass trail nodes detect A2 and B2 | VERIFIED | `const MIN_MIDI = 45; // A2` at `usePitchDetection.js` line 28; JSDoc range "A2 (MIDI 45) to C6 (MIDI 84)"; A2=MIDI45 and B2=MIDI47 both pass filter |
| 5 | BPM context flows from game settings into detection hooks automatically | VERIFIED | `NotesRecognitionGame`: `micTiming` useMemo at line 1652 from `settings?.tempo \|\| settings?.bpm \|\| 90`; `SightReadingGame`: `micTiming` useMemo at line 849 from `gameSettings?.tempo \|\| gameSettings?.bpm`; both spread `...micTiming` into `useMicNoteInput` |

**Score: 5/5 truths verified**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/micInputPresets.js` | `calcMicTimingFromBpm` utility function | VERIFIED | Exported at line 17; full implementation with beatMs, noteMs, four derived params with floor values; no changes since previous verification |
| `src/hooks/useMicNoteInput.js` | IDLE/ARMED/ACTIVE FSM replacing candidateFrames | VERIFIED | `FSM` enum at line 15; `fsmState` in `stateRef.current`; explicit FSM branches in `handlePitchDetected`; no changes since previous verification |
| `src/hooks/usePitchDetection.js` | `MIN_MIDI = 45` covering A2 | VERIFIED | Line 28: `const MIN_MIDI = 45; // A2`; no changes since previous verification |
| `src/components/games/sight-reading-game/SightReadingGame.jsx` | BPM-derived timing + per-note dedup | VERIFIED | Import at line 10; `micTiming` useMemo at line 849; `...micTiming` spread at line 863; `lastScoredRef` at line 787; dedup guard at lines 832-839; no changes since previous verification |
| `src/components/games/notes-master-games/NotesRecognitionGame.jsx` | BPM-derived timing + per-note dedup | VERIFIED | Import at line 28; `micTiming` useMemo at line 1652 (moved earlier — declaration order only, logic unchanged); `...micTiming` spread at line 1698; `lastScoredRef` at line 635; dedup guard at lines 1661-1669 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `micInputPresets.js` | `SightReadingGame.jsx` | `import { calcMicTimingFromBpm }` | WIRED | Line 10 import; useMemo at line 849 computes timing from `gameSettings.tempo` |
| `micInputPresets.js` | `NotesRecognitionGame.jsx` | `import { calcMicTimingFromBpm }` | WIRED | Line 28 import; useMemo at line 1652 with 90 BPM fallback |
| `gameSettings.tempo` | `useMicNoteInput` params | `micTiming` useMemo spread | WIRED | SightReadingGame: `gameSettings?.tempo || gameSettings?.bpm` -> `calcMicTimingFromBpm` -> `...micTiming`; NotesRecognitionGame: `settings?.tempo || settings?.bpm || 90` |
| `handleNoteEvent` | scoring dedup | `lastScoredRef` guard | WIRED | SightReadingGame lines 832-839: checks `last.pitch === event.pitch && now - last.time < minScoreInterval * 2` before calling scoring handler |
| `handleMicNoteEvent` | scoring dedup | `lastScoredRef` guard | WIRED | NotesRecognitionGame lines 1661-1669: identical dedup pattern before `handleAnswerSelect` |
| `usePitchDetection.frequencyToNote` | A2/B2 detection | `MIN_MIDI = 45` | WIRED | A2=MIDI45 and B2=MIDI47 both >= 45; notes pass through `frequencyToNote` filter |
| `FSM` enum | `useMicNoteInput` state machine | `fsmState` in `stateRef` | WIRED | `FSM.IDLE/ARMED/ACTIVE` used in `handlePitchDetected` and silence handler; explicit transitions with emit calls |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PIPE-01 | 08-01 | Dynamic `onFrames` scales with BPM and note duration | SATISFIED | `calcMicTimingFromBpm`: `onFrames = Math.max(2, Math.round(noteMs * 0.15 / 16.7))` — tempo-dependent; REQUIREMENTS.md marked `[x]` Complete |
| PIPE-02 | 08-01 | Dynamic `offMs` scales with BPM and note duration | SATISFIED | `calcMicTimingFromBpm`: `offMs = Math.max(60, Math.round(noteMs * 0.4))` — scales with noteMs; REQUIREMENTS.md marked `[x]` Complete |
| PIPE-03 | 08-01 | Formal IDLE/ARMED/ACTIVE FSM in `useMicNoteInput` | SATISFIED | `const FSM = { IDLE: 'IDLE', ARMED: 'ARMED', ACTIVE: 'ACTIVE' }` at line 15; fsmState in stateRef; REQUIREMENTS.md marked `[x]` Complete |
| PIPE-04 | 08-01 | Full piano frequency map covers A2, B2 and full trail pool | SATISFIED | `MIN_MIDI = 45` (A2); MIDI 45=A2 and MIDI 47=B2 both in [45, 84] range; REQUIREMENTS.md marked `[x]` Complete |
| PIPE-05 | 08-02 | BPM/duration context propagated from game components into hooks | SATISFIED | Both games import `calcMicTimingFromBpm`, compute `micTiming` from settings, spread into `useMicNoteInput`; REQUIREMENTS.md marked `[x]` Complete |
| PIPE-06 | 08-02 | Per-note debouncing in game scoring layer prevents double-scoring | SATISFIED | `lastScoredRef` + `minInterOnMs * 2` dedup guard in both `handleNoteEvent` and `handleMicNoteEvent`; REQUIREMENTS.md marked `[x]` Complete |

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

No blocker anti-patterns found in phase 08 modified files. The uncommitted changes to `NotesRecognitionGame.jsx` and `AudioContextProvider.jsx` introduce no placeholders, stubs, or TODO markers in the detection pipeline code path.

The pre-existing test failure in `SightReadingGame.micRestart.test.jsx` (1 of 30 tests) was confirmed pre-existing before Phase 08 changes and is not a regression from this phase.

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

## Re-verification History

| Date | Status | Score | Notes |
|------|--------|-------|-------|
| Initial | gaps_found | 0/5 | No detection pipeline existed |
| 2026-02-22 | passed | 5/5 | Plans 08-01 and 08-02 closed all gaps |
| 2026-02-24 | passed | 5/5 | Regression check; two uncommitted changes confirmed non-regressive |

---

*Verified: 2026-02-24T00:00:00Z*
*Verifier: Claude (gsd-verifier)*
