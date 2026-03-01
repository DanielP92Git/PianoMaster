---
phase: 15-trail-content-gating-ui
plan: 01
subsystem: ui
tags: [react, tailwind, lucide-react, i18n, trail, subscription, content-gating]

# Dependency graph
requires:
  - phase: 14-subscription-context-service-layer
    provides: useSubscription() hook returning { isPremium, isLoading }
provides:
  - src/config/subscriptionConfig.js with FREE_NODE_IDS Set (19 IDs) and isFreeNode() gate function
  - premium_locked visual state in getCategoryColors() and getNodeStateConfig() with gold/amber styling
  - node-3d-premium-locked CSS class in trail-effects.css
  - TrailMap reads useSubscription() and pre-computes premiumLockedNodeIds Set
  - ZigzagTrailLayout threads isPremiumLocked boolean to each TrailNode
  - TrailNode renders Sparkles icon + gold CSS + click-to-modal for premium_locked state
  - i18n keys modal.premiumMessage and modal.button.gotIt in en and he trail.json
affects:
  - 15-trail-content-gating-ui Plan 02 (TrailNodeModal paywall branch)
  - Any future phase using isFreeNode() or subscriptionConfig

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "premiumLockedNodeIds pre-computed as useMemo Set at TrailMap level — single subscription check for all nodes"
    - "isPremium defaults to false during loading → premium nodes show gold (no flash of unlocked content)"
    - "premium_locked as highest priority in nodeState useMemo — subscription gate overrides prerequisite state"

key-files:
  created:
    - src/config/subscriptionConfig.js
  modified:
    - src/utils/nodeTypeStyles.js
    - src/styles/trail-effects.css
    - src/components/trail/TrailNode.jsx
    - src/components/trail/ZigzagTrailLayout.jsx
    - src/components/trail/TrailMap.jsx
    - src/locales/en/trail.json
    - src/locales/he/trail.json

key-decisions:
  - "subscriptionConfig.js uses explicit static node ID lists (not dynamic resolution from unit files) — prevents accidental paywall expansion"
  - "premiumLockedNodeIds computed once at TrailMap level via useMemo — avoids repeated subscription lookups per node"
  - "isPremium false-default during loading means non-free nodes show gold until subscription confirmed — no flash of unlocked content"
  - "premium_locked wins over locked in nodeState priority — gold subscription gate is more informative than gray prerequisite lock"

patterns-established:
  - "Content gate UI pattern: compute locked Set at provider level, thread as prop, render distinct visual at leaf"
  - "Two distinct lock states: gray prerequisite lock (node-3d-locked) vs gold subscription lock (node-3d-premium-locked)"

requirements-completed: [GATE-01, GATE-02]

# Metrics
duration: 20min
completed: 2026-03-01
---

# Phase 15 Plan 01: Trail Content Gating UI - Visual Layer Summary

**Gold premium_locked node state wired from subscriptionConfig through TrailMap to TrailNode — free-tier users see Sparkles icon with amber gradient on all non-Unit-1 nodes**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-01T15:07:17Z
- **Completed:** 2026-03-01T15:28:18Z
- **Tasks:** 2
- **Files modified:** 7 (+ 1 created)

## Accomplishments
- Created `src/config/subscriptionConfig.js` with 19 free node IDs (7 treble + 6 bass + 6 rhythm) and `isFreeNode()` gate function — exact copy from monetization branch commit `6bc69fa`
- Added `premium_locked` state to the styling system: gold/amber gradient colors in `getCategoryColors()`, Sparkles icon override in `getNodeStateConfig()`, and `node-3d-premium-locked` CSS class in `trail-effects.css`
- Wired subscription awareness through the full trail component tree: `TrailMap` reads `useSubscription()`, pre-computes `premiumLockedNodeIds` Set, threads it to `ZigzagTrailLayout` and then to each `TrailNode`
- Added i18n keys `modal.premiumMessage` and `modal.button.gotIt` to both English and Hebrew trail.json files (consumed by TrailNodeModal in Plan 02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create subscriptionConfig.js and add premium_locked visual state** - `1600d79` (feat)
2. **Task 2: Wire premium-locked state through TrailMap -> ZigzagTrailLayout -> TrailNode** - `b682a55` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/config/subscriptionConfig.js` - Free tier gate: FREE_NODE_IDS Set (19 IDs), isFreeNode() function, PAYWALL_BOSS_NODE_IDS
- `src/utils/nodeTypeStyles.js` - Added Sparkles import, premium_locked branch in getCategoryColors() and getNodeStateConfig()
- `src/styles/trail-effects.css` - Added node-3d-premium-locked CSS class with gold gradient and hover glow; added to touch-action and focus-visible groups
- `src/components/trail/TrailNode.jsx` - Added isPremiumLocked prop, Sparkles icon, premium_locked first in nodeState, click opens modal, gold name text
- `src/components/trail/ZigzagTrailLayout.jsx` - Added premiumLockedNodeIds prop (default empty Set), passed isPremiumLocked to each TrailNode
- `src/components/trail/TrailMap.jsx` - Added useSubscription() and isFreeNode() imports, premiumLockedNodeIds useMemo, prop threading to ZigzagTrailLayout and TrailNodeModal
- `src/locales/en/trail.json` - Added modal.premiumMessage and modal.button.gotIt
- `src/locales/he/trail.json` - Added modal.premiumMessage and modal.button.gotIt

## Decisions Made
- `subscriptionConfig.js` uses explicit static node ID lists — prevents accidental paywall expansion if unit files grow; gate changes must be intentional
- `premiumLockedNodeIds` computed once at `TrailMap` level via `useMemo` — single subscription check for all nodes, avoids per-node subscription hook calls
- `isPremium` defaults to `false` during loading → non-free nodes show gold until subscription confirmed — no flash of unlocked content, satisfies `must_have` truth #5
- `premium_locked` is highest priority in `nodeState` useMemo — subscription gate overrides prerequisite-locked state (gold is more informative than gray)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failure in `SightReadingGame.micRestart.test.jsx` (`useAudioContext must be used inside AudioContextProvider`) — pre-existing issue noted in STATE.md, unrelated to this plan's changes. All 62 other tests pass.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All visual layer wiring complete for GATE-01 and GATE-02
- `TrailNodeModal` already receives `isPremiumLocked` prop — Plan 02 adds the paywall branch content (premium message + "Got it!" button) inside the modal
- Dashboard "Continue Learning" filtering for free-tier users is also in Plan 02

---
*Phase: 15-trail-content-gating-ui*
*Completed: 2026-03-01*
