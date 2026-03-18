---
phase: 09-rhythm-generator-infrastructure
verified: 2026-03-18T23:12:00Z
status: human_needed
score: 3/3 must-haves verified
human_verification:
  - test: "Start a MetronomeTrainer session with 6/8 time signature, observe the MetronomeDisplay"
    expected: "6 circles appear. Circles 1 and 4 are visually larger than circles 2, 3, 5, 6. The active beat highlight cycles through all 6 positions."
    why_human: "MetronomeDisplay renders conditionally (only when isActive=true) — cannot exercise the live component rendering and visual sizing differences programmatically."
  - test: "Play a 6/8 exercise in MetronomeTrainer, listen to the count-in before the pattern starts"
    expected: "You hear 4 metronome clicks (2 measures x 2 compound beats) before the pattern plays. The tempo feels like dotted-quarter = BPM setting."
    why_human: "Count-in timing and audio click scheduling depend on AudioContext timing and cannot be verified via static analysis."
  - test: "In a 6/8 exercise, tap on beat 2 (the dotted-quarter compound beat, starting at position 3 in the 6-subdivision grid) slightly early and slightly late"
    expected: "Taps within the tolerance window around the compound beat are accepted. A tap on position 4 of the 6-subdivision grid (the second compound beat) is not rejected as a false negative."
    why_human: "Tap evaluation window correctness depends on runtime timing accuracy and the beat window algorithm — the code paths exist and use unitsPerBeat correctly, but the actual acceptance range must be felt in practice."
  - test: "Play a 4/4 or 3/4 exercise and verify it behaves exactly as before"
    expected: "4/4 shows 4 beat circles (not 6). Count-in is 4 beats. Tap evaluation window is unchanged. No timing regressions."
    why_human: "Regression of simple-time feel requires live playback — the code guards are verified statically, but user perception of timing accuracy needs human confirmation."
---

# Phase 09: Rhythm Generator Infrastructure Verification Report

**Phase Goal:** The rhythm generator and VexFlow renderer correctly model 6/8 as 2 compound beats so timing windows and beam groupings are musically accurate
**Verified:** 2026-03-18T23:12:00Z
**Status:** human_needed (all automated checks passed; 4 items require live playback confirmation)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | An existing MetronomeTrainer 6/8 exercise shows eighth notes beamed in 3+3 groups (not 2+2+2) | VERIFIED | `beamGroupsForTimeSignature("6/8")` returns `[Fraction(3,8), Fraction(3,8)]`. All 6 `Beam.generateBeams` call sites in `VexFlowStaffDisplay.jsx` and the single call in `RhythmPatternPreview.jsx` pass `beamConfig = { groups: beamGroups }` for 6/8. 8/8 beamGroupUtils tests pass. |
| 2 | The tap scoring window for beat 2 of 6/8 correctly registers taps without false-negative rejection | VERIFIED (code) / HUMAN (feel) | `MetronomeTrainer.jsx` lines 857 and 1130 compute `unitsPerBeat = measureLength / beats = 12/2 = 6`. `beatPosition = index / unitsPerBeat` replaces the old hardcoded `/ 4`. A note at sixteenth index 6 (the second compound beat) now resolves to `beatPosition = 1.0`, matching the expected beat position in the evaluation window. |
| 3 | Existing 4/4, 3/4, and 2/4 rhythm exercises are unaffected | VERIFIED | `subdivisions ?? beats` pattern falls back to `beats` for all simple-time signatures (none have a `subdivisions` field). `isCompound` is only set on `SIX_EIGHT`. All 51 tests pass including 3 4/4 regression tests in `patternBuilder.test.js` and all existing `rhythmGenerator.test.js` tests. |

