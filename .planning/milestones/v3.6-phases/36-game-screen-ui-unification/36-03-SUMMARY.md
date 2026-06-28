---
phase: 36-game-screen-ui-unification
plan: 03
type: checkpoint
wave: 3
status: complete
autonomous: false
requirements: [REQ-01, REQ-06]
---

# 36-03 Summary — Owner Verification: NotesRecognitionGame Base-Shell Zero-Regression

## Outcome

**APPROVED.** The owner verified NotesRecognitionGame after the Wave 1 base-shell
extraction (Plan 36-02) and confirmed the reference screen is regression-free. Wave 2
base-shell rollout to the other games is unblocked.

## What was verified

Plan 36-02 extracted `ProgressBar`, `ScorePill`, and `TimerDisplay` from
NotesRecognitionGame into `src/components/games/shared/hud/` and refactored
NotesRecognitionGame to consume them. The engagement layer (lives, combo, on-fire,
speed-bonus, tier-up) was intentionally left inline and unchanged this wave.

Automated checks at the time of approval:

- Contract tests GREEN: `npx vitest run src/components/games/shared/hud` (ProgressBar +
  ScorePill).
- Full suite GREEN: 1910 passed / 13 todo / 2 skipped.
- Production build clean (`npm run build` exit 0, ~41s).

The owner approved the base-shell render/animation parity ("note recognition test
approved").

## Notes / out of scope

During verification, the dev server logged `403 Forbidden` errors for self-hosted
`@fontsource` font files (`nunito-*`, `quicksand-*` `.woff`/`.woff2`). Confirmed this is
**unrelated to Phase 36** — `git diff f85fe46..HEAD` shows no font, CSS, `index.html`, or
Vite config files were touched by this phase (only HUD components + planning docs). The
403s are an environment/dev-server issue (likely missing `@fontsource` deps in the
worktree's `node_modules`, or the service worker intercepting font requests) and cause
only a fallback to system fonts. Tracked as out-of-scope; does not affect HUD parity.

## Gate

Wave 4 (base-shell rollout to SightReading, Memory, RhythmReading, RhythmDictation,
MixedLesson, MetronomeTrainer) is unblocked.
