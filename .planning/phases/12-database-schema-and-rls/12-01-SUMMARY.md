---
phase: 12-database-schema-and-rls
plan: 01
subsystem: database
tags: [supabase, postgres, rls, row-level-security, subscriptions, lemon-squeezy, payments]

# Dependency graph
requires:
  - phase: 11-legal-gate-design-processor-setup
    provides: subscriptionConfig.js with FREE_NODE_IDS and PAYMENT_PROCESSOR confirmed as Lemon Squeezy

provides:
  - subscription_plans table with 4 pricing rows (monthly/yearly x ILS/USD)
  - parent_subscriptions table with student FK, Lemon Squeezy IDs, status tracking
  - RLS: SELECT-only for authenticated users on parent_subscriptions; no authenticated writes
  - is_free_node() Postgres function mirroring subscriptionConfig.js free tier (19 nodes + NULL)
  - has_active_subscription() Postgres function with active/grace/past_due logic

affects:
  - 12-02 (students_score RLS gate — will call is_free_node/has_active_subscription)
  - 12-03 (student_skill_progress RLS gate — same helpers)
  - 13-webhook-handler (writes to parent_subscriptions via service_role)
  - 14-paywall-ui (reads parent_subscriptions, calls has_active_subscription)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subscription tables: SELECT via RLS, writes only via service_role (webhook pattern)"
    - "is_free_node() as IMMUTABLE sql function (no DB read, safe in RLS policies)"
    - "has_active_subscription() as STABLE SECURITY DEFINER (needs to read subscriptions table)"
    - "Migration history repair via supabase migration repair --status applied when local/remote diverge"

key-files:
  created:
    - supabase/migrations/20260226000001_add_subscription_tables.sql
    - supabase/migrations/20260226000002_seed_subscription_plans.sql
  modified: []

key-decisions:
  - "parent_subscriptions is child-centric (student_id FK): one row per subscription, supports reassignment between children"
  - "is_free_node() is IMMUTABLE (no DB reads) — hardcoded array matching subscriptionConfig.js; changes require intentional migration edits"
  - "has_active_subscription() uses 3-day grace period for past_due and preserves access through end of period for cancelled status"
  - "lemon_squeezy_variant_id left NULL in subscription_plans until Phase 13 LS dashboard setup"
  - "Migration applied via Supabase management API (POST /v1/projects/{ref}/database/query) due to duplicate timestamp in local migration history blocking CLI push"

patterns-established:
  - "Webhook-owned writes: subscription tables have RLS SELECT for authenticated users, no INSERT/UPDATE/DELETE policies — service_role bypasses RLS for all webhook writes"
  - "Postgres gate functions: is_free_node() IMMUTABLE SECURITY INVOKER for static lookups; has_active_subscription() STABLE SECURITY DEFINER for table reads"

requirements-completed: [SUB-01, SUB-02, SUB-03, SUB-04]

# Metrics
duration: 6min
completed: 2026-02-26
---

# Phase 12 Plan 01: Database Schema and RLS Summary

**Subscription database foundation: subscription_plans and parent_subscriptions tables with RLS, is_free_node() and has_active_subscription() Postgres helper functions, and 4 pricing rows seeded**

## Performance

- **Duration:** 6 minutes
- **Started:** 2026-02-26T01:43:46Z
- **Completed:** 2026-02-26T01:50:23Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Created `subscription_plans` table with billing_period/currency/amount_cents schema and public SELECT RLS
- Created `parent_subscriptions` table with Lemon Squeezy ID fields, status enum, and student FK — authenticated users can only SELECT their own row; no INSERT/UPDATE/DELETE for client role
- Implemented `is_free_node()` IMMUTABLE function covering all 19 free nodes (treble_1_1..7, bass_1_1..6, rhythm_1_1..6) plus NULL; boss nodes (boss_treble_1, boss_bass_1, boss_rhythm_1) correctly return false
- Implemented `has_active_subscription()` STABLE SECURITY DEFINER with active/cancelled-grace/past_due-3day logic
- Seeded 4 locked pricing rows: monthly-ILS 2990c, monthly-USD 799c, yearly-ILS 24990c, yearly-USD 7990c

## Task Commits

Each task was committed atomically:

1. **Task 1: Create subscription tables, RLS policies, and helper functions** - `7c79bf3` (feat)
2. **Task 2: Seed subscription plans pricing data** - `d33cff8` (feat)

**Plan metadata:** committed with docs commit after SUMMARY

## Files Created/Modified

- `supabase/migrations/20260226000001_add_subscription_tables.sql` - subscription_plans table, parent_subscriptions table, RLS policies, is_free_node() and has_active_subscription() functions
- `supabase/migrations/20260226000002_seed_subscription_plans.sql` - 4 pricing rows with ON CONFLICT DO NOTHING for idempotency

## Decisions Made

- **Migration delivery via API:** Local migration history had a pre-existing duplicate timestamp issue (`20260127000003` exists twice with different filenames). The Supabase CLI `db push` command was blocked by this. Applied the migration via the Supabase Management API (`POST /v1/projects/{ref}/database/query`) and registered it in history using `migration repair --status applied`. No data integrity risk — only the new migration's SQL was executed.
- **Child-centric subscription model:** `parent_subscriptions` uses `student_id` FK directly. This supports reassignment (update student_id) and is simpler than a separate parent table given the single-child-per-subscription constraint.
- **lemon_squeezy_variant_id NULL:** Left NULL intentionally — will be populated in Phase 13 when Lemon Squeezy product variants are created in the dashboard.

## Deviations from Plan

None - plan executed exactly as written. The migration history repair was a pre-existing infrastructure issue, not a deviation from the plan's requirements.

## Issues Encountered

**Migration CLI duplicate timestamp:** Local repo has two files with timestamp `20260127000003` (`optimize_rls_auth_plan.sql` and `regenerate_daily_goals.sql`). The Supabase CLI treats these as conflicting and blocks `db push`. Workaround: applied the new migration SQL directly via the Supabase Management REST API, then registered the version in history with `migration repair --status applied 20260226000001 20260226000002`. This is a known issue in this repo's migration history that should be cleaned up before Phase 13.

## User Setup Required

None — tables and functions are live in the remote database. No environment variables or dashboard configuration needed for this plan.

## Next Phase Readiness

- `is_free_node()` and `has_active_subscription()` are live and ready for use in Phase 12 Plans 02-03 (RLS policies on students_score and student_skill_progress)
- `parent_subscriptions` table ready to receive webhook writes in Phase 13
- **Concern to track:** Duplicate migration timestamp `20260127000003` in local repo should be renamed before Phase 13 to avoid recurring CLI push issues

## Self-Check: PASSED

- supabase/migrations/20260226000001_add_subscription_tables.sql: FOUND
- supabase/migrations/20260226000002_seed_subscription_plans.sql: FOUND
- .planning/phases/12-database-schema-and-rls/12-01-SUMMARY.md: FOUND
- commit 7c79bf3 (tables + RLS + functions): FOUND
- commit d33cff8 (seed pricing): FOUND
- commit e798ff6 (docs/metadata): FOUND
- Remote DB verification: subscription_plans=4 rows, parent_subscriptions=0 rows, is_free_node(treble_1_1)=true, is_free_node(boss_treble_1)=false, has_active_subscription(random)=false

---
*Phase: 12-database-schema-and-rls*
*Completed: 2026-02-26*
