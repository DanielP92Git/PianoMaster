---
phase: 01-complete-the-hebrew-translations-gaps
plan: 01
subsystem: i18n
tags: [i18next, react-i18next, translation, hebrew, localization, RTL]

# Dependency graph
requires:
  - phase: 01-RESEARCH
    provides: Analysis of missing translation keys (17 in Hebrew common.json)
provides:
  - Complete EN root install namespace with all keys referenced by AppSettings.jsx
  - Hebrew enableAllNotificationsDescription translation
affects: [phase-02-remove-dead-keys]

# Tech tracking
tech-stack:
  added: []
  patterns: [i18next namespace organization, RTL translation support]

key-files:
  created: []
  modified:
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Added install.safari as separate object at root install level to match install.ios structure"
  - "Used Hebrew translation 'הפעלת כל ההתראות באפליקציה' for enableAllNotificationsDescription"

patterns-established:
  - "Root install namespace now consistent with code references (install.ios.*, install.safari.*)"
  - "All notification settings have matching description keys in both EN and HE"

# Metrics
duration: 3 min
completed: 2026-02-12
---

# Phase 01 Plan 01: Fix EN root install namespace and add missing Hebrew notification key Summary

**Fixed EN root install namespace duplication and added missing Hebrew notification description key, eliminating runtime translation fallbacks for install instructions and notification settings**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T22:35:08Z
- **Completed:** 2026-02-12T22:38:39Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Fixed EN root `install` namespace by adding missing iOS and Safari install step keys
- Added complete `install.safari` object with installDescription and 3 install steps
- Added missing `enableAllNotificationsDescription` to Hebrew notifications namespace
- All `t("install.*")` references in AppSettings.jsx now resolve to real keys
- JSON files validated successfully (build passed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix EN root install namespace and add missing Hebrew notification key** - `1d6219d` (feat)

## Files Created/Modified
- `src/locales/en/common.json` - Added install.ios.installStep1/2/3 and complete install.safari object
- `src/locales/he/common.json` - Added enableAllNotificationsDescription to pages.settings.notifications

## Decisions Made

**EN Install Namespace Structure:**
Decided to add `install.safari` as a complete separate object at the root install level to match the structure of `install.ios`. This maintains consistency with how the code references these keys in AppSettings.jsx (lines 179-201) and avoids mixing install instructions across different namespaces.

**Hebrew Translation:**
Used "הפעלת כל ההתראות באפליקציה" (translates to "Enable all notifications in the app") for the enableAllNotificationsDescription key, which matches the pattern used in other Hebrew notification descriptions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plan 01-02 (Remove dead keys from EN/HE common.json and deprecated trail names from HE trail.json)

All actively-used translation keys now exist in both English and Hebrew locales. No console warnings for missing i18next translation keys will occur for install instructions or notification settings.

---
*Phase: 01-complete-the-hebrew-translations-gaps*
*Completed: 2026-02-12*
