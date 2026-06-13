---
phase: 36-game-screen-ui-unification
plan: 08
subsystem: games/shared/hud + notes-master-games
tags: [extraction, refactor, engagement-hud, zero-regression]
dependency_graph:
  requires: ["36-07"]
  provides:
    ["SpeedBonusFlash", "TierUpPopup", "NotesRecognitionGame full migration"]
  affects: ["src/components/games/notes-master-games/NotesRecognitionGame.jsx"]
tech_stack:
  added: []
  patterns:
    - "verbatim lift: SpeedBonusFlash remount-key pattern (flashKey prop)"
    - "verbatim lift: TierUpPopup fly-to via scorePillRef.getBoundingClientRect"
    - "D-10 encapsulation: comboShake removed from parent; ComboPill detects combo decrease internally"
key_files:
  created:
    - src/components/games/shared/hud/SpeedBonusFlash.jsx
    - src/components/games/shared/hud/TierUpPopup.jsx
  modified:
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
decisions:
  - "TierUpPopup uses text-3xl only (no sm:text-4xl) per UI-SPEC typography cap"
  - "comboShake state + setComboShake calls deleted entirely; ComboPill.prevComboRef detects decrease"
  - "comboPillRef removed (no longer attached; ComboPill does not expose forwardRef)"
  - "Heart, Zap, flameIcon, useAccessibility imports removed as they only served the now-extracted inline JSX"
metrics:
  duration: "~30 minutes"
  completed: "2026-06-14"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 36 Plan 08: SpeedBonusFlash + TierUpPopup extraction + NotesRecognitionGame full migration Summary

SpeedBonusFlash and TierUpPopup extracted to shared/hud/ as verbatim lifts; NotesRecognitionGame refactored to consume all nine shared HUD components with comboShake state removed and scorePillRef fly-to preserved.

## Tasks Completed

| Task | Name                                                                   | Commit   | Files                                                                |
| ---- | ---------------------------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| 1    | Create SpeedBonusFlash.jsx + TierUpPopup.jsx                           | f99f39ba | src/components/games/shared/hud/SpeedBonusFlash.jsx, TierUpPopup.jsx |
| 2    | Refactor NotesRecognitionGame to consume all six engagement components | 9de5c1be | src/components/games/notes-master-games/NotesRecognitionGame.jsx     |

## What Was Built

### SpeedBonusFlash.jsx

Named-export verbatim lift of the "FAST!" flash badge. Key implementation details:

- Outer `div.pointer-events-none.flex.h-7.items-center.justify-center` wrapper reserves 28px of layout space so content below never shifts when the flash appears/disappears
- `flashKey` prop forces AnimatePresence remount on each trigger (Pitfall 5) — parent increments `speedBonusKey` per flash
- No `useMotionTokens` guard (matches the source: the AnimatePresence scale/fade is the only animation and was not reduced-motion gated in the original)

### TierUpPopup.jsx

Named-export verbatim lift of the DOUBLE/TRIPLE XP fly-to overlay. Key implementation details:

- `fixed inset-0 z-[70]` overlay renders above all game content
- `target.x` / `target.y` coordinates passed from parent (computed via `scorePillRef.current.getBoundingClientRect()`)
- `useMotionTokens()` read internally — reduced-motion path uses `opacity [1,1,0]` over 1.2s (no position fly)
- `text-3xl font-black` only — `sm:text-4xl` omitted per UI-SPEC typography contract (capped at 4 declared sizes)

### NotesRecognitionGame.jsx Refactoring

Replaced six inline JSX engagement blocks with shared components:

- `<OnFireSplash show={showFireSplash} />` — was 19-line AnimatePresence block
- `<OnFireBadge active={isOnFire} />` — was 18-line AnimatePresence block using appReducedMotion
- `<ComboPill combo={combo} />` — was 35-line motion.div with comboShake animate prop
- `<LivesDisplay lives={lives} totalLives={INITIAL_LIVES} />` — was 32-line AnimatePresence heart-array
- `<SpeedBonusFlash show={showSpeedBonus} flashKey={speedBonusKey} />` — was 14-line wrapper+AnimatePresence
- `<TierUpPopup multiplier={tierUpMultiplier} target={tierUpTarget} />` — was 42-line AnimatePresence block

**State deleted:**

- `comboShake` state (`useState(false)`)
- All `setComboShake(true/false)` calls (3 locations: wrong-answer if-block + reset function)
- `comboPillRef` (`useRef(null)`) and its `ref={comboPillRef}` attachment

**Imports removed:**

- `Heart, Zap` from lucide-react (Loader2 retained for loading spinner)
- `flameIcon` (was used only by OnFireSplash/OnFireBadge inline JSX)
- `useAccessibility` (was used only for `appReducedMotion` in the OnFireBadge inline JSX; now encapsulated inside OnFireBadge)

**Preserved:**

- `scorePillRef` + `getBoundingClientRect()` fly-to computation (Pitfall 1)
- `speedBonusKey` increment logic (Pitfall 5)
- Full lives→GameOverScreen path (REQ-05)
- All scoring, combo, on-fire, and auto-grow logic unchanged

## Verification Results

| Check                                                                     | Result                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `npx vitest run src/components/games/shared/hud`                          | 13/13 PASS                                                                |
| `npx vitest run ...NotesRecognitionGame.autogrow.test.js ...shared/hud`   | 24/24 PASS                                                                |
| `npm run test:run` (full suite)                                           | 1916/1929 PASS (2 skipped test files are network-dependent, pre-existing) |
| `npm run lint`                                                            | 0 errors, 126 warnings (all pre-existing)                                 |
| `npm run build`                                                           | Clean build                                                               |
| `comboShake` absent from NotesRecognitionGame.jsx (comment-filtered grep) | CONFIRMED (count = 0)                                                     |
| `scorePillRef` + `getBoundingClientRect` preserved                        | CONFIRMED                                                                 |
| `GameOverScreen` import + render present                                  | CONFIRMED                                                                 |
| `text-4xl` absent from TierUpPopup.jsx                                    | CONFIRMED                                                                 |

## Deviations from Plan

None - plan executed exactly as written.

The PATTERNS.md verbatim body for TierUpPopup included `sm:text-4xl` but the PLAN task 1 explicitly stated "NO `text-4xl` — UI-SPEC typography cap". The UI-SPEC's typography contract was honored: `text-3xl` only.

## Known Stubs

None. All engagement component props are wired to real game state.

## Threat Flags

None. This is a presentational extraction — no new trust boundaries, network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- `src/components/games/shared/hud/SpeedBonusFlash.jsx` — FOUND
- `src/components/games/shared/hud/TierUpPopup.jsx` — FOUND
- Commit `f99f39ba` — FOUND
- Commit `9de5c1be` — FOUND
- `comboShake` in NotesRecognitionGame (comment-filtered) — 0 occurrences: CONFIRMED
- `scorePillRef.current.getBoundingClientRect()` — PRESENT
