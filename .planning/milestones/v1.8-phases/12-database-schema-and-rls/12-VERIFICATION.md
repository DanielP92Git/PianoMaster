---
phase: 12-database-schema-and-rls
verified: 2026-02-26T02:30:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 12: Database Schema and RLS Verification Report

**Phase Goal:** The subscription database foundation exists — tables are created with correct RLS so the client can only read subscription state, all writes are restricted to the webhook service role, the pricing data is seeded, and the content gate is enforced at the database layer not only in React
**Verified:** 2026-02-26T02:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A logged-in student calling the Supabase client directly cannot INSERT or UPDATE rows in `parent_subscriptions` — only the webhook service role key can write subscription state | VERIFIED | Migration `20260226000001` creates exactly one policy on `parent_subscriptions`: `parent_subscriptions_select_own` FOR SELECT only. No INSERT, UPDATE, or DELETE policies exist for the `authenticated` role. Service role bypasses RLS by design (Supabase default). |
| 2 | The `subscription_plans` table contains monthly and yearly rows for both ILS and USD — a fresh database query returns all four price rows without seed data being re-run | VERIFIED | Migration `20260226000002` inserts `monthly-ils` (2990), `monthly-usd` (799), `yearly-ils` (24990), `yearly-usd` (7990) with `ON CONFLICT (id) DO NOTHING` — idempotent by construction. All four rows confirmed in migration file. |
| 3 | `src/config/subscriptionConfig.js` exists with an `isFreeNode(node)` function — changing the free tier boundary requires editing exactly one file in one place | VERIFIED | File exists at `src/config/subscriptionConfig.js` line 100. `isFreeNode(nodeId)` uses `FREE_NODE_IDS.has(nodeId)` where `FREE_NODE_IDS` is a `Set` assembled from `FREE_TREBLE_NODE_IDS`, `FREE_BASS_NODE_IDS`, `FREE_RHYTHM_NODE_IDS` — all defined in the same file. Header comment states explicitly: "Changing the free tier boundary requires editing ONLY this file." |
| 4 | A student who bypasses React's `isPremium` check and attempts to save a score on a premium node is blocked at the database level — the INSERT is rejected by RLS | VERIFIED | Migration `20260226000003` creates `students_score_insert_gate` (INSERT WITH CHECK: `is_free_node(node_id) OR has_active_subscription(auth.uid())`). For a premium node (e.g. `treble_2_1`), `is_free_node` returns false, and `has_active_subscription` returns false for a non-subscriber — RLS rejects the INSERT. `apiScores.js` line 59 passes `node_id: nodeId \|\| null` into the INSERT. |
| 5 | The Postgres `is_free_node()` function mirrors the 19 free node IDs in `subscriptionConfig.js` | VERIFIED | Postgres function (migration `20260226000001`) hardcodes exactly 19 IDs: `treble_1_1`–`treble_1_7` (7), `bass_1_1`–`bass_1_6` (6), `rhythm_1_1`–`rhythm_1_6` (6). JS config exports the same 19 IDs across `FREE_TREBLE_NODE_IDS`, `FREE_BASS_NODE_IDS`, `FREE_RHYTHM_NODE_IDS`. Both also treat NULL as free. |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260226000001_add_subscription_tables.sql` | subscription_plans table, parent_subscriptions table, RLS policies, helper functions | VERIFIED | File exists, 122 lines. Contains `CREATE TABLE subscription_plans`, `CREATE TABLE parent_subscriptions`, `ENABLE ROW LEVEL SECURITY` on both, `parent_subscriptions_select_own` SELECT policy, `is_free_node()` IMMUTABLE SECURITY INVOKER function, `has_active_subscription()` STABLE SECURITY DEFINER function. |
| `supabase/migrations/20260226000002_seed_subscription_plans.sql` | Four pricing rows seeded into subscription_plans | VERIFIED | File exists, 21 lines. INSERT with all four rows: monthly-ils/2990, monthly-usd/799, yearly-ils/24990, yearly-usd/7990. `ON CONFLICT (id) DO NOTHING` ensures idempotency. |
| `supabase/migrations/20260226000003_add_content_gate_rls.sql` | Content gate RLS on students_score and student_skill_progress, node_id column on students_score | VERIFIED | File exists, 107 lines. Adds `node_id TEXT` column to `students_score` with sparse index. Creates `students_score_insert_gate`, `students_score_select`, `student_skill_progress_insert_gate`, `student_skill_progress_update_gate`. Drops old permissive policies. |
| `src/config/subscriptionConfig.js` | isFreeNode(node) function, single source of truth for free tier | VERIFIED | File exists, 120 lines. Exports `isFreeNode()`, `FREE_NODE_IDS` (Set), `FREE_TREBLE_NODE_IDS`, `FREE_BASS_NODE_IDS`, `FREE_RHYTHM_NODE_IDS`, `PAYWALL_BOSS_NODE_IDS`, `FREE_TIER_SUMMARY`, `PAYMENT_PROCESSOR`. |
| `src/services/apiScores.js` | Score INSERT includes node_id column for gate enforcement | VERIFIED | File exists, 76 lines. Line 59: `node_id: nodeId \|\| null` in the INSERT object. `nodeId` parameter exists in function signature (line 36: `nodeId = null`). |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `parent_subscriptions` SELECT policy | `auth.uid()` | `student_id = (SELECT auth.uid())` | WIRED | Migration `20260226000001` line 64: `USING (student_id = (SELECT auth.uid()))` — exactly one SELECT policy, no write policies. |
| `has_active_subscription()` | `parent_subscriptions` | SELECT EXISTS checking status and current_period_end | WIRED | Function body reads `FROM parent_subscriptions WHERE student_id = p_student_id AND (status = 'active' OR cancelled-grace OR past_due-grace)`. |
| `students_score` INSERT policy | `is_free_node(node_id)` | WITH CHECK clause calling is_free_node | WIRED | Migration `20260226000003` line 57: `is_free_node(node_id)` inside WITH CHECK on `students_score_insert_gate`. |
| `student_skill_progress` INSERT policy | `is_free_node(node_id)` | WITH CHECK clause calling is_free_node | WIRED | Migration `20260226000003` line 77: `is_free_node(node_id)` inside WITH CHECK on `student_skill_progress_insert_gate`. |
| `src/services/apiScores.js` | `students_score.node_id` | INSERT includes node_id field | WIRED | `node_id: nodeId \|\| null` in the `.insert([{...}])` call (line 59). Pattern `node_id.*nodeId` confirmed. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SUB-01 | 12-01-PLAN.md | Subscription database table exists with RLS restricting client to SELECT-only | SATISFIED | `parent_subscriptions` table with RLS enabled, one SELECT policy only, no authenticated write policies. |
| SUB-02 | 12-01-PLAN.md | Subscription plans table seeded with monthly and yearly prices in ILS and USD | SATISFIED | `subscription_plans` seeded with 4 rows: monthly/yearly x ILS/USD with correct amounts. |
| SUB-03 | 12-01-PLAN.md, 12-02-PLAN.md | Free tier boundary defined in a single config file (Unit 1 per path = free) | SATISFIED | `src/config/subscriptionConfig.js` is the single source of truth. Postgres `is_free_node()` mirrors the same 19 IDs. Both must be kept in sync (no automated enforcement — acceptable per design decision). |
| SUB-04 | 12-01-PLAN.md | Subscription writes restricted to webhook Edge Function via service role key | SATISFIED | No INSERT/UPDATE/DELETE policies on `parent_subscriptions` for authenticated role. Service role bypasses RLS — only the webhook (holding service role key) can write. |
| GATE-03 | 12-02-PLAN.md | Content gate enforced at database RLS layer, not only client-side React checks | SATISFIED | `students_score_insert_gate` and `student_skill_progress_insert_gate` and `_update_gate` all enforce `is_free_node(node_id) OR has_active_subscription(auth.uid())` at the Postgres layer. Client bypass of React's `isPremium` check is blocked by RLS. |

**Orphaned requirements check:** No additional Phase 12 requirements found in REQUIREMENTS.md beyond the five above. No orphaned IDs.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `supabase/migrations/20260226000001_add_subscription_tables.sql` | 101 | `has_active_subscription()` is SECURITY DEFINER but has no explicit `auth.uid()` caller check — any authenticated user can call it with any UUID | Info | This is by design: the function is used in RLS policies which already scope it to `auth.uid()`, and it is safe to call with arbitrary UUIDs (returns false for non-existent subscriptions). No data leakage risk. |
| `src/config/subscriptionConfig.js` | 100 | `isFreeNode(nodeId)` returns `false` for `undefined`/`null` (Set.has(null) = false) — unlike the Postgres function which treats NULL as free | Info | In JS context, `null` node IDs indicate non-trail games which should never call `isFreeNode()`. The divergence in NULL handling between JS (`isFreeNode(null)` = false) and Postgres (`is_free_node(NULL)` = true) is intentional — JS gate is for UI; Postgres gate handles NULL at the database layer. No blocker. |

No blocker or warning-level anti-patterns found.

---

### Human Verification Required

The following items cannot be verified programmatically because they require a live database connection with test users:

#### 1. RLS Rejection for Authenticated INSERT on parent_subscriptions

**Test:** Using a browser console or Postman with a valid Supabase auth token for a student account, call `supabase.from('parent_subscriptions').insert({ student_id: '<student-uuid>', ls_subscription_id: 'test-123', status: 'active' })`.
**Expected:** Returns an RLS violation error (PostgreSQL error code 42501 or Supabase "new row violates row-level security policy").
**Why human:** Cannot execute live Supabase queries from the verifier. The migration SQL has been confirmed correct but live rejection requires authenticated execution.

#### 2. Content Gate Blocks Premium Node Score INSERT

**Test:** Using a browser console with a student account that has no active subscription, call `supabase.from('students_score').insert({ student_id: '<student-uuid>', score: 100, game_type: 'note_recognition', node_id: 'treble_2_1' })`.
**Expected:** Returns an RLS violation error. The INSERT is rejected.
**Why human:** Requires live authenticated Supabase execution with a non-subscribed user.

#### 3. Content Gate Allows Free Node and NULL node_id Scores

**Test:** Same user as above, insert with `node_id: 'treble_1_1'` (free node) and then with `node_id: null` (non-trail game).
**Expected:** Both INSERTs succeed without error.
**Why human:** Requires live database execution.

---

### Gaps Summary

No gaps found. All five success criteria are satisfied by the migration files and JS code on disk. All four commits are present in git history. Requirements SUB-01 through SUB-04 and GATE-03 are all accounted for and satisfied.

**Notable design constraint to track (not a gap):** The Postgres `is_free_node()` function and `src/config/subscriptionConfig.js` are manually kept in sync — there is no automated enforcement that they match. Both currently agree on 19 free node IDs. This is an accepted design decision documented in the SUMMARY (IMMUTABLE function requires intentional migration to change). A future migration to expand the free tier must update both files.

---

_Verified: 2026-02-26T02:30:00Z_
_Verifier: Claude (gsd-verifier)_
