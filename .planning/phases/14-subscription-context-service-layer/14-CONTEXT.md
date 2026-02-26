# Phase 14: Subscription Context and Service Layer - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Provide a global React context (`SubscriptionContext`) so any component can read subscription status via `useSubscription()`. Powered by React Query with `staleTime: 0` and a Supabase Realtime channel that invalidates the query when the webhook writes an update. This phase does NOT include checkout UI, paywall components, or billing management — only the service layer that reads and distributes subscription state.

</domain>

<decisions>
## Implementation Decisions

### Context shape
- `useSubscription()` returns `{ isPremium, isLoading }` — minimal API
- `isPremium` is a boolean: `true` = active subscription (including grace period), `false` = everything else (free, expired, cancelled past period end)
- No distinction between "never subscribed" and "subscription ended" — both are `isPremium: false`
- No plan details, status strings, or expiry dates exposed — keep it simple, add later if needed

### Provider placement
- `SubscriptionProvider` sits inside `AuthProvider` but above the Router/App content
- Only fetches subscription status when user is authenticated

### Loading behavior
- While subscription status is loading, `isPremium` defaults to `false` (assume free)
- Components can use `isLoading` to show skeletons if they want, but the default locked state is acceptable
- No blocking of UI — app renders immediately with free-tier assumption

### Error handling
- If subscription fetch fails (network error, Supabase down): `isPremium = false` (fail safe)
- Silent degradation — no error toasts or banners shown to the user
- Avoids confusing 8-year-old users with technical error messages

### Real-time update feedback
- When Realtime channel pushes an update (subscription activated), show a brief toast or subtle animation ("Premium unlocked!" or similar)
- Premium nodes unlock seamlessly on the trail map via query invalidation
- This is the one moment where the user should feel "it worked"

### Claude's Discretion
- Supabase Realtime channel configuration details
- React Query cache key structure and invalidation mechanics
- Service function implementation for fetching subscription status from `parent_subscriptions` table
- Toast/animation implementation details for the unlock moment

</decisions>

<specifics>
## Specific Ideas

- The unlock toast should feel celebratory but not over-the-top — a brief "unlocked" moment that confirms the purchase worked
- Grace period logic (cancelled but period not ended) should resolve to `isPremium: true` — same as the `has_active_subscription()` Postgres function

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-subscription-context-service-layer*
*Context gathered: 2026-02-27*
