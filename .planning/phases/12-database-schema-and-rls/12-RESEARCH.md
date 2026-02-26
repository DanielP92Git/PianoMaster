# Phase 12: Database Schema and RLS - Research

**Researched:** 2026-02-26
**Domain:** Supabase PostgreSQL — subscription schema design, Row Level Security, seed data, content gate enforcement
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Pricing amounts:** Monthly ILS 29.90, Monthly USD $7.99, Yearly ILS 249.90, Yearly USD $79.90 (2 months free, ~17% discount). No free trial — 19 free nodes are the trial.
- **Four rows** seeded into `subscription_plans`: monthly-ILS, monthly-USD, yearly-ILS, yearly-USD.
- **Payment processor:** Lemon Squeezy (confirmed Phase 11). Store Lemon Squeezy subscription IDs for webhook correlation.
- **One subscription = one child.** Family plans deferred to EXT-03.
- **Subscriptions are reassignable** — parent can move subscription from one child to another via a settings page.
- **Grace period:** 3-day grace on failed payments. Cancellation preserves access until billing period ends.
- **Current state only** — one row per subscription, no events/history table.
- **Score blocking behavior:** Silent reject via RLS on both `students_score` AND `student_skill_progress` INSERT/UPDATE.
- **Existing progress preserved** — legacy data untouched. RLS only blocks new writes on premium nodes.
- **Free users can READ old premium progress** (cannot write new scores).
- **Boss nodes at end of Unit 1** (boss_treble_1, boss_bass_1, boss_rhythm_1) are paywalled — same IDs already in `subscriptionConfig.js`.
- **`isFreeNode()` already exists** client-side in `src/config/subscriptionConfig.js` — database needs an equivalent check.

### Claude's Discretion

- Schema design for parent-student linking (parent-centric vs child-centric, as long as reassignment works).
- Exact subscription status enum values.
- RLS implementation approach for free node determination (hardcoded Postgres function vs lookup table).
- Column types, constraints, and index design.
- Migration file structure and naming.
- Whether `subscription_plans` is a reference table with RLS or an unprotected seed table.

### Deferred Ideas (OUT OF SCOPE)

- Family plan (one subscription = all children) — EXT-03.
- Subscription history/events log.
- Trial period support.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SUB-01 | Subscription database table exists with RLS restricting client to SELECT-only | Service-role bypass pattern confirmed from existing DB policies; `parent_subscriptions` table with no INSERT/UPDATE/DELETE for `authenticated` role |
| SUB-02 | Subscription plans table seeded with monthly and yearly prices in ILS and USD | Seed-in-migration pattern used throughout codebase; four rows determined by locked pricing decisions |
| SUB-03 | Free tier boundary defined in a single config file (Unit 1 per path = free) | `src/config/subscriptionConfig.js` already exists with `isFreeNode()` and all free node IDs — this requirement is ALREADY MET by Phase 11 Plan 01 |
| SUB-04 | Subscription writes restricted to webhook Edge Function via service role key | Service role key bypass via `auth.role() = 'service_role'` pattern verified in 12 existing policies on this DB |
| GATE-03 | Content gate enforced at database RLS layer, not only client-side React checks | RLS INSERT/UPDATE policies on `students_score` and `student_skill_progress` can call a `is_free_node(node_id)` Postgres function |
</phase_requirements>

---

## Summary

Phase 12 builds the subscription database foundation: two new tables (`parent_subscriptions` and `subscription_plans`), a database-equivalent of the client-side `isFreeNode()` check, and modified INSERT/UPDATE RLS policies on `students_score` and `student_skill_progress` that enforce the content gate at the database layer.

