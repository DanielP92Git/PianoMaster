---
status: diagnosed
phase: 08-audio-infrastructure-rhythm-games
source: [08-VERIFICATION.md]
started: 2026-03-28T00:12:00Z
updated: 2026-04-01T00:00:00Z
---

## Current Test

Tested 2026-04-01 on Android, iOS, Desktop. 6 issues found across 3 items.

## Tests

### 1. RhythmReadingGame — tap-along gameplay
expected: Child sees VexFlow rhythm staff, hears count-in clicks with 3-2-1-GO overlay, indigo cursor sweeps left-to-right synced to tempo, each tap produces click sound and shows PERFECT/GOOD/MISS floating text
result: FAIL — Three issues: (a) Double cursor renders — one static inside RhythmStaffDisplay and one animated in parent, (b) Cursor reaches beat 4 note position before metronome beat 4 click (linear cursor vs non-linear VexFlow spacing), (c) Back button stuck with loading spinner — never navigates back

### 2. RhythmDictationGame — hear-and-pick gameplay
expected: C4 piano notes play for each beat on question load, replay button re-plays the pattern, correct card glows green, wrong card flashes red then correct is revealed with auto-replay
result: FAIL — Two issues: (a) Auto-advances to next exercise too fast — after wrong answer, correct pattern replays but next exercise starts at hardcoded 2000ms before replay finishes, (b) No readiness gate — pattern auto-plays immediately on each exercise with no "I'm ready" button

### 3. Trail node navigation to rhythm games
expected: Tapping a trail node with exercise_type='rhythm_tap' opens RhythmReadingGame (not ComingSoon). Tapping 'rhythm_dictation' opens RhythmDictationGame.
result: FAIL (iOS only) — First rhythm trail node shows infinite loading spinner on iOS. RhythmReadingGame's auto-start silently returns when AudioContext is suspended, with no gesture-gate fallback (unlike MetronomeTrainer which has needsGestureToStart + AudioInterruptedOverlay).

### 4. Piano tone quality
expected: usePianoSampler produces a piano-like tone (not buzzy or silent) through device speakers when playNote('C4') is called
result: MIXED — Each rhythm game uses a different sound for pattern playback. User prefers MetronomeTrainer's G4.mp3 piano sample (via audioEngine.createPianoSound) over the oscillator-based synthesis in other games. Request to unify all rhythm games to MetronomeTrainer's sound.

### 5. PWA cache invalidation
expected: After service worker update, new game routes are served from the new cache (pianomaster-v9), not from stale assets
result: PASS — New game routes load correctly on all devices.

## Summary

total: 5
passed: 1
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

### Gap 1: RhythmReadingGame visual bugs
status: failed
items: [1a, 1b, 1c]
fix_plan: 15-03-PLAN.md
description: Double cursor, cursor/metronome desync, back button stuck spinning

### Gap 2: RhythmDictationGame pacing
status: failed
items: [2a, 2b]
fix_plan: 15-04-PLAN.md
description: Auto-advance too fast, needs "I'm ready" button + sound unification

### Gap 3: iOS gesture gate
status: failed
items: [3]
fix_plan: 15-05-PLAN.md
description: RhythmReadingGame missing needsGestureToStart pattern for iOS AudioContext
