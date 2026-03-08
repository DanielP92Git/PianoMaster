# Phase 12: Database Schema and RLS - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the subscription database foundation: tables (`parent_subscriptions`, `subscription_plans`), RLS policies restricting client to SELECT-only (webhook service role owns all writes), seed pricing data for both currencies, and enforce the content gate at the database layer so bypassing React's `isPremium` check cannot save scores on premium nodes.

Requirements covered: SUB-01, SUB-02, SUB-03 (already done in Phase 11), SUB-04, GATE-03.

</domain>

<decisions>
## Implementation Decisions

### Pricing Amounts
- Monthly ILS: 29.90 ILS
- Monthly USD: $7.99
- Yearly ILS: 249.90 ILS (2 months free, ~17% discount)
- Yearly USD: $79.90 (2 months free, ~17% discount)
- No free trial period — the free tier (19 nodes) serves as the trial
- Four rows seeded into `subscription_plans`: monthly-ILS, monthly-USD, yearly-ILS, yearly-USD

### Parent-Student Linking
- One subscription = one child (family plans deferred to future milestone)
- Parent must specify which child when they have multiple children on different accounts
- Subscriptions are reassignable — a parent can move a subscription from one child to another via a settings page
- Schema design: Claude's discretion on whether to use parent-centric (subscription -> parent_email with student_id FK) or child-centric approach, but must support reassignment and the multi-child use case where a parent has several children with separate accounts

### Subscription Lifecycle
- 3-day grace period on failed payments — child keeps premium access while Lemon Squeezy retries
- Cancellation preserves access until billing period ends (no immediate revocation)
- Resubscribing preserves all previous progress — stars and scores on premium nodes are never wiped
- Current state only — no separate events/history table. One row per subscription with current status.
- Status values: Claude's discretion on exact enum values, but must cover active, cancelled (with end-of-period access), and past_due (grace period) states

### Score Blocking Behavior
- Silent reject via RLS — INSERT fails at database level if a free-tier student attempts to save a score on a premium node
- Gate applies to BOTH `students_score` AND `student_skill_progress` tables — complete defense in depth
- Existing progress preserved — legacy data from pre-monetization era stays intact. RLS only blocks NEW writes.
- Free users CAN read their old premium node progress (old stars visible, motivates upgrading) but CANNOT write new scores
- RLS source for determining premium vs free: Claude's discretion on whether to use a Postgres function with hardcoded IDs or a lookup table

### Claude's Discretion
- Schema design for parent-student linking (parent-centric vs child-centric, as long as reassignment works)
- Exact subscription status enum values
- RLS implementation approach for free node determination (hardcoded Postgres function vs lookup table)
- Column types, constraints, and index design
- Migration file structure and naming
- Whether `subscription_plans` is a reference table with RLS or an unprotected seed table

</decisions>

<specifics>
## Specific Ideas

- Boss nodes at end of Unit 1 are the paywall tease (decided in Phase 11) — the RLS gate must treat boss_treble_1, boss_bass_1, boss_rhythm_1 as premium
- The `isFreeNode()` function already exists client-side in `src/config/subscriptionConfig.js` — the database layer needs an equivalent check
- Lemon Squeezy is the payment processor (confirmed in Phase 11) — schema should store Lemon Squeezy subscription IDs for webhook correlation
- "Can read, can't write" for premium nodes means the SELECT RLS policy stays open on progress tables, but INSERT/UPDATE policies check subscription status

</specifics>

<deferred>
## Deferred Ideas

- Family plan (one subscription = all children) — future milestone (EXT-03 in REQUIREMENTS.md)
- Subscription history/events log — add if analytics needs arise
- Trial period support — reconsider based on conversion data post-launch

</deferred>

---

*Phase: 12-database-schema-and-rls*
*Context gathered: 2026-02-26*
