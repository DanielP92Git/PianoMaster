---
phase: 02-practice-tooling
reviewed: 2026-07-10T09:20:10Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - src/components/games/sight-reading-game/components/FeedbackSummary.jsx
  - src/components/games/sight-reading-game/components/ReviewDrillPanel.jsx
  - src/components/games/sight-reading-game/components/SightReadingLayout.jsx
  - src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx
  - src/components/games/sight-reading-game/constants/gradingModes.js
  - src/components/games/sight-reading-game/hooks/useReviewDrill.js
  - src/components/games/sight-reading-game/hooks/useReviewDrill.test.js
  - src/components/games/sight-reading-game/hooks/useTimingAnalysis.js
  - src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js
  - src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx
  - src/components/games/sight-reading-game/SightReadingGame.jsx
  - src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx
  - src/components/games/sight-reading-game/SightReadingGame.practiceMode.test.jsx
  - src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx
  - src/components/games/sight-reading-game/SightReadingGame.review.test.jsx
  - src/components/games/sight-reading-game/utils/comparisonPattern.js
  - src/components/games/sight-reading-game/utils/comparisonPattern.test.js
  - src/components/games/sight-reading-game/utils/scoreCalculator.js
  - src/components/games/sight-reading-game/utils/scoreCalculator.test.js
  - src/components/games/VictoryScreen.jsx
  - src/contexts/SightReadingSessionContext.jsx
  - src/hooks/useVictoryState.js
  - src/locales/__tests__/sight-reading-parity.test.js
  - src/locales/en/common.json
  - src/locales/he/common.json
findings:
  critical: 2
  warning: 3
  info: 1
  total: 6
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-07-10T09:20:10Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

This phase adds practice-mode grading (PRAC-03), DISPLAY-phase replay (PRAC-01),
played-vs-correct comparison playback (PRAC-02), and a review-mistakes drill
(PRAC-04) to the sight-reading game. To scope the review precisely, the diff for
`SightReadingGame.jsx`, `VexFlowStaffDisplay.jsx`, `SightReadingSessionContext.jsx`,
`useVictoryState.js`, and `VictoryScreen.jsx` was isolated against the pre-phase
commit (`d06a6185`) and read in full; the newly-added hooks/utils/components were
read in their entirety. All 45+ unit tests and 5 integration test files for this
phase pass (`npx vitest run`), and the EN/HE locale-parity test passes.

Despite green tests, two genuine functional defects were found by tracing the new
code paths end-to-end (not covered by the existing test suite, since both tests
mock out the exact seam where the bug lives): a moving-highlight rendering bug in
`VexFlowStaffDisplay` (stroke-width leaks across notes instead of moving with the
comparison playback), and a `suppressPersistence` gap in `useVictoryState`/
`VictoryScreen` that breaks the mid-node "Next Exercise" flow for Practice-mode
trail nodes with more than one exercise. Additionally, the new "Compare" feature
ships with orphaned i18n keys (`sightReading.compare.yours`/`correct`) that
strongly suggest a "yours vs. correct" label was planned but never wired up,
leaving the two playback passes visually indistinguishable to the user.

## Critical Issues

### CR-01: Comparison-playback highlight (PRAC-02) leaves a stroke-width trail instead of moving

**File:** `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx:1655-1679`

