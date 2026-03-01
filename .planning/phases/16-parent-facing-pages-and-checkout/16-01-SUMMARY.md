---
phase: 16-parent-facing-pages-and-checkout
plan: 01
subsystem: payments
tags: [lemon-squeezy, edge-functions, deno, supabase, subscriptions]

# Dependency graph
requires:
  - phase: 13-payment-webhook-service-worker
    provides: lemon-squeezy-webhook Edge Function, parent_subscriptions table, upsertSubscription.ts
  - phase: 14-subscription-context-service-layer
    provides: subscriptionService.js with fetchSubscriptionStatus, SubscriptionContext
provides:
  - create-checkout Edge Function: server-side Lemon Squeezy checkout URL creation with embed:true
  - cancel-subscription Edge Function: server-side Lemon Squeezy subscription cancellation returning endsAt
  - fetchSubscriptionPlans(currency): client-side plan data fetcher for pricing page
  - fetchSubscriptionDetail(studentId): client-side subscription detail fetcher for parent portal
  - plan_id population in upsertSubscription (resolves Phase 13 TODO)
affects: [16-02-pricing-page, 16-03-parent-portal, parent-portal, checkout-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CORS preflight handling: OPTIONS method returns 200 with CORS_HEADERS before route guards"
    - "Edge Function auth pattern: createClient with anon key + user Authorization header to get auth.uid()"
    - "Dual Supabase clients in Edge Functions: user client for auth, service role client for DB"
    - "Defensive plan_id lookup: maybeSingle() + plan?.id ?? null — null fallback if variant unmapped"

key-files:
  created:
    - supabase/functions/create-checkout/index.ts
    - supabase/functions/cancel-subscription/index.ts
  modified:
    - supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts
    - src/services/subscriptionService.js
    - supabase/functions/.env.example
    - supabase/config.toml

key-decisions:
  - "create-checkout uses service role client for plan lookup (RLS: subscription_plans_select_public = USING(true)) — consistent with webhook pattern, avoids edge case"
  - "cancel-subscription reads student's ls_subscription_id from DB via service role — student can only cancel their own subscription via auth.uid() from JWT"
  - "endsAt fallback to current_period_end from DB if LS DELETE response lacks ends_at field — prevents null return to client"
  - "verify_jwt = true added to config.toml for both new functions — Supabase auto-verifies JWT, manual auth.getUser() adds defense-in-depth check"
  - "fetchSubscriptionDetail makes two sequential queries (parent_subscriptions + subscription_plans) for simplicity over a JOIN — plan fetch is conditional on plan_id present"
  - "subscriptionService default export updated to include new functions — maintains backward compat for existing named imports"

patterns-established:
  - "Pattern: Auth-gated Edge Function — createClient(URL, ANON_KEY, {Authorization: header}) then auth.getUser() for defense-in-depth user verification"
  - "Pattern: CORS_HEADERS const + OPTIONS preflight handler at top of Deno.serve — consistent across all browser-callable Edge Functions"

requirements-completed: [PARENT-02, PARENT-04, PARENT-05]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 16 Plan 01: Server-Side Edge Functions and Service Layer Summary

**Deno Edge Functions for Lemon Squeezy checkout creation and subscription cancellation with plan_id mapping and service layer extensions for pricing and portal data**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T16:53:40Z
- **Completed:** 2026-03-01T16:57:08Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- `create-checkout` Edge Function creates a signed Lemon Squeezy overlay checkout URL server-side, embedding `student_id` in `checkout_data.custom` for webhook auto-linking, with `embed: true` for in-PWA overlay mode
- `cancel-subscription` Edge Function calls `DELETE /v1/subscriptions/:id` on the Lemon Squeezy API and returns `endsAt` for optimistic UI display before the webhook updates the DB
- `upsertSubscription.ts` now resolves the Phase 13 TODO: looks up `plan_id` from `subscription_plans` by `lemon_squeezy_variant_id` before upsert (falls back to null if variant not yet mapped)
- `subscriptionService.js` extended with `fetchSubscriptionPlans(currency)` for the pricing page and `fetchSubscriptionDetail(studentId)` for the parent portal

## Task Commits

Each task was committed atomically:

1. **Task 1: Create create-checkout and cancel-subscription Edge Functions** - `d996c7c` (feat)
2. **Task 2: Update upsertSubscription for plan_id mapping and extend subscriptionService** - `e703941` (feat)

**Plan metadata:** committed with SUMMARY.md (docs)

## Files Created/Modified
- `supabase/functions/create-checkout/index.ts` - Deno Edge Function: creates LS overlay checkout URL with auth verification and student_id embedding
- `supabase/functions/cancel-subscription/index.ts` - Deno Edge Function: cancels LS subscription, returns endsAt for optimistic UI
- `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` - Resolves plan_id: null TODO via subscription_plans lookup by lemon_squeezy_variant_id
- `src/services/subscriptionService.js` - Added fetchSubscriptionPlans(currency) and fetchSubscriptionDetail(studentId) named exports
- `supabase/functions/.env.example` - Documents LS_API_KEY and LS_STORE_ID with source URLs
- `supabase/config.toml` - Added verify_jwt = true config entries for create-checkout and cancel-subscription functions

## Decisions Made
- `create-checkout` uses service role client for plan lookup even though `subscription_plans_select_public` RLS allows public reads — consistent with webhook pattern, no edge cases
- `cancel-subscription` returns `endsAt` with a fallback to `current_period_end` from DB if LS DELETE response lacks the `ends_at` field — prevents null returned to client for optimistic UI
- Both Edge Functions verify `auth.uid()` via `createClient(URL, ANON_KEY, {Authorization: header}).auth.getUser()` even though `verify_jwt = true` already validates the JWT — defense-in-depth as specified in plan
- `fetchSubscriptionDetail` uses two sequential queries instead of a JOIN — simpler, plan_id may be null so plan fetch is conditional

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before Edge Functions can create real checkouts.**

Before end-to-end testing:
1. **Set `LS_API_KEY`** — Get from Lemon Squeezy Dashboard → API → API Keys. Set as Supabase Edge Function secret:
   ```bash
   supabase secrets set LS_API_KEY=your_ls_api_key_here
   ```
2. **Set `LS_STORE_ID`** — Get from Lemon Squeezy Dashboard → Settings → Stores. Set as secret:
   ```bash
   supabase secrets set LS_STORE_ID=your_ls_store_id_here
   ```
3. **Populate `lemon_squeezy_variant_id`** in `subscription_plans` table with real LS variant IDs:
   ```sql
   UPDATE subscription_plans SET lemon_squeezy_variant_id = '<monthly-ils-variant-id>' WHERE id = 'monthly-ils';
   UPDATE subscription_plans SET lemon_squeezy_variant_id = '<yearly-ils-variant-id>' WHERE id = 'yearly-ils';
   UPDATE subscription_plans SET lemon_squeezy_variant_id = '<monthly-usd-variant-id>' WHERE id = 'monthly-usd';
   UPDATE subscription_plans SET lemon_squeezy_variant_id = '<yearly-usd-variant-id>' WHERE id = 'yearly-usd';
   ```

## Next Phase Readiness
- Plan 02 (pricing page) can use `fetchSubscriptionPlans(currency)` to display plans and call `create-checkout` Edge Function via `supabase.functions.invoke('create-checkout', { body: { planId, studentId } })`
- Plan 03 (parent portal) can use `fetchSubscriptionDetail(studentId)` for status display and call `cancel-subscription` Edge Function to handle cancellation
- `has_active_subscription()` Postgres function already handles cancelled-with-access-remaining (PARENT-05 satisfied at DB layer)
- Lemon Squeezy variant IDs must be populated in `subscription_plans` before any real checkout can succeed

---
*Phase: 16-parent-facing-pages-and-checkout*
*Completed: 2026-03-01*