The codebase already has a well-established pattern for service-role-only write tables. The `parental_consent_tokens` table (Phase 11's COPPA work) uses the identical pattern: RLS enabled, SELECT policy for students, zero INSERT/UPDATE/DELETE policies for authenticated users — all writes go through SECURITY DEFINER functions or the webhook service role key. This is the exact blueprint for `parent_subscriptions`.

The most delicate task in this phase is modifying the existing INSERT/UPDATE policies on `students_score` and `student_skill_progress` without breaking legitimate free-tier saves. The key insight: the RLS check needs to allow all writes for (a) free nodes, (b) users with an active subscription, and (c) the service role. The database check for free nodes is best implemented as a stable Postgres function `is_free_node(text)` that mirrors the 19 IDs already hardcoded in `subscriptionConfig.js`.

**Primary recommendation:** Use a hardcoded `is_free_node(node_id TEXT)` Postgres function (not a lookup table) so the free node boundary is enforced atomically with the RLS check — no join, no subquery, no risk of a missing row opening the gate. Pair this with a `has_active_subscription(student_id UUID)` helper that looks up `parent_subscriptions`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Postgres | 15+ (managed) | All schema/RLS work lives here | Existing database |
| Supabase Migrations | CLI via `supabase/migrations/` | DDL versioning | All 85+ migrations already use this pattern |
| `mcp__supabase__apply_migration` | MCP tool | Apply new migrations | Established project workflow |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pg_policies` view | built-in | Verify RLS policies after migration | Always after creating/modifying policies |
| `information_schema.tables` | built-in | Verify tables exist post-migration | After CREATE TABLE migrations |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded `is_free_node()` function | `subscription_free_nodes` lookup table | Table requires JOIN in every RLS check; adds latency and complexity; function is simpler and the boundary is intentionally static |
| Single migration file | Split into 3 migrations (tables, seed, RLS changes) | Split gives finer-grained rollback but adds overhead; one cohesive migration per logical unit is sufficient |

---

## Architecture Patterns

### Recommended Project Structure

```
supabase/migrations/
├── 20260226000001_add_subscription_tables.sql   # parent_subscriptions + subscription_plans tables + RLS
├── 20260226000002_seed_subscription_plans.sql   # INSERT four pricing rows
└── 20260226000003_add_content_gate_rls.sql      # Modify students_score + student_skill_progress INSERT/UPDATE policies
src/config/
└── subscriptionConfig.js   # Already exists — isFreeNode() already implemented (SUB-03 DONE)
```

### Pattern 1: Service-Role-Only Write Table (SUB-01, SUB-04)

**What:** Table with RLS enabled, SELECT policy for the owning user, NO INSERT/UPDATE/DELETE policies for `authenticated`. The webhook Edge Function uses the service role key which bypasses RLS entirely.

**When to use:** Any table where writes must ONLY originate from trusted server-side code.

**Established project precedent** (from `parental_consent_tokens`):
```sql
-- Enable RLS
ALTER TABLE parent_subscriptions ENABLE ROW LEVEL SECURITY;

-- Students can read their own subscription status (for isPremium check)
CREATE POLICY "parent_subscriptions_select_student"
  ON parent_subscriptions
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- NO INSERT/UPDATE/DELETE policies for authenticated role
-- Webhook uses service_role key → bypasses RLS entirely
-- Client calling supabase.from('parent_subscriptions').insert() will get RLS violation
```

**How service_role bypass works:** When the Supabase client is initialized with the `service_role` key (in the webhook Edge Function), `auth.role()` returns `'service_role'`. All RLS policies are bypassed for this role. The anon/authenticated client key cannot impersonate this — it is enforced at the JWT verification layer.

**Verification:** The existing `students_score` policy confirms the pattern works:
```sql
-- Already in DB: students_score "Consolidated scores access"
qual: "(student_id = (SELECT auth.uid())) OR (auth.role() = 'service_role')"
```
But for `parent_subscriptions`, we want NO auth write at all — just SELECT for the owning student, service_role handles everything else.

### Pattern 2: Subscription Plans Reference Table (SUB-02)

**What:** Static read-only pricing reference table. All users SELECT, no one inserts via client.

**Two approaches considered:**

Option A — Unprotected (no RLS): simpler, fine for a read-only reference table with no PII.
Option B — RLS with public SELECT: matches project convention for all tables to have explicit RLS.

**Recommendation:** Option B — enable RLS and add a public SELECT policy. Consistent with how `games` and `accessories` tables work. Schema has no PII so a permissive SELECT is safe.

```sql
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,               -- e.g., 'monthly-ils', 'yearly-usd'
  name TEXT NOT NULL,
  billing_period TEXT NOT NULL,      -- 'monthly' | 'yearly'
  currency TEXT NOT NULL,            -- 'ILS' | 'USD'
  amount_cents INTEGER NOT NULL,     -- Store as cents to avoid float math
  lemon_squeezy_variant_id TEXT,     -- Populated when LS variant created
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select_all"
  ON subscription_plans FOR SELECT
  USING (true);  -- Public reference data, no PII
```

**Seed data pattern** (match existing migration style):
```sql
INSERT INTO subscription_plans (id, name, billing_period, currency, amount_cents, is_active)
VALUES
  ('monthly-ils', 'Monthly (ILS)', 'monthly', 'ILS', 2990,  true),
  ('monthly-usd', 'Monthly (USD)', 'monthly', 'USD',  799,  true),
  ('yearly-ils',  'Yearly (ILS)',  'yearly',  'ILS', 24990, true),
  ('yearly-usd',  'Yearly (USD)',  'yearly',  'USD',  7990, true)
ON CONFLICT (id) DO NOTHING;   -- Idempotent: safe to re-run
```

### Pattern 3: Parent Subscriptions Schema Design

**What:** Child-centric design — subscription row references `student_id` (FK to `students.id`). `parent_email` is stored as a denormalized field for webhook correlation (matches the pattern already in the `students` table).

**Why child-centric:** The app's COPPA model stores `parent_email` on the `students` row. The subscription check is always "does this student have an active subscription?" A child-centric design makes the lookup a simple equality check with no join.

**Reassignment support:** Moving a subscription from one child to another is an UPDATE on `student_id` in `parent_subscriptions`. This is restricted to service_role only (webhook handles reassignment) or a future parent-auth flow.

```sql
CREATE TABLE parent_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Child being subscribed to
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Lemon Squeezy IDs for webhook correlation
  ls_subscription_id TEXT NOT NULL UNIQUE,    -- e.g., 'sub_123456'
  ls_customer_id TEXT,                        -- for customer portal links
  ls_variant_id TEXT,                         -- which plan variant

  -- Plan reference
  plan_id TEXT REFERENCES subscription_plans(id),

  -- Current state
  status TEXT NOT NULL,
  -- Values: 'active' | 'cancelled' | 'past_due' | 'expired' | 'paused' | 'on_trial'

  -- Billing dates
  current_period_end TIMESTAMPTZ,            -- Determines access expiry on cancellation

  -- Parent contact (denormalized for display, not for auth)
  parent_email TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one active subscription per student
-- (webhook upserts on ls_subscription_id conflict)
CREATE UNIQUE INDEX idx_parent_subscriptions_ls_id
  ON parent_subscriptions(ls_subscription_id);

CREATE INDEX idx_parent_subscriptions_student
  ON parent_subscriptions(student_id);

CREATE INDEX idx_parent_subscriptions_status
  ON parent_subscriptions(status, current_period_end);
```

### Pattern 4: has_active_subscription() Helper Function

**What:** Stable Postgres function used in RLS policies. Returns true if the student has a subscription granting current access.

**Access rules from CONTEXT.md:**
- `active` → full access
- `cancelled` → access until `current_period_end` (no immediate revocation)
- `past_due` → 3-day grace period (access while Lemon Squeezy retries)
- `expired`, `paused` → no access

```sql
CREATE OR REPLACE FUNCTION has_active_subscription(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM parent_subscriptions
    WHERE student_id = p_student_id
      AND (
        -- Active subscription
        status = 'active'
        OR
        -- Cancelled but within billing period (preserve until period ends)
        (status = 'cancelled' AND current_period_end > NOW())
        OR
        -- Past due — 3-day grace period
        (status = 'past_due' AND current_period_end > NOW() - INTERVAL '3 days')
      )
  );
$$;
```

### Pattern 5: is_free_node() Database Function

**What:** Postgres function that mirrors the client-side `isFreeNode()` in `subscriptionConfig.js`. Used in RLS WITH CHECK clauses.

**Recommendation: Hardcoded array** (not a lookup table). The free node boundary is intentionally static — changing it must be a deliberate code edit. This matches the client-side pattern exactly and requires no JOIN in RLS evaluation.

```sql
CREATE OR REPLACE FUNCTION is_free_node(p_node_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE  -- Pure function, same input = same output, enables query plan caching
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p_node_id = ANY(ARRAY[
    -- Treble Unit 1 (7 nodes)
    'treble_1_1', 'treble_1_2', 'treble_1_3', 'treble_1_4',
    'treble_1_5', 'treble_1_6', 'treble_1_7',
    -- Bass Unit 1 (6 nodes)
    'bass_1_1', 'bass_1_2', 'bass_1_3', 'bass_1_4',
    'bass_1_5', 'bass_1_6',
    -- Rhythm Unit 1 (6 nodes)
    'rhythm_1_1', 'rhythm_1_2', 'rhythm_1_3', 'rhythm_1_4',
    'rhythm_1_5', 'rhythm_1_6'
  ]);
$$;
```

**Why IMMUTABLE:** The function always returns the same value for the same input. Postgres can cache and inline it in query plans, making the RLS check very fast (no table scan).

**Why SECURITY INVOKER (not DEFINER):** It only reads hardcoded values, not any tables. No privilege escalation possible. Simpler and safer.

### Pattern 6: Content Gate RLS on students_score (GATE-03)

**What:** Modify INSERT/UPDATE policies on `students_score` and `student_skill_progress` to reject writes on premium nodes by non-subscribers.

**Current INSERT policy on `student_skill_progress`:**
```sql
-- Existing: student_skill_progress_insert_own
WITH CHECK: (student_id = (SELECT auth.uid()))
```

**New INSERT policy** (replaces the existing one):
```sql
-- Policy allows INSERT if EITHER:
-- (a) node is a free node — no subscription check needed
-- (b) student has an active subscription
-- (c) node_id is NULL — scores without a node_id are always free (non-trail games)
CREATE POLICY "student_skill_progress_insert_gate"
  ON student_skill_progress
  FOR INSERT
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND (
      is_free_node(node_id)
      OR has_active_subscription(auth.uid())
    )
  );
```

**UPDATE policy** (replaces existing `student_skill_progress_update_own`):
```sql
CREATE POLICY "student_skill_progress_update_gate"
  ON student_skill_progress
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND (
      is_free_node(node_id)
      OR has_active_subscription(auth.uid())
    )
  );
