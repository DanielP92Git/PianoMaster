# Stack Research

**Domain:** Parent-owned accounts + login-less child profiles on Supabase (brownfield: 62 live RLS policies, 3 paying subscribers, 20 students/15 with auth accounts)
**Researched:** 2026-07-21
**Confidence:** HIGH (core pattern verified against this repo's own production migrations + official Supabase docs); MEDIUM on the "what changed in 2026" question (no material new first-party feature found)

## Answering the four research questions up front

**1. Does Supabase have a first-party "one auth user owns N non-auth profile rows" pattern?**
No dedicated feature — but there is one idiomatic approach, and this codebase is already running a structural twin of it in production. `teacher_student_connections` + `students.id` (no FK to `auth.users`, dropped deliberately in migration `20250115000005`) is exactly "N owned rows with no auth account, linked to one auth.uid() owner via a join/FK and RLS subquery." The parent/child-profile model should **re-point this exact pattern at parents**, not invent a new one. This is not a guess — it's what `.planning/PROJECT.md` itself concludes ("Login-less profile rows already work in production").

**2. How do people represent "active profile" when RLS is keyed on `auth.uid()`?**
Client-side selection only. There is no server-side "current profile" primitive in Supabase Auth. The correct mental model: `auth.uid()` identifies the **account** (the parent), never the **profile in use** (the child). Every query must carry an explicit `child_profile_id`, and RLS proves _ownership_ of that id (`child_profile_id` belongs to a `child_profiles` row where `parent_id = auth.uid()`) rather than proving it's "the active one." "Active profile" is pure UI state — same tier as which sidebar tab is open — and belongs in a React Context + `localStorage`, matching this app's existing pattern (`SubscriptionContext`, `SessionTimeoutContext`, `AccessibilityContext` in `src/contexts/`). Do not try to make "active profile" a security boundary.

**3. Any Supabase feature that materially changes how this is built in 2026?**
No. The **Custom Access Token Hook** (SQL or HTTP function invoked at token issuance, GA since mid-2024) is the only Auth-adjacent feature that touches this problem, and it is the wrong tool here — see "What NOT to Use" below. `@supabase/supabase-js` is unchanged architecturally; current npm `latest` is `2.110.7` against this repo's pinned `^2.48.1` (`3.0.0` exists only as `-next` prereleases — do not adopt). No `@supabase/ssr` is installed or needed (this is a Vite SPA, not Next.js). The relevant "2026" artifact is Supabase's own RLS performance guidance (`SECURITY DEFINER STABLE` helper functions, `(select auth.uid())` wrapping, indexing policy columns) — which this repo already follows (`is_free_node()`, `has_active_subscription()`, `20260127000003_optimize_rls_auth_plan.sql`). The 62-policy rewrite should extend that existing convention, not introduce a new one.

**4. What should NOT be added?**
See dedicated section below — short version: no new client library, no Supabase Anonymous Auth for children, no per-child JWTs/sessions, no embedding "active profile" in `app_metadata` via the Custom Access Token Hook, no ORM.

## Recommended Stack

### Core Technologies — no additions, only usage-pattern changes

| Technology                                   | Version                                                | Purpose                                                            | Why Recommended                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@supabase/supabase-js`                      | `^2.48.1` (already installed; latest stable `2.110.7`) | Auth session for parent, Postgres client for `child_profiles` CRUD | Zero new library needed. Bump to latest `2.x` as routine maintenance (bugfixes only — no breaking API relevant to this milestone), **not** `3.0.0-next.*` (unreleased prerelease track, do not adopt for a brownfield app with paying subscribers).                                                                                   |
| Postgres `SECURITY DEFINER` helper functions | Postgres (Supabase-managed)                            | RLS ownership checks for the 62-policy rewrite                     | This repo already uses this exact pattern (`is_free_node()`, `has_active_subscription()`, both `SECURITY DEFINER STABLE SET search_path = public`). Add `public.owns_child_profile(p_child_id uuid) RETURNS boolean` as the single source of truth every rewritten policy calls, instead of inlining the ownership subquery 62 times. |
| React Context (existing pattern)             | React 18 (already installed)                           | "Active child profile" client state                                | Matches `SubscriptionContext`/`SessionTimeoutContext`/`AccessibilityContext` already in `src/contexts/`. No new state library needed — this is deliberately NOT a Redux concern (CLAUDE.md restricts Redux Toolkit to rhythm only).                                                                                                   |

### Supporting Libraries — none required

No new npm packages are needed for this milestone. The entire feature is: (a) a new Postgres schema (`parents`/reuse `auth.users`, `child_profiles`), (b) rewritten RLS policies using the existing SECURITY DEFINER convention, (c) a React Context for active-profile selection, (d) existing `ParentGateMath` component reused for the parental gate (already built per CLAUDE.md — "Parental gate on account settings, subscription, and billing" is a UI-routing change, not a new dependency).

### Development Tools

| Tool                                             | Purpose                                                                        | Notes                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supabase CLI / MCP `list_tables`, `get_advisors` | Verify schema + RLS state before/after each migration                          | Already used in this project's workflow (see MCP server instructions). Run `get_advisors` (security) after every RLS rewrite batch — with 62 policies changing, this is the fastest way to catch a policy that silently fell back to permissive/no-op. |
| `scripts/validateTrail.mjs` (existing)           | Unaffected, but confirm no trail-node data assumes `student_id === auth.uid()` | Pattern-check only; no tool change.                                                                                                                                                                                                                    |

## Installation

```bash
# Nothing new to install for the core pattern.
# Optional routine maintenance bump:
npm install @supabase/supabase-js@^2.110.0
```

## The Idiomatic Pattern (verified against this repo + official docs)

### Schema

```sql
-- parents: reuse auth.users directly. Do NOT create a separate `parents` table
-- unless you need parent-specific columns beyond what auth.users + a thin
-- profile row already gives you (the COPPA PRD's `parents(id, email, created_at)`
-- is redundant with auth.users — id and email already live there).
-- If you want a parents-facing profile row for app-specific fields (locale,
-- consent timestamp), keep it 1:1 with auth.users.id, not a new identity.

CREATE TABLE child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_id TEXT NOT NULL,
  birth_year INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_child_profiles_parent_id ON child_profiles(parent_id);
```

The FK direction mirrors `teacher_student_connections.teacher_id -> teachers.id`, and the "no login, no auth.users row" property mirrors `students.id` having no FK to `auth.users` (deliberately dropped, migration `20250115000005`). This is not a new architectural decision for the codebase — it's applying an already-proven pattern to a new owner.

### RLS ownership helper (extends the existing convention)

```sql
CREATE OR REPLACE FUNCTION public.owns_child_profile(p_child_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM child_profiles
    WHERE id = p_child_id
      AND parent_id = (SELECT auth.uid())
  );
$$;
```

Every one of the 62 policies being rewritten becomes:

```sql
USING (owns_child_profile(child_profile_id))
```

instead of duplicating the `EXISTS (... parent_id = auth.uid())` subquery 62 times. This is exactly the "move joins into a SECURITY DEFINER function" optimization Supabase's own RLS performance guide recommends (documented 100x+ speedups vs. inline joins in their benchmarks) — and it's the same shape as this repo's `has_active_subscription(p_student_id)`.

### Client-side active profile

A `ActiveProfileContext` (new file, same shape as `SubscriptionContext.jsx`) holding `{ activeChildId, setActiveChildId }`, persisted to `localStorage` keyed per-parent (`activeProfile:${parentId}`), read on app boot and after login. Every service call that currently does `.eq('student_id', user.id)` (151 call sites per PROJECT.md) becomes `.eq('child_profile_id', activeChildId)`, with RLS as the actual enforcement layer — the client passing the wrong id simply returns zero rows, it does not leak data, because `owns_child_profile()` is checked server-side regardless of what the client claims is "active."

## Alternatives Considered

| Recommended                                                                                            | Alternative                                                                                              | When to Use Alternative                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `child_profiles` table + `owns_child_profile()` SECURITY DEFINER helper                                | Custom Access Token Hook embedding owned `child_profile_ids[]` in JWT `app_metadata`                     | Only at a scale where per-row DB lookups genuinely bottleneck (thousands of rows per query, high QPS). At this app's scale (20 students today, low tens of families post-migration) the JWT-embedding approach trades a solved-and-fresh problem for a staleness bug class (JWT only refreshes ~hourly by default; creating/deleting a child profile wouldn't take effect until then unless the client force-refreshes the session on every profile CRUD). Revisit only if `get_advisors`/query timing shows this table genuinely needs it. |
| Postgres FK + RLS for ownership                                                                        | Supabase Anonymous Auth per child (`signInAnonymously()`)                                                | Never for this feature — see "What NOT to Use."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| React Context for active profile                                                                       | Redux Toolkit slice                                                                                      | If the app's Redux usage expands beyond rhythm-only in a future milestone. Not justified for one piece of UI-only state today, and CLAUDE.md explicitly scopes Redux to rhythm.                                                                                                                                                                                                                                                                                                                                                             |
| Keep `auth.users` as the parent identity table (no separate `parents` table beyond a thin 1:1 profile) | A full `parents` table duplicating `id`/`email`/`created_at` (as sketched in `COPPA_REFACTOR_PRD.md` §4) | Only if parent-specific columns genuinely don't belong on a profile-style 1:1 table (e.g., if you need a table you can grant broader read access to without touching `auth.users`, which Supabase locks down by convention). For most fields (consent timestamp, locale, marketing opt-in) a `parent_profiles(id UUID PK REFERENCES auth.users, ...)` 1:1 table is cleaner than a redundant identity table — avoid duplicating `email`, which drifts from the auth source of truth.                                                         |

## What NOT to Use

| Avoid                                                                                                | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Use Instead                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Anonymous Sign-ins (`signInAnonymously()`) per child profile                                | Each anonymous sign-in is a **separate, device-bound auth session** with its own `auth.uid()` — the docs are explicit that "the user can't access their account if they sign out, clear browsing data, or use another device." That's the opposite of what's needed: children must be reachable from _any_ device the parent is logged in on, switched instantly, with zero session juggling. It would also 3x the RLS surface (child now has its own `auth.uid()` that needs to be reconciled with the parent's), directly working against the "rewrite 62 policies to a single owned-children subquery" goal. | The `child_profiles` FK+RLS pattern above. One auth session (the parent's), N profile rows, ownership proven server-side per request.                                                                                                                 |
| Embedding "active profile" in the Custom Access Token Hook / `app_metadata`                          | JWTs are only re-minted on refresh (default access-token TTL, not per-request). "Active profile" changes on every UI tap of the profile switcher — far more frequently than a token refreshes. Supabase's own docs single out this exact anti-pattern: token claims are for slow-changing state (roles, org membership), not app state that changes within a session.                                                                                                                                                                                                                                           | Client-side Context/localStorage (see above) + server-side ownership check that doesn't care what's "active," only what's _owned_.                                                                                                                    |
| A new ORM/query builder (Drizzle, Prisma, Kysely) to manage the RLS rewrite                          | Nothing about this milestone needs a query builder — it's plain SQL migrations (as every prior migration in `supabase/migrations/` already is) plus `@supabase/supabase-js`'s existing `.from()` calls on the client. Introducing an ORM mid-milestone, on a brownfield app with 62 policies and live paying users, adds a second source of truth for schema and a new failure surface with zero benefit to this specific problem.                                                                                                                                                                              | Keep using hand-written SQL migrations + `supabase-js`, exactly as the other ~65 existing migration files do.                                                                                                                                         |
| A separate `parents` table that duplicates `email`/`id` from `auth.users` (as the PRD's §4 sketches) | Two places claiming to be the source of truth for parent identity is a drift risk the moment a parent changes their email via Supabase Auth's built-in flow (already used — `useResetPassword`/`useUpdatePassword` exist) and the shadow table doesn't get updated.                                                                                                                                                                                                                                                                                                                                             | Treat `auth.users` as the parent identity table. Add a thin `parent_profiles(id UUID PK REFERENCES auth.users(id))` only for genuinely new columns (consent timestamp, etc.), never duplicating what auth.users already owns.                         |
| Blocking under-18 signup only on the email/password form                                             | This app already has Google/social OAuth (`useSocialAuth.js`, `services/apiAuth.js`) — an age gate placed only in front of the email/password form is bypassable via "Sign in with Google." The PRD's Step 1 (age gate before Step 2 registration) must gate the _entry point to all signup paths_, including the OAuth button, not just the form fields after it.                                                                                                                                                                                                                                              | Gate at the router/page level before any signup CTA renders (OAuth buttons included), and treat post-OAuth account creation as still needing the age confirmation before the account is marked "parent"-eligible, since OAuth provides no birth year. |
| `raw_user_meta_data`/`user_metadata` as the authority for "is this a parent account"                 | This project's own `SEC-01` requirement (v1.0, already shipped) states RLS must use **database state, not `user_metadata`**, for authorization — `user_metadata` is client-editable via the Auth API. The same rule applies here: "is this auth.uid() a parent who owns child X" must be answered by the `child_profiles` table, never by a JWT/metadata flag.                                                                                                                                                                                                                                                  | `owns_child_profile()` SECURITY DEFINER function reading `child_profiles`, per above.                                                                                                                                                                 |

## Stack Patterns by Variant

**If a future milestone needs true genuine multi-guardian access to one child (e.g., both parents, or a parent + grandparent):**

- Add a `child_profile_guardians(child_profile_id, guardian_id, role)` join table instead of changing `parent_id` on `child_profiles` to an array.
- Because it keeps `owns_child_profile()` a simple `EXISTS` over a join table (same shape as `teacher_student_connections`), rather than needing array-contains logic in every policy.

**If RLS query volume against `child_profiles`/`owns_child_profile()` ever becomes a measured bottleneck (not before):**

- Reach for the Custom Access Token Hook to embed owned child IDs in `app_metadata`, with an explicit `supabase.auth.refreshSession()` call after every child-profile CRUD to avoid staleness.
- Because it's the only lever beyond function/index tuning Supabase Auth offers — but treat it as a last resort given the staleness tradeoff, and this app's current data volume (dozens of families, not thousands) does not warrant it now.

## Version Compatibility

| Package A                                 | Compatible With                                                                                         | Notes                                                                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@supabase/supabase-js@^2.48.1` (current) | Postgres RLS `SECURITY DEFINER` + `(select auth.uid())` patterns used throughout `supabase/migrations/` | No client-library version dependency — these are server-side SQL constructs, work with any 2.x client. Safe to leave pinned at `^2.48.1` for this milestone; bump to `^2.110.0`+ is a separate, low-risk maintenance task. |
| `@supabase/supabase-js@3.0.0-next.*`      | —                                                                                                       | Do not adopt. Prerelease-only as of this research date; no stable `3.0.0` exists on npm. Revisit after GA and only in its own maintenance milestone, never bundled into a schema/RLS rewrite.                              |
| React 18 Context API                      | No version constraint                                                                                   | Already the app's established pattern for exactly this kind of cross-cutting, infrequently-changing client state.                                                                                                          |

## Sources

- Repo evidence (HIGH confidence — ground truth for this specific codebase):
  - `C:\Development\PianoApp2\supabase\migrations\20251129000001_teacher_student_linking.sql` — existing "owner + login-less owned rows" pattern (`teacher_id = auth.uid()` subqueries, placeholder students with no `auth.users` FK)
  - `C:\Development\PianoApp2\supabase\migrations\20260404000001_ensure_subscription_rls.sql` — `has_active_subscription()` SECURITY DEFINER convention
  - `C:\Development\PianoApp2\supabase\migrations\20260708120000_is_free_node_null_safe.sql`, `20260601000001_phase1_rhythm_pedagogy.sql` — `is_free_node()` SECURITY DEFINER convention
  - `C:\Development\PianoApp2\supabase\migrations\20260127000003_optimize_rls_auth_plan.sql` — `(select auth.uid())` wrapping already standard in this repo
  - `C:\Development\PianoApp2\src\contexts\` (`SubscriptionContext.jsx`, `SessionTimeoutContext.jsx`, `AccessibilityContext.jsx`) — established client-state pattern for the "active profile" recommendation
  - `C:\Development\PianoApp2\src\features\authentication\useSocialAuth.js` — confirms OAuth signup path exists, informing the age-gate placement warning
  - `C:\Development\PianoApp2\.planning\PROJECT.md` (v4.0 Current Milestone section) — "login-less profile rows already work in production" conclusion, 62-policy/26-table/30-FK scope figures
  - `npm view @supabase/supabase-js version[s]` — confirmed latest stable `2.110.7`, `3.0.0` prerelease-only as of research date
- Official Supabase docs (HIGH confidence):
  - https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook — Custom Access Token Hook capabilities/limits (claims frozen at issuance; not for frequently-changing state)
  - https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv — index policy columns, wrap `auth.uid()` in `(select ...)`, `SECURITY DEFINER` helper functions for joins, restrict `TO authenticated`
  - https://supabase.com/docs/guides/auth/auth-anonymous — anonymous sign-ins are device/session-bound, not designed for multi-profile-per-owner use
- WebSearch, verified against official docs above (MEDIUM confidence, used only for framing/terminology, not as a standalone source of fact):
  - "Supabase RLS Best Practices" (makerkit.dev), "Supabase multi-tenancy" community writeups — corroborate the SECURITY DEFINER + JWT-claims-for-slow-changing-state framing but were not treated as authoritative on their own

---

_Stack research for: Parent-first account architecture (COPPA), PianoApp2 v4.0_
_Researched: 2026-07-21_
