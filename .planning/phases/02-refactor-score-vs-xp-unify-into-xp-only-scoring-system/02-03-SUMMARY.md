---
phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system
plan: 03
subsystem: ui
tags: [xp, i18n, avatars, achievements, accessory-unlocks, toast]

# Dependency graph
requires:
  - "02-01: XP-based service layer (apiAccessories, accessoryUnlocks, achievementService)"
provides:
  - "XP-based Avatars page with XP balance display and purchase UI"
  - "XP-based Achievements page with total_xp query and XP reward labels"
  - "XP-aware unlock modals (xp_earned case with backward compat)"
  - "XP terminology in English and Hebrew i18n files"
affects:
  - "02-04: Teacher analytics may reference updated i18n keys"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "XP keys added alongside old points keys for backward compatibility with DB records"
    - "xp_earned/points_earned dual case pattern extended to UI modals"

key-files:
  created: []
  modified:
    - "src/components/Avatars.jsx"
    - "src/pages/Achievements.jsx"
    - "src/components/ui/UnlockRequirementModal.jsx"
    - "src/components/ui/AccessoryUnlockModal.jsx"
    - "src/components/ui/Toast.jsx"
    - "src/locales/en/common.json"
    - "src/locales/he/common.json"

key-decisions:
  - "Keep old i18n keys (pointsEarned, notEnoughPoints, etc.) alongside new XP keys for backward compatibility with existing DB unlock_requirement records"
  - "Achievements page queries students.total_xp directly instead of using deleted calculatePointsSummary"
  - "showPointsGain renamed to showXPGain with backward-compatible alias export"
  - "purchase i18n key uses {{xp}} interpolation variable instead of {{points}}"

patterns-established:
  - "XP/points dual i18n key pattern: new xpEarned key for code, old pointsEarned kept for DB fallback"
  - "Direct total_xp query pattern: supabase.from('students').select('total_xp') for XP display"

requirements-completed: [XP-AVATARS, XP-ACHIEVEMENTS, XP-I18N]

# Metrics
duration: 8min
completed: 2026-03-08
---

# Phase 2 Plan 03: UI + i18n XP Unification Summary

**Updated Avatars, Achievements, unlock modals, Toast, and en/he i18n files to display XP everywhere instead of points**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-08T00:59:40Z
- **Completed:** 2026-03-08T01:07:57Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Avatars page displays XP balance, XP prices, and "Not enough XP" messaging
- Achievements page replaced broken calculatePointsSummary import with direct total_xp query
- UnlockRequirementModal and AccessoryUnlockModal handle both xp_earned and points_earned types
- All user-visible "points" text updated to "XP" in both English and Hebrew translations

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Avatars and Achievements pages to display XP** - `9c10640` (feat)
2. **Task 2: Update unlock modals, toast, and i18n files (en + he)** - `9316ef5` (feat)

## Files Created/Modified
- `src/components/Avatars.jsx` - Renamed availablePoints/earnedPoints/spentPoints to XP variants, updated currentProgress.totalXP, removed stale total-points query invalidation
- `src/pages/Achievements.jsx` - Removed dead calculatePointsSummary import, added total_xp query, updated XP reward display
- `src/components/ui/UnlockRequirementModal.jsx` - Added xp_earned case, switched to totalXP and xpEarned i18n keys
- `src/components/ui/AccessoryUnlockModal.jsx` - Added xp_earned case in formatRequirementChip
- `src/components/ui/Toast.jsx` - Renamed showPointsGain to showXPGain, shows "+X XP earned!"
- `src/locales/en/common.json` - Added xpEarned, xpReward, availableXP, notEnoughXP, xpSpent keys; updated engagement/stats/victory text
- `src/locales/he/common.json` - Mirrored all English XP changes with Hebrew translations

## Decisions Made
- Kept old i18n keys (pointsEarned, notEnoughPoints, availablePoints, pointsSpent, etc.) alongside new XP keys. Existing DB records with `unlock_requirement.type: "points_earned"` still generate correct UI text through the old keys.
- Achievements page uses a direct `students.total_xp` query instead of the deleted `calculatePointsSummary` which aggregated scores + achievement points. This is simpler and consistent with Plan 01's approach.
- Toast's `showPointsGain` kept as a backward-compatible alias for `showXPGain` in case any code still imports the old name.
- The `purchase` i18n key now uses `{{xp}}` interpolation variable instead of `{{points}}`, matching the component code change.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All user-facing UI now shows "XP" instead of "points"
- Service layer (Plan 01) and UI layer (Plan 03) both use XP
- Plan 02 (hooks + VictoryScreen) and Plan 04 (teacher analytics + DB migration) remain
- Old i18n keys preserved for DB backward compatibility, can be cleaned up in Plan 04 or later

## Self-Check: PASSED

All 7 modified files verified present. Both task commits (9c10640, 9316ef5) verified in git log.

---
*Phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system*
*Completed: 2026-03-08*