```

**For `students_score`:** The existing "Consolidated scores access" policy is an ALL policy using USING clause. ALL policies don't have a WITH CHECK separate from USING for the non-SELECT commands — we need to either replace it with separate per-command policies OR use a workaround.

**Recommended approach:** Keep the existing ALL policy for SELECT, DELETE (they're fine). Add a separate INSERT-specific policy and UPDATE-specific policy. Since multiple PERMISSIVE policies are ORed together by Postgres, we need to DROP the overly permissive ALL policy and replace with fine-grained per-command policies.

**Critical observation from DB audit:** `students_score` currently lacks a `node_id` column. The existing `updateStudentScore()` in `apiScores.js` does NOT pass `node_id` into the INSERT row (only `student_id`, `score`, `game_type`). The `nodeId` parameter is only used for rate-limiting. For GATE-03 to work on `students_score`, we need to either:
1. Add a `node_id` column to `students_score` and update the INSERT in `apiScores.js`, OR
2. Gate ONLY on `student_skill_progress` (which already has `node_id`), and accept that `students_score` does not carry node context

**Recommendation:** Add `node_id` column (nullable, TEXT) to `students_score`. Update `apiScores.js` to pass `nodeId` into the INSERT when it is available. This is needed for the RLS check to work at the DB level. Without this, the database cannot determine which node the score belongs to.

### Anti-Patterns to Avoid

- **Using `user_metadata` for subscription checks:** Never check JWT `user_metadata` for subscription status — users can modify their own metadata via `supabase.auth.updateUser()`. Always check `parent_subscriptions` table.
- **Caching subscription status aggressively:** The client layer (Phase 14 — SubscriptionContext) must use `staleTime: 0` for subscription queries. RLS at the DB level is the ground truth but client should reflect it promptly.
- **Forgetting the service_role bypass check:** When verifying RLS blocks client writes, test with an authenticated user JWT — NOT with the service_role key. The webhook deliberately bypasses RLS.
- **Re-running seed data without ON CONFLICT:** Without `ON CONFLICT DO NOTHING`, re-running the migration would duplicate pricing rows.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service role bypass | Custom auth check column | `auth.role() = 'service_role'` in RLS USING | Built into Supabase, verified in 12 existing DB policies |
| Subscription status check | Custom JWT decode | DB function querying `parent_subscriptions` directly | JWT can be manipulated; DB is ground truth |
| Atomic upsert on webhook retry | Manual check-then-insert | `INSERT ... ON CONFLICT (ls_subscription_id) DO UPDATE` | Idempotent by design for duplicate webhooks |

**Key insight:** The service-role-only write pattern is native to Supabase. No custom middleware, no Edge Function wrapping for reads, no JWT inspection on the client. The webhook Edge Function (Phase 13) uses the `SUPABASE_SERVICE_ROLE_KEY` env var which bypasses all RLS policies.

---

## Common Pitfalls

### Pitfall 1: students_score Missing node_id Column

**What goes wrong:** GATE-03 requires blocking premium-node scores at the DB level. `students_score` has no `node_id` column today — the `nodeId` in `updateStudentScore()` is only used for rate limiting, not stored in the row.

**Why it happens:** The score table predates the trail system. Node tracking was added to `student_skill_progress` but not backfilled to `students_score`.

**How to avoid:** Add `node_id TEXT` (nullable) to `students_score` in the migration. Update `apiScores.js` to pass `nodeId` into the INSERT. The RLS WITH CHECK should treat NULL node_id as free (non-trail games that don't reference nodes should never be blocked).

**Warning signs:** If a student bypasses React and saves a score with a null node_id, it should succeed. If all score INSERTs start failing, the gate is blocking non-trail games — `is_free_node(NULL)` must return true.

### Pitfall 2: Replacing ALL Policy With Gate Breaks Teacher Access

**What goes wrong:** `students_score` has a "Teachers can view connected students scores" SELECT policy AND a "Consolidated scores access" ALL policy. If we drop the ALL policy and add a gated INSERT policy, teacher SELECTs still work (covered by the separate SELECT policy). But the ALL policy also covered service_role writes — verify the new INSERT policy includes service_role OR that there are no webhook writes to `students_score`.

**How to avoid:** After policy surgery, run `SELECT` from a teacher account, `INSERT` from a student account on a free node, and verify `INSERT` on a premium node fails for free-tier students.

### Pitfall 3: has_active_subscription() Called on Every Row in Table Scans

**What goes wrong:** If `has_active_subscription()` is not declared STABLE and Postgres inlines it poorly, it could execute a subquery for every row being evaluated during a table scan.

**How to avoid:** Mark the function STABLE. Use `(SELECT auth.uid())` pattern (already standard in this codebase) rather than bare `auth.uid()` to ensure it's evaluated once per query, not per row.

### Pitfall 4: Grace Period Logic Time Direction

**What goes wrong:** The 3-day grace period means access continues for 3 days AFTER the renewal failed. `current_period_end` is the renewal date. A `past_due` subscription should have `current_period_end > NOW() - INTERVAL '3 days'` (the period end was recent enough that 3 days haven't elapsed since it was due).

**How to avoid:** Verify: `past_due` subscription with `current_period_end = NOW() - 2 days` → has_active_subscription returns TRUE. `past_due` with `current_period_end = NOW() - 4 days` → returns FALSE.

### Pitfall 5: Seed Migration Runs Twice in CI

**What goes wrong:** If the seed migration is part of the normal migration chain and CI runs migrations on a fresh DB each time, pricing rows are inserted, then the migration is marked complete. No issue. But if someone runs the migration manually against production a second time, duplicates are inserted.

**How to avoid:** Always use `ON CONFLICT (id) DO NOTHING` or `ON CONFLICT (id) DO UPDATE` in seed INSERTs.

---

## Code Examples

### Full parent_subscriptions table + RLS migration

```sql
-- Source: project pattern from 20260201000001_coppa_schema.sql + CONTEXT.md decisions

