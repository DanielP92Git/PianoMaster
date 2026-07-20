---
phase: 02-practice-tooling
plan: 09
subsystem: games
tags: [sight-reading, react, mic, i18n, vitest]

# Dependency graph
requires:
  - phase: 02-practice-tooling
    provides: "03 (useReviewDrill hook + ReviewDrillPanel component), 06 (FeedbackSummary onReview prop + SightReadingLayout 'review' phase contract), 08 (stable FEEDBACK-phase region SightReadingGame.jsx last touched)"
provides:
  - "GAME_PHASES.REVIEW registered in SightReadingGame.jsx's three phase-gating lists (session-timeout activePhases, showPlayableKeyboardBand, audio-interruption pause effect)"
  - "REVIEW input routing (mic/keyboard/PC-key) that runs BEFORE canScoreNow and never scores/touches combo"
  - "handleEnterReview/handleExitReview mic-lifecycle management + audition self-detection guard"
  - "ReviewDrillPanel wired into the review guidance region"
affects: []
# Final serial game-file wave of Phase 02 — no downstream plans depend on this one.

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "reviewDrillRef mirrors the useReviewDrill() return object every render (ref-mirror discipline, matching gamePhaseRef/currentPatternRef) so mic/keyboard/PC-key input-routing branches read the latest handlePitch without adding it to every callback's dependency array"
    - "Audition self-detection guard: playReviewTarget() arms a 500ms timestamp guard consulted only by the mic path (handleNoteEvent), so playing the target pitch (auto or via 'Play it') can never self-advance the drill via speaker-to-mic leakage — same class of concern as Phase 01's on-fire-sound-during-mic-listening avoidance"

key-files:
  created:
    - src/components/games/sight-reading-game/SightReadingGame.review.test.jsx
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "handleKeyboardNoteInput owns the single REVIEW-routing branch for all keyboard-sourced input; the PC-keydown listener detects REVIEW and delegates to handleKeyboardNoteInput (bypassing its own canScoreNow gate) rather than duplicating reviewDrillRef.current.handlePitch(...) a third time"
  - "Auto-audition is deferred until after startListeningSync() resolves (mic mode) rather than firing immediately on entering REVIEW, per RESEARCH.md Open Q3's stated discretion — combined with the 500ms audition guard for defense in depth"
  - "Auto-exit effect (gamePhase===REVIEW && reviewDrill.isComplete -> handleExitReview()) returns to FEEDBACK automatically once every mistake is resolved; ReviewDrillPanel's own 'done' state Exit CTA remains as a fallback affordance in case the effect hasn't fired yet"

patterns-established:
  - "For a new active in-exercise phase, the addition checklist is: GAME_PHASES entry, session-timeout activePhases array, showPlayableKeyboardBand disjunct, audio-interruption pause-effect exclusion list (SETUP/FEEDBACK only), and the mic phase-enforcement switch's default case (already safe by omission)"

requirements-completed: [PRAC-04]

# Metrics
duration: 10min
completed: 2026-07-10
---

# Phase 02 Plan 09: Review-Mistakes Drill Wiring Summary

