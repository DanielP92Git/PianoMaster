---
phase: 16-parent-facing-pages-and-checkout
plan: 03
subsystem: payments
tags: [react, subscription, lemon-squeezy, i18n, react-query, supabase-edge-functions]

requires:
  - phase: 16-01
    provides: cancel-subscription Edge Function, fetchSubscriptionDetail service, SubscriptionContext
  - phase: 16-02
    provides: /subscribe and /subscribe/success routes wired in App.jsx, SubscribePage

provides:
  - ParentPortalPage component at /parent-portal with full cancel flow
  - Subscription section in AppSettings linking to /parent-portal or /subscribe
  - Paywall upgrade button in TrailNodeModal navigating to /subscribe
  - parentPortal i18n namespace in en/he common.json
  - askParent translation key in en/he trail.json

affects: [subscription management, trail node modal paywall, settings page]

tech-stack:
  added: []
  patterns:
    - "Optimistic cancel state using useState alongside React Query cache invalidation"
    - "StatusBadge component with status-keyed className map"
    - "Intl.NumberFormat + Intl.DateTimeFormat for locale-aware price and date rendering"
    - "Two-button paywall layout: secondary dismiss + primary amber upgrade CTA"

key-files:
  created:
    - src/pages/ParentPortalPage.jsx
  modified:
    - src/App.jsx
    - src/components/trail/TrailNodeModal.jsx
    - src/pages/AppSettings.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
    - src/locales/en/trail.json
    - src/locales/he/trail.json

key-decisions:
  - "ParentPortalPage uses useQuery with staleTime:0 for subscription-detail — matches SubscriptionContext pattern to never show stale data"
  - "Optimistic cancel state via setOptimisticCancel merges on top of fetched detail — avoids waiting for DB refresh while maintaining real data as source of truth"
  - "AppSettings Subscription section uses defaultOpen:true — subscription status is high-priority for parent users, show immediately"
  - "TrailNodeModal paywall: Got it becomes gray secondary, Ask a parent becomes amber primary — reverses priority to nudge upgrade action"

requirements-completed: [PARENT-01, PARENT-04, PARENT-05]

duration: 5min
completed: 2026-03-01
---

# Phase 16 Plan 03: Parent Portal and Paywall Entry Points Summary

**ParentPortalPage (/parent-portal) with Lemon Squeezy cancel-subscription flow, paywall upgrade button in TrailNodeModal, and Subscription section in AppSettings — completing all monetization entry and management points**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T17:08:22Z
- **Completed:** 2026-03-01T17:13:00Z
- **Tasks:** 2
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments

- Built ParentPortalPage (324 lines) with subscription status display, plan details (billing period, formatted price, renewal/end date), cancel button with confirmation dialog calling cancel-subscription Edge Function, and optimistic cancelled state with Re-subscribe button
- Added two-button paywall layout to TrailNodeModal: "Got it" (gray secondary) + "Ask a parent to unlock!" (amber primary, navigates to /subscribe) replacing single amber dismiss button
- Added Subscription SettingsSection to AppSettings: shows "Premium Active" + "Manage Subscription" link when subscribed, "Free Plan" + "Unlock Full Access" button when not subscribed
- Registered /parent-portal route in App.jsx
- Added parentPortal i18n namespace (26 keys) to both en/he common.json, and askParent key to en/he trail.json

## Task Commits

Each task was committed atomically:

1. **Task 1: ParentPortalPage + App.jsx route + parentPortal i18n** - `f42cac9` (feat)
2. **Task 2: TrailNodeModal paywall buttons + AppSettings subscription section** - `ab12f53` (feat)

## Files Created/Modified

- `src/pages/ParentPortalPage.jsx` - Subscription management page with status display, plan details, confirmation dialog, cancel flow, and Re-subscribe CTA
- `src/App.jsx` - Added ParentPortalPage import and /parent-portal route
- `src/components/trail/TrailNodeModal.jsx` - Replaced single paywall button with two-button layout (Got it + Ask a parent)
- `src/pages/AppSettings.jsx` - Added Subscription SettingsSection with CreditCard icon, isPremium-conditional display
- `src/locales/en/common.json` - Added parentPortal namespace (26 keys) and settings.subscription* keys
- `src/locales/he/common.json` - Same as English with Hebrew translations
- `src/locales/en/trail.json` - Added modal.button.askParent key
- `src/locales/he/trail.json` - Added modal.button.askParent Hebrew translation

## Decisions Made

- ParentPortalPage uses `useQuery` with `staleTime: 0` for subscription-detail — matches SubscriptionContext pattern, never shows stale subscription status
- Optimistic cancel state via `setOptimisticCancel` merges on top of fetched detail without clearing it — maintains real data as source of truth while providing instant feedback
- AppSettings Subscription section uses `defaultOpen: true` — subscription status is high-priority info for parents visiting settings
- TrailNodeModal paywall button priority reversed: "Got it" becomes gray secondary, "Ask a parent to unlock!" becomes amber primary — nudges upgrade action without removing dismiss option

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The cancel-subscription Edge Function was deployed in Plan 01.

## Next Phase Readiness

Phase 16 is complete. All three plans (01 cancel-subscription Edge Function + create-checkout, 02 SubscribePage + SubscribeSuccessPage, 03 ParentPortalPage + paywall entry points) have shipped.

The complete monetization flow is wired end-to-end:
- Trail paywall modal "Ask a parent to unlock!" → /subscribe → Lemon Squeezy overlay → /subscribe/success → polling → premium unlocked
- Settings "Manage Subscription" → /parent-portal → cancel confirmation → optimistic cancelled state → Re-subscribe → /subscribe

---
*Phase: 16-parent-facing-pages-and-checkout*
*Completed: 2026-03-01*