**Issue:** `highlightNote()` is meant to show a single moving outline on the staff
as the "yours vs. correct" comparison plays back (`playbackHighlightIndex`
advances note-by-note via `startComparison()` in `SightReadingGame.jsx`). The
`forEach` loop at line 1655 resets each note's `class`/`fill`/`stroke` attributes
every call (which correctly clears the CSS class `vf-playback-highlight` from the
previously-highlighted note), but it never resets the `stroke-width` attribute
that the additive block at line 1677 sets to `"4"` on the _currently_ highlighted
note. Since `stroke-width` is a real SVG presentation attribute that renders
independently of the `class` attribute, every note that was ever the active
highlight during a comparison pass keeps its thick stroke forever (until the next
full `renderStaff()` re-render, e.g. a pattern change). The explicit code comment
("overlays a glow/stroke-width bump on **a single note** ... WITHOUT touching any
other note's fill") documents the intended behavior, which this code does not
deliver: as the comparison plays through a multi-note pattern, notes accumulate
thickened strokes instead of showing one outline that moves. This is not covered
by any test — both `SightReadingGame.replay.test.jsx` and `.review.test.jsx` mock
out `VexFlowStaffDisplay` entirely, so the real DOM-attribute behavior is
untested.

**Fix:** Reset `stroke-width` for every note in the same loop that resets
`class`/`fill`/`stroke`, before (re-)applying it to the current highlight:

```js
notesRef.current.forEach((noteElement, idx) => {
  if (noteElement) {
    const colorInfo = getNoteColor(idx);
    const { fill, stroke, class: className } = colorInfo;
    noteElement.setAttribute("class", `vf-stavenote ${className}`);
    noteElement.setAttribute("fill", fill);
    noteElement.setAttribute("stroke", stroke || fill);
    noteElement.removeAttribute("stroke-width"); // clear any prior highlight bump
  }
});
```

### CR-02: Practice mode breaks "Next Exercise" flow for multi-exercise trail nodes

**File:** `src/hooks/useVictoryState.js:355-363`, `src/components/games/VictoryScreen.jsx:352-379`

**Issue:** When a trail node has more than one exercise (`exerciseIndex`/
`totalExercises` provided — see CLAUDE.md "Sequential Exercises"), the _real_
`exercisesRemaining` value only gets computed by awaiting
`updateExerciseProgress(...)` inside the `if (nodeId)` branch of
`processTrailCompletion`. The new `suppressPersistence` short-circuit added for
Practice mode (`useVictoryState.js:358-363`) returns **before** that call ever
runs:

```js
if (nodeId) {
  hasProcessedTrail.current = true;
  if (suppressPersistence) {
    setIsProcessingTrail(false);
    return;               // <-- exercisesRemaining/nodeComplete never computed
  }
  ...
  const result = await updateExerciseProgress(...);
  setExercisesRemaining(result.exercisesRemaining);
  ...
}
```

`exercisesRemaining` therefore keeps its `useState(0)` initial value for the
entire life of the practice-mode `VictoryScreen`. `VictoryScreen.jsx`'s CTA
selection (`exercisesRemaining > 0 && onNextExercise ? "Next Exercise" : ...`)
then always falls through to the "node complete" branch and renders "Next
Adventure" (`handleNavigateToTrail`), even when the node objectively has more
exercises left. A child practicing (Practice mode, unscored on purpose) a
multi-exercise trail node is bounced back to the trail map after the _first_
exercise instead of being able to step through exercise 2, 3, etc. — the exact
"stay in the node and keep practicing" flow this feature is supposed to support.

**Fix:** Compute `exercisesRemaining` (and `nodeComplete`) independent of
persistence — e.g. still call `getNodeProgress`/derive remaining count from
`totalExercises - exerciseIndex - 1` locally when `suppressPersistence` is true,
instead of defaulting to 0:

```js
if (suppressPersistence) {
  if (exerciseIndex !== null && totalExercises !== null) {
    setExercisesRemaining(Math.max(0, totalExercises - exerciseIndex - 1));
  }
  setIsProcessingTrail(false);
  return;
}
```

## Warnings

### WR-01: "Compare" playback never labels which pass is "yours" vs. "correct"

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:2655-2685` (`startComparison`), `src/locales/en/common.json:1701-1704`, `src/locales/he/common.json:1708-1710`

**Issue:** `startComparison()` plays the child's reconstructed rendition, then
chains directly into the correct pattern, using the _same_ moving-highlight
mechanism (`playbackHighlightIndex`) for both passes with no on-screen or
announced distinction between them. Both `en/common.json` and `he/common.json`
define a `sightReading.compare.yours` / `sightReading.compare.correct` key pair
(clearly intended for exactly this purpose), but a full-repo search confirms
neither key is referenced anywhere in the codebase — they're dead translations.
As shipped, a child tapping "Hear yours vs correct" hears two passes and sees the
same-looking moving outline twice with no way to tell which pass is "theirs" and
which is the target — undermining the stated goal of the feature (D-13/D-14,
"played-vs-correct comparison playback").

**Fix:** Surface a small state label (e.g. re-using the existing
`sightReading.compare.yours`/`correct` keys) in the FeedbackSummary/staff area
while each pass plays, driven off a new `comparisonPass` state
(`"yours" | "correct" | null`) set inside `playPass`/`playCorrectPass`.

### WR-02: Grading-mode toggle's `aria-label` masks the current Practice/Test state from screen readers

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:3919-3938`

**Issue:** The Practice/Test pill button's visible text already communicates
state (`"Practice"` or `"Test"`), but `aria-label={t("sightReading.controls.modeToggleLabel")}`
("Grading mode") overrides that for assistive tech — a screen-reader user hears
only "button, Grading mode" with no indication of the current mode or what
activating it will do. Given this app explicitly targets screen-reader
optimization (CLAUDE.md "Accessibility" section) and the audience is young
learners who may rely on a parent/teacher using assistive tech, this is a real
regression for a control that toggles a meaningful, state-changing setting.

**Fix:** Include the current state in the label and/or use `aria-pressed`:

```jsx
aria-label={t("sightReading.controls.modeToggleLabel")}
aria-pressed={isPracticeMode}
```

or fold the state into the label itself, e.g. `${modeToggleLabel}: ${isPracticeMode ? modePractice : modeTest}`.

### WR-03: `REVIEW_AUDITION_GUARD_MS` redeclared every render instead of hoisted to module scope

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:1004`

**Issue:** Unlike the file's other timing constants (`FIRST_NOTE_EARLY_MS`,
`NOTE_LATE_MS`, etc., all declared at module scope), `REVIEW_AUDITION_GUARD_MS`
is declared inside the component body, so a new `const` binding is created on
every render. It has no dependency on props/state, so there's no reason it can't
be hoisted — this is purely a consistency/quality nit, but this file already
sets the pattern for where such constants belong.

**Fix:** Move `const REVIEW_AUDITION_GUARD_MS = 500;` to module scope alongside
the other timing constants near the top of the file.

## Info

### IN-01: `playTargetPitch` inline arrow + non-memoized `useReviewDrill` return object churn every render

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:991`, `src/components/games/sight-reading-game/hooks/useReviewDrill.js:144-156`

**Issue:** `playTargetPitch: (pitch) => audioEngine.playPianoSound(0.6, pitch)` is
a fresh function literal on every `SightReadingGame` render, and
`useReviewDrill`'s return value is a plain object literal (not memoized), so
`reviewDrill` (and derived callbacks like `playCurrentTarget`) change identity on
every parent render. This is purely a re-render/perf concern (out of this
review's stated scope) and not a correctness issue since consumers read the
latest value via `reviewDrillRef`, but it's worth a follow-up since the rest of
the file deliberately memoizes hot objects (see `useRhythmPlayback`'s explicit
`useMemo` for the same reason, PERF-4).

**Fix (optional, follow-up):** Wrap `useReviewDrill`'s return value in
`useMemo`, and hoist/stabilize `playTargetPitch` with `useCallback`.

---

_Reviewed: 2026-07-10T09:20:10Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
