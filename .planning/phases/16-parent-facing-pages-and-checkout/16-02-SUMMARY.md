---
phase: 16-parent-facing-pages-and-checkout
plan: 02
subsystem: payments-ui
tags: [lemon-squeezy, lemon-js, react-query, i18n, routing, pricing-page]

# Dependency graph
requires:
  - phase: 16-01
    provides: create-checkout Edge Function, fetchSubscriptionPlans(), SubscriptionContext/useSubscription()
provides:
  - SubscribePage: pricing page with locale-detected currency, Lemon.js overlay checkout
  - SubscribeSuccessPage: post-checkout confirmation with 10-second isPremium polling
  - /subscribe route: wired into App.jsx inside ProtectedRoute > AppLayout
  - /subscribe/success route: wired into App.jsx inside ProtectedRoute > AppLayout
  - i18n keys: subscribe.* and subscribeSuccess.* in en/common.json and he/common.json
affects: [parent-portal, 16-03, checkout-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lemon.js loading: guard document.querySelector before creating script tag, setupLemon() guarded by useRef to prevent StrictMode double-setup"
    - "Checkout polling: queryClient.invalidateQueries loop with setInterval, MAX_ATTEMPTS=10, 1s interval, timedOut state after failure"
    - "Currency detection: navigator.language?.startsWith('he') ? 'ILS' : 'USD' — single expression, no dependency on i18n locale"
    - "Savings % calculation: Math.round((1 - (yearlyAmountCents/12/100) / (monthlyAmountCents/100)) * 100)"

key-files:
  created:
    - src/pages/SubscribePage.jsx
    - src/pages/SubscribeSuccessPage.jsx
  modified:
    - src/App.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Option B chosen for App.jsx: only /subscribe and /subscribe/success added now; /parent-portal left for Plan 03 to avoid forward-reference build error"
  - "LemonSqueezy.Url.Open fallback: if overlay not ready, window.open in new tab — prevents silent failure if Lemon.js loads late"
  - "timedOut state drives pending vs loading display — avoids complex isPremium + attempts combination logic"
  - "isPolling derived as !isConfirmed && !isPending — single readable truth source for spinner state"

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 16 Plan 02: Pricing Page and Success Confirmation Summary

**Pricing page with locale-detected currency and Lemon.js overlay checkout, plus post-checkout success page with 10-second isPremium polling**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T17:01:12Z
- **Completed:** 2026-03-01T17:04:36Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `SubscribePage.jsx` renders monthly/yearly plan cards with prices from `fetchSubscriptionPlans(currency)`. Currency auto-detected from `navigator.language` (ILS for Hebrew, USD for all others). Yearly card has "Best Value" badge, savings %, and per-month equivalent price.
- Lemon.js script loaded once in `useEffect` with `lemonSetupRef` guard preventing StrictMode double-setup. `LemonSqueezy.Setup()` registers `Checkout.Success` event handler that navigates to `/subscribe/success`.
- `handlePlanClick` invokes `create-checkout` Edge Function, receives `checkoutUrl`, opens LS overlay via `LemonSqueezy.Url.Open()`. Falls back to `window.open` if overlay not ready.
- `SubscribeSuccessPage.jsx` polls `isPremium` via `queryClient.invalidateQueries` on a 1-second interval for up to 10 seconds. Three display states: loading (spinner), confirmed (CheckCircle + "Premium Unlocked!"), pending/timeout ("Payment Received!").
- Both pages use `i18n.dir()` for RTL support. All text uses `t()` keys with English and Hebrew translations.
- App.jsx now has `/subscribe` and `/subscribe/success` routes wired inside `ProtectedRoute > AppLayout`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build SubscribePage with Lemon Squeezy overlay checkout** - `adb90c1` (feat)
2. **Task 2: Build SubscribeSuccessPage and add routes to App.jsx** - `d5d447e` (feat)

**Plan metadata:** committed with SUMMARY.md (docs)

## Files Created/Modified

- `src/pages/SubscribePage.jsx` — Pricing page: locale-detected currency, plan cards from DB, Lemon.js overlay checkout, feature checklist, glass card design, RTL support
- `src/pages/SubscribeSuccessPage.jsx` — Success confirmation: 10-second isPremium polling via React Query invalidation, three states (loading/confirmed/pending), glass card layout
- `src/App.jsx` — Added SubscribePage and SubscribeSuccessPage imports; registered /subscribe and /subscribe/success routes inside ProtectedRoute > AppLayout
- `src/locales/en/common.json` — Added `subscribe.*` and `subscribeSuccess.*` translation keys
- `src/locales/he/common.json` — Added `subscribe.*` and `subscribeSuccess.*` Hebrew translation keys

## Decisions Made

- `Option B` for App.jsx route additions: only `/subscribe` and `/subscribe/success` added in this plan. `/parent-portal` will be added in Plan 03 once `ParentPortalPage` is created, avoiding a forward-reference build error.
- `LemonSqueezy.Url.Open` fallback to `window.open` in new tab if overlay not ready — prevents silent failure if Lemon.js loads late or the overlay API isn't initialized.
- `timedOut` boolean state drives the three display modes cleanly: `isConfirmed = isPremium`, `isPending = timedOut && !isPremium`, `isPolling = !isConfirmed && !isPending`.
- `lemonSetupRef` (useRef, initialized to `false`) prevents `LemonSqueezy.Setup()` from being called twice in StrictMode double-render cycles.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Files created:
- src/pages/SubscribePage.jsx ✓
- src/pages/SubscribeSuccessPage.jsx ✓

Commits:
- adb90c1 ✓
- d5d447e ✓

## Self-Check: PASSED
