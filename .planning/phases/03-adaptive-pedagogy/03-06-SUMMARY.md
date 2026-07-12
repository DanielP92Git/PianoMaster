---
phase: 03-adaptive-pedagogy
plan: 06
subsystem: games
tags: [react, sight-reading, adaptive-pedagogy, vitest, supabase]

# Dependency graph
requires:
  - phase: 03-adaptive-pedagogy (Plan 01)
    provides: buildWeightedNotePool/MASTERY_MIN_ATTEMPTS pure engine functions (weak-note weighting)
  - phase: 03-adaptive-pedagogy (Plan 02)
    provides: updateExerciseProgress/updateNodeProgress optional trailing perNoteMastery param, getNodeProgress read path
  - phase: 03-adaptive-pedagogy (Plan 05)
    provides: baseAdaptiveSettingsRef pristine-baseline pattern, handleNextExercise exercise-boundary hook, nodeSupersetNotesRef
  - phase: 03-adaptive-pedagogy (Plan 07)
    provides: note_mastery column live in production (owner-approved apply) — this plan's write path targets a real column
provides:
  - "sessionMasteryRef session-scoped accumulator in SightReadingGame.jsx merging perNoteAccuracy across exercises via pure per-pitch addition"
  - "sessionMastery prop threaded SightReadingGame -> VictoryScreen -> useVictoryState -> updateExerciseProgress/updateNodeProgress trailing perNoteMastery arg; Practice mode skips the write via the existing suppressPersistence early-return"
  - "seedMasteryBiasedSettings(): reads getNodeProgress(studentId, nodeId).note_mastery and biases the baseline note pool via buildWeightedNotePool, applied at both the primary trail auto-start effect and the iOS gesture-gated auto-start path, races an 800ms timeout so gameplay never blocks on the network"
affects: [gsd-secure-phase]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Session-scoped useRef accumulator reset at the same !currentPattern guard as baseAdaptiveSettingsRef (true session start only), merged imperatively (not via setState) so the value is always current when read at render time for prop-passing"
    - "Promise.race(fetch, timeout) gate before the FIRST exercise's pattern generation — gameplay-availability takes precedence over completeness of adaptive biasing on a slow/failed network"
    - "Reusable async settings-seeding helper (seedMasteryBiasedSettings) shared by both entry points that reach startGame with fresh settings, so a feature added to one auto-start path can't silently be absent from the other"

key-files:
  created:
    - src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/VictoryScreen.jsx
    - src/hooks/useVictoryState.js

key-decisions:
  - "First-exercise race: PREFERRED option taken — the trail auto-start effect now awaits seedMasteryBiasedSettings (racing an 800ms timeout) BEFORE calling startGame, so exercise 1 is biased on a first-ever resumed session, not just exercise 2 onward."
  - "Rule 2 (missing critical functionality): applied the same seedMasteryBiasedSettings() call to the iOS gesture-gated auto-start path (handleGestureStart), which bypasses the main auto-configure effect entirely when AudioContext needs a user gesture to resume. Without this, iOS users on a suspended AudioContext — a large fraction of first-session mobile traffic — would silently never receive weak-note biasing at all, not just a one-exercise cold-start gap. This was not explicitly called out in the plan's action block (which only shows the primary effect), so it is documented here as a deviation."
  - "ADAPT-04 NOT marked complete in REQUIREMENTS.md, only ADAPT-03. Per 03-07-SUMMARY's own decision, ADAPT-04's final confirmation is explicitly deferred to the phase's dedicated /gsd-secure-phase pass, even though this plan reuses the existing JS gate (verifyStudentDataAccess via getNodeProgress) with no new bypass. Marking it complete here would pre-empt that dedicated security pass."
  - "sessionMastery is threaded as an unconditional prop (SightReadingGame -> VictoryScreen -> useVictoryState), never gated on grading mode at the SightReadingGame layer — Practice mode's skip happens entirely inside useVictoryState's existing suppressPersistence early-return, matching Plan 02's Pitfall-4-recommended default of 'no extra gate needed.'"

patterns-established:
  - "Async settings-seeding helpers that must run before a session's first pattern generation are exposed as a shared useCallback (seedMasteryBiasedSettings) rather than being inlined once, so every future auto-start entry point is 1 call away from correctness instead of requiring a full re-audit."

requirements-completed: [ADAPT-03]
# ADAPT-04 intentionally left pending — see key-decisions above; final confirmation
# belongs to the phase's dedicated /gsd-secure-phase pass per 03-07-SUMMARY.md.

