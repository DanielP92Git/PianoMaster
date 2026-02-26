---
status: testing
phase: 08-detection-pipeline
source: 08-01-PLAN.md, 08-02-PLAN.md (no summaries on disk — verified from code)
started: 2026-02-25T12:00:00Z
updated: 2026-02-25T12:00:00Z
---

## Current Test

number: 4
name: Bass clef note detection (Trail)
expected: |
  Play a bass clef trail node that requires low notes (C3, D3, E3 range).
  The game should correctly detect the played notes — not ignore or
  misidentify bass notes.
awaiting: user response

## Tests

### 1. Eighth notes at fast tempo (Sight Reading)
expected: In Sight Reading game at 120 BPM with eighth note patterns, playing distinct eighth notes registers each note individually — notes are not merged or skipped
result: issue
reported: "after hitting start playing, the count in starts but gets stuck on last count in beat (beat 4)"
severity: blocker

### 2. Quarter notes at slow tempo (Sight Reading)
expected: In Sight Reading game at 60 BPM with quarter note patterns, playing and holding a quarter note registers exactly once — long sustain does not trigger double-scoring for a single key press
result: skipped
reason: Blocked by Test 1 — count-in stall prevents Sight Reading from reaching playing phase

### 3. Adjacent note alternation (Sight Reading)
expected: In Sight Reading game, rapidly alternating between two adjacent notes (e.g., C4 then D4 then C4) registers all notes correctly — pitch flicker at note boundaries does not produce phantom or missed detections
result: skipped
reason: Blocked by Test 1 — count-in stall prevents Sight Reading from reaching playing phase

### 4. Bass clef note detection (Trail)
expected: Playing a bass clef trail node that requires low notes (C3, D3, E3 range) correctly detects the played notes — the game does not ignore or misidentify bass notes
result: [pending]

### 5. Notes Recognition Game still works
expected: Notes Recognition game detects notes normally — tapping a key on the piano shows the correct note detected, game scores accurately. No regression from the detection pipeline changes.
result: [pending]

### 6. No ghost notes from background noise
expected: With the mic active but not playing piano, background room noise (talking, movement) does not trigger false note detections — the game stays quiet until an actual piano note is played
result: [pending]

## Summary

total: 6
passed: 0
issues: 1
pending: 3
skipped: 2

## Gaps

- truth: "Count-in completes all beats and transitions to active playing phase"
  status: failed
  reason: "User reported: count-in starts but gets stuck on last beat (beat 4) — game never transitions to playing"
  severity: blocker
  test: 1
  root_cause: "Race condition: startListeningSync() called but NOT awaited during early window (~80ms before count-in end). Mic connection can suspend AudioContext. tickCompletionGate polls audioEngine.getCurrentTime() which returns frozen value when context is suspended. Gate condition (audioNowGate >= countInEndAudioTime) never becomes true. Prior fix (3839d9e) added resume in requestMic but doesn't prevent the race where tickCompletionGate polls BEFORE resume completes."
  artifacts:
    - path: "src/components/games/sight-reading-game/SightReadingGame.jsx"
      issue: "Line ~2868: startListeningSync() not awaited; Line ~2906-2944: tickCompletionGate polls getCurrentTime() which stalls"
    - path: "src/contexts/AudioContextProvider.jsx"
      issue: "Line ~114-118: resume after mic connect exists but races with completion gate"
  missing:
    - "Either await startListeningSync and confirm AudioContext resume before tickCompletionGate continues, or add safeguard in tickCompletionGate to detect/recover from stalled AudioContext"
  debug_session: ""
