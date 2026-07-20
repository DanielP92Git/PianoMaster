---
phase: 03-adaptive-pedagogy
plan: 03
subsystem: ui
tags: [react, framer-motion, i18n, sight-reading, accessibility]

# Dependency graph
requires:
  - phase: 01-engagement-hud-parity
    provides: OnFireSplash.jsx structural pattern (AnimatePresence + useMotionTokens reduced-motion branching), useMotionTokens hook
provides:
  - LevelUpCue.jsx presentation component (positive-only escalation overlay, show-prop driven)
  - sightReading.adaptive.* i18n keys (EN+HE, exact parity) — levelUp, levelUpSubtitle
affects:
  [
    03-05 (wires the show trigger into SightReadingGame.jsx adaptive difficulty logic),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Escalation-only cue pattern (D-12): visible celebratory overlay on difficulty step-up, fully silent on step-down — no negative/easing component or copy exists anywhere in the codebase for this concept"

key-files:
  created:
    - src/components/games/sight-reading-game/components/LevelUpCue.jsx
    - src/components/games/sight-reading-game/components/LevelUpCue.test.jsx
  modified:
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "LevelUpCue mirrors OnFireSplash's AnimatePresence + reduce-branched motion.div structure exactly, but is a distinct component (not a reused/renamed OnFireSplash) per 03-CONTEXT.md guidance"
  - "Used lucide-react ArrowUp icon instead of a new asset, consistent with FeedbackSummary/ComboPill icon usage in this folder"

patterns-established:
  - "Reduced-motion opacity-only branch pattern for new celebratory overlays: initial/animate both collapse to { opacity: 1 } under reduce, matching OnFireSplash precedent"

requirements-completed: [ADAPT-01, I18N-01]

# Metrics
duration: 20min
completed: 2026-07-12
---

# Phase 03 Plan 03: LevelUpCue Escalation Overlay Summary

**Positive-only "leveling up" celebratory overlay (framer-motion, reduced-motion aware) plus its parity-gated EN/HE `sightReading.adaptive.*` i18n strings — presentation-only, driven by a parent-controlled `show` prop.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-12T07:28:00Z (approx)
- **Completed:** 2026-07-12T07:48:07Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- `sightReading.adaptive.levelUp` / `sightReading.adaptive.levelUpSubtitle` added to the canonical `sightReading` namespace in both `en/common.json` and `he/common.json` with exact key parity, no easing/negative copy anywhere (D-12)
- `LevelUpCue.jsx` built as a structural analog of `OnFireSplash` — `AnimatePresence` + `motion.div` gated on `show`, reduced-motion branch collapses to opacity-only (no scale keyframes), copy sourced entirely via `useTranslation`/`t()`
- Render test covers all 4 required states: show=true renders localized copy, show=false renders nothing, reduced-motion uses the opacity-only `animate` branch, full-motion uses the `[1, 1.15, 1]` scale-keyframe branch

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sightReading.adaptive.\* strings (EN + HE, exact parity)** - `f73adc97` (feat)
2. **Task 2: Build LevelUpCue.jsx (reduced-motion aware) + render test** - `b7842082` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified

- `src/locales/en/common.json` - Added `adaptive.levelUp` / `adaptive.levelUpSubtitle` keys to the canonical (second/last-parsed) `sightReading` object
- `src/locales/he/common.json` - Byte-for-byte key-parallel Hebrew subtree added to the canonical `sightReading` object
- `src/components/games/sight-reading-game/components/LevelUpCue.jsx` - New presentation component: `AnimatePresence`/`motion.div` overlay, `useMotionTokens` for reduced-motion, `useTranslation` for copy, `ArrowUp` icon from lucide-react
- `src/components/games/sight-reading-game/components/LevelUpCue.test.jsx` - Render test with mocked `react-i18next`, `framer-motion`, `useMotionTokens`, and `lucide-react`

## Decisions Made

- Followed the plan's explicit guidance to mirror `OnFireSplash`'s shape without literally reusing/renaming it — kept as a fully independent component since the trigger semantics (escalation vs. on-fire) are conceptually distinct and Plan 05 will wire a different trigger condition.
- Chose `ArrowUp` (lucide-react, already used elsewhere in the icon set convention) over a new PNG asset, consistent with the plan's suggestion and the project's existing icon-based celebration components.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `LevelUpCue` is ready to be imported and wired with a real `show` trigger in Plan 05 (adaptive difficulty/tempo escalation logic in `SightReadingGame.jsx`).
- `sightReading.adaptive.*` i18n keys are stable and parity-gated (`sight-reading-parity.test.js` green) for any downstream plan that needs to reference the same copy.
- No blockers.

---

_Phase: 03-adaptive-pedagogy_
_Completed: 2026-07-12_

## Self-Check: PASSED

All created files verified present on disk; all task commit hashes (`f73adc97`, `b7842082`) verified present in git log.
