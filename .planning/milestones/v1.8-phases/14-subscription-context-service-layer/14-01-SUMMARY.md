---
phase: 14-subscription-context-service-layer
plan: 01
subsystem: payments
tags: [react-query, supabase-realtime, react-context, subscription, isPremium]

requires:
  - phase: 13-payment-webhook-service-worker
    provides: parent_subscriptions table written by webhook, RLS SELECT for student_id=auth.uid()

provides:
  - fetchSubscriptionStatus() async function mirroring has_active_subscription() Postgres logic
  - SubscriptionProvider React context component with React Query + Supabase Realtime
  - useSubscription() hook returning { isPremium, isLoading } for any component in app tree
  - 8 unit tests covering all fetchSubscriptionStatus code paths

affects:
  - 15-trail-gating-ui
  - 16-parent-checkout

tech-stack:
  added: []
  patterns:
    - "Context provider embedding useQuery + Realtime channel in single component"
    - "vi.hoisted() for Vitest mock variable hoisting with chainable query builders"
    - "prevIsPremiumRef for toast de-duplication on Realtime reconnect"
    - "staleTime: 0 with refetchOnWindowFocus: false — Realtime handles push, not polling"

key-files:
  created:
    - src/services/subscriptionService.js
    - src/contexts/SubscriptionContext.jsx
    - src/services/__tests__/subscriptionService.test.js
  modified:
    - src/App.jsx

key-decisions:
  - "vi.hoisted() used for Vitest mock variables — vi.mock factory is hoisted before const declarations"
  - "Toast shown only in useEffect watching query data, not in Realtime callback — prevents duplicate toasts on reconnect"
  - "staleTime: 0 with refetchOnWindowFocus: false — Realtime push invalidation handles freshness; window focus poll is redundant"
  - "isPremium defaults to false while loading, on error, and for users without a subscription (fail-safe)"
  - "maybeSingle() used instead of single() — unsubscribed users have no row, which returns null not error"

patterns-established:
  - "Pattern: SubscriptionProvider — context provider calling useQuery + useQueryClient internally, with Realtime useEffect cleanup"
  - "Pattern: prevIsPremiumRef toast guard — useRef tracks previous isPremium, toast fires only on false->true transition"

requirements-completed: [SVC-01, SVC-02, SVC-03]

duration: 3min
completed: 2026-02-28
---

# Phase 14 Plan 01: Subscription Context and Service Layer Summary

**SubscriptionProvider with React Query (staleTime: 0) + Supabase Realtime postgres_changes push invalidation, exposing useSubscription() globally with false-to-true toast guard**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T22:20:08Z
- **Completed:** 2026-02-28T22:22:54Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- fetchSubscriptionStatus() mirrors has_active_subscription() Postgres logic across all 5 status paths (active, on_trial, cancelled-grace, past_due-grace, default-false)
- SubscriptionProvider provides isPremium globally via useSubscription() hook — no prop drilling required (SVC-01)
- Supabase Realtime postgres_changes channel subscribes to parent_subscriptions changes filtered by student_id, calling invalidateQueries on event (SVC-03)
- staleTime: 0 overrides global 5-min default — subscription data always considered stale (SVC-02)
- Toast de-duplication via prevIsPremiumRef prevents "Premium unlocked!" firing on Realtime reconnect
- 8 unit tests pass covering all fetchSubscriptionStatus code paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Create subscriptionService and SubscriptionContext with Realtime channel** - `5c72a77` (feat)
2. **Task 2: Wire SubscriptionProvider into App.jsx and add unit tests** - `05ee362` (feat)

## Files Created/Modified
- `src/services/subscriptionService.js` - fetchSubscriptionStatus() with 5 status paths mirroring Postgres has_active_subscription()
- `src/contexts/SubscriptionContext.jsx` - SubscriptionProvider + useSubscription hook with React Query + Realtime
- `src/services/__tests__/subscriptionService.test.js` - 8 unit tests with vi.hoisted() mock pattern
- `src/App.jsx` - SubscriptionProvider wired inside SightReadingSessionProvider, above AppRoutes

## Decisions Made
- Used vi.hoisted() for Vitest mock variables (vi.mock factory is hoisted before const declarations — test failed without this fix)
- Toast shown in useEffect watching query data, not in Realtime callback — Realtime reconnect can re-deliver events, causing duplicate toasts
- staleTime: 0 with refetchOnWindowFocus: false — Realtime push handles cache invalidation; window-focus polling is redundant and wasteful
- isPremium defaults to false while loading, on error, and for unsubscribed users (fail-safe per CONTEXT.md)
- maybeSingle() used instead of single() — unsubscribed students have no row in parent_subscriptions; single() would throw, maybeSingle() returns null

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Vitest vi.mock hoisting error with vi.hoisted()**
- **Found during:** Task 2 (unit tests)
- **Issue:** Plan's test code pattern defined const mock variables before vi.mock(), but vi.mock() is hoisted to top of file by Vitest transform — causing "Cannot access 'mockFrom' before initialization" ReferenceError
- **Fix:** Wrapped mock variable declarations in vi.hoisted(() => {...}) so variables are initialized in the hoisting phase, making them available when vi.mock() factory runs
- **Files modified:** src/services/__tests__/subscriptionService.test.js
- **Verification:** All 8 tests pass
- **Committed in:** 05ee362 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test mock initialization order)
**Impact on plan:** Test mock pattern required vi.hoisted() fix; no scope creep, all 8 tests now pass.

## Issues Encountered
- Vitest mock hoisting: plan specified const mock variables before vi.mock(), which fails because vi.mock() is hoisted above const declarations. Fixed with vi.hoisted() pattern (Vitest standard solution). All tests pass after fix.

## User Setup Required
None - no external service configuration required. Supabase Realtime is already enabled in the existing supabase.js client.

## Next Phase Readiness
- useSubscription() is available to any component in the app tree via SubscriptionProvider
- Phase 15 (trail gating UI) can call useSubscription() directly — no prop drilling needed
- Phase 16 (parent checkout) can use isPremium to show upgrade prompts
- Realtime channel will push updates within seconds after Phase 13 webhook writes to parent_subscriptions

---
*Phase: 14-subscription-context-service-layer*
*Completed: 2026-02-28*
