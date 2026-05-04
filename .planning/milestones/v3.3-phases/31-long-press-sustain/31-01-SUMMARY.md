---
phase: 31-long-press-sustain
plan: "01"
subsystem: rhythm-games
tags: [hold-scoring, svg-animation, tap-area, i18n, tdd]
dependency_graph:
  requires: []
  provides:
    - holdScoringUtils (scoreHold, isHoldNote, calcHoldDurationMs, HOLD_THRESHOLDS)
    - HoldRing SVG component with ref-driven rAF progress
    - TapArea extended with hold mode (pointer events, HoldRing overlay)
    - i18n keys holdHere + holdGood in en + he
  affects:
    - src/components/games/rhythm-games/components/TapArea.jsx
    - src/components/games/rhythm-games/components/index.js
tech_stack:
  added: []
  patterns:
    - ref-based DOM mutation for 60fps SVG animation (avoids React re-render on rAF)
    - Pointer capture (setPointerCapture) for reliable hold tracking across pointer cancel
    - TDD red-green-refactor for utility functions
key_files:
  created:
    - src/components/games/rhythm-games/utils/holdScoringUtils.js
    - src/components/games/rhythm-games/utils/holdScoringUtils.test.js
    - src/components/games/rhythm-games/components/HoldRing.jsx
  modified:
    - src/components/games/rhythm-games/components/TapArea.jsx
    - src/components/games/rhythm-games/components/index.js
    - src/locales/en/common.json
    - src/locales/he/common.json
decisions:
  - isHoldNote threshold at durationUnits >= 8 (half note and above are hold notes)
  - scoreHold returns string quality ('PERFECT'|'GOOD'|'MISS') matching scoreTap convention
  - HoldRing accepts both ringRef (imperative rAF) and progress prop (declarative) patterns
  - TapArea hold mode activates only when isHoldNote=true — existing onClick path unchanged
  - reducedMotion=true returns null from HoldRing; parent handles opacity flash fallback
metrics:
  duration_seconds: 262
  completed_date: "2026-04-13"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 4
---

# Phase 31 Plan 01: Hold Scoring Foundation Summary

**One-liner:** Hold scoring utilities (70%/40% thresholds), ref-driven SVG ring progress component, and pointer-event-based TapArea hold mode with i18n HOLD/holdGood keys.

## Tasks Completed

| Task | Name                                   | Commit  | Files                                         |
| ---- | -------------------------------------- | ------- | --------------------------------------------- |
| 1    | Create holdScoringUtils with TDD       | 5adeac2 | holdScoringUtils.js, holdScoringUtils.test.js |
| 2    | Create HoldRing SVG and extend TapArea | 2292789 | HoldRing.jsx, TapArea.jsx, index.js           |
| 3    | Add i18n keys for HOLD and holdGood    | e3d81a7 | en/common.json, he/common.json                |

## What Was Built

### Task 1: holdScoringUtils.js (TDD)

RED phase: 25 tests written covering all boundary conditions — scoreHold thresholds (70%/40%), edge cases (zero duration, negative hold, zero required), isHoldNote boundaries (durationUnits 1/2/4/6/8/12/16), calcHoldDurationMs at 80 and 120 BPM. All failed before implementation.

GREEN phase: Minimal implementation to pass all 25 tests:

- `HOLD_THRESHOLDS = { PERFECT: 0.7, GOOD: 0.4 }` (per D-03, D-04)
- `scoreHold(actualMs, requiredMs)` — guards zero/negative, returns PERFECT/GOOD/MISS
- `isHoldNote(durationUnits)` — true when >= 8 (half, dotted half, whole; per D-06)
- `calcHoldDurationMs(durationUnits, tempo)` — `(units/4) * (60000/tempo)` per D-05

### Task 2: HoldRing.jsx + TapArea.jsx extension

**HoldRing.jsx:** SVG ring with track circle (rgba(255,255,255,0.20)) and progress circle. Supports two update patterns:

1. Imperative: `ringRef` prop — parent drives `stroke-dashoffset` via rAF at 60fps without re-rendering React tree
2. Declarative: `progress` prop (0-1) — useEffect updates DOM attribute

`isComplete=true` switches stroke from `#818cf8` (indigo-400) to `#4ade80` (green-400) with 0.15s ease transition (per D-01). `reducedMotion=true` returns null. Exports `CIRCUMFERENCE` constant for parent rAF loops. `aria-hidden="true"` (cosmetic element).

**TapArea.jsx:** Extended with 7 new optional props, all backward-compatible:

- `isHoldNote`, `onPressStart`, `onPressEnd`, `holdRingRef`, `isHoldComplete`, `reducedMotion`, `holdFeedbackLabel`

Hold mode activates only when `isHoldNote=true`. Uses `onPointerDown` (with `setPointerCapture` for reliable tracking) / `onPointerUp` / `onPointerCancel`. `touchAction: none` prevents scroll during hold. Existing `onClick` path for quarter notes is completely unchanged. Button has `relative` class for HoldRing absolute overlay.

`holdFeedbackLabel` prop overrides standard accuracy label — lets parent pass "Almost, hold longer!" for GOOD hold results.

**index.js:** Added `HoldRing` and `CIRCUMFERENCE` to barrel exports.

### Task 3: i18n Keys

Added under `games.metronomeTrainer.tapArea` in both locales:

- `holdHere`: "HOLD" (en) / "החזק" (he)
- `accuracy.holdGood`: "Almost, hold longer!" (en) / "!כמעט, החזק יותר" (he)

## Verification Results

1. `npx vitest run holdScoringUtils.test.js` — 25/25 tests PASS
2. `npx vitest run rhythm-games/` — 151/151 tests PASS across 16 test files (1 pre-existing failure in ArcadeRhythmGame.test.js with 8 unhandled rejection errors, pre-dates this plan)
3. JSON locale files parse without errors
4. All acceptance criteria met

## Deviations from Plan

### Pre-existing test failure documented

**ArcadeRhythmGame.test.js** has 8 unhandled rejections (`getOrCreateAudioContext is not a function`) that were present on the base commit (aefa721) before any changes in this plan. Verified by stashing changes and running the test — same 8 errors. Confirmed out-of-scope per deviation rules (pre-existing issue not caused by current task). All 151 actual test assertions still pass; the errors are async unhandled rejections from timers in that test file.

No other deviations. Plan executed exactly as written.

## Threat Mitigations Applied

Per threat model T-31-02 (Denial of Service — HoldRing rAF loop): The `ringRef` pattern delegates rAF management to the parent renderer (Plans 02/03). The `reducedMotion=true` returns null with no animation loop. No rAF is started within HoldRing itself — only DOM attribute mutation via ref. Parent cleanup is the responsibility of Plans 02/03 per the design contract.

## Known Stubs

None. All exports are fully implemented with correct behavior. Plans 02 and 03 will wire these utilities into game renderers.

## Self-Check

## Self-Check: PASSED

- FOUND: src/components/games/rhythm-games/utils/holdScoringUtils.js
- FOUND: src/components/games/rhythm-games/utils/holdScoringUtils.test.js
- FOUND: src/components/games/rhythm-games/components/HoldRing.jsx
- FOUND commit 5adeac2: feat(31-01): add holdScoringUtils with TDD
- FOUND commit 2292789: feat(31-01): add HoldRing SVG component and extend TapArea
- FOUND commit e3d81a7: feat(31-01): add holdHere and holdGood i18n keys
