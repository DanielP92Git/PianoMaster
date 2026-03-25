---
phase: 06-dedicated-parent-portal-with-math-gate
plan: 03
subsystem: ui
tags: [react, settings, cleanup, parent-portal]

# Dependency graph
requires:
  - phase: 06-dedicated-parent-portal-with-math-gate/06-01
    provides: "ParentZoneEntryCard component for mobile Settings entry"
  - phase: 06-dedicated-parent-portal-with-math-gate/06-02
    provides: "ParentPortalPage with gate-first architecture hosting moved sections"
provides:
  - "Cleaned AppSettings.jsx with subscription, streak, and notification card sections removed"
  - "ParentZoneEntryCard rendered as first interactive element in Settings after LanguageSelector"
  - "No dead code from migrated features (handlers, state, queries, imports all removed)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Entry card pattern: ParentZoneEntryCard in Settings as the mobile-only discoverability path to Parent Portal"
    - "Simplified delete gate: handleDeleteAccountClick always shows parent gate (no bypass via parentConsentGranted)"

key-files:
  created: []
  modified:
    - src/pages/AppSettings.jsx

key-decisions:
  - "handleDeleteAccountClick simplified to always show parent gate (removed parentConsentGranted bypass) -- safer, every deletion attempt goes through verification"
  - "Kept useSubscription import because isPremium is still used in notification toggle logic"
  - "queryClient.invalidateQueries for push-subscription-status left in handleDeleteParentConsentGranted even though local query removed -- invalidation is a safe no-op and other components may cache the key"

patterns-established:
  - "Settings page as entry-card hub: dedicated components like ParentZoneEntryCard placed between LanguageSelector and Avatar link for mobile discoverability"

requirements-completed: [D-02, D-10, D-11, D-12, D-13, D-14, REQ-02, REQ-07, REQ-08]

# Metrics
duration: 8min
completed: 2026-03-25
---

# Phase 06 Plan 03: AppSettings Cleanup Summary

**Removed subscription section, streak/weekend-pass section, and NotificationPermissionCard from Settings; added ParentZoneEntryCard as mobile entry point to Parent Portal; eliminated all dead code from migrated features**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-25T19:05:00Z
- **Completed:** 2026-03-25T19:13:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Removed Subscription SettingsSection entirely (moved to Parent Portal, D-12)
- Removed Streak SettingsSection with weekend pass toggle (moved to Parent Portal, D-10)
- Removed NotificationPermissionCard from Notification section (moved to Parent Portal, D-11)
- Removed all dead code: showParentGate/pendingToggleValue state, handleWeekendPassToggle/handleParentConsentGranted/handleParentGateCancel handlers, pushStatus query, streakState query, parentConsentGranted derived value, unused imports (ParentGateMath, NotificationPermissionCard, streakService, getPushSubscriptionStatus, CreditCard, Flame)
- Added ParentZoneEntryCard as first interactive element after LanguageSelector
- Preserved all non-migrated sections: Notification (toggles/quiet hours/daily reminder), Install, Profile, Accessibility, Audio, Account Deletion, Legal, Logout, FeedbackForm

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove moved sections and dead code from AppSettings, add ParentZoneEntryCard** - `777c406` (feat)
2. **Task 2: Verify complete Parent Portal flow** - Human checkpoint, approved by user

## Files Created/Modified
- `src/pages/AppSettings.jsx` - Removed subscription/streak/notification-card sections and all associated dead code; added ParentZoneEntryCard import and render

## Decisions Made
- handleDeleteAccountClick simplified to always show parent gate -- removes dependency on parentConsentGranted bypass, which is safer for account deletion
- Kept useSubscription import because isPremium is still referenced in notification toggle conditional logic
- Left queryClient.invalidateQueries for "push-subscription-status" in delete handler as a harmless no-op -- safe even though local query was removed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Known Stubs
None - all functionality is either fully wired or intentionally removed (migrated to Parent Portal).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 06 is now complete: all 3 plans executed
- Parent Portal is fully functional with gate-first architecture, desktop sidebar entry, mobile Settings entry card
- Settings page is clean with no duplicate sections
- Ready for any follow-up phases (DailyChallengeCard/TrailNodeModal subscription checks if planned)

---
*Phase: 06-dedicated-parent-portal-with-math-gate*
*Completed: 2026-03-25*
