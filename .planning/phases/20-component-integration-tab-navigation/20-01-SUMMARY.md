---
phase: 20-component-integration-tab-navigation
plan: 01
subsystem: database, ui
tags: [xp, leveling, prestige, postgres, i18n, vitest]

# Dependency graph
requires: []
provides:
  - 30-level XP_LEVELS array with prestige computation in xpSystem.js
  - MAX_STATIC_LEVEL, PRESTIGE_XP_PER_TIER, PRESTIGE_BASE_XP constants
  - Postgres award_xp function supporting 30 levels + prestige tiers
  - EN and HE i18n keys for all level names and prestige titles
affects: [20-02-PLAN, dashboard, victory-screen, xp-ring, xp-progress-card]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prestige tier pattern: infinite levels beyond MAX_STATIC_LEVEL with fixed XP cost per tier"
    - "calculateLevel returns isPrestige/prestigeTier fields for all consumers"

key-files:
  created:
    - src/utils/xpSystem.test.js
    - supabase/migrations/20260307000001_extend_xp_levels.sql
  modified:
    - src/utils/xpSystem.js
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Arabic numerals (Maestro 1, Maestro 2) for prestige tier names instead of Roman numerals — simpler for 8-year-olds"
  - "PRESTIGE_XP_PER_TIER = 3000 — matches typical late-level XP gaps, keeps prestige achievable"
  - "Postgres CHECK constraint removed upper bound — prestige levels go beyond 30 indefinitely"
  - "Data fixup in migration recalculates all student levels from total_xp — fixes DB/JS mismatch"

patterns-established:
  - "Prestige pattern: calculateLevel returns { isPrestige, prestigeTier, title: 'Maestro N' } for XP beyond PRESTIGE_BASE_XP"
  - "getLevelProgress returns isPrestige field — consumers use this to switch between normal and prestige UI"

requirements-completed: [PROG-01, PROG-02, PROG-03]

# Metrics
duration: 5min
completed: 2026-03-07
---

# Phase 20 Plan 01: XP Level System Summary

**30-level XP system with infinite prestige tiers, Postgres migration with data fixup, and EN/HE locale keys for all level names**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-07T16:05:56Z
- **Completed:** 2026-03-07T16:11:04Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Extended XP_LEVELS from 15 to 30 entries with strictly increasing thresholds (0 to 51000 XP)
- Added prestige tier computation: levels 31+ are "Maestro 1", "Maestro 2", etc. with 3000 XP per tier
- Created Postgres migration that drops the level-10 cap constraint, replaces award_xp with 30-level function, and fixes existing student data
- Added 16 xpLevels keys and 3 victory keys to both EN and HE locale files
- TDD test suite with 27 tests covering all level ranges and prestige edge cases

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD xpSystem.js -- extend to 30 levels with prestige computation** - `defe988` (feat)
2. **Task 2: Postgres migration -- 30-level award_xp, constraint fix, data fixup** - `af3dc1d` (chore)
3. **Task 3: i18n keys -- 15 new level names + prestige + celebration keys in EN and HE** - `e2d706e` (feat)

## Files Created/Modified
- `src/utils/xpSystem.js` - Extended XP_LEVELS to 30 entries, added prestige constants and computation
- `src/utils/xpSystem.test.js` - 27 unit tests covering all levels and prestige edge cases
- `supabase/migrations/20260307000001_extend_xp_levels.sql` - Constraint fix, 30-level award_xp function, data fixup
- `src/locales/en/common.json` - 16 new xpLevels keys + 3 victory keys
- `src/locales/he/common.json` - 16 new xpLevels keys + 3 victory keys (Hebrew translations)

## Decisions Made
- Used Arabic numerals (Maestro 1, Maestro 2) for prestige titles instead of Roman numerals -- simpler for 8-year-old target audience per CONTEXT.md
- PRESTIGE_XP_PER_TIER set to 3000 -- matches typical late-level XP gaps, keeps prestige achievable
- Removed upper bound from Postgres CHECK constraint -- prestige levels go beyond 30 indefinitely
- Data fixup recalculates all student current_level from total_xp -- fixes the pre-existing DB (caps at 10) / JS (15 levels) mismatch

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failure in SightReadingGame.micRestart.test.jsx (AudioContextProvider not wrapped) -- unrelated to this plan's changes, not fixed per scope boundary rules.

## User Setup Required

None - no external service configuration required. Migration should be applied to Supabase via normal deployment.

## Next Phase Readiness
- xpSystem.js exports are ready for Plan 02 UI integration (calculateLevel returns isPrestige/prestigeTier)
- getLevelProgress returns isPrestige field for consumers to switch between normal and prestige UI
- All level names are localized and ready for display
- Postgres function is deployment-ready

## Self-Check: PASSED

All 6 files verified present. All 3 task commits verified in git log.

---
*Phase: 20-component-integration-tab-navigation*
*Completed: 2026-03-07*