-- 1. Create subscription_plans reference table
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  currency TEXT NOT NULL CHECK (currency IN ('ILS', 'USD')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  lemon_squeezy_variant_id TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_public_read"
  ON subscription_plans FOR SELECT USING (true);

-- 2. Create parent_subscriptions table
CREATE TABLE parent_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  ls_subscription_id TEXT NOT NULL UNIQUE,
  ls_customer_id TEXT,
  ls_variant_id TEXT,
  plan_id TEXT REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN (
    'on_trial', 'active', 'paused', 'past_due', 'unpaid', 'cancelled', 'expired'
  )),
  current_period_end TIMESTAMPTZ,
  parent_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parent_subscriptions_student ON parent_subscriptions(student_id);
CREATE INDEX idx_parent_subscriptions_status ON parent_subscriptions(status, current_period_end);

ALTER TABLE parent_subscriptions ENABLE ROW LEVEL SECURITY;

-- Students can read their own subscription (for isPremium check in Phase 14)
CREATE POLICY "parent_subscriptions_select_student"
  ON parent_subscriptions FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Service role (webhook) handles all writes — no client INSERT/UPDATE/DELETE policies
```

### Seed migration

```sql
-- Source: pricing from CONTEXT.md decisions, pattern from existing migrations
INSERT INTO subscription_plans (id, name, billing_period, currency, amount_cents)
VALUES
  ('monthly-ils', 'Monthly',  'monthly', 'ILS', 2990),
  ('monthly-usd', 'Monthly',  'monthly', 'USD',  799),
  ('yearly-ils',  'Yearly',   'yearly',  'ILS', 24990),
  ('yearly-usd',  'Yearly',   'yearly',  'USD',  7990)
