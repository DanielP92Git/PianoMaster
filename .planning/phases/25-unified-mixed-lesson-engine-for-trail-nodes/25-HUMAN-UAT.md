---
status: partial
phase: 25-unified-mixed-lesson-engine-for-trail-nodes
source: [25-VERIFICATION.md]
started: 2026-04-10T00:45:00Z
updated: 2026-04-10T00:45:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-End Mixed Lesson Session

expected: Launch mixed lesson from trail (rhythm_1_1, rhythm_1_2, or rhythm_1_3), tap through 8 interleaved visual_recognition and syllable_matching questions, verify correct/wrong sounds play, animations trigger, and VictoryScreen shows with correct score and star rating
result: [pending]

### 2. Crossfade Transition Quality

expected: When question type changes (visual_recognition -> syllable_matching or vice versa), observe smooth ~300ms fade animation. With reduced-motion enabled in accessibility settings, animation should be instant (no fade).
result: [pending]

### 3. Progress Bar Visual Appearance

expected: Green progress bar fill (bg-green-400) on glass track (bg-white/15) with fraction text like "3/8" visible. Bar fills progressively as questions are answered.
result: [pending]

### 4. Standalone Game Regression

expected: VisualRecognitionGame and SyllableMatchingGame launched from trail nodes look and behave identically to before the renderer extraction refactor. No visual differences.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
