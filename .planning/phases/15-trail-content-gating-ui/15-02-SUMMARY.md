---
phase: 15-trail-content-gating-ui
plan: 02
subsystem: ui
tags: [react, supabase, subscription, paywall, trail, i18n, react-query]

# Dependency graph
requires:
  - phase: 15-trail-content-gating-ui-01
    provides: subscriptionConfig.js isFreeNode() + premiumLockedNodeIds threading through TrailMap/ZigzagTrailLayout/TrailNode
  - phase: 14-subscription-context-service-layer
    provides: SubscriptionContext + useSubscription() hook returning isPremium boolean
provides:
  - TrailNodeModal with isPremiumLocked branch (paywall message, Sparkles icon, Got it! button, no pricing)
  - getNextRecommendedNode(studentId, isPremium) that filters premium nodes for free users
  - Dashboard "Continue Learning" query wired to subscription status via isPremium queryKey
affects: [phase-16-dashboard-xp-prominence, any future upsell flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isPremiumLocked prop pattern: parent computes lock state, modal receives it as prop — no subscription check inside modal"
    - "Subscription-aware queryKey: include isPremium in React Query key so cache auto-invalidates on subscription change"
    - "Free-tier filter in service layer: isPremium=false default param keeps recommendations safe without caller awareness"

key-files:
  created: []
  modified:
    - src/components/trail/TrailNodeModal.jsx
    - src/services/skillProgressService.js
    - src/components/layout/Dashboard.jsx

key-decisions:
  - "isPremiumLocked defaults to false in TrailNodeModal — safe default, wrong direction fails open to normal modal"
  - "getNextRecommendedNode isPremium defaults to false — free-tier filter is always active unless explicitly unlocked"
  - "isPremium included in Dashboard queryKey — React Query re-fetches automatically when subscription flips, no manual invalidation needed"
  - "Skills/XP/accessory sections remain visible for premium-locked nodes — child can see what they will earn, builds engagement"
  - "Boss unlock hint and prerequisites sections hidden for premium-locked — not relevant; premium gate supersedes prerequisite gate"

patterns-established:
  - "Child-safe paywall: zero pricing, zero buy buttons, single Got it! dismiss — all purchase flows are parent-only"
  - "Service-layer isPremium=false default: callers without subscription context are always treated as free tier"

requirements-completed: [CHILD-01, CHILD-02]

# Metrics
duration: 9min
completed: 2026-03-01
---

# Phase 15 Plan 02: Trail Content Gating UI Summary

**Child-appropriate paywall modal with Sparkles icon and "Got it!" dismiss, plus Dashboard recommendation filtered to free-tier nodes for non-premium users**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-01T15:31:22Z
- **Completed:** 2026-03-01T15:40:21Z
- **Tasks:** 1 (+ 1 human-verify checkpoint approved)
- **Files modified:** 3

## Accomplishments

- TrailNodeModal shows amber/gold UI with Sparkles icon and child-safe paywall message when `isPremiumLocked=true` — no pricing, no payment links, no buy buttons anywhere in the student flow
- Single "Got it!" button (amber gradient) dismisses the modal; skills list, XP reward, and accessory unlock remain visible to build excitement about what premium unlocks
- `getNextRecommendedNode` now accepts `isPremium=false` and filters out premium nodes from recommendations for free-tier users — Dashboard "Continue Learning" always points to a playable free node
- Dashboard query key includes `isPremium` so React Query cache auto-invalidates the moment a parent subscribes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add paywall branch to TrailNodeModal and filter Dashboard recommendations** - `4498b50` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/components/trail/TrailNodeModal.jsx` — Added `isPremiumLocked` prop, Sparkles icon import, amber header colors, paywall message box, "Got it!" button branch; early-exit for exercise progress fetch when premium-locked; `!isPremiumLocked` guard on prerequisites and boss unlock hint sections
- `src/services/skillProgressService.js` — Added `isFreeNode` import; updated `getNextRecommendedNode` signature to `(studentId, isPremium = false)`; added free-tier filter using `isFreeNode(node.id)` before priority logic
- `src/components/layout/Dashboard.jsx` — Added `useSubscription` import; added `const { isPremium } = useSubscription()` hook; added `isPremium` to `queryKey` array and `queryFn` call for `getNextRecommendedNode`

## Decisions Made

- `isPremiumLocked` defaults to `false` in TrailNodeModal — safe default ensures normal modal behavior unless explicitly flagged premium-locked
- `getNextRecommendedNode` defaults `isPremium` to `false` — callers without subscription context always receive free-tier-only recommendations
- `isPremium` included in Dashboard `queryKey` — React Query re-fetches on subscription status change without manual cache invalidation
- Skills, XP reward, and accessory unlock sections remain visible for premium-locked nodes — these sections build excitement for what the child will earn when unlocked
- Boss unlock hint and prerequisites sections hidden for premium-locked nodes — subscription gate supersedes prerequisite lock, these messages would confuse the child

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

**Deferred (out of scope):** In Hebrew locale, the "Skills You'll Learn" badge list shows raw note IDs (`C4`, `D4`) instead of Hebrew note names (`דו`, `רה`). This is a pre-existing i18n gap not introduced by this plan. Logged in `deferred-items.md` for future resolution.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 15 complete: full trail content gating UI delivered (Plan 01: visual premium_locked state; Plan 02: paywall modal + recommendation filter)
- CHILD-01 and CHILD-02 requirements fulfilled
- Phase 16 (Dashboard XP Prominence) can proceed — no blockers from this phase

---
*Phase: 15-trail-content-gating-ui*
*Completed: 2026-03-01*