ON CONFLICT (id) DO NOTHING;
```

### is_free_node() function

```sql
CREATE OR REPLACE FUNCTION is_free_node(p_node_id TEXT)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p_node_id = ANY(ARRAY[
    'treble_1_1','treble_1_2','treble_1_3','treble_1_4','treble_1_5','treble_1_6','treble_1_7',
    'bass_1_1','bass_1_2','bass_1_3','bass_1_4','bass_1_5','bass_1_6',
    'rhythm_1_1','rhythm_1_2','rhythm_1_3','rhythm_1_4','rhythm_1_5','rhythm_1_6'
  ]) OR p_node_id IS NULL;  -- NULL = non-trail game, always free
$$;
```

### Modified student_skill_progress INSERT policy

```sql
-- Drop old permissive policy
DROP POLICY IF EXISTS "student_skill_progress_insert_own" ON student_skill_progress;

-- Create gated policy
CREATE POLICY "student_skill_progress_insert_gate"
  ON student_skill_progress FOR INSERT
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND (
      is_free_node(node_id)
      OR has_active_subscription((SELECT auth.uid()))
    )
  );
```

### Add node_id to students_score (required for GATE-03)

```sql
-- Add nullable node_id to students_score
ALTER TABLE students_score ADD COLUMN IF NOT EXISTS node_id TEXT;

