---
status: testing
phase: 08-design-data-modeling
source: [08-01-SUMMARY.md, 08-02-SUMMARY.md]
started: 2026-02-24T12:00:00Z
updated: 2026-02-24T14:00:00Z
---

## Current Test

number: 3
name: Mic Detection in Notes Recognition Game
expected: |
  Start a Notes Recognition game session with mic input. Play the displayed note on your piano — the mic should pick it up and the game should evaluate whether you played the correct note.
awaiting: user response

## Tests

### 1. Bass Note Detection (A2/B2)
expected: Play A2 or B2 into the mic during a bass clef exercise. The note should be detected and recognized (not filtered out). Previously these low notes were blocked by a C3 minimum.
result: pass

### 2. Mic Detection in Sight Reading Game
expected: Start a Sight Reading game session with mic input enabled. Play notes on your piano — they should be detected and scored as correct/incorrect against the displayed notation. Basic mic detection flow works end-to-end.
result: deferred
reported: |
  Two sub-issues observed:
  1. (Fixed) Count-in stalled on last beat in mic mode — AudioContext was suspended after source.connect(analyser); fixed by adding ctx.resume() in AudioContextProvider.requestMic().
  2. (Partially fixed, still present) Notes scored as wrong pitch (RED) even when played correctly — especially 2nd note in eighth-note pairs. A fix was applied (derive mic timing from actual pattern note durations via shortestPatternDuration useMemo) but the issue persisted after retest.
severity: major
deferred_to: Phase 09 (dedicated debug session)
notes: |
  Root cause of remaining issue is unclear. Investigated timing windows, FSM changeFrames, latency compensation. Best hypothesis: piano sustain/harmonics cause pitchy to accumulate wrong pitch during ARMED→ACTIVE transition even after changeFrames reduction for eighth notes. Requires dedicated debug phase with console logging of FSM state, detectedNote, latencyMs per frame.

### 3. Mic Detection in Notes Recognition Game
expected: Start a Notes Recognition game session with mic input. Play the displayed note on your piano — the mic should pick it up and the game should evaluate whether you played the correct note.
result: [pending]

### 4. No Double-Scoring on Held Notes
expected: In either Sight Reading or Notes Recognition game with mic input, play and hold a single note for 2-3 seconds. The note should be scored only once — you should not see the score increment multiple times or get duplicate correct/incorrect feedback for one held note.
result: [pending]

### 5. Detection Works at Different Tempos
expected: In Sight Reading game, change the tempo/BPM setting (e.g., try 60 BPM and 120 BPM). At both speeds, mic detection should work cleanly — notes should register without noticeable lag or missed detections relative to the tempo.
result: [pending]

## Summary

total: 5
passed: 1
issues: 0
deferred: 1
pending: 3
skipped: 0

## Gaps

- truth: "Sight Reading game count-in completes and transitions to performance phase in mic mode"
  status: fixed
  root_cause: "AudioContext suspended after source.connect(analyser) in requestMic() — fixed by adding ctx.resume() call"
  test: 2

- truth: "Notes scored as played (correct pitch) in Sight Reading game with mic input, including eighth-note patterns"
  status: deferred
  reason: "Notes (especially 2nd note of eighth-note pairs) consistently marked RED (wrong pitch) even when played correctly at 80 BPM. Investigated FSM timing, changeFrames calibration, latency compensation, timing window overlap. A fix was applied (shortestPatternDuration useMemo) but issue persisted after retest."
  severity: major
  test: 2
  root_cause: "Unknown — likely piano sustain/harmonics corrupting pitchy's pitch accumulation during ARMED state or ACTIVE note-change transition"
  deferred_to: "Phase 09 (dedicated debug session with per-frame FSM logging)"
  artifacts:
    - "commit 3113aca: fix(sight-reading): derive mic timing from actual pattern note durations"
    - "commit in AudioContextProvider: ctx.resume() after source.connect(analyser)"
  missing:
    - "Per-frame console logging of FSM state, detectedNote, latencyMs, candidateFrames during eighth-note transitions"
    - "Test with different clarity thresholds to filter harmonics"
    - "Test with onFrames/changeFrames overridden to very small values (1-2 frames) to isolate whether timing or pitch classification is the issue"
  debug_session: ""
