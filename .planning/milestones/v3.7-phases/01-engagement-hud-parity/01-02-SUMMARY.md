---
phase: 01-engagement-hud-parity
plan: 02
subsystem: ui
tags: [react, vexflow, vitest, sight-reading, combo, hud, i18n]

# Dependency graph
requires:
  - phase: 01-engagement-hud-parity
    provides: "SightReadingSessionContext exposes combo/isOnFire/incrementCombo/resetCombo (Plan 01)"
provides:
  - "SightReadingGame.jsx calls incrementCombo() at the correct-note record site and resetCombo() at the single miss-record site"
  - "ComboPill + OnFireBadge render in the HUD header; OnFireSplash renders as a root-level fragment sibling"
  - "One-shot on-fire splash effect (false -> true transition only) with no fire sound (mic-safety)"
  - "4-case combo integration test suite (SightReadingGame.combo.test.jsx) + extended micRestart mock"
affects: [sight-reading-game, phase-02-practice-tooling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Stateful mocked context hook (real useState/useCallback inside a vi.mock factory) to drive genuine re-renders through mocked context providers in integration tests, instead of static vi.fn() mocks"
    - "One-shot transition effect (prevIsOnFireRef) for celebration overlays, gated on false->true only — avoids re-splashing on every re-render while isOnFire stays true"

key-files:
  created:
    - src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx

key-decisions:
  - "No fire sound wired (planner's discretion, D-08 area) — sight-reading runs continuous mic pitch-detection during PERFORMANCE, and an audible oscillator blip risks a phantom mic detection / false note; splash + badge deliver the celebration safely without touching audio."
  - "isOnFire passed to ComboPill (matches RESEARCH.md's example, diverges from NotesRecognitionGame's own usage which omits it) — surfaces a double signal (OnFireBadge + ComboPill's own flame icon), intentional per 'maximum motivational juice' framing."

patterns-established:
  - "Stateful vi.mock context hook pattern for testing components that consume mocked context providers requiring genuine reactive state (documented above)"

requirements-completed: [HUD-01, HUD-03, I18N-01]

# Metrics
duration: 15min
completed: 2026-07-09
---

# Phase 01 Plan 02: Combo/On-Fire HUD Wiring Summary

**Sight-reading players now see a live ComboPill + OnFireBadge in the game HUD (incrementing on every correct note, resetting on window-close misses) plus a one-shot OnFireSplash celebration at combo >= 5, reusing the shared v3.6 HUD components and existing EN/HE i18n keys verbatim.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-09T22:54:36+03:00
- **Completed:** 2026-07-09T23:09:34+03:00
- **Tasks:** 2 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `SightReadingGame.jsx` now calls `incrementCombo()` at the single correct-note record site (inside `handleNoteDetected`) and `resetCombo()` at the single miss-record site (inside `schedulePerformanceTimeline`'s RAF `tick()`) — the exact two sites Plan 01's context was designed to be driven from
- `ComboPill` + `OnFireBadge` render in the HUD header's "Right Controls" flex container, before `ScorePill`; `OnFireSplash` renders as a root-level fragment sibling (outside `SightReadingLayout`, per D-08) so its `fixed inset-0` overlay isn't clipped
- A one-shot splash effect fires only on the `isOnFire` `false -> true` transition (1500ms), with no fire sound — deliberately avoided per D-08 since an audible oscillator blip during continuous mic pitch-detection risks a phantom mic detection / false note
- Accessible wrapper labels (`role="status"` + `aria-label`) reuse the existing `games.engagement.combo` / `games.engagement.onFire` i18n keys verbatim — no new locale keys, full EN+HE parity preserved
- No lives, no `GameOverScreen` — the existing encouragement/loss path is completely untouched (verified via grep: 0 matches)
- New `SightReadingGame.combo.test.jsx` integration suite (4 cases: correct-note increment, miss-window reset, cross-exercise persistence, on-fire threshold render) went RED before wiring and GREEN after, using a stateful mocked-context pattern (real `useState`/`useCallback` inside the `vi.mock` factory) so `ComboPill`/`OnFireBadge`/`OnFireSplash` exercise their own real transition effects faithfully
- `SightReadingGame.micRestart.test.jsx`'s `useSightReadingSession` mock extended with the four new fields (additive only) — its mic-restart regression assertions remain green throughout

## Task Commits

Each task was committed atomically:

1. **Task 1: Write combo integration test + extend the shared session mock (RED)** - `3e55b3bb` (test)
2. **Task 2: Wire and render combo/on-fire HUD in SightReadingGame (GREEN)** - `f0aa7366` (feat)

_TDD gate sequence confirmed: RED (`3e55b3bb`, all 4 new combo cases failing — `incrementCombo`/`resetCombo` never called, HUD pills never rendered) → GREEN (`f0aa7366`, all 4 cases passing after wiring). No separate REFACTOR commit — the GREEN commit already included the two small in-test fixes (AccessibilityContext mock, unused-var cleanup) needed to reach a clean pass, and the plan's own TDD-in-place workflow (Task 2 title: "GREEN") treats this as a single wiring commit rather than a 3-commit cycle._

## Files Created/Modified

- `src/components/games/sight-reading-game/SightReadingGame.jsx` - Added `ComboPill`/`OnFireBadge`/`OnFireSplash` imports, destructured `combo`/`isOnFire`/`incrementCombo`/`resetCombo` from `useSightReadingSession()`, added the one-shot splash transition effect, wired `incrementCombo()`/`resetCombo()` into the two existing record sites (with their stable-callback dependency arrays), and rendered the three HUD pieces (header pills + root-level splash)
- `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` - New 4-case integration suite: fires a real correct-note detection via a captured `useMicNoteInput` `onNoteEvent` callback, lets the RAF miss-branch fire naturally via fake-timer advancement, and drives on-fire threshold rendering via a captured `incrementCombo` reference — all backed by a stateful mocked `useSightReadingSession` hook
- `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` - Extended its static `useSightReadingSession` mock with `combo: 0, isOnFire: false, incrementCombo: vi.fn(), resetCombo: vi.fn()` (additive, no other changes)

## Decisions Made

- **No fire sound** — sight-reading keeps continuous mic pitch-detection live during PERFORMANCE; an oscillator blip (as used in `NotesRecognitionGame`) risks a false-positive mic detection. The visual splash + badge carry the celebration alone.
- **`isOnFire` passed to `ComboPill`** — surfaces both the dedicated `OnFireBadge` and `ComboPill`'s own internal flame-icon swap simultaneously; intentional double-signal per RESEARCH.md's "maximum motivational juice" framing, even though the `NotesRecognitionGame` analog omits this prop in its own usage.
- **Stateful mock for the combo test file** — rather than a static `vi.fn()`-only mock (sufficient for the pre-existing micRestart test), the new integration suite's `useSightReadingSession` mock runs real `useState`/`useCallback` internally so `ComboPill`/`OnFireBadge`/`OnFireSplash` see genuine state transitions (needed specifically for the on-fire `false -> true` splash-trigger test).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing `AccessibilityContext` mock in the new test file**

- **Found during:** Task 2 (running the combo test suite after wiring)
- **Issue:** `OnFireBadge` calls `useAccessibility()` internally (dual reduced-motion source per its own docstring); the new test file rendered `SightReadingGame` without an `AccessibilityProvider` in the tree, throwing "useAccessibility must be used within an AccessibilityProvider" once the game started rendering the real (unmocked) `OnFireBadge`.
- **Fix:** Added `vi.mock("../../../contexts/AccessibilityContext", () => ({ useAccessibility: vi.fn(() => ({ reducedMotion: false })) }))`, matching the exact convention already used in `ArcadeRhythmGame.test.js` for the same dependency.
- **Files modified:** `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx`
- **Verification:** Suite went from 2 passed/2 failed to 4/4 passed on the next run.
- **Committed in:** `f0aa7366` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed a self-inflicted test design bug in the "persists across exercises" case**

- **Found during:** Task 2 (test iteration)
- **Issue:** The test drove `combo` to 3 via direct `capturedIncrementCombo()` calls without ever scoring the pattern's single note through the real detection pipeline. When the test then advanced fake timers to reach the FEEDBACK phase, the real (now-wired) miss-branch legitimately fired `resetCombo()` for the still-unscored note — correct production behavior, but it broke the test's own premise (testing persistence across `goToNextExercise`, not the miss path).
- **Fix:** Rewrote the test to score the note correctly via the real `capturedOnNoteEvent` pipeline first (as in Test 1), so no pending miss exists when the exercise timeline completes; combo then genuinely persists across the `Next Exercise` click.
- **Files modified:** `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx`
- **Verification:** Test passes; confirmed via full 5-test run (4 combo + 1 micRestart) green.
- **Committed in:** `f0aa7366` (Task 2 commit)

**3. [Rule 1 - Bug] Removed unused `capturedResetCombo` test variable**

- **Found during:** Task 2 (post-wiring lint pass)
- **Issue:** ESLint flagged `capturedResetCombo` as assigned but never read (`no-unused-vars`) — a leftover capture point from an earlier draft of the test file that was never needed by any assertion.
- **Fix:** Removed the variable and its two assignment sites (mock hook body, `beforeEach` reset).
- **Files modified:** `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx`
- **Verification:** `npx eslint` on the file returns 0 problems; suite still 4/4 green.
- **Committed in:** `f0aa7366` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs — all confined to the new test file's own harness, none touched production code beyond what the plan specified)
**Impact on plan:** All three were test-infrastructure corrections needed to reach a genuinely green, non-flaky suite. No scope creep; `SightReadingGame.jsx`'s production changes match the plan's `<action>` block exactly (verified via the plan's own acceptance-criteria greps, all passing).

## Issues Encountered

None beyond the three auto-fixed test-harness issues documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 01 (Engagement HUD Parity) is now complete: both plans executed (Plan 01 — session-wide combo state; Plan 02 — HUD wiring). All phase success criteria are met:
  - Live ComboPill increments on correct notes and resets on window-close misses (HUD-01, D-04) — verified by the new integration suite
  - OnFireBadge + OnFireSplash celebrate at combo >= 5, reduced-motion honored by the self-contained shared components (HUD-03, D-08)
  - OnFireSplash is a root-level `fixed inset-0` sibling, not inside `SightReadingLayout` (D-08) — verified via grep placement check
  - Combo/on-fire accessible labels reuse `games.engagement.combo`/`onFire` in EN+HE (I18N-01, D-07) — no new locale keys added
  - No lives, no GameOverScreen; encouragement screen unchanged (D-01, D-03) — verified via grep (0 matches)
- Full existing test suite remains green (1975 passed, 13 todo, 2 intentionally skipped — up from the pre-Plan-01 baseline of 1971 passed, reflecting the 4 new combo tests net of consolidation)
- Ready for Phase 02 (Practice Tooling): "hear it again" replay, Practice vs Test mode, Review-mistakes mode — none of these touch the combo/on-fire state this phase introduced, but Phase 02 plans should be aware `incrementCombo()`/`resetCombo()` are now live at the two record sites documented above if replay/review flows ever re-enter the scoring pipeline
- No blockers.

---

_Phase: 01-engagement-hud-parity_
_Completed: 2026-07-09_

## Self-Check: PASSED

All created files and commits verified present:

- FOUND: src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx
- FOUND: src/components/games/sight-reading-game/SightReadingGame.jsx
- FOUND: src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx
- FOUND: .planning/phases/01-engagement-hud-parity/01-02-SUMMARY.md
- FOUND: 3e55b3bb (test commit)
- FOUND: f0aa7366 (feat commit)
