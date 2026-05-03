---
phase: 33-rhythm-issues-cleanup
plan: 03
subsystem: audio
tags: [react, hooks, web-audio, rhythm-games, prewarm, ios-safari]

# Dependency graph
requires:
  - phase: 30-audio-fixes
    provides: await-resume-then-schedule pattern (D-01), dictation prewarm investigation (D-04)
  - phase: 33-rhythm-issues-cleanup
    provides: 33-CONTEXT D-13 (shared prewarm hook), D-16 (limit hardening to confirmed bugs)
provides:
  - Shared `useEnsureAudioReady(audioEngine, getOrCreateAudioContext)` hook composing resumeAudioContext + loadPianoSound + warmup oscillator + isReady() post-condition check
  - `loadPianoSound` now exposed in useAudioEngine return object (was internal-only)
  - RhythmDictationQuestion.handleListen migrated off inline initializeAudioContext+resumeAudioContext to the shared hook
affects: [33-07 (DiscoveryIntroQuestion same hook integration if UAT issue 1/4 confirmed)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared audio prewarm hook pattern: composes useAudioEngine surface (resumeAudioContext, loadPianoSound, audioContextRef, isReady) into a single async ensureReady() callable returned from a hook"

key-files:
  created:
    - src/hooks/useEnsureAudioReady.js
  modified:
    - src/hooks/useAudioEngine.js
    - src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx
    - src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx

key-decisions:
  - "Honored D-13 verbatim: warmup oscillator copied from PulseQuestion.startFlow lines 548-573 — proven good pattern, not reinvented"
  - "Honored D-16: only RhythmDictationQuestion modified; DiscoveryIntroQuestion left untouched (separate plan 33-07 contingent on UAT issue 1 OR 4)"
  - "Implemented RESEARCH §4 fix candidate (a): blocking await on loadPianoSound in the new hook; preserved fire-and-forget loadPianoSoundAsync inside initializeAudioContext (no behavior change to useAudioEngine init path)"
  - "handleListen returns silently when ensureAudioReady() is false; relies on existing AudioInterruptedOverlay + user re-tap recovery (per plan task spec)"

patterns-established:
  - "Audio prewarm via shared hook — any future renderer that reproduces an audio race should call useEnsureAudioReady at entry (D-13 contract)"

requirements-completed: [AUDIO-02]

# Metrics
duration: 8min
completed: 2026-05-03
---

# Phase 33 Plan 03: Dictation Listen Audio Prewarm Summary

**Extracted PulseQuestion's proven audio prewarm sequence (resume + loadPianoSound + warmup oscillator + isReady gate) into a shared `useEnsureAudioReady` hook and applied it to RhythmDictationQuestion.handleListen, eliminating the gainNodeRef race that caused UAT issue 7 (silent first Listen tap inside MixedLessonGame).**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-03T20:48:34Z
- **Completed:** 2026-05-03T20:57:08Z
- **Tasks:** 2 / 2 complete
- **Files modified:** 3 (1 created, 1 source modified, 1 test modified, plus 1 hook export-line addition in useAudioEngine.js)

## Accomplishments

- New shared `useEnsureAudioReady` hook (61 lines) that composes the proven PulseQuestion.startFlow sequence verbatim, returning a `Promise<boolean>` post-condition from `audioEngine.isReady()`
- `loadPianoSound` exposed in `useAudioEngine` return object so consumers can `await` it (it was previously only invoked fire-and-forget by `loadPianoSoundAsync` inside `initializeAudioContext`)
- `RhythmDictationQuestion.handleListen` migrated to the new hook; old inline `initializeAudioContext()` + `resumeAudioContext()` calls removed; dependency array trimmed to `[ensureAudioReady, playPattern]`
- Existing test suite updated to assert the new D-13 contract (`resumeAudioContext` + `loadPianoSound` order) and mock useAudioEngine now exposes `isReady`, `loadPianoSound`, plus a minimal WebAudio surface on `audioContextRef.current` so the warmup oscillator can construct without throwing
- All 4 RhythmDictationQuestion tests pass; full plan-touched test suite passes (1647 → 1649 tests passing post-changes)

## Task Commits

1. **Task 1: Create useEnsureAudioReady hook + expose loadPianoSound from useAudioEngine** — `d8548e4` (feat)
2. **Task 2: Replace handleListen in RhythmDictationQuestion with useEnsureAudioReady** — `63be508` (fix)

**Plan metadata commit:** _pending — created by final orchestrator commit_

## Files Created/Modified

- `src/hooks/useEnsureAudioReady.js` (NEW, 61 lines) — Shared prewarm hook. Composes `audioEngine.resumeAudioContext()` + `audioEngine.loadPianoSound()` + warmup oscillator (silent gain, 10ms) on `audioContextRef.current` + returns `audioEngine.isReady()` boolean. Recovers via `getOrCreateAudioContext()` on iOS interrupted-state errors.
- `src/hooks/useAudioEngine.js` — Added one line: `loadPianoSound,` to the public return object alongside `resumeAudioContext` (no other behavior change; `initializeAudioContext` still fires `loadPianoSoundAsync` non-blocking as before).
- `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx` — Imported `useEnsureAudioReady`; instantiated `ensureAudioReady` callback after `useAudioEngine`; replaced `handleListen` body's inline init+resume with `await ensureAudioReady()` + early-return if not ready; trimmed deps array.
- `src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx` — Added `makeReadyMockEngine()` helper providing the full surface useEnsureAudioReady needs (`audioContextRef.current` with `state:"running"`, `createOscillator`, `createGain`, `destination`; `isReady`, `loadPianoSound`). Replaced two legacy tests (asserting old direct `initializeAudioContext` call) with new tests asserting the D-13 contract.

## Decisions Made

- Plan was followed exactly as specified — no in-flight design choices.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Existing renderer test broke after handleListen refactor**

- **Found during:** Task 2 (verification gate `npm run test:run`)
- **Issue:** Three tests in `RhythmDictationQuestion.test.jsx` failed because (a) two tests asserted the legacy direct `initializeAudioContext` call which no longer happens (D-13 makes it implicit), and (b) the third test `"shows Listening... instruction text"` failed because the existing mock `useAudioEngine` had `audioContextRef.current === null` and no `isReady`, so `ensureAudioReady()` returned false and `handleListen` returned silently before transitioning to LISTENING phase.
- **Fix:** Added a `makeReadyMockEngine()` helper that augments the mock with `isReady: () => true`, `loadPianoSound: () => Promise.resolve(true)`, and a minimal `audioContextRef.current` (with `createOscillator` / `createGain` / `destination`) so the warmup oscillator can construct without throwing. Replaced the two legacy assertion tests with two new tests that assert the new D-13 contract: (i) `resumeAudioContext` called on first Listen, (ii) `resumeAudioContext` called before `loadPianoSound` (call-order assertion). The third test was unblocked by the augmented module-level mock.
- **Files modified:** `src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx`
- **Verification:** `npx vitest run src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx` — all 4 tests pass
- **Committed in:** `63be508` (rolled into Task 2 commit since the test update is the test-side counterpart to the source change)

---

**Total deviations:** 1 auto-fixed (Rule 1: bug — test contract aligned to new code contract)
**Impact on plan:** Necessary correction to the test suite to reflect the intentional API contract change. No scope creep — touched only the test file paired with the modified renderer.

## Issues Encountered

**Pre-existing failure logged to deferred-items.md:** `src/data/units/rhythmUnit8Redesigned.test.js > Combined-values node variety (DATA-04) > rhythm_2_4` test fails on `main` HEAD baseline (verified by stashing my changes and re-running). Likely caused by the recent commit `aa220c9 fix(33-04): D-12 remove rest-bearing patterns from quarter-half tag pool`. Logged in `.planning/phases/33-rhythm-issues-cleanup/deferred-items.md` for plan 33-04 to investigate. Out of scope for plan 33-03 per SCOPE BOUNDARY rule (touched files: `useEnsureAudioReady.js`, `useAudioEngine.js`, `RhythmDictationQuestion.jsx` — no overlap with rhythm unit data files).

## Verification Status

| Gate                                 | Command                                                                                                                                           | Result                                                                                                                                                                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trail validator                      | `npm run verify:trail`                                                                                                                            | PASS (warnings only, no errors)                                                                                                                                                                                                                                         |
| Production build                     | `npm run build`                                                                                                                                   | PASS (built in 28.48s)                                                                                                                                                                                                                                                  |
| Touched-file lint                    | `npx eslint src/hooks/useEnsureAudioReady.js src/hooks/useAudioEngine.js src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx` | PASS (only pre-existing unused-var warnings — `disabled` and `reducedMotion` props in RhythmDictationQuestion, pre-existing)                                                                                                                                            |
| Renderer test suite                  | `npx vitest run src/components/games/rhythm-games/renderers/`                                                                                     | PASS                                                                                                                                                                                                                                                                    |
| Full vitest single-run               | `npm run test:run`                                                                                                                                | 1649 pass / 1 fail / 13 todo / 2 skipped — the 1 failure is the pre-existing `rhythmUnit8Redesigned.test.js` rhythm_2_4 variety test owned by plan 33-04 (see deferred-items.md)                                                                                        |
| Project-wide ESLint (`npm run lint`) | `npm run lint`                                                                                                                                    | FAIL — chokes on a `dist/assets/index-*.js` build artifact in another worktree (`.claude/worktrees/agent-a2e6e6b2/`). Pre-existing tooling issue, unrelated to plan 33-03's source files. The plan's must_haves require lint clean for **touched files**, which passes. |

## UAT Status

**UAT Issue 7** (`33-UAT.md`): Code change deployed to `main` via commit `63be508`. Awaiting user retest at deploy time per plan acceptance criteria — user should:

1. Pull latest, rebuild
2. Open `/trail` → Unit 1 → Node 1_2
3. Reach the rhythm_dictation question inside MixedLessonGame
4. Tap "Listen" — pattern should play audibly on the FIRST tap (no need to tap Replay)
5. Mark UAT issue 7 entry `[x] resolved-by-deploy` in `33-UAT.md`

This is the D-06 manual-UAT gate.

## Self-Check: PASSED

**File existence checks:**

- `src/hooks/useEnsureAudioReady.js` — FOUND (61 lines)
- `src/hooks/useAudioEngine.js` — FOUND, contains `loadPianoSound,` in return-object area (line 1206 region)
- `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx` — FOUND, contains `useEnsureAudioReady` import + `ensureAudioReady` invocation; old `audioEngine.initializeAudioContext()` call removed
- `.planning/phases/33-rhythm-issues-cleanup/deferred-items.md` — FOUND (logged out-of-scope test failure)

**Commit existence checks:**

- `d8548e4` (Task 1) — FOUND in git log
- `63be508` (Task 2) — FOUND in git log
