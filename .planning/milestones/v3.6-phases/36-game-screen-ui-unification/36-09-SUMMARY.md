---
phase: 36-game-screen-ui-unification
plan: "09"
subsystem: games/rhythm-games
tags: [hud, arcade-rhythm, combo-pill, lives-display, refactor, wave-6]
dependency_graph:
  requires: ["36-07"]
  provides: ["ArcadeRhythmGame-shared-hud"]
  affects: ["src/components/games/rhythm-games/ArcadeRhythmGame.jsx"]
tech_stack:
  added: []
  patterns:
    ["shared-hud-adoption", "combo-2-guard-in-parent", "isOnFire-prop-routing"]
key_files:
  modified:
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx
decisions:
  - "combo >= 2 render guard stays in ArcadeRhythmGame (parent owns game-specific threshold — D-09)"
  - "On-fire flows through ComboPill isOnFire prop (Flame icon), not a separate OnFireBadge"
  - "LivesDisplay Framer animations are an accepted enhancement over the prior static heart row (D-09)"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-14"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 36 Plan 09: ArcadeRhythmGame HUD De-duplication Summary

**One-liner:** Replace ArcadeRhythmGame's inline combo badge (Zap/Flame) and static heart row with shared ComboPill + LivesDisplay, preserving combo>=2 guard, landscape lock, exported constants, and GameOver path.

## What Was Built

Wave 6 (D-05/D-09): De-duplicated ArcadeRhythmGame's engagement HUD onto the shared components introduced in Plan 36-07. The game's inline JSX for combo and lives was replaced with the single-source-of-truth components.

### Changes in `ArcadeRhythmGame.jsx`

**Removed:**

- `import { Heart, Zap, Flame } from "lucide-react"` — all three now dead after HUD de-dup
- Inline combo badge: `{combo >= 2 && <div className="rounded-full border ..."><Flame .../>{combo}<Zap .../></div>}`
- Inline hearts: `<div role="group" ...>{Array.from({ length: INITIAL_LIVES }).map((_, i) => <Heart .../>)}</div>`

**Added:**

- `import { ComboPill } from "../shared/hud/ComboPill"` (line 10)
- `import { LivesDisplay } from "../shared/hud/LivesDisplay"` (line 11)
- `{combo >= 2 && <ComboPill combo={combo} isOnFire={isOnFire} />}` — combo threshold guard stays in parent
- `<LivesDisplay lives={lives} totalLives={INITIAL_LIVES} />` — animated heart row

## Preservation Constraints Verified

| Constraint                                                         | Status               |
| ------------------------------------------------------------------ | -------------------- |
| `useDeclareNeedsLandscape(isPhoneViewport)` present and unchanged  | CONFIRMED (line 142) |
| `combo >= 2` guard remains in parent (not inside ComboPill)        | CONFIRMED            |
| On-fire via `isOnFire` prop on ComboPill (no separate OnFireBadge) | CONFIRMED            |
| `INITIAL_LIVES` exported                                           | CONFIRMED (line 47)  |
| `ON_FIRE_THRESHOLD` exported                                       | CONFIRMED (line 48)  |
| `GAME_PHASES` exported                                             | CONFIRMED (line 39)  |
| Lives decrement / GameOver path untouched                          | CONFIRMED            |

## Test Results

- `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` — **12/12 passed**
- `npx vitest run src/components/games/shared/hud` — **13/13 passed**
- `npm run test:run` — **1916 passed, 2 test files skipped (pre-existing), 0 failures**
- `npm run lint` — **0 errors** (126 pre-existing warnings, unchanged)
- `npm run build` — **clean** (chunk size warnings are pre-existing)

## Commits

| Hash       | Description                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------- |
| `06f5ba8d` | refactor(36-09): de-dup ArcadeRhythmGame engagement HUD onto shared ComboPill + LivesDisplay |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — presentational component swap with no new trust boundaries, network calls, or auth paths.

## Self-Check: PASSED

- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — file exists and contains correct imports
- Commit `06f5ba8d` exists in git log
- `useDeclareNeedsLandscape(isPhoneViewport)` confirmed present at line 142
- `combo >= 2` guard confirmed in parent JSX
- All exports (`INITIAL_LIVES`, `ON_FIRE_THRESHOLD`, `GAME_PHASES`) confirmed
