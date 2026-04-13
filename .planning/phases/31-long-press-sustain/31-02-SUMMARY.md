---
phase: 31-long-press-sustain
plan: "02"
subsystem: rhythm-games
tags: [hold-mechanic, raf-animation, pointer-events, onset-tracking, rhythm-tap]
dependency_graph:
  requires:
    - holdScoringUtils (scoreHold, isHoldNote, calcHoldDurationMs)
    - HoldRing (CIRCUMFERENCE)
    - TapArea extended with hold props (Plan 31-01)
  provides:
    - RhythmTapQuestion with full hold lifecycle
    - vexDurations tracking in patternInfoRef
    - currentOnsetIndexRef — tracks position through onset sequence
    - handlePressStart / handlePressEnd — hold note press lifecycle
    - rAF ring animation driven via holdRingCircleRef
  affects:
    - src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx
tech_stack:
  added: []
  patterns:
    - registerFirstOnset() helper — shared first-tap anchor logic extracted for both tap and hold paths
    - rAF loop guarded by pressStartTimeRef !== null (T-31-05 DoS mitigation)
    - onset-only index derived by filtering rests from vexDurations
    - Onset timing recorded on press-start (not press-end) for correct timing accuracy evaluation
key_files:
  created: []
  modified:
    - src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx
decisions:
  - reducedMotion sourced from useAccessibility() (established rhythm-game pattern) rather than useMotionTokens() as suggested in plan — useMotionTokens returns 'reduce', not 'reducedMotion'; AccessibilityContext is the canonical source
  - registerFirstOnset() helper extracted to eliminate code duplication between handleTap and handlePressStart first-tap anchor logic
  - title prop passes undefined in USER_PERFORMANCE to let TapArea derive HOLD/TAP label from isHoldNote
metrics:
  duration_seconds: 420
  completed_date: "2026-04-13"
  tasks_completed: 1
  tasks_total: 2
  files_created: 0
  files_modified: 1
---

# Phase 31 Plan 02: Hold Mechanic in RhythmTapQuestion Summary

**One-liner:** Full hold-press lifecycle wired into RhythmTapQuestion — vexDurations tracking, onset index, rAF ring animation, sustained audio, and PERFECT/GOOD/MISS hold scoring with quarter notes unchanged.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Store vexDurations and track current onset index | 116e367 | RhythmTapQuestion.jsx |

## Task 2: Awaiting Human Verification

**Status:** checkpoint:human-verify — awaiting user confirmation

**What was built:** Long-press sustain mechanic in the listen&tap (RhythmTapQuestion) game. Half and whole note onsets now require sustained finger hold with filling ring visual and sustained piano sound. Quarter notes remain simple taps.

### Verification Instructions

1. Run `npm run dev` and open the app at http://localhost:5174
2. Navigate to the trail map and find a rhythm node that uses half notes (e.g., a node with patternTags including "quarter-half")
3. Start a listen&tap exercise on that node
4. During the USER_PERFORMANCE phase:
   a. Observe that quarter note onsets show "TAP HERE" label — tap them normally, verify scoring works as before
   b. Observe that half note onsets show "HOLD" label with ring outline
   c. Press and HOLD on a half note onset — verify: ring fills clockwise, sustained piano sound plays
   d. Hold for the full duration — verify: ring completes to 100%, turns green, PERFECT feedback shows
   e. Try releasing early (40-69% hold) — verify: "Almost, hold longer!" feedback appears
   f. Try releasing very early (<40%) — verify: MISS feedback
5. Verify the game completes normally after all onsets are tapped/held
6. Check that quarter-note-only patterns still work with no visual change (no ring, no HOLD label)

**Resume signal:** Type "approved" or describe issues

## What Was Built

### Task 1: Hold-Press Infrastructure in RhythmTapQuestion.jsx

**New imports:**
- `scoreHold`, `isHoldNote`, `calcHoldDurationMs` from holdScoringUtils
- `CIRCUMFERENCE` from HoldRing
- `DURATION_INFO` from durationInfo
- `useAccessibility` from AccessibilityContext (for `reducedMotion`)

**New refs:**
- `currentOnsetIndexRef` — tracks which onset the child is currently on (advances per tap/hold-complete)
- `pressStartTimeRef` — records `performance.now()` at press-down for hold duration calculation
- `rafIdRef` — stores requestAnimationFrame ID for cleanup (T-31-05 DoS mitigation)
- `holdRingCircleRef` — passed to TapArea as holdRingRef; parent drives stroke-dashoffset at 60fps

**New state:**
- `isHoldComplete` — triggers green ring state on PERFECT hold
- `currentOnsetHold` — `{ isHold, holdDurationMs }` for current expected onset; drives TapArea display

