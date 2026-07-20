---
phase: 03-adaptive-pedagogy
fixed_at: 2026-07-12T18:34:42Z
review_path: .planning/phases/03-adaptive-pedagogy/03-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-07-12T18:34:42Z
**Source review:** .planning/phases/03-adaptive-pedagogy/03-REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 7 (2 Critical, 5 Warning — `fix_scope: critical_warning`, Info findings IN-01/IN-02 out of scope)
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Weak-note weighting is discarded by the pattern generator — the whole ADAPT-03/D-09/D-11 feature is a no-op

**Files modified:** `src/components/games/sight-reading-game/utils/adaptiveEngine.js`, `src/components/games/sight-reading-game/utils/adaptiveEngine.test.js`, `src/components/games/sight-reading-game/utils/patternBuilder.js`, `src/components/games/sight-reading-game/utils/patternBuilder.test.js`, `src/components/games/sight-reading-game/hooks/usePatternGeneration.js`, `src/components/games/sight-reading-game/constants/adaptiveTiers.js`, `src/components/games/sight-reading-game/SightReadingGame.jsx`, `src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx`
**Commit:** `b513c902`
**Applied fix:** Read `patternBuilder.js`'s note-selection logic before deciding between the review's two suggested directions. `availableNotes` there is hard-deduplicated (`.filter((pitch, index, self) => self.indexOf(pitch) !== index ...)`) before any pick happens, so duplication-based weighting can never survive regardless of whether the pick itself is uniform or weighted — a separate weighting channel was required, not an alternative to it. Changed `buildWeightedNotePool` to return a per-pitch weight map (`{ [pitch]: weight }`, weak pitches get `WEAK_NOTE_WEIGHT`, others `1`) instead of a duplicated array. Added a `pickWeightedNote(pool, weights)` helper in `patternBuilder.js` and wired it into `generatePatternData`'s two uniform-random-pick call sites (the non-beginner-mode branch and the beginner-mode fallback), gated by a new `noteWeights` config field. Threaded `noteWeights` through `usePatternGeneration.js` and both `generatePattern(...)` call sites in `SightReadingGame.jsx` (`loadExercisePattern`, `startGame`) as a new trailing positional argument. `seedMasteryBiasedSettings` now sets `noteWeights` on the settings object instead of mutating `selectedNotes`. Added a regression suite in `patternBuilder.test.js` that does NOT mock `usePatternGeneration`/`patternBuilder.js` and does NOT stub `Math.random` — it calls the real `generatePatternData` with a heavily-weighted pitch across ~128 real generated notes and asserts its observed share is well above uniform (and a companion test asserting near-uniform distribution when `noteWeights` is omitted), so this class of bug (weighting silently discarded downstream) can't recur invisibly. Updated `SightReadingGame.mastery.test.jsx`'s existing "over-represented" test to assert on the new `noteWeights` positional arg instead of array duplication.

### CR-02: `sessionMasteryRef`/`baseAdaptiveSettingsRef` are never reset on "Play Again" / "Try Again", causing double-counted mastery persistence

**Files modified:** `src/components/games/sight-reading-game/SightReadingGame.jsx`, `src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx`
**Commit:** `f2918a02`
**Applied fix:** Applied the review's suggested fix essentially verbatim — added `baseAdaptiveSettingsRef.current = null; sessionMasteryRef.current = {};` inside `handleStartNewSession` before `loadExercisePattern()`, mirroring the reset `startGame`'s `!currentPattern` guard already performs at true session start. Added a new regression test ("Play Again (onReset) does not leak session 1's sessionMastery counts into session 2's persisted payload") that completes a full session, captures VictoryScreen's `onReset` prop, invokes it, completes a second session with different notes, and asserts the second session's `sessionMastery` payload contains ONLY the second session's counts. Making this test possible required the `SightReadingSessionContext` mock's `resetSession` to become a genuine stateful reset (previously a no-op `vi.fn()`) — this in turn surfaced that `startSession`/`resetSession` must also be referentially STABLE (`useCallback`, not a fresh `vi.fn()` per render), because the component's mount effect depends on both and an unstable identity was re-firing the cleanup (and therefore the reset) on every render, which would have silently zeroed the mocked session's exercise counter continuously. Fixed by stabilizing both. Verified the fix actually closes the gap by temporarily reverting it and confirming the new test fails (leaked C4/D4 counts), then restoring it.

### WR-01: Mastery data from non-victory ("encouragement") sessions is silently discarded

