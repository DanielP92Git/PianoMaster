---
phase: 36-game-screen-ui-unification
plan: "07"
subsystem: shared-hud
tags: [engagement-layer, lives, combo, on-fire, tdd, framer-motion]
dependency_graph:
  requires: ["36-04", "36-05", "36-06"]
  provides: ["LivesDisplay", "ComboPill", "OnFireBadge", "OnFireSplash"]
  affects: []
tech_stack:
  added: []
  patterns:
    - "RED→GREEN TDD: contract tests written before components"
    - "Animation encapsulation (D-10): ComboPill diffs combo prop via prevComboRef internally"
    - "Dual-source reduced-motion: OnFireBadge reads both useMotionTokens().reduce and useAccessibility().reducedMotion"
    - "Verbatim lift: components extracted from NotesRecognitionGame inline JSX without redesign"
key_files:
  created:
    - src/components/games/shared/hud/LivesDisplay.test.jsx
    - src/components/games/shared/hud/ComboPill.test.jsx
    - src/components/games/shared/hud/LivesDisplay.jsx
    - src/components/games/shared/hud/ComboPill.jsx
    - src/components/games/shared/hud/OnFireBadge.jsx
    - src/components/games/shared/hud/OnFireSplash.jsx
  modified: []
decisions:
  - "ComboPill internalizes shake/scale via prevComboRef diff — no comboShake prop from parent (D-10)"
  - "OnFireBadge reads BOTH useMotionTokens().reduce AND useAccessibility().reducedMotion for animate-pulse guard"
  - "flame.png import uses 4-level path (../../../../assets/icons/flame.png) from hud/ vs 3-level in NotesRecognitionGame"
  - "Heart mock in LivesDisplay.test.jsx passes className through to enable active/spent heart assertions"
metrics:
  duration: "~20 minutes"
  completed: "2026-06-14"
  tasks_completed: 3
  files_created: 6
---

# Phase 36 Plan 07: Engagement Layer Base Components — LivesDisplay, ComboPill, OnFireBadge, OnFireSplash

Verbatim extraction of NotesRecognitionGame's inline engagement-layer JSX into four shared/hud/ named exports, with RED→GREEN contract tests for the two unit-testable components.

## Tasks Completed

| Task | Name                                            | Commit   | Files                                     |
| ---- | ----------------------------------------------- | -------- | ----------------------------------------- |
| 1    | RED contract tests for LivesDisplay + ComboPill | 2d26262f | LivesDisplay.test.jsx, ComboPill.test.jsx |
| 2    | Create LivesDisplay.jsx + ComboPill.jsx (GREEN) | 67cdbec3 | LivesDisplay.jsx, ComboPill.jsx           |
| 3    | Create OnFireBadge.jsx + OnFireSplash.jsx       | 67cdbec3 | OnFireBadge.jsx, OnFireSplash.jsx         |

Tasks 2 and 3 were committed together since Task 3 had no separate contract tests; all four components were verified by the full hud suite before committing.

## TDD Gate Compliance

**RED gate (Task 1, commit 2d26262f):** Both `LivesDisplay.test.jsx` and `ComboPill.test.jsx` were committed first. Running them confirmed non-zero exit — both failed with `Failed to resolve import "./LivesDisplay"` / `Failed to resolve import "./ComboPill"`, not syntax errors.

**GREEN gate (Task 2, commit 67cdbec3):** After creating all four components, `npx vitest run src/components/games/shared/hud/LivesDisplay.test.jsx src/components/games/shared/hud/ComboPill.test.jsx` passed with 6/6 tests. Full hud suite: 13/13 across 4 files (ProgressBar, ScorePill, LivesDisplay, ComboPill).

## Verification Results

- `npx vitest run src/components/games/shared/hud` — 4 test files, 13 tests: **ALL PASS**
- `npm run test:run` — 83 test files (2 skipped), 1916 tests: **ALL PASS**, no regressions
- `npm run build` — **clean** (pre-existing chunk size warnings, no new errors)
- `npx eslint` on 4 component files — **no errors**

## Deviations from Plan

### Auto-adjusted: Heart mock passes className through

The plan's suggested lucide-react mock used `Heart: () => <span data-testid="heart"/>` (no className passthrough). This would prevent asserting which hearts carry `fill-red-400` vs `text-white/30` since those classes live on the Heart element, not the wrapper. The Heart mock was adjusted to `Heart: ({ className }) => <span data-testid="heart" className={className}/>` so the active/spent assertion in test 2 can inspect className. This is a test-quality improvement that does not affect the component implementation.

### Worktree base correction

This agent worktree (`worktree-agent-aa1cf3122ae16abfa`) was created before the wave 1–4 commits landed on the feature branch. The branch HEAD was at `5f6fba3e` (below the required base `36040367`). A fast-forward merge of `worktree-v3.6-game-screen-ui-unification` was performed at the start to bring in the prior-wave files (ProgressBar, ScorePill, TimerDisplay and all planning docs) before beginning Task 1. No conflicts occurred.

## Known Stubs

None. All four components are complete verbatim lifts with no placeholder data or TODO items.

## Threat Flags

None. These are presentational engagement components fed by numeric/boolean props — no new trust boundaries, network calls, or PII handling.

## Self-Check: PASSED

### Files verified to exist:

- src/components/games/shared/hud/LivesDisplay.test.jsx: FOUND
- src/components/games/shared/hud/ComboPill.test.jsx: FOUND
- src/components/games/shared/hud/LivesDisplay.jsx: FOUND
- src/components/games/shared/hud/ComboPill.jsx: FOUND
- src/components/games/shared/hud/OnFireBadge.jsx: FOUND
- src/components/games/shared/hud/OnFireSplash.jsx: FOUND

### Commits verified:

- 2d26262f (RED tests): FOUND
- 67cdbec3 (components): FOUND

### Contract checks:

- LivesDisplay.jsx contains `export function LivesDisplay`: YES
- LivesDisplay.jsx contains `fill-red-400`: YES
- LivesDisplay.jsx contains `aria-label`: YES
- LivesDisplay.jsx contains `role="group"`: YES
- ComboPill.jsx contains `export function ComboPill`: YES
- ComboPill.jsx contains `prevComboRef`: YES
- ComboPill.jsx contains `Zap` and `Flame` imports: YES
- ComboPill.jsx contains `border-amber-400/30` and `border-yellow-400/40`: YES
- ComboPill.jsx does NOT contain `comboShake` or `shouldShake`: CONFIRMED
- OnFireBadge.jsx contains `export function OnFireBadge`: YES
- OnFireBadge.jsx contains both `useMotionTokens` and `useAccessibility` imports: YES
- OnFireBadge.jsx contains `../../../../assets/icons/flame.png`: YES
- OnFireBadge.jsx contains `animate-pulse`: YES
- OnFireSplash.jsx contains `export function OnFireSplash`: YES
- OnFireSplash.jsx contains `../../../../assets/icons/flame.png`: YES
- OnFireSplash.jsx contains `z-[70]`: YES