# Metrics
duration: 45min
completed: 2026-07-12
---

# Phase 03 Plan 06: Weak-Note Targeting (Session Mastery Accumulation + Read-Back Biasing) Summary

**Session-scoped perNoteAccuracy accumulator persists to the live `note_mastery` column at session end (Practice-skipped for free) and a later session reads it back through the existing JS authorization gate to bias sight-reading note selection toward historically-weak pitches, closing the adaptive loop across sessions.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 2 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- `SightReadingGame.jsx` accumulates each finished exercise's `summaryStats.perNoteAccuracy` into a session-scoped `sessionMasteryRef` (`{ [pitch]: { correct, total } }`) via pure per-pitch addition, guarded by the same `!exerciseRecorded` check as `recordSessionExercise` so a Try-Again replay never double-counts. Reset to `{}` at true session start (the same `!currentPattern` guard `baseAdaptiveSettingsRef` uses in `startGame`), so mid-session gear-icon settings changes don't reset it.
- `sessionMastery` is threaded as a plain prop chain: `SightReadingGame.jsx` -> `VictoryScreen.jsx` -> `useVictoryState.js`, landing as the trailing `perNoteMastery` argument on both `updateExerciseProgress` and `updateNodeProgress`. Because `suppressPersistence`'s existing early-return in `useVictoryState.js` fires before either service call, Practice mode skips the mastery write automatically — no new gate was added.
- `seedMasteryBiasedSettings()` (new `useCallback` in `SightReadingGame.jsx`) fetches `getNodeProgress(studentId, nodeId)` — which runs through the existing `verifyStudentDataAccess` JS gate — extracts `note_mastery`, and feeds it into Plan 01's `buildWeightedNotePool(baseNotes, masteryMap, MASTERY_MIN_ATTEMPTS)` to bias the baseline pool toward pitches with `>= MASTERY_MIN_ATTEMPTS` attempts and `< WEAK_ACCURACY_THRESHOLD` accuracy. Biasing only duplicates pitches already in the node's own pool (D-09) — cold start / no qualifying pitch returns the pool unchanged (uniform).
- First-exercise race handled deliberately (not left implicit): the trail auto-start effect now `await`s `seedMasteryBiasedSettings()` — raced against an 800ms timeout via `Promise.race` — BEFORE calling `startGame`, so exercise 1 is already biased. The same seeding call was added to the iOS gesture-gated auto-start path (`handleGestureStart`), which otherwise bypasses the main effect entirely (Rule 2 — see Decisions).
- `SightReadingGame.mastery.test.jsx` (created in Task 1, extended in Task 2) covers three layers: SightReadingGame-level accumulation reaching VictoryScreen's `sessionMastery` prop (Test mode) and `suppressPersistence` (Practice mode); `useVictoryState`-level direct `renderHook` coverage proving the trailing `perNoteMastery` arg reaches both `updateExerciseProgress` and `updateNodeProgress` in Test mode and neither is called in Practice mode; and SightReadingGame-level weak-note biasing (a weak pitch over-represented in exercise 1's generated pool, cold start unchanged, free play never attempts the fetch).

## Task Commits

Each task was committed atomically:

1. **Task 1: Accumulate session mastery + thread it to session-end persistence (+ create the mastery test)** - `4bceee36` (feat)
2. **Task 2: Read persisted mastery on node start + bias note selection (weak-note targeting)** - `de267b83` (feat)

_Plan metadata commit intentionally omitted from the numbered list above — worktree mode excludes STATE.md/ROADMAP.md from this agent's commits; the orchestrator handles the shared-state metadata commit centrally after wave merge. This SUMMARY.md (+ REQUIREMENTS.md) is committed separately per the worktree git_commit_metadata step._

## Files Created/Modified