**Wires the Review-mistakes drill into `SightReadingGame.jsx`: a new `GAME_PHASES.REVIEW` registered in all three phase-gating lists, mic/keyboard/PC-key input routed to `useReviewDrill.handlePitch` before any scoring logic, a 500ms audition self-detection guard on the mic path, and `ReviewDrillPanel` rendered from the FEEDBACK panel's Review button through to an automatic return to FEEDBACK — closing PRAC-04 and completing Phase 02.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-10T11:51:00Z (approx, context gathering)
- **Completed:** 2026-07-10T12:01:24Z
- **Tasks:** 3 (plus one Rule-1 deviation)
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- `GAME_PHASES.REVIEW = "review"` added and registered in all three phase-gating lists Pitfall 4 calls out: session-timeout `activePhases` (child-safety timeout stays paused mid-drill), `showPlayableKeyboardBand` (keyboard users get an input surface), and the audio-interruption pause effect (already covered REVIEW implicitly by excluding only SETUP/FEEDBACK — documented explicitly with a comment)
- `useReviewDrill` instantiated against `performanceResults`/`currentPattern.notes`/`audioEngine.playPianoSound`; `reviewDrillRef` mirrors it every render so the mic (`handleNoteEvent`), keyboard (`handleKeyboardNoteInput`), and PC-keydown branches can all route REVIEW input to `reviewDrillRef.current.handlePitch(...)` and `return` BEFORE any `canScoreNow`/scoring call (D-22/Pitfall 3) — the drill never scores, never touches combo/on-fire (D-17/D-18)
- Mic-path audition guard: `playReviewTarget()` arms a 500ms timestamp guard before playing the target pitch (auto-audition on entry or the panel's "Play it" tap); `handleNoteEvent`'s REVIEW branch ignores mic pitch events until the guard expires, preventing the target-pitch playback from self-advancing the drill via speaker-to-mic leakage
- `handleEnterReview`/`handleExitReview` manage the mic lifecycle (start on entry after the button-tap gesture, stop on exit) and are wired to `FeedbackSummary`'s `onReview` prop and `ReviewDrillPanel`'s `onExit`; an auto-exit effect returns to FEEDBACK once `reviewDrill.isComplete` becomes true
- `ReviewDrillPanel` rendered in the guidance region for `gamePhase === GAME_PHASES.REVIEW`, reusing `SightReadingLayout`'s existing "review" phase contract (02-06) unchanged
- New `SightReadingGame.review.test.jsx` (4 tests): clean-run hides the Review button (D-20), Review button present + click enters REVIEW and renders `ReviewDrillPanel`, review input advances the drill without touching combo/`updateStudentScore`, and REVIEW is proven part of the session-timeout active set (`pauseTimer` fires on entry, not `resumeTimer`)
- Full `npx vitest run src/components/games/sight-reading-game` green (15 files / 166 tests, up from the pre-plan 162 by exactly the 4 new tests); full `npm run test:run` green (2015 passed, 13 todo, 2 skipped — up from the pre-plan 2011 baseline); `npm run lint` clean (0 errors, 125 pre-existing warnings, none in this plan's files); `npm run build` succeeds (prebuild trail validation passes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add GAME_PHASES.REVIEW + register in the three phase lists** - `134810f2` (feat)
2. **Task 2: Wire useReviewDrill, input routing, mic lifecycle, and ReviewDrillPanel render** - `85d50bd2` (feat)
3. **Task 3: Review drill component/integration test** - `2be4e4a6` (test)

**Deviation commit:** `7371785c` (fix — remove duplicate `sightReading.review` JSON key in EN/HE locales, see below)

## Files Created/Modified

- `src/components/games/sight-reading-game/SightReadingGame.jsx` - `GAME_PHASES.REVIEW` + three phase-list registrations (Task 1); `useReviewDrill`/`reviewDrillRef`/audition guard, REVIEW input routing in `handleNoteEvent`/`handleKeyboardNoteInput`/PC-keydown listener, `handleEnterReview`/`handleExitReview`, auto-exit effect, `ReviewDrillPanel` render, `FeedbackSummary` `onReview` wiring (Task 2)
- `src/components/games/sight-reading-game/SightReadingGame.review.test.jsx` - NEW: 4 integration tests (D-20 clean-run hide, enter-REVIEW render, no-score/no-combo review input, session-timeout active-set membership)
- `src/locales/en/common.json` / `src/locales/he/common.json` - Removed a duplicate, shadowed `sightReading.review` JSON object (Rule 1 fix, see Deviations)

## Decisions Made

See frontmatter `key-decisions` for the full list. Highlights:

- `handleKeyboardNoteInput` is the single owner of keyboard-sourced REVIEW routing; the PC-keydown listener delegates to it rather than duplicating `reviewDrillRef.current.handlePitch(...)` a third time, keeping one source of truth for keyboard-path REVIEW behavior.
- Auto-audition is deferred until `startListeningSync()` resolves (mic mode), combined with the 500ms audition guard on the mic path — belt-and-suspenders against the target-pitch playback self-advancing the drill.
- The auto-exit effect returns to FEEDBACK as soon as the drill completes; `ReviewDrillPanel`'s own "done" Exit CTA is retained as a fallback, not removed, in case the effect's re-render hasn't landed yet.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate, shadowed `sightReading.review` JSON key in EN/HE locale files**

- **Found during:** Task 3 (writing the review test's translation mapping, cross-checked against the real locale files)
- **Issue:** Both `src/locales/en/common.json` and `src/locales/he/common.json` had two sibling `"review": {...}` objects under `sightReading` — a 6-key block (missing `exit`) immediately followed later by a 7-key block matching 02-03's documented spec. Standard JS/JSON object-literal parsing means the second (last) key silently wins, so the first block was fully dead. Functionally harmless today since the surviving block is the complete one `ReviewDrillPanel` needs, but dead/duplicate keys are a latent risk (a future edit to the "wrong" block would silently do nothing).
- **Fix:** Removed the shadowed first `review` block from both locale files, keeping the complete 7-key block (title/progress/instruction/playIt/skip/done/exit).
- **Files modified:** src/locales/en/common.json, src/locales/he/common.json
- **Verification:** Both files parse as valid JSON; a Python duplicate-key scan confirms no more `sightReading.review` duplicates; `npx vitest run src/locales/__tests__/sight-reading-parity.test.js` green.
- **Committed in:** `7371785c` (standalone fix commit)

Also logged (not fixed, out of scope): a pre-existing, unrelated duplicate `syllableToggle` JSON key in the rhythm-games section of both locale files (byte-identical blocks, harmless) — recorded in `.planning/phases/02-practice-tooling/deferred-items.md` per the Scope Boundary rule.

---

**Total deviations:** 1 auto-fixed (1 Rule 1 — bug), 1 logged-and-deferred (out of scope)
**Impact on plan:** The auto-fix removed dead/duplicate data directly inside the feature this plan wires (the exact `sightReading.review.*` keys `ReviewDrillPanel` consumes). No scope creep — no new components, no architectural changes.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PRAC-04 (Review-mistakes mode) is fully wired, tested, and this closes the last practice-tooling requirement for Phase 02 (PRAC-01/02/03/04 all shipped across plans 02-01/02-03/02-06/02-07/02-08/02-09).
- This was the final serial game-file wave for Phase 02 — no downstream plans in this phase depend on `SightReadingGame.jsx` further.
- Full `npm run test:run` (2015/2015 passed, 13 todo, 2 skipped), `npm run lint` (0 errors), and `npm run build` (prebuild trail validation) all clean; ready for `/gsd-verify-phase 02`.
- Manual/device verification intentionally deferred per the plan's `<verification>` block: mic-mode review does not phantom-detect the target audition, keyboard review works, child-safety timeout does not fire mid-drill.

---

_Phase: 02-practice-tooling_
_Completed: 2026-07-10_

## Self-Check: PASSED

- FOUND: src/components/games/sight-reading-game/SightReadingGame.jsx
- FOUND: src/components/games/sight-reading-game/SightReadingGame.review.test.jsx
- FOUND: src/locales/en/common.json
- FOUND: src/locales/he/common.json
- FOUND commit: 134810f2
- FOUND commit: 85d50bd2
- FOUND commit: 7371785c
- FOUND commit: 2be4e4a6
