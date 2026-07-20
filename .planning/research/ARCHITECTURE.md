# Architecture Research: Parent-Owned Identity Migration

**Domain:** Live-data identity model migration (Supabase/Postgres RLS + React client) for COPPA compliance
**Researched:** 2026-07-21
**Confidence:** HIGH (measured facts + current official Supabase guidance) / MEDIUM on client UX specifics (product decisions not yet made) / LOW on the 5-orphaned-student and 3-legacy-subscription edge cases (flagged explicitly below, need owner sign-off)

## Grounding: what was verified against this codebase, not assumed

- `supabase/migrations/20260127000003_optimize_rls_auth_plan.sql` — this project **already** rewrote 19 policies from bare `auth.uid()` to `(SELECT auth.uid())` in January 2026, for exactly the performance reason Supabase's docs describe. This is a proven, understood pattern here — the v4.0 migration should extend it, not relearn it.
- `supabase/functions/lemon-squeezy-webhook/lib/{extractPayload,upsertSubscription}.ts` — confirmed `parent_subscriptions` is keyed on `student_id`, conflict-resolved on `ls_subscription_id`, and `student_id` is sourced from `custom_data` that **we** control and Lemon Squeezy simply echoes back on every webhook event.
- `supabase/functions/create-checkout/index.ts` and `cancel-subscription/index.ts` — both defense-in-depth check `studentId === auth.uid()` / `student_id = auth.uid()`. This coupling breaks the moment `auth.uid()` stops being a student id, and is a required edit, not a side effect.
- `supabase/migrations/20250115000005_remove_student_auth_fkey.sql` — confirms in its own comments that `students.id` has no FK to `auth.users`, deliberately, so teachers could pre-create student rows with generated UUIDs "students can later sign up and claim their profile." This is the exact login-less-profile-row pattern the new `child_profiles` table needs — it already works in production today, just owned by the wrong party (a teacher instead of a parent).
- `src/features/authentication/useUser.js` + `src/ui/ProtectedRoute.jsx` — `useUser()` is a single React Query-backed hook (`queryKey: ["user"]`, 5 min staleTime) returning `{ user, isAuthenticated, isTeacher, isStudent, userRole, profile }`. All 34 consuming files sit on top of this one hook, which is good news: the seam for the new "active child" concept is narrow.
- Supabase's official troubleshooting doc and its own GitHub discussion on RLS performance (see Sources) confirm the wrap-in-`SELECT` pattern and additionally recommend structuring ownership subqueries as `column IN (SELECT ... WHERE owner_col = (SELECT auth.uid()))` rather than a correlated `EXISTS` against the same outer row, because the former can become a cached initPlan while the latter re-runs per row.

---

## Standard Architecture

### System Overview — current vs. target identity shape

```
CURRENT (measured)                         TARGET (this migration)
┌─────────────────┐                        ┌─────────────────┐
│   auth.users     │                        │   auth.users     │
│  (student OR     │                        │  (PARENT ONLY —  │
│   teacher logs   │                        │   or teacher,    │
│   in directly)    │                        │   never child)   │
└────────┬─────────┘                        └────────┬─────────┘
         │ id reused as PK (convention only,           │
         │ no FK — 20250115000005)                     ├──────────────┐
         ▼                                              ▼              ▼
┌─────────────────┐   ┌──────────────────┐    ┌────────────────┐  ┌──────────┐
│   students       │   │    teachers      │    │    parents      │  │ teachers │
│ id = auth.uid()  │   │ id = auth.uid()  │    │ id = auth.uid() │  │(unchanged)│
│ (by convention)  │   │ (fan-out to many │    │ (fan-out to many│  └────┬─────┘
└────────┬─────────┘   │  students via    │    │  children —     │       │
         │              │  teacher_student_│    │  SAME shape as  │       │
         │ 30 FK cols   │  connections)     │    │  teachers table)│       │
         │ across       └──────────────────┘    └────────┬────────┘       │
         │ 26 tables                                       │ parent_id FK   │
         ▼                                                  ▼                │
┌─────────────────┐                              ┌──────────────────┐       │
│ 26 progress /    │                              │  child_profiles   │       │
│ score / streak /  │                              │  id REUSES the    │       │
│ subscription /    │                              │  legacy students. │       │
│ push tables       │                              │  id for migrated  │       │
│ (student_id FK)   │                              │  rows — no PII,   │       │
└─────────────────┘                              │  no auth account  │       │
                                                    └────────┬───────────┘◄────┘
                                                              │ same 26 tables,
                                                              │ column renamed/
                                                              │ re-targeted, VALUES
                                                              │ UNCHANGED
                                                              ▼
                                                    ┌──────────────────┐
                                                    │ 26 progress /...  │
                                                    │ tables (now       │
                                                    │ child_profile_id) │
                                                    └──────────────────┘
```