- `src/components/games/sight-reading-game/SightReadingGame.jsx` - `sessionMasteryRef` accumulator (reset in `startGame`'s `!currentPattern` guard, merged in `handleNextExercise`, passed to `<VictoryScreen sessionMastery=.../>`); `seedMasteryBiasedSettings()` helper (imports `getNodeProgress`, `buildWeightedNotePool`, `MASTERY_MIN_ATTEMPTS`) called from both the primary trail auto-start effect and `handleGestureStart`, gating exercise 1's pattern generation on the mastery fetch with an 800ms timeout fallback.
- `src/components/games/VictoryScreen.jsx` - Destructures `sessionMastery = null` and relays it into `useVictoryState(...)` (no render use, same pattern as `suppressPersistence`).
- `src/hooks/useVictoryState.js` - Destructures `sessionMastery = null`; passes it as the trailing arg to both `updateExerciseProgress(...)` and `updateNodeProgress(...)`; added to the `processTrailCompletion` effect's dependency array.
- `src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx` - New: three-layer coverage (SightReadingGame accumulation/prop-threading, useVictoryState service-call plumbing via `renderHook`, SightReadingGame weak-note-biasing read-side) — 8 tests total.

## Decisions Made

See `key-decisions` in frontmatter above for the full rationale on: (1) the PREFERRED first-exercise-race option chosen over the cold-start-gap alternative; (2) the Rule 2 extension of mastery seeding to the iOS gesture-gated auto-start path; (3) why only ADAPT-03 (not ADAPT-04) was marked complete in REQUIREMENTS.md; (4) why `sessionMastery` is passed unconditionally rather than gated at the SightReadingGame layer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Extended mastery-biased seeding to the iOS gesture-gated auto-start path**

- **Found during:** Task 2, while implementing the primary trail auto-start effect's gating
- **Issue:** The plan's action block shows the mastery fetch being gated inside the primary node-auto-configure effect only. That effect returns early (before setting `hasAutoConfigured.current` or reading node data) whenever the AudioContext needs a user gesture to resume (`ctx.state === "suspended" || "interrupted"` — the IOS-02 tap-to-start path). The separate `handleGestureStart` callback then drives the ENTIRE session start on its own, calling `startGame` directly with no mastery fetch at all. Left as-is, this is not merely a one-exercise cold-start gap — it means weak-note biasing would NEVER fire for any session that goes through the iOS gesture-gated path, which is common on iOS Safari (AudioContext frequently starts suspended pending a user gesture).
- **Fix:** Extracted the mastery-fetch-and-bias logic into a shared `seedMasteryBiasedSettings()` `useCallback` and called it from both entry points (the primary effect and `handleGestureStart`), so neither path can silently diverge from the other.
- **Files modified:** `src/components/games/sight-reading-game/SightReadingGame.jsx`
- **Verification:** Full `src/components/games/sight-reading-game` suite green (19 files, 205 tests) after the fix; no existing test exercises `handleGestureStart` directly, so this is a defense-in-depth completeness fix rather than something that could have been caught by a pre-existing regression test.
- **Committed in:** `de267b83` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 2 missing-critical-functionality fix, 1 file touched)
**Impact on plan:** Necessary for the weak-note-targeting feature to actually apply consistently across all session-start entry points on the affected platform (iOS). No scope creep — same seeding logic, same node's own pool, no new persistence path introduced.

## Issues Encountered

None beyond the iOS gesture-path completeness gap documented above.

## User Setup Required

None - no external service configuration required. The `note_mastery` column this plan writes to is already live in production (Plan 03-07, owner-approved). No further Supabase action needed for this plan.

## Next Phase Readiness

- ADAPT-03 (per-note mastery persists across sessions and biases weak-note targeting) is fully wired end-to-end: accumulation -> persistence -> read-back -> biasing, all regression-tested.
- ADAPT-04's structural requirement (JS gate + DB RLS defense-in-depth, no new bypass) is satisfied by construction — this plan introduces no new read/write path, only reuses `getNodeProgress`/`updateExerciseProgress`/`updateNodeProgress`, all of which already run through `verifyStudentDataAccess` and existing RLS policies (confirmed live in Plan 03-07). Final sign-off is the phase's dedicated `/gsd-secure-phase` pass, per the phase's own roadmap decision.
- Full `src/components/games/sight-reading-game` suite (19 files, 205 tests) and the full project suite (`npm run test:run`: 100 files passed | 2 skipped, 2061 tests passed) are green — no regressions from this plan's changes.
- No blockers for phase close pending the `/gsd-secure-phase` pass.

---

_Phase: 03-adaptive-pedagogy_
_Completed: 2026-07-12_

## Self-Check: PASSED

- FOUND: src/components/games/sight-reading-game/SightReadingGame.jsx
- FOUND: src/components/games/VictoryScreen.jsx
- FOUND: src/hooks/useVictoryState.js
- FOUND: src/components/games/sight-reading-game/**tests**/SightReadingGame.mastery.test.jsx
- FOUND: .planning/phases/03-adaptive-pedagogy/03-06-SUMMARY.md
- FOUND commit: 4bceee36 (Task 1)
- FOUND commit: de267b83 (Task 2)
