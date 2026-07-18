---
status: partial
phase: 02-practice-tooling
source: [02-VERIFICATION.md]
started: 2026-07-10T13:10:00Z
updated: 2026-07-18T00:00:00Z
---

## Current Test

Item 2 (review-mistakes on mic) still pending — owner will test separately. Items 1, 3, 4 passed
after two rounds of on-device bug fixes (see Gaps). PRAC-02 comparison playback was subsequently
hidden by owner decision (too busy for the 8-year-old audience) — item 1 is recorded as passed
because the feature worked correctly on device before being gated off.

## Tests

### 1. Comparison playback ("Hear yours vs correct") on a real device

expected: Tap "Hear yours vs correct" after a mixed-result attempt (some correct, some wrong-pitch, some missed). Child's reconstructed rendition plays first (with the fixed moving-outline highlight tracking one note at a time, per CR-01), then the correct rendition plays with the same moving outline, with a visible/audible "Yours"/"Correct" label distinguishing the two passes (per WR-01).
result: PASS (after fix) — first device pass FAILED: only the correct rendition played and no
labels appeared. Root cause: `useRhythmPlayback`'s `onBeatChange(-1)` was overloaded as both
"no note sounding" and "pattern finished" and fired ~50ms after the tap during the audio lead-in,
so the code skipped straight to the correct pass and killed the "yours" audio. Fixed by adding an
explicit `onComplete` end-of-pattern callback (commit `4e37ac3d`), owner-confirmed working:
both passes play with "Yours"/"Correct" labels. **Feature then HIDDEN** by owner decision
(commit `9f199a00`, `SHOW_COMPARE_FEATURE=false`) — too many controls for 8-year-olds. PRAC-02 is
therefore recorded as **deferred (built + working, hidden pending simplification)**, mirroring HUD-02.

### 2. Review-mistakes mode in mic input mode on a real device

expected: Enter Review-mistakes mode, play each target note aloud. The auto-audition of the target pitch does not self-advance the drill (500ms `REVIEW_AUDITION_GUARD_MS` should suppress mic pickup of the speaker's own note-out sound), and playing the correct note on the piano/mic advances to the next mistake.
result: PENDING — owner testing separately; accepted as a known-open item at milestone close.

### 3. Practice/Test pill legibility and lock behavior

expected: Toggle Practice/Test pill before starting an exercise; it visibly greys out immediately at count-in and stays greyed for the whole session until returning to setup. Pill is legible and clearly conveys locked vs active state (per D-05/D-06); screen-reader announces state via `aria-pressed`.
result: PASS (after fix) — first device pass FAILED: the pill was greyed out before count-in and
could never be toggled. Root cause: `isModeLocked` lived in an app-root provider that outlives the
game; `lockMode()` at count-in was never cleared on route exit, so it stuck `true` after the first
exercise for the rest of the app session. Fixed by resetting the lock in
`startSession`/`resetSession` (commit `4e37ac3d`), owner-confirmed: pill is toggleable before
count-in, greys at count-in, and is toggleable again on re-entry.

### 4. Practice-mode multi-exercise trail playthrough (CR-02 fix)

expected: Complete a Practice-mode multi-exercise trail node end-to-end. "Next Exercise" correctly advances instead of bouncing to the trail map — player stays in the node and can step through exercise 2, 3, etc. while in Practice mode.
result: PASS — previously untestable because Practice mode was unreachable in trail mode (same
lock-leak root cause as item 3). With the lock fix, Practice mode is reachable during DISPLAY, and
the owner confirmed "Next Exercise" advances through a multi-exercise node without bouncing to the
trail map.

## Summary

total: 4
passed: 3
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps

- **Item 2 (review-mistakes on mic)** — not yet tested on device; accepted as a known-open item at
  v3.7 milestone close (owner will test separately). The 500ms audition guard is code-present and
  unit-adjacent, but the speaker-to-mic self-detection concern is only verifiable on real hardware.
- **PRAC-02 comparison playback hidden** — built, device-verified working, then gated off
  (`SHOW_COMPARE_FEATURE=false`) as too busy for 8-year-olds. Recorded as deferred, not complete.
- Two device-only bugs (items 1 and 3) reached this UAT despite 10/10 code-level verification,
  because the test suite mocked the exact runtime seams that broke. New tests now target those
  seams: `hooks/__tests__/useRhythmPlayback.test.js` (real playback completion semantics) and the
  grading-mode lock lifecycle in `SightReadingSessionContext.test.jsx`.