-- Index for potential future queries by node
CREATE INDEX IF NOT EXISTS idx_students_score_node_id
  ON students_score(node_id) WHERE node_id IS NOT NULL;

-- Rebuild INSERT policy with gate
DROP POLICY IF EXISTS "Consolidated scores access" ON students_score;

-- SELECT for own rows and teacher-connected students
CREATE POLICY "students_score_select"
  ON students_score FOR SELECT
  USING (
    student_id = (SELECT auth.uid())
    OR (SELECT auth.role()) = 'service_role'
    OR (SELECT auth.uid()) IN (
      SELECT teacher_id FROM teacher_student_connections
      WHERE student_id = students_score.student_id
        AND status = 'accepted'
    )
  );

-- INSERT with content gate
CREATE POLICY "students_score_insert_gate"
  ON students_score FOR INSERT
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND (
      is_free_node(node_id)
      OR has_active_subscription((SELECT auth.uid()))
    )
  );

-- DELETE stays permissive for own rows
CREATE POLICY "students_score_delete"
  ON students_score FOR DELETE
  USING (student_id = (SELECT auth.uid()));
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth.jwt() -> 'user_metadata' ->> 'role'` for role checks | DB table queries (`EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid())`) | Phase 09 security audit (Jan 2026) | Prevents metadata manipulation; DB is canonical |
| Generic ALL policies | Per-command (SELECT/INSERT/UPDATE/DELETE) policies | Phase 09 | Better least-privilege, avoids unintended write access |
| auth.uid() called inline per row | `(SELECT auth.uid())` subquery pattern | Phase 09 RLS optimization | Called once per query not per row — avoids N+1 RLS overhead |

**Deprecated/outdated:**
- `auth.jwt() -> 'user_metadata'` in RLS: Never use. This codebase removed it in the security hardening migration.
- Bare `auth.uid()` (without SELECT subquery): Deprecated in this project per migration `20260128000001_consolidate_rls_policies.sql`.

---

## Open Questions

1. **parent_email on parent_subscriptions vs students table**
   - What we know: `students.parent_email` exists. `parent_subscriptions` could denormalize `parent_email` or just reference it from `students`.
   - What's unclear: Will the parent email in the subscription ever differ from the one on the student record (e.g., grandparent pays, parent is on the student record)?
   - Recommendation: Denormalize `parent_email` on `parent_subscriptions` for auditing purposes. This is the email Lemon Squeezy used for the purchase — it may differ from the consent email.

2. **ls_variant_id vs plan_id alignment**
   - What we know: `subscription_plans.lemon_squeezy_variant_id` will be populated when the LS store is configured. At migration time, it may be NULL.
   - What's unclear: Should `parent_subscriptions.ls_variant_id` be a FK to `subscription_plans.lemon_squeezy_variant_id` or just a TEXT field?
   - Recommendation: Keep as plain TEXT. The FK-to-variant relationship is set up in Phase 13 when the LS variants are created and their IDs are known.

3. **SUB-03 status: is it already done?**
   - What we know: `src/config/subscriptionConfig.js` exists with `isFreeNode()` and all IDs. REQUIREMENTS.md maps SUB-03 to Phase 12. CONTEXT.md notes "already exists client-side."
   - Recommendation: The Planner should mark SUB-03 as satisfied by Phase 11 Plan 01 work already committed. The Phase 12 task for SUB-03 should be creating the DATABASE-layer `is_free_node()` Postgres function, which is new work distinct from the existing JS function.

---

## Sources

### Primary (HIGH confidence)

- DB introspection via `mcp__supabase__list_tables` — confirmed `parent_subscriptions` and `subscription_plans` do NOT yet exist
- DB introspection via `pg_policies` — confirmed 12 existing policies use `auth.role() = 'service_role'` pattern; verified `student_skill_progress` and `students_score` current INSERT/UPDATE policies
- `supabase/migrations/20260201000001_coppa_schema.sql` — confirmed no-write-policy pattern on `parental_consent_tokens` (direct blueprint for `parent_subscriptions`)
- `supabase/migrations/20260124000001_add_skill_trail_system.sql` — confirmed standard migration structure used in project
- `src/config/subscriptionConfig.js` — confirmed `isFreeNode()`, `FREE_NODE_IDS` Set, and all 19 free node IDs already exist; confirmed `PAYMENT_PROCESSOR` set to Lemon Squeezy
- `src/services/apiScores.js` — confirmed `students_score` INSERT does NOT include `node_id` in the row; `nodeId` param used only for rate limiting

### Secondary (MEDIUM confidence)

- Lemon Squeezy subscription status values (`on_trial`, `active`, `paused`, `past_due`, `unpaid`, `cancelled`, `expired`) — from official LS API docs at `docs.lemonsqueezy.com/api/subscriptions`
- Lemon Squeezy webhook event types — from official LS docs at `docs.lemonsqueezy.com/help/webhooks/event-types`

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing Supabase project, all patterns verified in live DB
- Architecture: HIGH — all key patterns (`service_role` bypass, `auth.uid()` subquery, IMMUTABLE functions) verified in existing migrations
- Pitfalls: HIGH for items verified in code (missing `node_id` column confirmed by reading `apiScores.js`); MEDIUM for edge cases in grace period logic (not verified against production behavior)

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable domain — Supabase RLS and Lemon Squeezy subscription model are stable APIs)
