---
phase: 17-push-notifications
plan: "02"
subsystem: client-ui
tags: [push-notifications, coppa, parent-gate, pwa, i18n, react, supabase]

# Dependency graph
requires:
  - phase: 17-push-notifications
    plan: "01"
    provides: push_subscriptions table, RLS policies, VAPID Edge Function infrastructure
provides:
  - ParentGateMath COPPA verification gate (math problem, attempts tracking)
  - Upgraded NotificationPermissionCard with full push state machine + parent gate flow
  - savePushSubscription / removePushSubscription / getPushSubscriptionStatus functions
  - sw.js daily-practice notificationclick handler navigating to /trail
  - PushOptInCard dashboard component (one-time, dismissible, 7-day threshold)
  - Dashboard integration for PushOptInCard
  - AppSettings studentId wiring for NotificationPermissionCard
  - English and Hebrew i18n translations (parentGate, pushNotifications, pushOptIn)
affects: [dashboard-ux, settings-ux, push-notification-flow, coppa-compliance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ParentGateMath: state = { problem, answer, error, attempts } — reset problem on wrong answer, hint after 3 attempts"
    - "NotificationPermissionCard state machine: loading → enabled | consent_skip | denied | unsupported | default"
    - "consent_skip state: parent_consent_granted=true but is_enabled=false — skip gate on re-enable"
    - "PushOptInCard: async check in useEffect with mountedRef cleanup to avoid setState-after-unmount"
    - "Defense-in-depth auth: client-side user.id === studentId check before every DB write"

key-files:
  created:
    - src/components/settings/ParentGateMath.jsx
    - src/components/dashboard/PushOptInCard.jsx
  modified:
    - src/components/settings/NotificationPermissionCard.jsx
    - src/services/notificationService.js
    - src/pages/AppSettings.jsx
    - src/components/layout/Dashboard.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
    - public/sw.js

key-decisions:
  - "consent_skip state: when parent_consent_granted=true but is_enabled=false, re-enable skips the math gate — matches CONTEXT.md spec"
  - "checkIosInstallRequired inline in NotificationPermissionCard: checks userAgent + display-mode standalone before subscribing — avoids silent failure on iOS Safari browser tab"
  - "PushOptInCard useRef(true) cleanup pattern for async getPushSubscriptionStatus — prevents setState after unmount warning"
  - "DISMISSED_KEY=push_optin_dismissed in localStorage — simple boolean string, no user-scoped key needed (card is per-device UX)"
  - "ParentGateMath generates new problem on wrong answer — prevents brute-force retry on same problem"
  - "sw.js daily-practice handler: client.navigate(urlToOpen) then client.focus() — consistent with existing dashboard-practice-reminder pattern"

requirements-completed: [NOTIF-01, NOTIF-02, NOTIF-05]

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 17 Plan 02: Push Notifications Client-Side Summary

**Full client-side push notification experience: ParentGateMath COPPA gate, upgraded NotificationPermissionCard with 5-state push flow, savePushSubscription/removePushSubscription DB functions, sw.js daily-practice handler navigating to /trail, PushOptInCard dashboard card with 7-day threshold, AppSettings studentId wiring, English and Hebrew translations**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T11:31:41Z
- **Completed:** 2026-03-04T11:35:18Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Created `ParentGateMath.jsx`: COPPA knowledge-based math verification gate. Generates two-digit addition problems (a: 20-60, b: 15-40). Wrong answer resets problem and increments attempts counter. After 3 wrong attempts shows hint text. Glass card overlay with `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`. RTL support via `isRTL` prop. Uses `useTranslation` for all text.

- Upgraded `NotificationPermissionCard.jsx`: Full push state machine replacing the simple browser-permission-only card. States: loading (shows spinner while checking DB), enabled (subscription active + Disable button), consent_skip (consent granted, currently disabled → re-enable without gate), denied (browser blocked), unsupported, default (first enable → triggers ParentGateMath). iOS standalone check before subscribing. Calls `savePushSubscription` / `removePushSubscription` from notificationService. Accepts new `studentId` prop.

- Extended `notificationService.js`: Added `savePushSubscription` (upsert with parent_consent_granted=true, parent_consent_at), `removePushSubscription` (browser unsubscribe + DB is_enabled=false, subscription=null), `getPushSubscriptionStatus` (SELECT is_enabled + parent_consent_granted). All write functions have defense-in-depth auth check (`user.id !== studentId` throws Unauthorized).

- Added `daily-practice` notificationclick handler to `public/sw.js`: Navigates to `/trail` when user taps a server-sent push notification from the send-daily-push Edge Function. Follows exact existing `dashboard-practice-reminder` pattern (matchAll + navigate + focus, fallback to openWindow).

- Created `PushOptInCard.jsx`: Dashboard card with visibility conditions (push supported + account >7 days + not dismissed + not subscribed). Checks `getPushSubscriptionStatus` async on mount with `useRef` cleanup. Dismissed via localStorage `push_optin_dismissed=true`. Links to `/settings`. Glass card matching DailyGoalsCard style.

- Integrated `PushOptInCard` into `Dashboard.jsx`: Rendered after DailyGoalsCard, student-only, passes `user.id` and `profileData.created_at`.

- Updated `AppSettings.jsx`: Added `useUser` import, destructured `user`, passed `studentId={user?.id}` to `NotificationPermissionCard`.

- Added i18n keys: `parentGate` (title/subtitle/placeholder/submit/cancel/wrong/hint), `pushNotifications` (enabled/enabledDescription/enableButton/enableDescription/disableButton/reEnableButton/iosInstallRequired/subscribing), `pushOptIn` (title/subtitle/goToSettings/dismiss) — in both `en/common.json` and `he/common.json` under `pages.settings.notifications`.

## Task Commits

Each task was committed atomically:

1. **Task 1: ParentGateMath + NotificationPermissionCard upgrade + notificationService + sw.js** - `c2e1609` (feat)
2. **Task 2: PushOptInCard + Dashboard + AppSettings + i18n** - `43a8c53` (feat)

## Files Created/Modified

- `src/components/settings/ParentGateMath.jsx` (created) — COPPA math verification gate
- `src/components/settings/NotificationPermissionCard.jsx` (modified) — Full push state machine with parent gate
- `src/services/notificationService.js` (modified) — savePushSubscription, removePushSubscription, getPushSubscriptionStatus
- `public/sw.js` (modified) — daily-practice notificationclick handler
- `src/components/dashboard/PushOptInCard.jsx` (created) — One-time dismissible opt-in card
- `src/components/layout/Dashboard.jsx` (modified) — PushOptInCard import + render
- `src/pages/AppSettings.jsx` (modified) — useUser import + studentId prop
- `src/locales/en/common.json` (modified) — English translations
- `src/locales/he/common.json` (modified) — Hebrew translations

## Decisions Made

- `consent_skip` state: when `parent_consent_granted=true` but `is_enabled=false`, re-enable skips the math gate. Matches CONTEXT.md requirement "Re-enabling after disable does NOT require parent re-consent." Parent consent is a permanent flag once granted.
- iOS standalone check inline in `performSubscription`: navigator.userAgent + display-mode standalone detection runs before calling `subscribeToPushNotifications`. Shows `iosInstallRequired` message instead of letting the browser fail silently.
- `PushOptInCard` uses `useRef(true)` cleanup pattern for the async `getPushSubscriptionStatus` call to prevent the "Can't perform a React state update on an unmounted component" warning.
- `DISMISSED_KEY` is not user-scoped in localStorage. The card is a per-device UX nudge; different users on the same device each dismiss independently as they log in.
- `ParentGateMath` generates a new problem on wrong answer — prevents the parent leaving the screen open for the child to brute-force the same problem.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Self-Check: PASSED

- FOUND: src/components/settings/ParentGateMath.jsx
- FOUND: src/components/dashboard/PushOptInCard.jsx
- FOUND: src/components/settings/NotificationPermissionCard.jsx (modified)
- FOUND: src/services/notificationService.js (savePushSubscription present)
- FOUND: public/sw.js (daily-practice handler present)
- FOUND: src/components/layout/Dashboard.jsx (PushOptInCard import + render)
- FOUND: src/pages/AppSettings.jsx (studentId={user?.id} present)
- FOUND: src/locales/en/common.json (parentGate key present)
- FOUND: src/locales/he/common.json (parentGate key present)
- FOUND commit: c2e1609 (Task 1)
- FOUND commit: 43a8c53 (Task 2)

---
*Phase: 17-push-notifications*
*Completed: 2026-03-04*