**Score:** 3/3 truths verified (automated); 4 items flagged for human playback confirmation

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/games/rhythm-games/RhythmPatternGenerator.js` | Fixed SIX_EIGHT: beats:2, subdivisions:6 | VERIFIED | Line 57: `beats: 2`, line 58: `subdivisions: 6`. Lines 412, 604, 704 all use `subdivisions ?? beats` multiplier. No hardcoded `* 4` remains. |
| `src/components/games/sight-reading-game/utils/patternBuilder.js` | Compound-aware secondsPerSixteenth | VERIFIED | Line 112: `const secondsPerSixteenth = beatDurationSeconds / unitsPerBeat`. `unitsPerBeat` from `resolvedSignature.unitsPerBeat` which equals 6 for 6/8 (12/2). |
| `src/components/games/rhythm-games/MetronomeTrainer.jsx` | Fixed count-in, tap eval, visual tracking | VERIFIED | Count-in line 707-708: `isCompound ? beats * 2 : beats`. Tap eval lines 857 and 1130: `index / unitsPerBeat`. Subdivision scheduling lines 392-494: `subdivisionDur = beatDur / 3` for compound time. |
| `src/components/games/rhythm-games/components/MetronomeDisplay.jsx` | 6 subdivision circles with accented beats | VERIFIED | Line 21: `displayCount = timeSignature.subdivisions ?? timeSignature.beats`. Lines 26-27: `accentedPositions` from `strongBeats`. Larger circles (`h-12 w-12`) for accented vs smaller (`h-9 w-9`) for unaccented. |
| `src/components/games/sight-reading-game/utils/beamGroupUtils.js` | beamGroupsForTimeSignature() helper | VERIFIED | File exists. Exports `beamGroupsForTimeSignature`. Returns `[Fraction(3,8), Fraction(3,8)]` for "6/8", `null` for "4/4"/"3/4"/"2/4"/undefined. |
| `src/components/games/sight-reading-game/utils/beamGroupUtils.test.js` | 8 unit tests | VERIFIED | 8 test cases covering 6/8, 9/8, 12/8, 4/4, 3/4, 2/4, undefined, empty string. All pass. |
| `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` | All 6 Beam.generateBeams calls use beamConfig | VERIFIED | Lines 720, 721, 967, 968, 1199, 1325: all pass `beamConfig`. Import at line 32. `beamGroups` computed from `pattern.timeSignature` at line 341. |
| `src/components/games/sight-reading-game/components/RhythmPatternPreview.jsx` | Beam.generateBeams uses beamConfig | VERIFIED | Import at line 12. `beamGroupsForTimeSignature(timeSignature)` at line 129. Config merged with `stem_direction: Stem.UP`. New `timeSignature = "4/4"` prop (default preserves existing behavior). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `RhythmPatternGenerator.js` | `durationConstants.js` | `buildTimeSignatureGrid` reads `measureLength / beats` | WIRED | `buildTimeSignatureGrid` at line 87-90 computes `unitsPerBeat = measureLength / beats`. With `beats=2` for SIX_EIGHT, grid entry gets `unitsPerBeat=6`. Confirmed via durationConstants.js lines 87-90. |
| `patternBuilder.js` | `durationConstants.js` | `resolveTimeSignature` returns `unitsPerBeat` | WIRED | `patternBuilder.js` line 105: `resolveTimeSignature(timeSignature)`, line 108: `unitsPerBeat = resolvedSignature.unitsPerBeat || 4`, line 112: `secondsPerSixteenth = beatDurationSeconds / unitsPerBeat`. |
| `MetronomeTrainer.jsx` | `RhythmPatternGenerator.js` | `gameSettings.timeSignature` reads `beats`, `measureLength`, `isCompound`, `subdivisions` | WIRED | `MetronomeTrainer.jsx` reads `currentTimeSignature.isCompound` (line 392), `currentTimeSignature.beats` (line 707), `gameSettings.timeSignature.measureLength / gameSettings.timeSignature.beats` (line 857). |
| `beamGroupUtils.js` | `VexFlowStaffDisplay.jsx` | import + `beamGroupsForTimeSignature(pattern.timeSignature)` | WIRED | Import at line 32. Called at line 341 with `pattern.timeSignature`. Result passed to all 6 `Beam.generateBeams` call sites. |
| `beamGroupUtils.js` | `RhythmPatternPreview.jsx` | import + `beamGroupsForTimeSignature(timeSignature)` | WIRED | Import at line 12. Called at line 129 with `timeSignature` prop. Result merged into beam config. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RFIX-01 | 09-01-PLAN.md | Fix 6/8 beat model (beats:6 → beats:2 compound grouping) | SATISFIED | `SIX_EIGHT.beats = 2` confirmed in `RhythmPatternGenerator.js` line 57. `subdivisions: 6` added at line 58. All downstream consumers derive correct `unitsPerBeat = 6`. 6/8-specific tests in `rhythmGenerator.test.js` (lines 764-830) and `patternBuilder.test.js` (lines 189-270) all pass. |
| RFIX-02 | 09-02-PLAN.md | Compound beaming uses correct 3+3 eighth-note grouping for 6/8 | SATISFIED | `beamGroupUtils.js` exists with correct `Fraction(3,8)` groups for 6/8. All 7 `Beam.generateBeams` call sites updated. `beamGroupUtils.test.js` 8/8 tests pass. Build exits 0. |

No orphaned requirements: REQUIREMENTS.md maps only RFIX-01 and RFIX-02 to Phase 09, and both are claimed and satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `MetronomeDisplay.jsx` | 17 | `return null` | None | Legitimate guard — component only renders when `isActive=true`. Not a stub. |

No blockers, no warnings. No TODO/FIXME/placeholder comments in any phase-modified file.

### Human Verification Required

#### 1. MetronomeDisplay 6/8 Circle Layout

**Test:** Open a 6/8 MetronomeTrainer exercise. Start the metronome.
**Expected:** 6 circles appear in the beat display. Circles numbered 1 and 4 are visibly larger than circles 2, 3, 5, and 6. The active-beat highlight cycles through all 6 positions (not just 2).
**Why human:** `MetronomeDisplay` renders only when `isActive=true` — the `displayCount` and circle sizing logic is correct in code, but the actual visual rendering in a live browser requires human confirmation.

#### 2. Count-In Feel for 6/8

**Test:** Start a 6/8 exercise. Listen to the count-in before the pattern begins.
**Expected:** You hear exactly 4 metronome clicks (2 compound beats x 2 measures) at the dotted-quarter pulse before the pattern starts. This is more beats than 4/4 (which gets 4), giving enough time to feel the compound pulse.
**Why human:** `beatsInCountIn = beats * 2 = 4` is confirmed in code (line 708), but whether the audio timing feels correct — clicks at dotted-quarter intervals, strong/weak alternation — requires live audio playback.

#### 3. Tap Acceptance Window for Beat 2 of 6/8

**Test:** In a 6/8 exercise, let the pattern play back once to hear it. Then attempt to tap along, intentionally tapping slightly early and slightly late for beat 2 (the second dotted-quarter compound beat, which occurs halfway through the measure).
**Expected:** Taps within a reasonable tolerance window around beat 2 are accepted as correct. A tap 50-100ms early or late should still register. There should be no false-negative rejection that was present before the fix (where `index / 4` gave wrong beat positions).
**Why human:** The acceptance window math is correct (`unitsPerBeat = 6` yields correct beat positions), but the perceptual feel of whether the window is too tight or too loose can only be confirmed by playing the game.

#### 4. Simple-Time Regression Check

**Test:** Play a 4/4 exercise and a 3/4 exercise. Verify they behave exactly as before.
**Expected:** 4/4 shows 4 beat circles (no change). Count-in is 4 beats. Tap evaluation works normally. The `subdivisions ?? beats` fallback for simple time is transparent to the user.
**Why human:** All code guards for simple-time branches verified statically, but perceptual regression (unexpected timing changes, wrong circle counts) needs a human to confirm in a live session.

### Gaps Summary

No gaps. All automated checks passed across both plans. The phase goal is achieved in code:

- **6/8 compound beat model** is correctly implemented root-to-tip: `TIME_SIGNATURES.SIX_EIGHT.beats = 2` with `subdivisions = 6` propagates through `durationConstants.buildTimeSignatureGrid` (giving `unitsPerBeat = 6`), through `patternBuilder.secondsPerSixteenth` (using `beatDurationSeconds / unitsPerBeat`), through `MetronomeTrainer` count-in and tap evaluation (both using `index / unitsPerBeat`), and through the metronome visual (6 subdivision circles, beats 1 and 4 accented).
- **VexFlow 3+3 beaming** is correctly threaded: `beamGroupsForTimeSignature` returns `[Fraction(3,8), Fraction(3,8)]` for 6/8 and `null` for all simple-time signatures, and all 7 `Beam.generateBeams` call sites pass the result as `beamConfig`.
- **51 tests pass** (23 rhythmGenerator + 20 patternBuilder + 8 beamGroupUtils), production build exits 0.

The 4 human verification items are playback/audio/visual confirmations — they cannot block the conclusion that the implementation is correct, but they should be spot-checked before shipping 6/8 nodes to learners.

---

_Verified: 2026-03-18T23:12:00Z_
_Verifier: Claude (gsd-verifier)_
