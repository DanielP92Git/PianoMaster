---
status: partial
phase: 08-audio-infrastructure-rhythm-games
source: [08-VERIFICATION.md]
started: 2026-03-28T00:12:00Z
updated: 2026-03-28T00:12:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. RhythmReadingGame — tap-along gameplay
expected: Child sees VexFlow rhythm staff, hears count-in clicks with 3-2-1-GO overlay, indigo cursor sweeps left-to-right synced to tempo, each tap produces click sound and shows PERFECT/GOOD/MISS floating text
result: [pending]

### 2. RhythmDictationGame — hear-and-pick gameplay
expected: C4 piano notes play for each beat on question load, replay button re-plays the pattern, correct card glows green, wrong card flashes red then correct is revealed with auto-replay
result: [pending]

### 3. Trail node navigation to rhythm games
expected: Tapping a trail node with exercise_type='rhythm_tap' opens RhythmReadingGame (not ComingSoon). Tapping 'rhythm_dictation' opens RhythmDictationGame.
result: [pending]

### 4. Piano tone quality
expected: usePianoSampler produces a piano-like tone (not buzzy or silent) through device speakers when playNote('C4') is called
result: [pending]

### 5. PWA cache invalidation
expected: After service worker update, new game routes are served from the new cache (pianomaster-v9), not from stale assets
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
