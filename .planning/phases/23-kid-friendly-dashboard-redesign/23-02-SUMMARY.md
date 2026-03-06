---
phase: 23-kid-friendly-dashboard-redesign
plan: 02
subsystem: ui
tags: [react, tailwind, framer-motion, dashboard, kid-friendly, i18n]

# Dependency graph
requires:
  - phase: 23-01
    provides: XPRing, PlayNextButton, UnifiedStatsCard components
provides:
  - Restructured kid-friendly Dashboard.jsx with compact hero, PlayNextButton, UnifiedStatsCard, circular Practice Tools
  - Refreshed DailyGoalsCard with glow icons and thicker progress bars
  - i18n keys for greeting, playNext, and practice tool short labels (en + he)
affects: [future dashboard enhancements, any component importing Dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [compact hero with centered avatar + level badge, circular icon button pattern for practice tools, motion.div entrance animation gating]

key-files:
  created: []
  modified:
    - src/components/layout/Dashboard.jsx
    - src/components/dashboard/DailyGoalsCard.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Removed getLevelInfo, getStreakProgress, getNextStreakMilestone helper functions (only used by old stat cards)"
  - "XP data query moved from XPProgressCard into Dashboard.jsx directly for UnifiedStatsCard consumption"
  - "firstName extracted from profile.first_name or user_metadata.full_name split on space"
  - "Practice tools rendered as data-driven array with staggered motion.div animation"
  - "MotionOrDiv pattern: uses plain div when reducedMotion is true, motion.div when false"
  - "Fallback avatar placeholder (piano emoji) shown when no avatarUrl available, with level badge"

patterns-established:
  - "Compact hero: h-[220px] md:h-[260px] with centered flex column layout"
  - "Practice tool circles: border-2 + color-specific bg/border/glow + group hover:scale-110 active:scale-95"
  - "Data-driven tool rendering: practiceTools array maps to button/Link elements with stagger animation"

requirements-completed: [DASH-05, DASH-06, DASH-07, DASH-08, DASH-09]

# Metrics
duration: 5min
completed: 2026-03-06
---

# Phase 23 Plan 02: Dashboard Layout Rewrite Summary

**Rewrote Dashboard.jsx to kid-friendly layout with compact hero, centered avatar + LV badge, PlayNextButton CTA, UnifiedStatsCard, refreshed DailyGoalsCard, and 3 circular Practice Tools buttons**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-06T14:59:46Z
- **Completed:** 2026-03-06T15:04:23Z
- **Tasks:** 1 of 2 (Task 2 is human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- Dashboard restructured from data-heavy 1083-line layout to clean 813-line kid-friendly design
- Compact hero with centered avatar, level badge (LV.X), and "Hi, [Name]!" greeting
- PlayNextButton gradient pill overlaps hero bottom edge as primary CTA
- UnifiedStatsCard replaces 4 floating-icon stat cards + XPProgressCard
- 3 circular glowing Practice Tools buttons (Reminder/Record/History) replace verbose list panel
- DailyGoalsCard refreshed with glow icon borders, thicker progress bars, bold goal names
- Removed: My Progress panel, Assignments section, old stat cards
- All existing data hooks, modal logic, and teacher panel preserved
- i18n keys added for en + he (greeting, playNext label, practice tool short labels)
- Entrance animations gated behind reducedMotion setting

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite Dashboard.jsx with new layout and components** - `9da2d4a` (feat)
2. **Task 2: Visual verification** - checkpoint:human-verify (pending)

## Files Created/Modified
- `src/components/layout/Dashboard.jsx` - Full restructure with compact hero, new components, circular practice tools
- `src/components/dashboard/DailyGoalsCard.jsx` - Refreshed styling (glow borders, h-2 progress bars, bold text)
- `src/locales/en/common.json` - Added greeting, playNext, and practice tool short label keys
- `src/locales/he/common.json` - Added Hebrew equivalents for all new keys

## Decisions Made
- Removed getLevelInfo, getStreakProgress, getNextStreakMilestone functions (only used by removed stat cards, not needed by UnifiedStatsCard)
- XP query (previously in XPProgressCard) moved to Dashboard.jsx body for UnifiedStatsCard props
- Practice tools rendered from data array for cleaner stagger animation and DRY code
- MotionOrDiv pattern chosen over conditional wrapper to avoid nesting complexity
- Fallback avatar (piano emoji in circle) added when no avatar URL available

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Task 2 (human-verify checkpoint) pending user visual approval
- Dev server started at localhost:5174 for verification

## Self-Check: PASSED

All files exist. Commit 9da2d4a verified.

---
*Phase: 23-kid-friendly-dashboard-redesign*
*Completed: 2026-03-06*