**vexDurations storage:** `resolveByTags` result now propagated to `pattern.vexDurations` and stored in `patternInfoRef.current.vexDurations`. Non-curated generative patterns use `null` (safe fallback — all onsets treated as quarter-note taps).

**getCurrentOnsetInfo():** Filters rests from vexDurations to build onset-only list, returns `{ isHold, holdDurationMs, durationCode }` for the current onset index.

**registerFirstOnset():** Extracted shared helper containing the first-tap measure-anchor logic (find nearest beat 1, schedule metronome stop + evaluatePerformance). Called by both `handleTap` and `handlePressStart`.

**handlePressStart():**
1. Delegates quarter notes to `handleTap()` if onset is not a hold note
2. For hold notes: records audioContext tapTime in userTapsRef (onset timing, not press duration)
3. Calls registerFirstOnset() on first onset
4. Sets `pressStartTimeRef.current = performance.now()`
5. Calls `audioEngine.createPianoSound()` with full note duration in seconds
6. Starts rAF loop that drives `holdRingCircleRef` stroke-dashoffset — guarded by `pressStartTimeRef.current !== null` (T-31-05)

**handlePressEnd():**
1. Cancels rAF, measures hold duration via `performance.now() - pressStartTimeRef`
2. Calls `scoreHold(holdMs, requiredMs)` → 'PERFECT' | 'GOOD' | 'MISS'
3. Sets `isHoldComplete=true` for 200ms on PERFECT (green ring flash)
4. Resets ring to empty (stroke-dashoffset = CIRCUMFERENCE)
5. Shows per-tap feedback: GOOD shows holdGood i18n key ("Almost, hold longer!")
6. Calls `advanceOnset()` to move to next onset

**handleTap() updates:**
- Refactored to use `registerFirstOnset()` instead of inline first-tap logic
- Calls `advanceOnset()` after recording tap so onset index stays in sync for mixed patterns

**Cleanup:** `cancelAnimationFrame(rafIdRef.current)` added to unmount useEffect (T-31-05 rAF loop leak mitigation).

**TapArea props update:**
- `isHoldNote={phase === PHASES.USER_PERFORMANCE && currentOnsetHold.isHold}` — only show HOLD state during active performance
- `holdRingRef={holdRingCircleRef}` — ref-driven rAF animation
- `isHoldComplete={isHoldComplete}` — green ring state
- `reducedMotion={reducedMotion}` — from useAccessibility()
- `holdFeedbackLabel={feedback?.holdFeedbackLabel}` — "Almost, hold longer!" for GOOD
- `title={undefined}` during USER_PERFORMANCE — lets TapArea derive HOLD/TAP from isHoldNote prop

## Deviations from Plan

### Auto-fixed: reducedMotion source

**[Rule 1 - Bug] Used useAccessibility() instead of useMotionTokens()**
- **Found during:** Task 1
- **Issue:** Plan suggested `const { reducedMotion } = useMotionTokens()` but `useMotionTokens` returns `{ reduce, snappy, soft, fade }` — no `reducedMotion` field. The established pattern in rhythm games (`ArcadeRhythmGame.jsx`) is `const { reducedMotion = false } = useAccessibility()`.
- **Fix:** Import and use `useAccessibility` from `AccessibilityContext` as per the established pattern.
- **Files modified:** RhythmTapQuestion.jsx
- **Commit:** 116e367

### Auto-added: registerFirstOnset() helper

**[Rule 2 - Missing critical functionality] Extracted shared first-tap anchor logic**
- **Found during:** Task 1
- **Issue:** Both `handleTap` (quarter notes) and `handlePressStart` (hold notes) need identical first-onset measure-anchor logic. Duplicating ~15 lines would create a correctness risk (one path could diverge from the other).
- **Fix:** Extracted `registerFirstOnset(stopMetronome, evalPerf, setStarted)` helper called by both handlers.
- **Files modified:** RhythmTapQuestion.jsx
- **Commit:** 116e367

## Threat Mitigations Applied

- **T-31-05 (DoS — rAF loop leak):** `cancelAnimationFrame(rafIdRef.current)` in unmount useEffect. rAF `animate` loop also guards `pressStartTimeRef.current !== null` to self-terminate when press ends (double-stop safety).

## Known Stubs

None. The hold mechanic is fully implemented. Human verification (Task 2) is pending to confirm behavior in the running app.

## Self-Check

### Self-Check: PASSED

- FOUND: src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx
- FOUND commit 116e367: feat(31-02): wire hold-press mechanic into RhythmTapQuestion
- VERIFIED: All 17 test files pass (162/162 tests), 8 pre-existing unhandled rejections in ArcadeRhythmGame.test.js unchanged from Plan 01 baseline
- VERIFIED: All acceptance criteria met (all required imports, refs, handlers, TapArea props present)
