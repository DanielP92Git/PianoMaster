---
phase: 23-kid-friendly-dashboard-redesign
plan: 01
subsystem: ui
tags: [react, svg, framer-motion, tailwind, dashboard, xp-ring, gradient-border]

# Dependency graph
requires:
  - phase: none
    provides: none
provides:
  - XPRing circular SVG progress component with GoldStar center
  - PlayNextButton gradient pill CTA with glow animation
  - UnifiedStatsCard consolidating level, XP, streak, and daily goals
affects: [23-02 Dashboard.jsx rewrite will import all three components]

# Tech tracking
tech-stack:
  added: []
  patterns: [gradient-border wrapper div technique, SVG stroke-dasharray progress ring, CSS keyframe glow pulse]

key-files:
  created:
    - src/components/dashboard/XPRing.jsx
    - src/components/dashboard/PlayNextButton.jsx
    - src/components/dashboard/UnifiedStatsCard.jsx
  modified: []

key-decisions:
  - "XPRing uses foreignObject for GoldStar center placement inside SVG"
  - "PlayNextButton injects CSS keyframes via inline style tag for glow animation"
  - "UnifiedStatsCard gradient border uses wrapper div with p-[2px] and bg-gradient-to-r"
  - "UnifiedStatsCard conditionally wraps in framer-motion motion.div only when reducedMotion is false"

patterns-established:
  - "Gradient border: outer div rounded-2xl p-[2px] bg-gradient-to-r, inner div bg-slate-900/95 backdrop-blur-md"
  - "SVG progress ring: stroke-dasharray/dashoffset with linearGradient defs and rotate(-90) transform"
  - "Animation gating: all visual animations disabled when reducedMotion is true"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04]

# Metrics
duration: 3min
completed: 2026-03-06
---

# Phase 23 Plan 01: Dashboard Sub-Components Summary

**Three new kid-friendly dashboard components: XPRing (SVG circular progress with GoldStar), PlayNextButton (gradient pill CTA with glow pulse), and UnifiedStatsCard (gradient-border card consolidating level/XP/streak/goals)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T14:53:20Z
- **Completed:** 2026-03-06T14:56:19Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- XPRing renders circular SVG progress arc with GoldStar center and XP text, fully controllable via props
- PlayNextButton renders gradient pill Link with i18n label, node name subtitle, and attention-grabbing glow pulse animation
- UnifiedStatsCard consolidates level title, XPRing, streak count with fire/shield indicators, and daily goals progress bar into a single gradient-bordered card
- All three components gate animations behind reducedMotion and support RTL layout
- Loading skeleton implemented for UnifiedStatsCard

## Task Commits

Each task was committed atomically:

1. **Task 1: Create XPRing and PlayNextButton components** - `3303176` (feat)
2. **Task 2: Create UnifiedStatsCard component** - `c02e767` (feat)

## Files Created/Modified
- `src/components/dashboard/XPRing.jsx` - Circular SVG progress ring with GoldStar center, receives data via props
- `src/components/dashboard/PlayNextButton.jsx` - Large gradient pill CTA with glow animation, React Router Link
- `src/components/dashboard/UnifiedStatsCard.jsx` - Consolidated stats card with gradient border, XPRing, streak, daily goals

## Decisions Made
- XPRing uses SVG foreignObject to embed the GoldStar React component inside the SVG circle center
- PlayNextButton injects CSS @keyframes via an inline style tag rather than requiring Tailwind config changes, since the glow pulse animation is component-specific
- UnifiedStatsCard gradient border uses the wrapper div technique (outer gradient + inner bg-slate-900/95) rather than CSS border-image for better rounded corner support
- UnifiedStatsCard conditionally wraps content in framer-motion motion.div only when animations are enabled, avoiding unnecessary motion wrapper when reducedMotion is true
- Fire emoji used directly for streak display (consistent with existing StreakDisplay patterns) rather than importing flame.png asset

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three components export default and are ready for import in Plan 02 (Dashboard.jsx rewrite)
- Props interfaces documented in plan and implemented consistently
- Plan 02 will need to add i18n key `dashboard.playNext.label` to locale files (currently using defaultValue fallback)

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 23-kid-friendly-dashboard-redesign*
*Completed: 2026-03-06*
