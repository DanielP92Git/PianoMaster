---
phase: 13-payment-webhook-service-worker
plan: 02
subsystem: infra
tags: [service-worker, pwa, cache, supabase, lemon-squeezy, webhook, deployment]

# Dependency graph
requires:
  - phase: 13-01
    provides: lemon-squeezy-webhook Edge Function that handles subscription events

provides:
  - Service worker REST API cache exclusion (subscription queries always network-first)
  - Cache version bump to pianomaster-v6 forcing PWA cache refresh on monetization deploy
  - DEPLOY.md deployment checklist for webhook setup

affects:
  - phase 14 (SubscriptionContext will rely on always-fresh REST API data)
  - any future service worker changes (isRestApiEndpoint pattern established)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "REST API cache exclusion via isRestApiEndpoint() function following same pattern as isAuthEndpoint()"
    - "shouldCache triple-guard: matchesPattern && !isAuth && !isRestApiEndpoint(url)"
    - "Offline fallback for REST API returns 503 JSON — React Query handles graceful offline UX at component layer"

key-files:
  created:
    - DEPLOY.md
  modified:
    - public/sw.js

key-decisions:
  - "Cache version bumped from pianomaster-v5 to pianomaster-v6 — forces cache refresh for all PWA users on monetization deploy"
  - "REST API exclusion added at shouldCache and offline-fallback levels — mirrors auth endpoint exclusion pattern"
  - "RUNTIME_CACHE_PATTERNS supabase.co regex unchanged — exclusion done at shouldCache level, consistent with existing arch"
  - "Offline 503 for REST API responses — React layer (SubscriptionContext/React Query in-memory) handles graceful offline UX, not SW cache"
  - "DEPLOY.md documents environment separation: same Edge Function code, different LS_SIGNING_SECRET per environment"

patterns-established:
  - "isRestApiEndpoint(url): checks hostname includes supabase.co and pathname startsWith /rest/ — add new exclusion functions following this pattern"
  - "shouldCache defense-in-depth: new exclusion types chain as additional !isXxx(url) conditions, never modify RUNTIME_CACHE_PATTERNS"

requirements-completed: [COMP-01, COMP-02]

# Metrics
duration: 8min
completed: 2026-02-26
---

# Phase 13 Plan 02: Service Worker REST API Cache Exclusion and Deployment Guide Summary

**Service worker hardened with REST API cache exclusion (prevents stale subscription data), cache bumped to pianomaster-v6 for monetization deploy, and DEPLOY.md checklist created for webhook setup end-to-end**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-26T22:40:11Z
- **Completed:** 2026-02-26T22:48:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Service worker now excludes all Supabase REST API endpoints (`/rest/*`) from caching — subscription status queries always fetch from network
- Cache version bumped from v5 to v6 ensuring all existing PWA users get fresh caches on next activation
- DEPLOY.md provides complete step-by-step deployment workflow: set secret, deploy function, register webhook URL, update variant IDs, sandbox testing, idempotency verification, signature rejection verification, and environment separation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add REST API cache exclusion and bump cache version in sw.js** - `cb9cb2a` (feat)
2. **Task 2: Create DEPLOY.md with webhook deployment checklist** - `cf2b01d` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `public/sw.js` - Cache version bumped to pianomaster-v6; `isRestApiEndpoint()` function added; `shouldCache` and offline fallback updated
- `DEPLOY.md` - 176-line step-by-step deployment guide for the Lemon Squeezy webhook

## Decisions Made

- Cache version bumped to v6 (not a new arbitrary cache name): the existing `activate` handler already purges caches not in `CACHE_WHITELIST` — bumping from v5 to v6 causes old v5 caches to be evicted automatically on next activation.
- `RUNTIME_CACHE_PATTERNS` supabase.co regex intentionally unchanged: the exclusion logic mirrors the auth endpoint pattern (check at shouldCache level) for consistency rather than shrinking the match list.
- Offline fallback for REST API endpoints returns a 503 JSON response rather than serving from cache. The plan's CONTEXT.md notes that "last known subscription state" offline UX is the React layer's responsibility (SubscriptionContext / React Query in-memory cache), not the service worker's.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** See `DEPLOY.md` at the project root for:
- Setting `LS_SIGNING_SECRET` via `supabase secrets set`
- Deploying the Edge Function with `supabase functions deploy`
- Registering the webhook URL in the Lemon Squeezy dashboard
- Updating `subscription_plans` table with real variant IDs

## Next Phase Readiness

- Service worker is ready for the monetization deploy — REST API responses will never be served from cache
- Cache version bump ensures zero stale-cache risk for existing users
- DEPLOY.md is the single reference for the deployment engineer executing the go-live checklist
- Phase 14 (SubscriptionContext) can rely on the SW always returning fresh data from `/rest/v1/parent_subscriptions`

---
*Phase: 13-payment-webhook-service-worker*
*Completed: 2026-02-26*

## Self-Check: PASSED

- FOUND: public/sw.js
- FOUND: DEPLOY.md
- FOUND: .planning/phases/13-payment-webhook-service-worker/13-02-SUMMARY.md
- FOUND: commit cb9cb2a (Task 1: sw.js REST API exclusion + version bump)
- FOUND: commit cf2b01d (Task 2: DEPLOY.md)