The single highest-leverage design decision in this migration: **`child_profiles.id` reuses the existing `students.id` UUID for every migrated row.** Because `students.id` already has no FK constraint to `auth.users` (deliberately dropped, see above), nothing stops `child_profiles.id` from taking over that same UUID space. This converts a 26-table **data** migration into a 26-table **schema + RLS** migration — the 30 FK columns keep their existing values and keep pointing at valid rows throughout, so no `UPDATE` sweep across student-generated content is required. Only the target table and the RLS predicate change.

### Component Responsibilities

| Component                                         | Responsibility                                                                                              | New or Modified                                                                                                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parents` table                                   | Top-level auth-owned account, PK = `auth.uid()`                                                             | **New** — structurally identical to the existing `teachers` table (same "auth-owned fan-out root" shape); copy that pattern, don't invent one                                     |
| `child_profiles` table                            | Nickname/avatar/birth_year only, no PII, `parent_id` FK, `id` reuses legacy `students.id` for migrated rows | **New**, backfilled from `students`                                                                                                                                               |
| `students` table                                  | Retired as an identity root; either kept as a legacy/audit shell or renamed                                 | **Modified** — becomes dead weight once `child_profiles` fully replaces it (contract-phase cleanup)                                                                               |
| 26 progress/score/streak/subscription/push tables | Same responsibilities, FK re-targeted at `child_profiles.id`, values unchanged                              | **Modified** (schema + RLS only, not data)                                                                                                                                        |
| `teacher_student_connections`                     | Consent link between a teacher and **one specific child**, not a whole family                               | **Modified** — `student_id` column re-targeted at `child_profiles.id`, zero row rewrite needed (UUID reuse)                                                                       |
| `parent_subscriptions`                            | Billing status, keyed directly on the paying adult                                                          | **Modified** — add `parent_id`, keep `student_id` as an audit trail                                                                                                               |
| `useUser()`                                       | Resolves the Supabase auth session                                                                          | **Modified minimally** — still resolves the parent's session; the "which child" concept is deliberately **not** folded into it                                                    |
| New `useActiveChild()` / `ActiveChildContext`     | Resolves which child profile is currently being played as                                                   | **New** — separate hook, separate concern, same React Context convention already used for `AccessibilityContext`/`SettingsContext`/`AudioContextProvider`/`SessionTimeoutContext` |
| `ParentGateMath`                                  | Math-gate before sensitive screens                                                                          | **Reused, widened in scope** — already gates the Parent Portal; extend its guard to also front Account Settings/Billing/Profile CRUD under the new model, per PRD §3 Step 4       |

---

## Q1 — Rewriting RLS from `x = auth.uid()` to "owned by a profile owned by auth.uid()"

### The subquery shape

Do **not** write a correlated `EXISTS` that joins back to the same outer row for every one of the 26 tables — that is the exact anti-pattern Supabase's own performance guidance warns against, and it would be a regression from the pattern this codebase already fixed once in `20260127000003_optimize_rls_auth_plan.sql`.

**Recommended pattern (IN + owner-first subquery, both parts SELECT-wrapped):**

```sql
-- Before (current, direct — fast because it's a plain equality)
CREATE POLICY "student_skill_progress_select_own"
  ON public.student_skill_progress
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- After (target — one indirection hop through child_profiles)
CREATE POLICY "student_skill_progress_select_own"
  ON public.student_skill_progress
  FOR SELECT
  USING (
    child_profile_id IN (
      SELECT id FROM public.child_profiles
      WHERE parent_id = (SELECT auth.uid())
    )
  );
```

Why this shape specifically, not `EXISTS (...WHERE cp.id = student_skill_progress.child_profile_id AND cp.parent_id = auth.uid())`:

- The inner `SELECT id FROM child_profiles WHERE parent_id = (SELECT auth.uid())` does **not** reference the outer table at all — it depends only on `auth.uid()`, which is itself wrapped so it's evaluated once per statement. Because the inner query has no correlation to the outer row, Postgres's planner can turn the whole thing into an **initPlan** — run once, cached as a small hashed set (a parent realistically owns 1-5 children), then reused for every row of the 26 outer tables, i.e. no different in cost from today's plain `student_id = auth.uid()` at this table's realistic cardinality.
- A correlated `EXISTS` that references `student_skill_progress.child_profile_id` inside its `WHERE` clause **must** be re-evaluated per candidate row because its result depends on the outer row — this is the shape Supabase's own GitHub discussion (#14576) and troubleshooting doc single out as 2×–11× slower on large tables specifically because it can't be cached as an initPlan.
- `child_profiles` will always be a tiny table relative to the 26 downstream tables (parents × ~2 children, not students × exercises), so the `IN` list itself is cheap regardless.

**Performance implications at this project's actual scale:** at 20 students today, none of this is measurable. The reason to get the pattern right now is that all 62 policies are being rewritten in the same milestone — get the _shape_ right once, copy it 62 times, rather than debug a 2×-11× regression later when `pg_stat_statements`/Advisors flag it. Add a btree index on `child_profiles.parent_id` (a single-column index on a small table — negligible cost, meaningful for the initPlan lookup) and keep the existing indexes on each table's `child_profile_id` column (renamed from `student_id`, index survives a column rename).

**Do not** wrap this in a `SECURITY DEFINER`/`plpgsql` function purely to reduce duplication across 26 tables. Supabase's guidance is explicit that non-inlined function calls (most `plpgsql` functions) run per-row and are _slower_ than the repeated inline subquery, because the planner can't fold them into an initPlan the way it can a plain `SELECT`. If duplication maintenance becomes painful, the only safe shortcut is a single-statement `SQL` (not `plpgsql`) `STABLE` function, which Postgres _can_ inline — but verify inlining with `EXPLAIN ANALYZE` before trusting it; the repeated inline subquery is the lower-risk default and matches this repo's existing convention (`20260128000001_consolidate_rls_policies.sql`, `20260131000001_audit_rls_policies.sql` both favor explicit inline SQL over shared functions).

**Teacher-facing policies keep their existing shape almost unchanged** — they already use a correlated `EXISTS` against `teacher_student_connections`, and that's fine because `teacher_student_connections` is filtered by `teacher_id = (SELECT auth.uid())` first (owner-first, matches Supabase's own recommended template) and is a small table. Only the column being joined (`tsc.student_id`) needs to be re-pointed at `child_profile_id` — the policy's structural shape is reused verbatim from `20260127000003_optimize_rls_auth_plan.sql`.

---

## Q2 — Modeling "which child is active" on the client

### Where the state lives

Introduce a dedicated `ActiveChildContext` (new file, same convention as the existing feature-scoped contexts: `AccessibilityContext`, `SettingsContext`, `AudioContextProvider`, `SessionTimeoutContext`, `SightReadingSession`, `Rhythm` contexts) — do **not** fold this into `useUser()`. Keep two separate hooks with two separate responsibilities:

- `useUser()` — unchanged in shape, still resolves the **parent's** Supabase auth session (`isAuthenticated`, `isTeacher`, etc.). This is the security-relevant identity.
- `useActiveChild()` (new) — resolves `{ activeChildId, children, setActiveChild }` from a React Query fetch of `child_profiles WHERE parent_id = auth.uid()` plus a persisted "last selected" preference. This is a **UX convenience**, not a security boundary (see below).

**Persistence for reload survival:** `localStorage`, namespaced by parent id — `pianoapp_active_child_${parentAuthId}` — not a bare key. This matters because of the shared-device scenario this codebase already designs for (session timeout, logout clears user-specific keys per `SEC-04`): if a different parent logs in on the same browser, an unnamespaced key would silently carry over the wrong "active child" guess. On load, validate the stored id against the fetched `child_profiles` list for the _currently authenticated_ parent; if it's missing, stale, or belongs to no child in the list (parent switched account, child was deleted), fall back to a profile-picker screen rather than guessing.

### Why sibling-switching is not the same threat as escaping to billing

These two halves of the question have different answers because they sit on different sides of the actual security boundary:

- **RLS is the real boundary, and it is per-parent, not per-child.** Two siblings under the same parent are, by construction, both already fully visible to that parent's `auth.uid()` — the parent-owned subquery from Q1 returns _both_ children's ids. So a device operating as "Kid A" reading/writing "Kid B"'s row is not a data-leak in the cross-tenant sense (it's not another family's data); it's the same trust boundary the parent already consented to when they created both profiles. Treat the profile switcher as a **low-friction UX affordance** (Netflix-style avatar picker), not a security gate — gating it behind `ParentGateMath` would be friction with no real security payoff, since the parent already authorized access to all of their own children.
- **Escaping to Account Settings / Subscription / Billing is the actual threat the PRD calls out (§3 Step 4)**, and it is independent of which child is "active." Reuse the existing `ParentGateMath` component and the existing gate-first Parent Portal architecture (`/parent-portal` already does math-gate-on-every-visit) — widen its coverage to also front: Account Settings, Subscription/Billing, and Child Profile CRUD (create/delete a sibling). None of these three should be reachable from whatever screen a child is actively using without the gate, regardless of `activeChildId`.
- **Open product question to flag for the roadmap (not resolved by research):** should switching _away_ from a child mid-session require the gate too (so Kid A can't casually reassign Kid B's practice session to themselves)? The PRD doesn't specify this, and it's a product/UX call, not an architecture one. Recommend surfacing this explicitly as a decision point in the phase that builds the profile switcher, rather than assuming an answer. LOW confidence either way — flag, don't guess.

**Concretely, extend the routing pattern that already exists** (`ProtectedRoute` gates auth; the Parent Portal already gates itself): add a `RequireActiveChild` wrapper around game/trail routes (redirect to a profile picker if `activeChildId` is unset — first-run or post-child-deletion case) and keep using the existing `ParentGateMath`-fronted pattern, just widen which routes sit behind it.

---

## Q3 — Sequencing strategy for the live migration

**Recommended strategy: expand/contract (parallel-change), not dual-write.** Dual-write (writing to both old and new columns simultaneously from application code) is the wrong tool here specifically _because_ of the UUID-reuse decision above — there is no new data to write in parallel, because the existing FK values are already correct once `child_profiles.id` mirrors `students.id`. What actually needs to happen in parallel is **RLS policies** (old and new coexisting, since Postgres RLS policies are OR'd together when multiple permissive policies exist on the same table/command), not row data.

### Why this minimizes the unreachable-data window

Because no existing row's `student_id`/`child_profile_id` value ever needs to change, there is no phase in which a table is "between states" from a data-integrity standpoint — only from a **policy-authorization** standpoint, and policy changes are near-instant DDL, not row-by-row `UPDATE`s. The unreachable-data window can be reduced to effectively zero if each table's policy swap is its own small transaction (matches this repo's existing convention of narrowly-scoped migration files, e.g. one table cluster per file, rather than one giant migration).

### Suggested phase order (roadmap-facing)

1. **Schema expand — additive only, zero client-visible change, fully reversible with `DROP TABLE`.**
   Create `parents` (PK = `auth.uid()`, same shape as the existing `teachers` table). Create `child_profiles` (`id` reuses `students.id` for the 20 existing rows via a straight `INSERT ... SELECT`, `parent_id` resolved per the backfill rule below). Add `child_profile_id` columns (nullable at first) alongside existing FK columns on the 26 tables — do not touch `student_id` yet.

   **Backfill rule — flag as an explicit open decision, not a research answer:** 15 of the 20 students have their own `auth.users` row (their id _is_ an auth account) — per the owner decision already recorded in PROJECT.md, that same auth id becomes the new `parents.id`, and the child re-consent prompt is a separate, already-scoped follow-up. The remaining **5 students have no auth account at all** (teacher-created placeholders) — these cannot become a `parents` row, because a `parents` row requires a backing `auth.users` entry. There is no natural "owning adult" for these 5 today. This needs an explicit owner decision before Phase 1 can complete its backfill: either (a) leave these 5 `child_profiles` rows with `parent_id = NULL` until a parent later claims them (requires nullable `parent_id` and a "claim" flow, and these children are inert/inaccessible under strict parent-owned RLS until claimed), or (b) temporarily attribute them to their connected teacher's auth id as a placeholder owner with a forced re-consent/claim prompt the first time a parent account is created for them. This is a genuine gap in the PRD (which doesn't address teacher-created, auth-less students) — do not resolve it by assumption in code; surface it as its own small roadmap phase or decision point.

2. **RLS dual-policy rollout, table cluster by table cluster.** Add the new `child_profile_id`-based policy from Q1 _alongside_ the existing `student_id = auth.uid()` policy (both permissive, both active — Postgres OR's them). Order clusters from lowest-risk/read-mostly to highest-risk/write-heavy and billing-adjacent:
   - Trail/progress/score/streak/daily-goals tables first (read-heavy, well-covered by existing tests, `verify:trail`/`verify:patterns` build-time checks already exist as a safety net)
   - Teacher-facing tables next (`teacher_student_connections`, teacher read policies) — reuses the already-optimized pattern from `20260127000003`, lowest structural risk
   - Subscription/billing (`parent_subscriptions`) last within this phase, and treat it as its own sub-sequence — see Q4
     Verify each cluster with Supabase's Performance/Security Advisors and a manual `EXPLAIN ANALYZE` spot-check before moving to the next cluster.

3. **New parent-only signup + age gate.** Purely additive/new code path (age gate, parent registration, first child profile creation) — touches zero existing rows, can be built and tested in parallel with Phase 1/2, but must not be **routed** live until Phase 1's schema exists (misrouting new signups before `parents`/`child_profiles` exist would break onboarding). Feature-flag the route swap as the actual cutover moment.

4. **Client "active child" model + profile switcher + widened `ParentGateMath` coverage** (Q2). Because of UUID reuse, the 15 existing single-child households never notice this land — their `activeChildId` resolves to the one profile that already carries their familiar id. This phase is where genuinely new multi-child UX work happens, and it's intentionally sequenced _after_ the backend is already correct, so it can ship independently and be device-tested without backend risk.

5. **`parent_subscriptions` re-pointing** (Q4) — its own careful sub-sequence given 3 live paying customers; see below.

6. **Re-consent flow** for the case where a child's own email ends up owning a "parent" account (already flagged as an owner decision in PROJECT.md — "needs a re-consent prompt, not a silent conversion") and resolution of the 5 auth-less placeholder students from step 1.

7. **Audio recording removal.** PROJECT.md is explicit that the `practice-recordings` Storage bucket and its policies exist **only in the remote Supabase project** (no migration represents them) and that deleting stored audio is live and irreversible with zero test coverage. Sequence this **last**, and treat it as a fully independent deploy from the identity work — the tables it touches (`practice_sessions`, `teacher_feedback`) are unrelated to the 26 identity-bearing tables, so there's no technical dependency forcing them together, only a shared milestone label. Keeping them as separate deploys means a problem discovered in the (reversible) identity migration never blocks or gets blocked by the (irreversible) deletion step, and vice versa. Gate this step behind explicit owner confirmation before running, matching this project's existing pattern for irreversible operations (e.g., the `note_mastery` column apply and the v3.5 rhythm-pedagogy production migration were both owner-approved before execution).

8. **Contract — cleanup only, after verified zero traffic on legacy policies.** Confirm via Advisors/logs that nothing still hits the old `student_id = auth.uid()` policies, then drop them, drop the now-redundant `students` identity semantics (keep the table if other non-identity data still lives there, or retire it), and clean up the 47 service call sites / 151 `user?.id` references that assumed 1:1 auth-id-equals-student-id.

### Rollback

Because Phases 1-2 add columns and policies without removing or mutating anything, rollback at any point before Phase 8 is simply "stop routing traffic through the new path" — `DROP TABLE parents, child_profiles CASCADE` and drop the added policies undoes Phase 1-2 cleanly with zero data loss, since no existing row was ever touched. The only genuinely irreversible action in the whole sequence is the audio-recording deletion in Phase 7, which is exactly why it's sequenced last and gated separately rather than bundled with anything reversible.

---

## Q4 — Re-pointing `parent_subscriptions` without breaking active Lemon Squeezy subscriptions

The key fact that de-risks this: **Lemon Squeezy has zero awareness of our internal id scheme.** `custom_data` on a checkout is opaque metadata _we_ set and LS simply echoes back on every subsequent webhook event for that subscription (confirmed by reading `extractPayload.ts` — it reads `meta.custom_data.student_id` fresh on every webhook, and `upsertSubscription.ts` conflict-resolves on `ls_subscription_id`, not on our internal id). Billing, card charges, and renewal are entirely driven by LS's own `subscription_id`/`customer_id` — our re-key is a **database-only** operation with no Lemon Squeezy-side action required and no customer-facing interruption.

Concrete steps:

1. Add a nullable `parent_id UUID REFERENCES parents(id)` column to `parent_subscriptions` (additive, matches the expand step elsewhere).
2. One-time backfill: `UPDATE parent_subscriptions SET parent_id = (SELECT parent_id FROM child_profiles WHERE child_profiles.id = parent_subscriptions.student_id)`. This resolves cleanly for all 3 live subscriptions specifically because of the UUID-reuse decision (Q3) — no ambiguity, no manual mapping table needed.
3. Add the new RLS policy (`parent_id = (SELECT auth.uid())`) alongside the existing one — dual-policy, same pattern as everywhere else.
4. Update `cancel-subscription`: change its lookup from `student_id = auth.uid()` to `parent_id = auth.uid()`. This is a pure server-side code deploy (Deno Edge Function), no DB row is touched by shipping it, and it can go out as soon as the backfill in step 2 is verified — it does not need to wait for the client cutover, because only a parent (never a child, who has no login) can reach the billing UI that calls this function in the first place. If anything, this is a **simplification**: the function no longer needs to reason about "is this student allowed to cancel," because only parents can call it at all.
5. Update `create-checkout`: change the embedded `checkout_data.custom` key from `student_id` to `parent_id`, with the same defense-in-depth `parentId === auth.uid()` check it already does for `studentId`. This only affects **new** checkouts going forward.
6. The 3 **existing** live subscriptions permanently carry `student_id` in their Lemon Squeezy-side `custom_data` — LS does not offer a way to edit historical checkout metadata, and there's no need to: add a small compatibility shim in `upsertSubscription.ts` that resolves `parent_id` from either `payload.parent_id` (new checkouts) or a `child_profiles` lookup on `payload.student_id` (legacy checkouts, i.e. exactly the same backfill query as step 2, run per-webhook instead of once). This keeps renewal/update/cancellation webhooks for the 3 existing customers correctly attributed without ever touching Lemon Squeezy. This shim is cheap enough to leave in permanently rather than time-bounding it to "until they churn."
7. Do not delete the legacy `student_id` column from `parent_subscriptions` in the same pass as everything else — keep it as an audit trail; it's a single nullable column on a 3-row table, the cost of keeping it is zero.

**Secondary architectural win worth calling out:** billing/subscription should be keyed **directly** on `parent_id`, not indirected through `child_profile_id` the way progress tables are. There is no product reason a subscription needs to resolve "which child" — a subscription is a family-level entitlement gating content, not a per-child fact. This also means its RLS policy is a plain equality (`parent_id = (SELECT auth.uid())`), not an `IN`-subquery indirection — the fastest and simplest shape available, and it removes the child-profile hop entirely from the billing hot path.

---

## Q5 — Where the teacher relationship attaches: child profile, not parent

Attach at `child_profiles`, matching the owner decision already recorded in PROJECT.md ("Teachers stay, re-pointed at `child_profiles` via `teacher_student_connections`"). Architectural justification, not just decision-recording:

- **The teacher relationship is pedagogical and per-learner, not per-family.** A parent with two children may have only one of them taking lessons, or two children with two different teachers. Attaching the connection at `parents` would leak a teacher's visibility across a parent's _entire_ family regardless of which child that teacher actually teaches — a real over-broad-access bug, not just a modeling nicety.
- **Zero data rewrite required**, again because of the UUID-reuse decision: `teacher_student_connections.student_id` already holds values equal to the future `child_profiles.id` for every existing connection row. Only the column's semantic target and its RLS predicate change — the existing ~20 connection rows need no `UPDATE` at all.
- **The RLS shape is already correct and already optimized** — `20260127000003_optimize_rls_auth_plan.sql` already produced the exact `EXISTS (... tsc.teacher_id = (SELECT auth.uid()) AND tsc.status = 'accepted')` pattern this migration needs; only the joined column name changes (`tsc.student_id = X.child_profile_id` instead of `tsc.student_id = X.id`/`X.student_id`). This is close to zero-novelty work, which matters given the size of the rest of this migration.
- **Consent implication, worth surfacing to the roadmap explicitly:** creating (and deleting) a `teacher_student_connections` row must remain something only a **parent** does, on behalf of a **specific named child** — never a blanket "share my whole family" action. This directly operationalizes the owner decision that "teacher access to progress data remains" while keeping the actual COPPA-relevant boundary (which specific child's data a specific teacher can see) intact. Recommend this linking action sit behind the same widened `ParentGateMath` coverage as Account Settings/Billing (Q2), since it's a consent-bearing action, not routine gameplay.

---

## Recommended Project Structure (additions)

```
src/
├── contexts/
│   └── ActiveChildContext.jsx        # NEW — which child is being played as; UX state, not security boundary
├── features/
│   └── authentication/
│       ├── useUser.js                # MODIFIED minimally — still resolves the parent's auth session
│       └── useActiveChild.js         # NEW — resolves { activeChildId, children, setActiveChild }
├── services/
│   └── apiChildProfiles.js           # NEW — createChildProfile / getChildProfiles / deleteChildProfile (per PRD §6 checklist)
├── components/
│   ├── onboarding/
│   │   └── AgeGate.jsx               # NEW — neutral age gate ahead of signup (PRD §3 Step 1)
│   └── settings/
│       ├── ParentGateMath.jsx        # REUSED, scope widened to front Settings/Billing/Profile CRUD
│       └── ChildProfileSwitcher.jsx  # NEW — low-friction avatar picker, deliberately NOT gated (see Q2)
└── ui/
    └── RequireActiveChild.jsx        # NEW — route guard analogous to ProtectedRoute, redirects to profile picker

supabase/
└── migrations/
    ├── 2026XXXX_add_parents_and_child_profiles.sql        # NEW — Phase 1 (expand, additive)
    ├── 2026XXXX_rls_child_profiles_progress_tables.sql     # NEW — Phase 2a (dual policy, trail/progress cluster)
    ├── 2026XXXX_rls_child_profiles_teacher_tables.sql      # NEW — Phase 2b (dual policy, teacher cluster — reuses 20260127 shape)
    ├── 2026XXXX_repoint_parent_subscriptions.sql           # NEW — Phase 5 (Q4)
    └── 2026XXXX_contract_drop_legacy_student_policies.sql  # NEW — Phase 8, only after verified zero legacy traffic
```

---

## Architectural Patterns

### Pattern 1: UUID Reuse for Zero-Rewrite Identity Migration

**What:** Give the new owned-entity table (`child_profiles`) the _same primary key values_ as the entity it replaces (`students`), for every row that already exists.
**When to use:** Exactly this situation — an identity root is being re-pointed to a new owner, but the downstream FK _values_ were already correct; only the target table and authorization predicate need to change.
**Trade-offs:** Massively de-risks a live migration (no data movement across 26 tables, only DDL + policy changes). The cost is conceptual: new engineers need to understand that `child_profiles.id` isn't a fresh UUID space, it's a historical artifact for migrated rows only (new children created after this migration get fresh UUIDs normally). Document this clearly at the point of table creation, not just in a research file.

### Pattern 2: Additive-Then-Dual-Policy RLS Rollout

**What:** Add the new ownership-shaped policy alongside the existing one (Postgres RLS policies within the same command are OR'd), verify, then drop the old one in a later, separate migration.
**When to use:** Any RLS predicate rewrite on live tables with real user traffic, especially when 62 policies across 32 tables are in scope.
**Trade-offs:** Doubles the number of policies temporarily (minor catalog bloat, no meaningful runtime cost since only matching policies are evaluated per row and both old/new resolve to the same allowed set during the transition window). Buys a genuinely safe, instantly-revertible rollout with no big-bang cutover moment.

### Pattern 3: Owner-First, Non-Correlated Ownership Subquery

**What:** `child_profile_id IN (SELECT id FROM child_profiles WHERE parent_id = (SELECT auth.uid()))` instead of a correlated `EXISTS`.
**When to use:** Any RLS policy that needs "this row belongs to something I own," not just this migration — a durable rule for this codebase going forward.
**Trade-offs:** None functionally; purely a performance-shape choice. Requires discipline to keep applying correctly as new identity-bearing tables get added post-migration — worth a one-line note in `CLAUDE.md`'s RLS/security guidance once this ships.

---

## Data Flow

### Request flow (post-migration, a game session save)

```
Child taps "Play" in switcher (no login — activeChildId already resolved client-side)
    ↓
Game component reads child_profile_id from ActiveChildContext (UX convenience value)
    ↓
apiTeacher.js / game service writes score row with child_profile_id = activeChildId
    ↓
Postgres RLS evaluates: child_profile_id IN (SELECT id FROM child_profiles WHERE parent_id = (SELECT auth.uid()))
    ↓ (auth.uid() here is the PARENT's session — the one actually logged in on the device)
Write allowed only if the active child truly belongs to the logged-in parent — this is
the REAL security check; the client's activeChildId is never trusted on its own.
```

### Billing flow (post Q4 re-pointing)

```
Parent (only — gated by ParentGateMath) opens Subscription screen
    ↓
create-checkout Edge Function verifies parentId === auth.uid(), embeds parent_id in LS custom_data
    ↓
Lemon Squeezy processes payment (entirely its own id space — customer_id/subscription_id)
    ↓
Webhook fires → extractPayload reads back OUR custom_data.parent_id (or legacy student_id + shim)
    ↓
upsertSubscription UPSERTs parent_subscriptions keyed on ls_subscription_id, parent_id resolved
    ↓
SubscriptionContext Realtime channel invalidates React Query cache (unchanged from today)
```

---

## Scaling Considerations

| Scale                                | Architecture Adjustments                                                                                                                                                                                                                                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-1k parents (current: single-digit) | No adjustment needed. `child_profiles` stays a tiny table; the `IN`-subquery indirection is effectively free relative to the 26 downstream progress tables, which are the actual size driver.                                                                                                                                          |
| 1k-100k parents                      | Confirm the `parent_id` btree index on `child_profiles` exists (cheap, single column). Re-run Advisors after the migration to catch any policy that didn't get the initPlan-cacheable shape — this is the one thing that could regress silently at this scale.                                                                         |
| 100k+ parents                        | The real bottleneck at this app's size is the progress/score/streak tables (rows = children × exercises × attempts), not the parent/child indirection layer — no architecture change specific to _this migration_ is needed beyond normal index/partition strategy for those existing tables, which is out of scope for this research. |

### Scaling priorities

1. **First and only realistic bottleneck relevant to this migration:** an RLS policy that accidentally uses a correlated `EXISTS` instead of the owner-first `IN` pattern (Q1) — catch this with Advisors/`EXPLAIN ANALYZE` per-cluster during Phase 2, not after the fact.
2. Everything else (overall table growth, index strategy on the 26 downstream tables) is unrelated to the identity model and pre-exists this migration.

---

## Anti-Patterns

### Anti-Pattern 1: Trusting client-side `activeChildId` as an authorization signal

**What people do:** Gate a query or UI decision on the client's `activeChildId` value alone.
**Why it's wrong:** It's convenience state, trivially tamperable (localStorage), and — critically — even if tampered, RLS is what actually decides whether the write succeeds, scoped to the _parent's_ `auth.uid()`, not the claimed child.
**Do this instead:** Let the client pick which child it's _displaying_; let Postgres RLS decide what's actually _allowed_. Never skip the RLS check because "the client already validated activeChildId."

### Anti-Pattern 2: A single big-bang migration touching all 26 tables and 62 policies in one transaction

**What people do:** One large migration file for "the whole identity refactor."
**Why it's wrong:** All-or-nothing rollback risk on a live database with 3 paying customers; also makes it impossible to verify RLS performance per-cluster with Advisors before moving to the next set of tables.
**Do this instead:** Table-cluster-sized migrations (this repo already does this — see the dated migration file naming convention), each independently revertible, each independently verified against Advisors before the next cluster ships.

### Anti-Pattern 3: Bundling the (reversible) identity migration with the (irreversible) audio-recording deletion

**What people do:** Ship both under one milestone deploy because they share a milestone label.
**Why it's wrong:** If something in the identity migration needs to roll back, you don't want it entangled with a step that has already permanently deleted data with zero migration representation and zero test coverage.
**Do this instead:** Same milestone, separate deploys, separate owner-approval gates — sequence recording deletion last and treat it as fully independent (they touch disjoint tables).

### Anti-Pattern 4: Reintroducing the correlated-`EXISTS`-per-row mistake this repo already fixed once

**What people do:** Write the new `child_profiles` ownership check as `EXISTS (SELECT 1 FROM child_profiles cp WHERE cp.id = outer.child_profile_id AND cp.parent_id = auth.uid())`.
**Why it's wrong:** Correlated subquery, can't be cached as an initPlan, re-evaluated per row — the exact class of problem `20260127000003_optimize_rls_auth_plan.sql` fixed for the old `auth.uid()` calls, now reintroduced one layer deeper.
**Do this instead:** The owner-first `IN` pattern from Q1/Pattern 3.

---

## Integration Points

### External Services

| Service                                | Integration Pattern                                              | Notes                                                                                                                                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lemon Squeezy                          | `custom_data` on checkout, echoed back on every webhook          | Zero LS-side action needed for the re-key (Q4) — LS has no awareness of our internal id scheme, it's purely our own DB + Edge Function change                                                                                  |
| Supabase Auth                          | `auth.users` — now exclusively parents (and teachers, unchanged) | Age gate (PRD §3 Step 1) blocks under-18 self-signup before an `auth.users` row is even created; children never get one                                                                                                        |
| Brevo (weekly parent email)            | Already parent-oriented                                          | Becomes _more_ correct once explicitly tied to `parent_id` rather than inferring a parent's email off a student row — net positive side effect worth noting, not a new risk                                                    |
| Push notifications (`send-daily-push`) | Currently keyed off student-shaped rows                          | Not directly investigated in this pass — flag as needing a similar `child_profile_id`/`parent_id` audit during Phase 2, since it's one of the 26 tables in scope per the milestone context but wasn't individually traced here |

### Internal Boundaries

| Boundary                                                                            | Communication                                                                                                         | Notes                                                                                               |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ActiveChildContext` ↔ RLS                                                         | Client sends `child_profile_id` explicitly in queries; RLS independently re-derives the allowed set from `auth.uid()` | The two must never be conflated — client state is convenience, RLS is the boundary (Anti-Pattern 1) |
| `teacher_student_connections` ↔ `child_profiles`                                   | FK re-pointed, zero row rewrite (UUID reuse)                                                                          | Reuses the already-optimized RLS shape from January 2026, see Q5                                    |
| `parent_subscriptions` ↔ Edge Functions (`create-checkout`, `cancel-subscription`) | Both re-pointed to `parent_id`, both are pure code deploys independent of client cutover timing                       | See Q4 for the compatibility shim needed for the 3 legacy subscriptions                             |

---

## Sources

- [Supabase Docs — RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — official source for the `(SELECT auth.uid())` initPlan-caching guidance and the owner-first subquery recommendation. HIGH confidence.
- [GitHub — supabase/discussions#14576, RLS Performance and Best Practices](https://github.com/orgs/supabase/discussions/14576) — community-verified elaboration of the same guidance, including the specific `team_id IN (SELECT ... WHERE user_id = auth.uid())` vs. correlated-`auth.uid() IN (...)` comparison this research's Q1 pattern is built on. MEDIUM-HIGH confidence (community discussion, but consistent with and cited by the official doc).
- `C:\Development\PianoApp2\supabase\migrations\20260127000003_optimize_rls_auth_plan.sql` — this project's own prior, already-shipped application of the same pattern. HIGH confidence (primary source, measured).
- `C:\Development\PianoApp2\supabase\migrations\20250115000005_remove_student_auth_fkey.sql` — confirms the no-FK, login-less-profile-row convention already proven in production. HIGH confidence (primary source, measured).
- `C:\Development\PianoApp2\supabase\functions\lemon-squeezy-webhook\lib\{extractPayload,upsertSubscription}.ts`, `create-checkout/index.ts`, `cancel-subscription/index.ts` — primary source for the Q4 billing re-pointing analysis. HIGH confidence (measured, read directly).
- `C:\Development\PianoApp2\src\features\authentication\useUser.js`, `C:\Development\PianoApp2\src\ui\ProtectedRoute.jsx` — primary source for the Q2 client-hook seam analysis. HIGH confidence (measured, read directly).
- `COPPA_REFACTOR_PRD.md` (repo root) — target schema and UX requirements (parents/child_profiles shape, age gate, parental gate). Explicitly noted in `.planning/PROJECT.md` that its §5 (third-party SDK audit) is generic boilerplate not applicable here; treated accordingly.
- `.planning/PROJECT.md` "Current Milestone: v4.0" section — owner decisions already recorded (teachers stay attached to children, under-18 self-signup blocked, existing users auto-migrate, recording removal decouples the counsel hold). Treated as fact, not re-derived.

---

_Architecture research for: parent-owned identity migration (COPPA v4.0)_
_Researched: 2026-07-21_
