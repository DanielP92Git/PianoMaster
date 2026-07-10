---
status: partial
phase: 02-practice-tooling
source: [02-VERIFICATION.md]
started: 2026-07-10T13:10:00Z
updated: 2026-07-10T13:10:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Comparison playback ("Hear yours vs correct") on a real device

expected: Tap "Hear yours vs correct" after a mixed-result attempt (some correct, some wrong-pitch, some missed). Child's reconstructed rendition plays first (with the fixed moving-outline highlight tracking one note at a time, per CR-01), then the correct rendition plays with the same moving outline, with a visible/audible "Yours"/"Correct" label distinguishing the two passes (per WR-01).
result: [pending]

### 2. Review-mistakes mode in mic input mode on a real device

expected: Enter Review-mistakes mode, play each target note aloud. The auto-audition of the target pitch does not self-advance the drill (500ms `REVIEW_AUDITION_GUARD_MS` should suppress mic pickup of the speaker's own note-out sound), and playing the correct note on the piano/mic advances to the next mistake.
result: [pending]

### 3. Practice/Test pill legibility and lock behavior

expected: Toggle Practice/Test pill before starting an exercise; it visibly greys out immediately at count-in and stays greyed for the whole session until returning to setup. Pill is legible and clearly conveys locked vs active state (per D-05/D-06); screen-reader announces state via `aria-pressed`.
result: [pending]

### 4. Practice-mode multi-exercise trail node playthrough (CR-02 fix)

expected: Complete a Practice-mode multi-exercise trail node end-to-end. "Next Exercise" correctly advances instead of bouncing to the trail map — player stays in the node and can step through exercise 2, 3, etc. while in Practice mode.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
