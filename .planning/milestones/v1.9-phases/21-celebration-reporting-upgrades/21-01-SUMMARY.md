---
phase: 21-celebration-reporting-upgrades
plan: 01
subsystem: ui
tags: [react, dashboard, victory-screen, i18n, supabase, weekly-progress]

# Dependency graph
requires:
  - phase: 20-extended-progression
    provides: XP system, prestige levels, Dashboard layout
provides:
  - Weekly progress summary card with rolling 7-day stats
  - Daily rotating fun-fact banner with localStorage non-repeat
  - Personal best badge on VictoryScreen
  - weeklyProgressService for Supabase queries
affects: [dashboard, victory-screen, i18n]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "localStorage rotation: store date + index, pick random avoiding last index"
    - "Circular SVG progress indicator with stroke-dashoffset animation"

key-files:
  created:
    - src/services/weeklyProgressService.js
    - src/components/dashboard/WeeklySummaryCard.jsx
    - src/components/dashboard/DailyMessageBanner.jsx
  modified:
    - src/components/games/VictoryScreen.jsx
    - src/components/layout/Dashboard.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "weeklyProgressService counts exercises from students_score rather than XP delta (no historical XP snapshots available)"
  - "Personal best detection fetches pre-update progress before updateExerciseProgress to compare against existing bestScore"
  - "DailyMessageBanner placed between header and PlayNextButton for visibility without disrupting play flow"

patterns-established:
  - "Weekly stats pattern: query students_score + student_skill_progress with 7-day rolling window"
  - "Personal best detection: compare current score against exercise_progress[].bestScore before update"

requirements-completed: [PROG-04, PROG-05, PROG-06]

# Metrics
duration: 8min
completed: 2026-03-07
---

# Phase 21 Plan 01: Celebration & Reporting Upgrades Summary

**Weekly summary card with 7-day rolling stats, personal best trophy badge on VictoryScreen, and daily rotating fun-fact banner with 12 bilingual messages**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-07T18:58:55Z
- **Completed:** 2026-03-07T19:07:06Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- WeeklySummaryCard renders days practiced (circular SVG), nodes completed, and exercises done with golden border celebration for 7/7 days
- VictoryScreen detects personal best in both exercise-level and legacy node-level paths, showing amber Trophy badge only when beating previous bestScore (not on first completion)
- DailyMessageBanner rotates through 12 fun facts with localStorage-based non-repeat logic
- Full i18n support in English and Hebrew for all new strings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create weeklyProgressService, WeeklySummaryCard, and DailyMessageBanner** - `e729fdb` (feat)
2. **Task 2: Add personal best badge, wire Dashboard components, add i18n keys** - `2b788b7` (feat)

## Files Created/Modified

- `src/services/weeklyProgressService.js` - 7-day rolling progress query service
- `src/components/dashboard/WeeklySummaryCard.jsx` - Glass card with 3 stat columns and perfect week celebration
- `src/components/dashboard/DailyMessageBanner.jsx` - Fun fact banner with localStorage date-based rotation
- `src/components/games/VictoryScreen.jsx` - Personal best detection and Trophy badge render
- `src/components/layout/Dashboard.jsx` - Wired DailyMessageBanner, WeeklySummaryCard, and weekly-summary useQuery
- `src/locales/en/common.json` - Added weeklySummary, funFacts (12), and victory.personalBest keys
- `src/locales/he/common.json` - Added Hebrew translations for all new keys

## Decisions Made

- weeklyProgressService counts exercises from students_score rather than computing XP delta, since no historical XP snapshots are available
- Personal best detection in exercise path fetches pre-update progress before calling updateExerciseProgress to compare against existing bestScore
- DailyMessageBanner placed between header and PlayNextButton for immediate visibility without disrupting the play flow
- WeeklySummaryCard placed after DailyGoalsCard to group progress-related content together

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All client-side celebration and reporting features complete
- Ready for Phase 21 Plan 02 (parent weekly email report)

## Self-Check: PASSED

All created files exist. All task commits verified (e729fdb, 2b788b7).

---

_Phase: 21-celebration-reporting-upgrades_
_Completed: 2026-03-07_
