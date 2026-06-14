---
quick_id: 260614-5wj
slug: make-listen-and-tap-game-ui-consistent-w
description: Make Listen & Tap (MetronomeTrainer) game UI consistent with the other games per Phase 36
date: 2026-06-14
status: complete
commit: df2bdff4
---

# Quick Task 260614-5wj — Summary

## What & why

Phase 36 ("Game Screen UI Unification") gave the "Listen & Tap" game
(`MetronomeTrainer.jsx`) the shared HUD **only in trail mode** (decision D-02), so
it still rendered its own progress + feedback UI everywhere else. The owner flagged
this as inconsistent and asked to bring it in line with the other games. Using the
sibling tap game `RhythmReadingGame` as the consistency reference, two genuine
divergences were fixed; mechanic-appropriate UI was intentionally kept.

## Changes (`src/components/games/rhythm-games/MetronomeTrainer.jsx`)

1. **Unified header.** Replaced the custom "Compact Header" (big `<h1>"Listen &
Tap"` + `timeSig • BPM • difficulty` subtitle + `nodeId`-gated `ScorePill` /
   text-counter) and the separate trail-only `ProgressBar` row with a single slim
   `<header>`: `BackButton` + flex-1 shared `ProgressBar` + `ScorePill`, mirroring
   `RhythmReadingGame.jsx:889`. The progress bar and score pill now render in
   **both** trail and free-practice mode (no more `nodeId` gating). Removed the
   now-unused `displayExerciseNumber` helper.

2. **Removed the bespoke live 4-stat footer** (patterns / XP / maxCombo / goodTaps)
   that no other game shows during play. Those stats still surface at session end on
   the shared `VictoryScreen`. Kept the feedback-phase nav buttons (Next Pattern /
   End Session).

## Intentionally kept (mechanic-appropriate, not styling divergence)

- **In-tap-button accuracy feedback** (`TapArea` PERFECT/GOOD/FAIR/MISS): coupled to
  the metronome's tap target. `FloatingFeedback` is built for staff games and would
  be a downgrade on a large tap button.
- **Phase guidance text** ("Listen to the pattern", "Keep tapping…"): instructional
  scaffolding for the listen-then-tap mechanic.

No scoring / mechanics / state / audio / landscape-lock logic was touched —
presentation only. The unused `metronomeTrainer.headerTitle`, `progressLabel`, and
`stats.{patterns,maxCombo,goodTaps}` i18n keys were left in place (harmless; removing
them is optional locale cleanup, not required since no new strings were added).

## Verification

- `npx eslint src/components/games/rhythm-games/MetronomeTrainer.jsx` → 0 errors
  (2 pre-existing `react-hooks/exhaustive-deps` warnings on `nodeType`, unrelated).
- `npx vitest run src/components/games/rhythm-games` → **22 files / 241 tests pass**.
- Pre-commit hook (lint-staged: eslint --fix + prettier) passed on commit.

## Follow-up — mid-game feedback buttons (owner request)

After walkthrough, the owner preferred SightReading's `FeedbackSummary` action
buttons (solid green→emerald "Try Again" + indigo→violet "Next") over Listen &
Tap's generic `<Button variant="primary">` (blue gradient) + `variant="outline"`
(hollow) feedback-phase buttons, and asked to make the style consistent across all
games. Survey confirmed `FeedbackSummary` (SightReading) was the only place that
style existed and `MetronomeTrainer` was the only divergent game (`GameControls`
is play/pause transport, not results nav).

- **New** `src/components/games/shared/hud/GameActionButton.jsx` — single source of
  truth for the solid gradient pill: tones `retry` (green→emerald), `advance`
  (indigo→violet), `neutral` (slate, for secondary/exit).
- `FeedbackSummary.jsx` refactored to consume it — pixel-identical (it is the
  reference style; zero visual regression).
- `MetronomeTrainer.jsx` FEEDBACK-phase buttons now use it: **Next Pattern** =
  `advance`, **End Session** = `neutral` (replaces blue `primary` + hollow
  `outline`). Removed the now-unused `Button` import.

Verified: `eslint` clean on all three files; `vitest run` rhythm-games +
sight-reading → **28 files / 342 tests pass**.

## Commits

- `df2bdff4` — feat(36/quick): unify Listen & Tap (MetronomeTrainer) HUD with other games
- `b8977261` — feat(36/quick): unify mid-game feedback buttons via shared GameActionButton

## Follow-ups (optional, not done)

- Locale cleanup: remove the now-unused `metronomeTrainer.headerTitle`,
  `progressLabel`, `stats.patterns`, `stats.maxCombo`, `stats.goodTaps` keys from
  `en`/`he` if desired.