**Files modified:** `src/services/skillProgressService.js`, `src/services/skillProgressService.test.js`, `src/components/games/sight-reading-game/SightReadingGame.jsx`, `src/components/games/sight-reading-game/__tests__/SightReadingGame.encouragementMastery.test.jsx` (new)
**Commit:** `b5167bcd`
**Applied fix:** Implemented the review's "persist independently of the XP/stars victory gate" option. Extracted the existing per-pitch merge-with-validation logic (previously duplicated inline in `updateNodeProgress` and `updateExerciseProgress`) into a shared `mergeMasteryDelta` helper, then added a new exported `mergeNoteMasteryOnly(studentId, nodeId, perNoteMastery)` service function that upserts ONLY `note_mastery` + `last_practiced` (no `stars`/`best_score`/`exercises_completed`, and no `checkRateLimit` call — telemetry, not a graded/anti-farming-gated write). Wired a `useEffect` in `SightReadingGame.jsx` that fires this fire-and-forget the moment `showEncouragementScreen` becomes true (guarded by a new `encouragementMasterySavedRef` so it fires once per session, reset at the same two points `sessionMasteryRef` already resets at — `startGame`'s `!currentPattern` guard and `handleStartNewSession`'s CR-02 fix), gated on `nodeId`/`studentId` present (trail mode only, mirroring `seedMasteryBiasedSettings`) and skipped in Practice mode (matches VictoryScreen's `suppressPersistence` contract). Added 21 unit tests for `mergeNoteMasteryOnly`/the shared helper in `skillProgressService.test.js`, and a new dedicated component test file (`SightReadingGame.encouragementMastery.test.jsx`) with a mock session context supporting `isVictory !== isSessionComplete` (neither sibling mock file supported that combination) to actually reach the encouragement screen and assert `mergeNoteMasteryOnly` is called with the session's accumulated mastery, is skipped in Practice mode, and is skipped in free play. Verified the regression test catches the gap by temporarily reverting the `useEffect` wiring and confirming the test fails, then restoring it.

### WR-02: Mid-session tempo changes via the settings gear are silently reverted by the next adaptive-tier computation

**Files modified:** `src/components/games/sight-reading-game/SightReadingGame.jsx`, `src/components/games/sight-reading-game/__tests__/SightReadingGame.settingsGear.test.jsx` (new)
**Commit:** `4bf1469f`
**Applied fix:** Applied the review's first option (re-baseline on user-initiated change) rather than the UI-toast alternative, since it fixes the underlying behavior instead of just documenting it. Added `baseAdaptiveSettingsRef.current = { ...newSettings };` inside `handleApplySettings` before calling `startGame(newSettings)`, so a user-chosen mid-session tempo becomes the new baseline the next tier computation offsets from — while leaving `handleCancelSettings` (which restarts the current exercise unchanged) untouched. Added a new dedicated test file that renders trail mode, opens the gear-icon settings overlay (mocking `UnifiedGameSettings` as a single "apply" button, since standing up its full step-wizard tree wasn't necessary to exercise the fix), applies a new tempo, then completes two successful exercises to trigger a tier escalation, and asserts the escalated tempo is computed from the just-applied baseline (`NEW_USER_TEMPO + 12`) rather than the stale session-start baseline. Verified the test catches the regression by temporarily reverting the fix (test failed with the tempo reverted to `80 + 12 = 92`), then restoring it.

### WR-03: `handleStartNewSession`/`sessionMasteryRef` cross-cutting concern also affects `baseAdaptiveSettingsRef` semantics

**Files modified:** none (resolved as a direct consequence of the CR-02 fix)
**Commit:** `f2918a02` (same commit as CR-02 — no additional code change was needed)
**Applied fix:** The review explicitly noted this finding shares CR-02's root cause and fix ("noted separately so the fix for CR-02 explicitly covers both refs"). CR-02's fix resets `baseAdaptiveSettingsRef.current = null` (not just `sessionMasteryRef`) inside `handleStartNewSession`, which is exactly what this finding asks for — a retried session now re-derives its adaptive tempo baseline from the fresh `startGame` call's `!currentPattern` guard instead of inheriting session 1's stale baseline. No separate commit was made since the code change is identical to CR-02's.

### WR-04: Fragile positional fallback for the baseline tier instead of using the exported constant

**Files modified:** `src/components/games/sight-reading-game/SightReadingGame.jsx`
**Commit:** `454f17c7`
**Applied fix:** Applied the review's suggested fix verbatim — imported `BASELINE_TIER_INDEX` alongside the other `adaptiveTiers` constants already imported, and changed the fallback from the positional `ADAPTIVE_TIERS[2]` to `ADAPTIVE_TIERS.find((tierDef) => tierDef.index === BASELINE_TIER_INDEX)`. Pure refactor with identical runtime behavior today (verified via the existing adaptive-tier test suite, which still passes unchanged) — the fix only changes what happens if `ADAPTIVE_TIERS` is ever reordered/extended.

### WR-05: `triggerLevelUpCue`'s `setTimeout` is untracked and never cleared on unmount

**Files modified:** `src/components/games/sight-reading-game/SightReadingGame.jsx`
**Commit:** `588c1ea9`
**Applied fix:** Applied the review's suggested fix — added a `levelUpCueTimeoutRef` (mirroring the existing `timingFeedbackTimeoutRef` pattern), tracked the `setTimeout` return value in it (clearing any prior pending one first, matching `showTimingFeedback`'s clear-then-set pattern), and added a clear for it inside the file's existing consolidated unmount cleanup effect (the one that already clears `performanceLiveTimeoutRef`/`previewPlaybackTimeoutRef`/etc.). Verified via the existing `SightReadingGame.adaptive.test.jsx` LevelUpCue-escalation test and `LevelUpCue.test.jsx`, both still green.

## Skipped Issues

None — all 7 in-scope findings were fixed.

---

_Fixed: 2026-07-12T18:34:42Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
