# Phase 1: Identity Schema Expand - Research

**Researched:** 2026-07-22
**Domain:** Postgres DDL / Supabase migration mechanics for an additive, reversible identity-schema expand (no application code)
**Confidence:** HIGH on DDL mechanics and this repo's own precedents (grounded in migrations read directly); MEDIUM on the exact live row counts/shapes of `students`/`avatars` and the full 26-table FK surface (this research session had **no live Supabase query access** — see Environment Availability); LOW/flagged explicitly where CONTEXT.md's D-01 and D-02 appear to conflict and needed reconciliation.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

D-01 through D-29 in `.planning/phases/01-identity-schema-expand/01-CONTEXT.md` are **authoritative and supersede this research where they conflict**. Full text is not reproduced here to avoid drift — read CONTEXT.md directly. Summary of the load-bearing ones this research had to build concrete mechanics for:

- **D-01/D-02:** In-place FK swap, but **dual FK during the expand window** — legacy `students(id)` FK is _kept_, a new `child_profiles(id)` FK is _added_ alongside it. (This research reconciles an apparent tension between D-01's "dropped and re-added" phrasing and D-02's "kept alongside" — see Pitfall R-1 below. **No `DROP CONSTRAINT` runs against any legacy FK in Phase 1.**)
- **D-03:** One atomic migration file (tables + backfill + all FK adds).
- **D-04:** Query-generated, committed FK checklist; same query re-runs as the IDENT-05 verifier.
- **D-06/D-07:** `parent_subscriptions` carved out of the sweep; every other downstream table gets a child-scoped vs. parent-scoped classification, owner-reviewed.
- **D-08 to D-11:** `parents` table minimal (no email), all 15 auth-having students get a `parents` row + re-consent flag, segmentation is automated + owner-reviewed, teachers get no `parents` row in Phase 1.
- **D-12 to D-17:** `child_profiles.nickname` from `students.musical_nickname` with generation fallback (see Pitfall R-2 — the actual column is `musical_nickname`, not `nickname`), `birth_year` year-only, `avatar_id` FK-reused, `is_active` ships now, RLS deny-all, index on `parent_id`.
- **D-18:** `child_profiles.parent_id` `ON DELETE SET NULL`; downstream columns `ON DELETE CASCADE`.
- **D-19 to D-22:** Bidirectional sync triggers (forward `students`→`child_profiles`, reverse `child_profiles`→`students` creating a shadow row), both directions built+tested in Phase 1, loop-guard required, PII in `students` untouched.
- **D-23 to D-25:** Committed inventory of every function/trigger touching `students(id)`; Phase 1 changes only the deletion-cron hazard (child_profiles row must be removed when a student is hard-deleted).
- **D-26 to D-29:** IDENT-05 is a committed, on-demand SQL script (no CI/local-DB dependency); owner-gated apply + committed rollback rehearsed on a Supabase branch; DB tests are SQL assertions on that branch; "zero client-visible change" proven by existing Vitest suite + owner smoke test on a real account.

### Claude's Discretion

- Shadow-row column defaults, and how `trigger_auto_generate_nickname`/`trigger_calculate_is_under_13` interact with reverse-sync inserts (**resolved concretely below, Q3**)
- Migration file naming and timestamp
- Trigger implementation specifics (loop-guard exact form — **resolved concretely below, Q3**: `pg_trigger_depth()` guard + `WHEN` value-change filter)
- Statement ordering within the atomic migration (**recommended order given below**)
- Exact column types and constraint naming conventions, following existing migration style (**recommended below**)

### Deferred Ideas (OUT OF SCOPE)

- Renaming `student_id` → `child_profile_id` — Phase 8's call, informed by the 47-call-site audit.
- Scrubbing legacy PII from `students` — Phase 8, recorded as a known open exposure (D-22).
- Re-pointing the inventoried `SECURITY DEFINER` functions — Phases 2 and 8, from D-23's committed inventory.
- Consent/legal columns on `parents` — added by whichever phase writes them (3 or 6).
- `parent_subscriptions` re-pointing to `parents` — Phase 5, post-sandbox verification.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                 | Research Support                                                                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDENT-01 | `parents` table exists, PK = `auth.users` id, mirrors `teachers` shape                                      | Q-mirror: exact `teachers` DDL read from `20250625120001_add_teacher_schema.sql`; concrete `parents` DDL given below                                                                |
| IDENT-02 | `child_profiles` table exists, zero-PII columns only                                                        | Concrete DDL below; column set is a closed, enumerable list — SQL assertion given in Validation Architecture                                                                        |
| IDENT-03 | `child_profiles.parent_id` nullable, teacher-created profiles valid with no parent                          | Backfill query (Q4) explicitly segments the 5 auth-less rows to `parent_id = NULL`; FK `ON DELETE SET NULL` per D-18                                                                |
| IDENT-04 | Every migrated child profile reuses legacy `students.id` UUID                                               | Backfill is a straight `INSERT ... SELECT s.id, ...` — no `gen_random_uuid()` call for migrated rows; confirmed safe by `20250115000005` (no FK from `students.id` to `auth.users`) |
| IDENT-05 | All identity-bearing FK columns resolve to `child_profiles`, verified by one `information_schema` checklist | Q1 gives the concrete generation/verification SQL, the D-07 scope-classification shape, and the D-06 carve-out                                                                      |

</phase_requirements>

## Summary

This phase is pure Postgres DDL with **zero application code changes** — the phase boundary explicitly excludes React/service-layer work. Everything the planner needs is mechanical: exact `CREATE TABLE` statements (copying the proven `teachers` shape), one `information_schema` query that both generates and verifies the FK checklist, dual-FK `ALTER TABLE ADD CONSTRAINT` statements that never `DROP` anything in Phase 1, two pairs of bidirectional sync triggers with a `pg_trigger_depth()` loop guard, a segmentation query for the 15/5 account split, and one new `AFTER DELETE` trigger that closes the deletion-cron hazard without touching the Deno Edge Function.

Two things this research turned up that are **not** in CONTEXT.md and need the planner's attention:

1. **CONTEXT.md's D-01 and D-02 read as contradictory in isolation** ("dropped and re-added" vs. "kept alongside"). D-02 is the more specific, more recent decision and explicitly states the legacy FK is _kept_. This research treats D-02 as controlling: **Phase 1 issues only `ADD CONSTRAINT` statements, never `DROP CONSTRAINT`, against any of the 26 downstream tables.** Flagged in the Assumptions Log for owner confirmation since it reconciles rather than restates CONTEXT.md.
2. **The actual `students` table column is `musical_nickname`, not `nickname`.** CONTEXT.md's D-12 says "`nickname` comes from `students.nickname`" — no such column exists (verified: only `20260201000001_coppa_schema.sql` touches nickname-shaped columns, and it defines `musical_nickname`). This is almost certainly informal shorthand in CONTEXT.md for the same column `trigger_auto_generate_nickname` already populates, but every DDL statement in the actual migration must read `students.musical_nickname`.
3. **The Supabase MCP server in this project is configured `--read-only`** (`.mcp.json`). This disables `apply_migration` and, per current versions of the MCP server, likely branch-management tools too — meaning D-27's "rehearsed on a Supabase branch" step **cannot run through the MCP tools as currently configured**. The Supabase CLI is available via `npx supabase` (v2.109.1 confirmed, not installed globally or as a devDependency) as the fallback path for branch creation/migration apply. See Environment Availability.

**Primary recommendation:** Write the migration as one atomic file that (a) creates `parents` and `child_profiles`, (b) backfills both from `students`/`auth.users` using the committed, owner-reviewed segmentation table as literal `INSERT` values (not a live heuristic re-run at migration time — the heuristic is for generating the artifact, the migration consumes the reviewed result), (c) adds the two sync-trigger pairs, (d) adds the deletion-cascade trigger, (e) adds one `ADD CONSTRAINT` per checklist row (minus D-06/D-07 carve-outs) — and rehearse apply→rollback→re-apply via `npx supabase` CLI against a branch before any owner-gated production apply.

## Architectural Responsibility Map

| Capability                                      | Primary Tier                         | Secondary Tier                                      | Rationale                                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parents`/`child_profiles` schema definition    | Database / Storage                   | —                                                   | Pure DDL; no API or client surface in this phase                                                                                                          |
| UUID-reuse backfill (15 auth + 5 auth-less)     | Database / Storage                   | —                                                   | One-time `INSERT...SELECT`, executed inside the migration transaction                                                                                     |
| FK repoint (dual-FK, ~26 tables)                | Database / Storage                   | —                                                   | `ALTER TABLE ADD CONSTRAINT`, additive only                                                                                                               |
| Bidirectional sync (students ↔ child_profiles) | Database / Storage                   | —                                                   | Postgres triggers; no ORM or API layer involved anywhere in this stack                                                                                    |
| Deletion-cron hazard fix                        | Database / Storage                   | API / Backend (Edge Function, unmodified)           | Fixed via a DB trigger so the Deno `process-account-deletions` function needs **no code change** — keeps this phase's "Postgres DDL only" boundary intact |
| FK checklist / function inventory artifacts     | Database / Storage (source of truth) | — (repo-committed markdown/SQL, not a runtime tier) | Generated from `information_schema`, committed as review gates                                                                                            |
| Segmentation table (15-row owner review)        | Database / Storage (source of truth) | —                                                   | Generated from `students`/`auth.users` join, committed as a review gate                                                                                   |

No Browser/Client, Frontend-SSR, or CDN tier participates in this phase at all — this is the cleanest possible tier mapping for a GSD phase because the phase boundary is explicitly "zero client-visible change."

## Environment Availability

| Dependency                                                 | Required By                                                                                                  | Available                                                                                                        | Version                                          | Fallback                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live Supabase project (remote, ref `hdltcvgqrtxuxgjdvzzu`) | All schema work — no local Postgres exists (D-26)                                                            | Not queryable in this research session (no MCP tool exposed to this agent)                                       | —                                                | Planner/executor must query live via MCP or CLI before finalizing the FK checklist and function inventory — this research's local grep-based approximations are **not authoritative**                                                                                                                                                    |
| Supabase MCP server (`mcp__supabase__*`)                   | D-27 branch rehearsal (`create_branch`, `apply_migration`, `execute_sql`, `merge_branch`, `list_migrations`) | Configured in `.mcp.json`, but with `--read-only` flag                                                           | supabase-mcp-server (latest via npx)             | `--read-only` disables `apply_migration` and, in current versions, is being extended to disable branch-mutation tools too [CITED: github.com/supabase-community/supabase-mcp#112, supabase.com/docs/guides/ai-tools/mcp] — **the flag must be removed from `.mcp.json` for the execution phase**, or the CLI fallback below must be used |
| Supabase CLI                                               | D-27 branch create/apply/rollback if MCP write tools are unavailable                                         | Not a global binary, not a `package.json` devDependency, but resolves via `npx supabase`                         | 2.109.1 (confirmed via `npx supabase --version`) | None needed — `npx supabase` works without installation                                                                                                                                                                                                                                                                                  |
| `psql` / direct Postgres client                            | Ad hoc verification during planning                                                                          | Not checked in this session (Windows dev machine — see `env` block, no `command -v` result attempted for `psql`) | —                                                | Use Supabase SQL Editor (dashboard) or MCP `execute_sql` (read-only mode still permits reads) as the fallback for read-only checklist generation                                                                                                                                                                                         |

**Missing dependencies with no fallback:** None — every write-capable path has a fallback (CLI for MCP's read-only restriction).

**Missing dependencies with fallback:** Supabase MCP write tools (fallback: `npx supabase` CLI, or temporarily drop `--read-only` from `.mcp.json` for the execution session only, per user's own git-safety norms — do not commit a credential/config change without the user's explicit go-ahead).

## Standard Stack

No new libraries. This phase touches nothing in `package.json`.

### Core

| Tool                      | Version                                           | Purpose                                       | Why Standard                                                                                                                                                  |
| ------------------------- | ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL (via Supabase) | Supabase-managed (project `hdltcvgqrtxuxgjdvzzu`) | All schema/trigger/backfill work              | This project's only database; no ORM anywhere in the stack (CLAUDE.md, `.planning/codebase/ARCHITECTURE.md` "Validation" section)                             |
| Supabase CLI              | 2.109.1 (via `npx supabase`)                      | Branch create/apply/rollback rehearsal (D-27) | Confirmed working via `npx` without install; no project devDependency exists yet — planner should decide whether to add it or keep using `npx` per-invocation |

### Supporting

| Tool                                    | Version                                 | Purpose                                                                                                            | When to Use                                                                                                                          |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Supabase MCP tools (`mcp__supabase__*`) | latest, `--read-only` in current config | Read-only inspection (`list_tables`, `execute_sql` reads, `get_advisors`, `get_logs`) during planning/verification | Any time a read is sufficient; do not rely on it for `apply_migration`/branch mutation until the read-only flag question is resolved |

### Alternatives Considered

| Instead of                                 | Could Use                                                                | Tradeoff                                                                                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB trigger for deletion-cascade fix (D-25) | Literal FK `child_profiles.id REFERENCES students(id) ON DELETE CASCADE` | **Rejected** — would block every Phase-3+ child profile created with no backing `students` row, defeating the entire reverse-sync-trigger design (D-20). See Q5.                                                                  |
| `pg_trigger_depth()` loop guard            | Pure `WHEN`-clause value-comparison guard only                           | `WHEN`-only convergence is a valid pattern but depends on every synced column being compared correctly; `pg_trigger_depth()` is a deterministic hard-stop independent of which columns changed. Recommend both together (see Q3). |
| pgTAP for DB tests (D-28)                  | Plain `.sql` assertion scripts run on a Supabase branch                  | Already rejected in CONTEXT.md D-28 as new infrastructure with a local-Postgres dependency; not revisited here.                                                                                                                   |

**Installation:** None required.

**Version verification:** `npx supabase --version` → `2.109.1` confirmed live in this session (2026-07-22). No `package.json` entry exists for `@supabase/supabase-js` beyond `^2.48.1` (unrelated — client SDK, not the CLI).

## Architecture Patterns

### System Architecture Diagram

```
students (existing)                    child_profiles (NEW)
┌──────────────────────┐                ┌──────────────────────┐
│ id (PK, no FK to      │  UUID reuse    │ id (PK) — reuses      │
│   auth.users, per     │───(backfill)──▶│   students.id for     │
│   20250115000005)     │                │   the 20 migrated     │
│ musical_nickname       │◀── forward ────│   rows                │
│ avatar_id              │    sync AFTER  │ parent_id (FK→parents,│
│ date_of_birth          │    INSERT/     │   SET NULL, indexed)  │
│ account_status         │    UPDATE      │ nickname               │
│ (PII columns untouched,│                │ avatar_id (FK→avatars)│
│  D-22)                 │──── reverse ──▶│ birth_year (year-only)│
└──────────────────────┘    sync AFTER    │ is_active (default T) │
         ▲                  INSERT/UPDATE │ RLS: deny-all         │
         │ (shadow row,                   └──────────┬────────────┘
         │  nickname+avatar only,                     │
         │  loop-guarded via                          │ new FK (ADD,
         │  pg_trigger_depth())                        │  not DROP)
         │                                             ▼
         │                              parents (NEW)
         │                              ┌──────────────────────┐
         │                              │ id (PK, REFERENCES    │
         │                              │   auth.users(id))     │
         │                              │ display_name (nullable)│
         │                              │ (no email — lives in  │
         │                              │   auth.users)          │
         │                              └──────────────────────┘
         │
  DUAL FK on every downstream table's identity column (e.g. students_score.student_id):
  ┌─────────────────────────────────────────────────────────────────┐
  │  student_id → students(id)   [LEGACY — kept, ON DELETE CASCADE]  │
  │  student_id → child_profiles(id) [NEW — added, ON DELETE CASCADE]│
  └─────────────────────────────────────────────────────────────────┘
  Both FKs satisfiable simultaneously because child_profiles.id mirrors
  students.id 1:1 for every migrated row (IDENT-04).

DELETION HAZARD FIX (D-24/D-25):
  process-account-deletions Edge Function (unmodified)
      │  DELETE FROM students WHERE id = studentId
      │  (existing legacy-FK CASCADE fires as it does today)
      ▼
  NEW: AFTER DELETE ON students trigger
      │  DELETE FROM child_profiles WHERE id = OLD.id
      ▼
  child_profiles(id)-FK CASCADE fires too — no hollow profile survives
```

### Recommended Project Structure

```
supabase/
└── migrations/
    └── 2026072200000X_add_parents_and_child_profiles.sql   # NEW — the one atomic Phase 1 migration
    └── 2026072200000X_add_parents_and_child_profiles.down.sql  # NEW — committed rollback (D-27)

.planning/phases/01-identity-schema-expand/
├── 01-fk-checklist.md          # NEW artifact — D-04 committed checklist (generation query output + scope/carve-out columns)
├── 01-function-inventory.md    # NEW artifact — D-23 committed inventory (functions/triggers touching students(id))
├── 01-account-segmentation.md  # NEW artifact — D-10 owner-reviewed 15-row segmentation table
└── 01-db-assertions.sql        # NEW — D-28 SQL assertion test file, run on a Supabase branch
```

### Pattern 1: In-Place Dual-FK Swap (no DROP in Phase 1)

**What:** Every downstream identity column keeps its name and its legacy FK; a second FK to `child_profiles(id)` is _added_ alongside.
**When to use:** Exactly this phase — reconciles D-01's "swap" framing with D-02's "keep both" refinement.
**Example:**

```sql
-- Source: repo convention from 20260327000002_fix_teacher_fk_references.sql (explicit named constraints),
-- extended per D-02 (ADD only, no DROP, in Phase 1)
ALTER TABLE public.students_score
  ADD CONSTRAINT students_score_student_id_child_profiles_fkey
  FOREIGN KEY (student_id) REFERENCES public.child_profiles(id) ON DELETE CASCADE;
```

Postgres allows multiple FK constraints on the same column referencing different tables — each is checked independently, and both are satisfiable here because `child_profiles.id` mirrors `students.id` 1:1 for every migrated row (the UUID-reuse anchor). Repeat this `ADD CONSTRAINT` once per row of the FK checklist that is not a D-06/D-07 carve-out. Match the `ON DELETE` action of the legacy constraint (every FK found in this repo's migrations targeting `students(id)` uses `CASCADE` — see Q1 for the caveat that this must be confirmed per-row against the live checklist, not assumed).

### Pattern 2: Converging Bidirectional Sync with `pg_trigger_depth()` Guard

**What:** Two trigger pairs (forward `students`→`child_profiles`, reverse `child_profiles`→`students`), each guarded so a write on one side cannot recurse indefinitely into the other.
**When to use:** D-19/D-20/D-21's expand-window safety net.
**Example:** See Q3 below for the full concrete SQL.

### Pattern 3: DB-Trigger Deletion Cascade Instead of a Literal FK

**What:** An `AFTER DELETE ON students` trigger removes the matching `child_profiles` row, rather than a hard FK from `child_profiles.id` to `students.id`.
**When to use:** Whenever a "delete X should also delete Y" rule must NOT constrain inserts into Y that have no X yet (exactly this phase's situation from Phase 3 onward).
**Trade-off:** A real FK with `ON DELETE CASCADE` would be simpler DDL, but Postgres enforces FK constraints immediately (or at latest at end-of-transaction for deferred constraints) — a `child_profiles.id REFERENCES students(id)` FK would reject every Phase-3+ parent-created child profile at INSERT time, since no `students` row exists yet for a brand-new child. The trigger achieves the same "delete cascades" outcome without that constraint.

### Anti-Patterns to Avoid

- **Treating D-01's "dropped and re-added" as a literal instruction to `DROP CONSTRAINT` in Phase 1:** D-02 immediately overrides this — the legacy FK must survive Phase 1 untouched. A migration that drops any legacy FK in Phase 1 breaks the "fully reversible with `DROP TABLE ... CASCADE`" guarantee the whole phase depends on (dropping `child_profiles`/`parents` would leave downstream tables with a dangling FK reference if the legacy one had already been dropped).
- **Writing `child_profiles.id REFERENCES students(id)` as a hard FK:** blocks all Phase 3+ new-child inserts (see Pattern 3).
- **Combining `AFTER INSERT OR UPDATE OF col1, col2` with a `WHEN` clause that references `OLD`:** for a trigger firing on both INSERT and UPDATE, `OLD` is not defined for the INSERT event — write two separate triggers (one `AFTER INSERT`, one `AFTER UPDATE OF ... WHEN (...)`) instead of one combined trigger with a WHEN clause spanning both events.
- **Trusting `students.nickname` as a real column name in any DDL statement:** it does not exist. Use `musical_nickname`.

## Don't Hand-Roll

| Problem                                       | Don't Build                                             | Use Instead                                                                                                                                                                                                                           | Why                                                                               |
| --------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| "Adult, auth-owned, fan-out root" table shape | A new schema pattern for `parents`                      | Copy `teachers` verbatim (id PK REFERENCES auth.users(id), created_at, updated_at, is_active)                                                                                                                                         | Already proven in production; CONTEXT.md D-08 explicitly says copy, don't invent  |
| Preset avatar enforcement                     | A new avatar-id text/enum column on `child_profiles`    | Reuse the existing `avatars` table via FK (same as `students.avatar_id` already does)                                                                                                                                                 | PROFILE-02's "no upload" rule becomes structural, not just UI-enforced (D-14)     |
| Non-PII display name generation               | A new nickname-generator for `child_profiles`           | Reuse `generate_musical_nickname()` (already defined, `20260201000001_coppa_schema.sql`) in the backfill's `COALESCE`                                                                                                                 | Zero new logic; already tested in production for `students`                       |
| Audit-log pattern for the deletion hazard     | A bespoke logging mechanism for the new cascade trigger | None needed — `account_deletion_log` already gets the row-count/category evidence from the _existing_ Edge Function; the new trigger just makes sure `child_profiles` doesn't survive orphaned. No new audit table needed in Phase 1. | Reuse existing precedent (D-25 doesn't ask for new audit infra, just correctness) |

**Key insight:** every reusable pattern this phase needs already exists in this codebase (`teachers` table shape, `avatars` FK, `generate_musical_nickname()`, `account_deletion_log`). There is no library or pattern gap — the entire risk surface is getting the _mechanics_ (dual FK, trigger loop-guard, checklist completeness) right, not inventing anything new.

## Runtime State Inventory

> Included because this phase performs a live backfill against production data and modifies a live deletion-cron interaction, even though it is framed as "additive."

| Category            | Items Found                                                                                                                                                                                                                                              | Action Required                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stored data         | 20 `students` rows (15 auth-having + 5 auth-less) get mirrored into new `parents`/`child_profiles` rows via one-time backfill `INSERT...SELECT`. No existing row's `id`/FK values change (UUID reuse, IDENT-04).                                         | Data migration (one-time INSERT, inside the atomic migration transaction) — not a code-only change                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Live service config | `process-account-deletions` Edge Function's deletion path is **behaviorally extended** (a `students` DELETE now also removes the corresponding `child_profiles` row) without any Edge Function code deploy — the fix lives entirely in a new DB trigger. | DB trigger only (no Edge Function redeploy needed) — confirm this is acceptable given the function's own code comments enumerate `DATA_CATEGORIES_REMOVED` and don't currently list `child_profiles`; **the comment/log list in `process-account-deletions/index.ts` will now be incomplete/stale** even though behavior is correct — flag as a documentation debt item for the plan (update the `DATA_CATEGORIES_REMOVED` comment and the parent-facing email's category list to include `child_profiles`, since the email is meant to be an evidentiary/compliance artifact) |
| OS-registered state | None — pg_cron schedule for `process-account-deletions` is unaffected; no OS-level task, no Windows Task Scheduler entry, no pm2 process.                                                                                                                | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Secrets/env vars    | None — no new secret, no renamed env var. `CRON_SECRET`, `AUDIT_HMAC_SECRET`, etc. are untouched by this phase.                                                                                                                                          | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Build artifacts     | None — no npm package, no build step touches this phase. `.mcp.json`'s `--read-only` flag is a _config_ state (not a build artifact) that blocks D-27's branch workflow — see Environment Availability.                                                  | Config change decision (not a build fix) — owner must decide whether to relax `--read-only` for the execution session                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

**Nothing found in category "OS-registered state" or "Secrets/env vars"** — verified by reading the only live cron consumer (`process-account-deletions/index.ts`) and confirming it reads no new/renamed environment variable and registers no OS-level schedule itself (scheduling is pg_cron, inside Postgres, unaffected by this phase's DDL).

---

## Q1 — The authoritative FK checklist (D-04, IDENT-05)

### Generation query (run pre-migration, output committed as the checklist artifact)

```sql
-- Enumerates every FK column currently targeting students(id).
-- Pattern extends the template already used in this repo's own
-- 20250115000005_remove_student_auth_fkey.sql (table_constraints +
-- key_column_usage + constraint_column_usage), adding referential_constraints
-- for the ON DELETE action.
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name,
  rc.delete_rule AS on_delete_action
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
  AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
  AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'students'
  AND ccu.column_name = 'id'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

**This query could not be run in this research session** (no live Supabase query access — see Environment Availability). A local `grep -rn "REFERENCES students(id)"` across `supabase/migrations/` found only **10 files / ~14 column references** — far short of the roadmap's stated 30, because grep cannot see columns added via bare `ALTER TABLE ADD CONSTRAINT` in a separate statement, constraints with non-obvious formatting (`REFERENCES students (id)` with a space, multi-line `ALTER TABLE` blocks), or the true current live state after 100+ migrations including corrective ones. **This confirms D-04's own rationale — grep is exactly the unreliable method D-04 explicitly rejects.** Planning/execution must run the query above live via Supabase MCP (`execute_sql`, permitted in read-only mode) or the CLI before finalizing the checklist.

### Committed artifact shape (adds D-06/D-07 scope columns, which the query alone cannot produce)

The generation query's output is not the whole artifact — D-07 requires owner-reviewed scope classification appended by hand:

| table_name                                         | column_name | constraint_name                      | on_delete_action | scope                | carve_out | reason                                                                                                                                                                                                  |
| -------------------------------------------------- | ----------- | ------------------------------------ | ---------------- | -------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| students_score                                     | student_id  | students_score_student_id_fkey       | CASCADE          | child-scoped         | no        | —                                                                                                                                                                                                       |
| parent_subscriptions                               | student_id  | parent_subscriptions_student_id_fkey | CASCADE          | parent-scoped        | **yes**   | D-06 — Phase 5 re-points to `parents`, not `child_profiles`; sweeping now moves it in the known-wrong direction                                                                                         |
| push_subscriptions                                 | student_id  | (from checklist)                     | CASCADE          | _TBD — owner review_ | _TBD_     | candidate parent-scoped per D-07 (listed as a named candidate in CONTEXT.md)                                                                                                                            |
| student_weekly_report_opt_out (or similarly named) | student_id  | (from checklist)                     | CASCADE          | _TBD — owner review_ | _TBD_     | candidate parent-scoped per D-07                                                                                                                                                                        |
| parental_consent_log                               | student_id  | parental_consent_log_student_id_fkey | CASCADE          | _TBD — owner review_ | _TBD_     | candidate parent-scoped per D-07 (a consent record is arguably about the _parent's_ attestation, not the child)                                                                                         |
| account_deletion_log                               | —           | —                                    | —                | N/A                  | N/A       | **No FK exists** — table deliberately has no FK to `students` (`20260321000001_account_deletion_log.sql`, "audit record must survive student deletion"); will not appear in the query output, correctly |

**The IDENT-05 verifier re-runs the same generation query, but pointed at `child_profiles`:**

```sql
-- Post-migration verifier: confirms every non-carved-out checklist row now ALSO
-- has a second FK targeting child_profiles(id). This is the concrete SQL behind
-- D-02's reframed SC #5 ("every identity column has a child_profiles FK"),
-- NOT "zero references to students(id) remain" (that's Phase 8's assertion).
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name,
  rc.delete_rule AS on_delete_action
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'child_profiles'
  AND ccu.column_name = 'id'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

Verification passes when every `(table_name, column_name)` pair from the pre-migration checklist **that is not a D-06/D-07 carve-out** appears in this post-migration output. Diffing the two committed query outputs (both timestamped, both committed as artifacts) is the verifier — no new tooling.

## Q2 — In-place FK swap mechanics (D-01, D-02)

**Confirmed:** Postgres allows multiple FK constraints on one column, each targeting a different table, as long as constraint names are unique within the table. Both are enforced independently and both are satisfiable here because of the UUID-reuse anchor (every migrated row's `child_profiles.id` equals its `students.id`).

**No `DROP CONSTRAINT` statement runs in Phase 1.** Only `ADD CONSTRAINT`:

```sql
ALTER TABLE public.<table>
  ADD CONSTRAINT <table>_<column>_child_profiles_fkey
  FOREIGN KEY (<column>) REFERENCES public.child_profiles(id) ON DELETE <action>;
```

**Naming convention:** this repo's existing convention (seen in `20260327000002_fix_teacher_fk_references.sql`, `20250115000005_remove_student_auth_fkey.sql`) is `<table>_<column>_fkey` for a single FK. For the _second_ FK on the same column, disambiguate with the target table name: `<table>_<column>_child_profiles_fkey`. The legacy constraint keeps its existing (often auto-generated) name unchanged — it is never touched.

**`ON DELETE` action:** match the legacy constraint's action, per-row from the checklist (Q1) — every FK targeting `students(id)` found via grep in this repo uses `CASCADE`, but this must be confirmed per-row against the live query output, not assumed uniform. D-18 confirms downstream columns should be `CASCADE` (matching legacy behavior).

## Q3 — Bidirectional sync triggers (D-19, D-20, D-21)

**Recommended loop-guard: `pg_trigger_depth()` as the hard stop, plus a `WHEN` value-change filter for efficiency.** `pg_trigger_depth()` is a built-in Postgres function returning the current nesting depth of trigger execution (0 outside any trigger). Guarding with `IF pg_trigger_depth() > 1 THEN RETURN; END IF;` guarantees the propagation chain terminates after exactly one hop, regardless of whether every synced column is correctly compared — a stronger guarantee than relying on value-convergence alone.

```sql
-- =========================================================================
-- FORWARD: students -> child_profiles
-- =========================================================================
CREATE OR REPLACE FUNCTION sync_student_to_child_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Loop guard: if we're already inside a nested trigger call (i.e. this
  -- fired as a side effect of the reverse trigger below), stop propagation.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  INSERT INTO child_profiles (id, nickname, avatar_id, birth_year, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.musical_nickname, generate_musical_nickname()),
    NEW.avatar_id,
    EXTRACT(YEAR FROM NEW.date_of_birth)::INTEGER,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname   = EXCLUDED.nickname,
    avatar_id  = EXCLUDED.avatar_id,
    birth_year = EXCLUDED.birth_year,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Separate INSERT and UPDATE triggers (a combined "INSERT OR UPDATE OF ..."
-- trigger cannot reference OLD in a WHEN clause, since OLD is undefined for
-- the INSERT event).
CREATE TRIGGER trigger_sync_student_insert
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_to_child_profile();

CREATE TRIGGER trigger_sync_student_update
  AFTER UPDATE OF musical_nickname, avatar_id, date_of_birth ON students
  FOR EACH ROW
  WHEN (
    NEW.musical_nickname IS DISTINCT FROM OLD.musical_nickname
    OR NEW.avatar_id IS DISTINCT FROM OLD.avatar_id
    OR NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth
  )
  EXECUTE FUNCTION sync_student_to_child_profile();

-- =========================================================================
-- REVERSE: child_profiles -> students (shadow row)
-- =========================================================================
CREATE OR REPLACE FUNCTION sync_child_profile_to_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Shadow row: nickname + avatar ONLY, no PII (D-19). musical_nickname is
  -- set explicitly here, so trigger_auto_generate_nickname (BEFORE INSERT,
  -- fires only when musical_nickname IS NULL) is a safe no-op on this path.
  -- date_of_birth is intentionally omitted (column default NULL), so
  -- trigger_calculate_is_under_13 (BEFORE INSERT OR UPDATE OF date_of_birth,
  -- fires unconditionally on INSERT regardless of the column list) computes
  -- is_under_13 = false via its own NULL branch -- correct, non-PII-leaking
  -- default for a shadow row that carries no birth date.
  INSERT INTO students (id, musical_nickname, avatar_id, account_status)
  VALUES (NEW.id, NEW.nickname, NEW.avatar_id, 'active')
  ON CONFLICT (id) DO UPDATE SET
    musical_nickname = EXCLUDED.musical_nickname,
    avatar_id        = EXCLUDED.avatar_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_child_profile_insert
  AFTER INSERT ON child_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_child_profile_to_student();

CREATE TRIGGER trigger_sync_child_profile_update
  AFTER UPDATE OF nickname, avatar_id ON child_profiles
  FOR EACH ROW
  WHEN (
    NEW.nickname IS DISTINCT FROM OLD.nickname
    OR NEW.avatar_id IS DISTINCT FROM OLD.avatar_id
  )
  EXECUTE FUNCTION sync_child_profile_to_student();
```

**Why this doesn't infinite-loop:** trace a Phase-3-style write, `INSERT INTO child_profiles` for a brand-new child (no prior `students` row): the `trigger_sync_child_profile_insert` (depth 1) fires, its function body is executing at trigger depth 1 so the guard doesn't block it, and it does `INSERT INTO students ...`. That INSERT fires `trigger_sync_student_insert` — but by now we're at trigger depth 2 (nested inside the child_profiles trigger's own execution), so its guard (`pg_trigger_depth() > 1`) returns immediately. **Total depth reached: 2. No further recursion possible.** The existing `trigger_auto_generate_nickname`/`trigger_calculate_is_under_13` triggers on `students` are `BEFORE` triggers and fire as normal during that nested INSERT (they don't participate in the loop at all — they only ever run once, synchronously, as part of the `students` row being physically written).

## Q4 — Backfill + segmentation (D-09, D-10, IDENT-03, IDENT-04)

### Segmentation heuristic query (produces the 15-row owner-reviewed artifact)

```sql
SELECT
  s.id,
  au.email AS auth_email,
  au.created_at AS auth_created_at,
  s.date_of_birth,
  s.parent_email,
  s.consent_verified_at,
  (
    s.date_of_birth IS NOT NULL
    AND s.date_of_birth > (au.created_at::date - INTERVAL '18 years')
  ) AS dob_under_18_at_signup,
  (s.parent_email IS NULL OR s.parent_email = au.email) AS parent_email_null_or_self,
  (s.consent_verified_at IS NULL) AS no_consent_verified,
  (
    (s.date_of_birth IS NOT NULL AND s.date_of_birth > (au.created_at::date - INTERVAL '18 years'))
    AND (s.parent_email IS NULL OR s.parent_email = au.email)
    AND s.consent_verified_at IS NULL
  ) AS flag_self_registered_minor
FROM students s
JOIN auth.users au ON au.id = s.id   -- INNER JOIN: only the 15 auth-having students appear
ORDER BY s.id;
```

Commit this output as `01-account-segmentation.md` with an added `owner_override` column the owner can hand-fill before the migration is written from it (D-10's owner-review gate).

### The 5 auth-less rows (trivially `parent_id = NULL`, no heuristic needed)

```sql
SELECT s.id, s.musical_nickname, s.avatar_id, s.date_of_birth
FROM students s
LEFT JOIN auth.users au ON au.id = s.id
WHERE au.id IS NULL;
```

Should return exactly 5 rows per the CONTEXT.md count — confirm this live before writing the migration; if it doesn't, the segmentation assumption needs re-verification before backfill.

### `birth_year` derivation (D-13)

```sql
EXTRACT(YEAR FROM s.date_of_birth)::INTEGER AS birth_year
```

`NULL` propagates correctly if `date_of_birth` is `NULL` (no error, no default needed).

### `nickname` fallback (D-12) — using the actual column name

```sql
COALESCE(s.musical_nickname, generate_musical_nickname()) AS nickname
```

Reuses the existing `generate_musical_nickname()` function (`20260201000001_coppa_schema.sql`) directly in the backfill's `SELECT` — no need to rely on the `trigger_auto_generate_nickname` trigger firing, since the backfill is a bulk `INSERT ... SELECT`, not a row-by-row API call.

### Backfill shape (both `parents` and `child_profiles`, in the atomic migration, informed by the reviewed segmentation table)

```sql
-- 1. parents — one row per auth-having student (15 rows), from the
--    owner-reviewed segmentation table's final id list (not re-run live).
INSERT INTO parents (id, display_name)
SELECT au.id, NULL
FROM auth.users au
WHERE au.id IN (/* 15 ids from the reviewed segmentation artifact */);

-- 2. child_profiles — all 20 rows (15 parented + 5 parent_id NULL).
INSERT INTO child_profiles (id, parent_id, nickname, avatar_id, birth_year, is_active)
SELECT
  s.id,
  au.id,  -- NULL via the LEFT JOIN for the 5 auth-less rows
  COALESCE(s.musical_nickname, generate_musical_nickname()),
  s.avatar_id,
  EXTRACT(YEAR FROM s.date_of_birth)::INTEGER,
  TRUE
FROM students s
LEFT JOIN auth.users au ON au.id = s.id;
```

## Q5 — The deletion-cron hazard (D-24, D-25)

**Live deletion path, cited:** `supabase/functions/process-account-deletions/index.ts`, Step 2 (line ~397): `supabase.from('students').delete().eq('id', studentId)`, relying on the existing `students(id)` `ON DELETE CASCADE` FKs to remove downstream data (`DATA_CATEGORIES_REMOVED` constant lists 14 tables, lines 40-55). With this phase's new dual FK, that same `DELETE` also satisfies the _new_ `child_profiles(id)`-targeting FK's CASCADE — but only for rows that reference `child_profiles.id`. Since nothing writes new rows via `child_profiles.id` in Phase 1, this particular sub-case is inert _today_, but the `child_profiles` row **itself** has no trigger or FK causing it to be removed when `students` is deleted — it survives, hollow.

**Fix — a new DB trigger, zero Edge Function code change:**

```sql
CREATE OR REPLACE FUNCTION cascade_delete_child_profile_on_student_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM child_profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_cascade_delete_child_profile
  AFTER DELETE ON students
  FOR EACH ROW
  EXECUTE FUNCTION cascade_delete_child_profile_on_student_delete();
```

This is the concrete implementation of D-25's "ON DELETE CASCADE from students to child_profiles" option — implemented as a trigger rather than a literal FK constraint, because (per Q2/Pattern 3) a literal `child_profiles.id REFERENCES students(id)` FK would block every Phase-3+ parent-created child profile. **Order of operations is correct:** the Edge Function's existing `DELETE FROM students` fires the legacy-FK CASCADEs exactly as it does today, then this new `AFTER DELETE` trigger fires and removes the `child_profiles` row, whose own downstream FK (added by this phase) CASCADEs too — belt-and-suspenders, no hollow profile survives either way.

**Documentation debt to flag for the plan:** `process-account-deletions/index.ts`'s `DATA_CATEGORIES_REMOVED` constant (used both for internal logging and the parent-facing confirmation email's bullet list) does not mention `child_profiles` and won't automatically pick it up since the removal now happens via a DB trigger the Edge Function doesn't know about. This is a **documentation-only** gap (the deletion is real and correct either way) but the parent-facing email is meant to be an evidentiary compliance artifact — the plan should note this as a Phase-7-or-later cleanup item (updating Edge Function code is out of this phase's DDL-only boundary) rather than silently leaving the email under-representing what was deleted.

## Q6 — Verification & rollback (D-26, D-27, D-28, D-29)

**Supabase branch workflow, with the MCP caveat already flagged in Environment Availability:**

1. Create a branch (`mcp__supabase__create_branch` if MCP write tools are enabled, else `npx supabase branches create <name>` per the CLI).
2. Apply the up-migration (`mcp__supabase__apply_migration` or `npx supabase db push` against the branch).
3. Run the D-28 SQL assertion file (row counts, FK targets via the Q1 verifier query, trigger round-trips per below) — via `execute_sql` (works even in read-only MCP mode, since it's a read against data written by the same rehearsal) or `npx supabase db execute`.
4. Apply the down-migration (rollback) and re-run the assertions to confirm a clean rollback state.
5. Re-apply the up-migration once more to prove idempotency of the whole apply→rollback→re-apply cycle.
6. Only then, owner-gated, apply to production — same gate pattern as the `note_mastery` column and the v3.5 production migration (both cited in CONTEXT.md D-27).
7. Merge/discard the branch (`mcp__supabase__merge_branch` or CLI equivalent) once production apply is confirmed.

**Trigger round-trip SQL assertions (committed as `01-db-assertions.sql`, run inside a transaction that's rolled back at the end — D-28):**

```sql
BEGIN;

-- Forward sync: insert a synthetic student, assert child_profiles mirrors it.
INSERT INTO students (id, musical_nickname, avatar_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Kid', <some existing avatar_id>);

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM child_profiles
    WHERE id = '00000000-0000-0000-0000-000000000001'
      AND nickname = 'Test Kid'
  ), 'Forward sync trigger did not create matching child_profiles row';
END $$;

-- Reverse sync: insert a synthetic child_profiles row with no prior students row,
-- assert a shadow students row appears.
INSERT INTO child_profiles (id, parent_id, nickname, avatar_id, birth_year)
VALUES ('00000000-0000-0000-0000-000000000002', NULL, 'Shadow Kid', <some avatar_id>, 2018);

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM students
    WHERE id = '00000000-0000-0000-0000-000000000002'
      AND musical_nickname = 'Shadow Kid'
  ), 'Reverse sync trigger did not create matching shadow students row';
END $$;

-- Deletion hazard fix: delete the first synthetic student, assert its
-- child_profiles row is also gone.
DELETE FROM students WHERE id = '00000000-0000-0000-0000-000000000001';

DO $$
BEGIN
  ASSERT NOT EXISTS (
    SELECT 1 FROM child_profiles WHERE id = '00000000-0000-0000-0000-000000000001'
  ), 'child_profiles row survived students deletion -- D-24/D-25 hazard not closed';
END $$;

ROLLBACK;
```

**"Zero client-visible change" (D-29):** run `npm run test:run` (full Vitest suite) against the branch's connection string if feasible, or against production post-apply if the branch can't be wired to the app's env — then the owner performs a manual smoke test logging into one real production student account, checking trail progress/XP/streak/dashboard render identically. This is explicitly _not_ substitutable by the automated suite alone, per D-29's own reasoning (mocks don't catch a wrong FK target).

## Q7 — The function/trigger inventory (D-23)

**Confirmed by direct reading, functions whose body resolves identity against `students`/`auth.uid()`:**

| Function/Trigger                                                                 | File                                                      | References `students(id)`?                                                                    | Notes                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `award_xp(p_student_id, p_xp_amount)`                                            | `20260126000001_fix_award_xp_security.sql`                | Yes — `auth.uid() != p_student_id` check, `UPDATE students ... WHERE id = p_student_id`       | Re-pointed in Phase 2/8 to resolve via `child_profiles`/active-child, not `auth.uid()` directly                                                                                                                                                                                                             |
| `has_active_subscription(p_student_id)`                                          | `20260404000001_ensure_subscription_rls.sql`              | Indirect — queries `parent_subscriptions WHERE student_id = p_student_id`                     | Re-pointed in Phase 5 per D-06 carve-out                                                                                                                                                                                                                                                                    |
| `is_free_node(p_node_id)`                                                        | `20260708120000_is_free_node_null_safe.sql`               | **No** — pure node-ID whitelist check, no identity resolution                                 | Included in D-23's inventory only because it's always called _alongside_ `has_active_subscription()` in the same `WITH CHECK` clauses (content-gate pair), not because its own body needs re-pointing                                                                                                       |
| `check_rate_limit(p_student_id, ...)`                                            | `20260201000002_add_rate_limiting.sql`                    | Yes — `auth.uid() != p_student_id` check, reads/writes `rate_limits` keyed on `student_id`    | Re-pointed in Phase 2/8                                                                                                                                                                                                                                                                                     |
| `request_parental_consent`, `verify_parental_consent`, `revoke_parental_consent` | `20260201000001_coppa_schema.sql`                         | Yes — all three take `p_student_id`, check `auth.uid() = p_student_id`, read/write `students` | COPPA export/delete-adjacent; re-pointed in Phase 2/8                                                                                                                                                                                                                                                       |
| `trigger_auto_generate_nickname` / `auto_generate_nickname()`                    | `20260201000001_coppa_schema.sql`                         | Operates on `students` directly (BEFORE INSERT)                                               | Interaction with reverse-sync insert confirmed safe in Q3 above                                                                                                                                                                                                                                             |
| `trigger_calculate_is_under_13` / `calculate_is_under_13()`                      | `20260201000001_coppa_schema.sql`                         | Operates on `students` directly (BEFORE INSERT/UPDATE)                                        | Interaction with reverse-sync insert confirmed safe in Q3 above                                                                                                                                                                                                                                             |
| `process-account-deletions` (Edge Function, not a DB function)                   | `supabase/functions/process-account-deletions/index.ts`   | Yes — queries/deletes `students` by `account_status`/`deletion_scheduled_at`                  | The only one Phase 1 _changes_ (via the new DB trigger, Q5) — all others are inventoried only                                                                                                                                                                                                               |
| `dataExportService.js`'s hardcoded `{ table, idColumn: 'student_id' }` list      | `src/services/dataExportService.js` (client code, not DB) | Yes, by convention                                                                            | **Not a Phase 1 concern** (application code, out of this phase's DDL-only boundary) — flagged here only because it's a second hardcoded "identity table list" that must independently stay in sync in a later phase; worth noting in the committed function inventory as a related-but-out-of-scope finding |

Commit this table (expanded with the live `information_schema`/`pg_proc` search results — see caveat below) as `01-function-inventory.md`.

**A `pg_proc` source-text search is the mechanical way to find any function this manual read missed:**

```sql
SELECT p.proname, n.nspname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%students%'
ORDER BY p.proname;
```

Run this live (not possible in this research session — no DB access) to catch anything this file-reading pass missed; cross-reference against the table above.

---

## Common Pitfalls

### Pitfall R-1: Treating D-01 literally and issuing `DROP CONSTRAINT` in Phase 1

**What goes wrong:** A migration that drops the legacy `students(id)` FK on any downstream table in Phase 1, following D-01's "dropped and re-added" wording literally.
**Why it happens:** D-01 and D-02 are two sequential decisions in the same discussion; D-01 describes the _end-state_ framing (in contrast to the rejected "parallel columns" alternative), and D-02 is the _refinement_ that actually governs Phase 1's mechanics. Reading D-01 in isolation is a natural but incorrect shortcut.
**How to avoid:** Every `ALTER TABLE` statement touching a legacy FK in the Phase 1 migration must be `ADD CONSTRAINT` only. Grep the drafted migration file for `DROP CONSTRAINT` before considering it done — zero matches expected (the deletion-hazard trigger, Q5, is the only `DROP`-adjacent DDL and it's a trigger, not a constraint drop).
**Warning signs:** A migration diff containing `DROP CONSTRAINT ... students`.

### Pitfall R-2: Writing DDL against `students.nickname` (doesn't exist)

**What goes wrong:** Any `SELECT`/`INSERT`/trigger body referencing `students.nickname` fails at migration-apply time with `column "nickname" does not exist`.
**Why it happens:** CONTEXT.md's D-12 uses "nickname" as shorthand; the actual column, confirmed by direct file read, is `musical_nickname` (`20260201000001_coppa_schema.sql`).
**How to avoid:** Every DDL statement in this research uses `musical_nickname` explicitly for the `students` side and `nickname` for the new `child_profiles` column (matching IDENT-02's field name). Re-verify against a live `\d students` or `information_schema.columns` query before finalizing the migration, since this research had no live DB access.
**Warning signs:** Migration apply fails immediately on the backfill `INSERT`/trigger creation statements.

### Pitfall R-3: Assuming the Supabase MCP branch tools work as configured

**What goes wrong:** D-27's rehearsal step is planned assuming `mcp__supabase__create_branch`/`apply_migration` will just work, and execution stalls when they're silently blocked by `--read-only`.
**Why it happens:** `.mcp.json` in this repo has `--read-only` set; per current Supabase MCP server behavior this disables `apply_migration` for certain, and per the linked GitHub issue is being tightened to also block branch-mutation tools [CITED: github.com/supabase-community/supabase-mcp/issues/112].
**How to avoid:** Plan the D-27 rehearsal step assuming the CLI fallback (`npx supabase branches create`, `npx supabase db push`) is the primary path, not the MCP tools, unless the owner explicitly relaxes `--read-only` for the execution session. Confirm live before planning locks in a specific tool.
**Warning signs:** `apply_migration` MCP call returns a permissions/read-only error.

### Pitfall R-4: Local grep as a substitute for the live FK checklist

**What goes wrong:** Using this research's local grep results (~14 references across 10 files) as if it were the authoritative 30-column checklist.
**Why it happens:** No live DB access existed in this research session; grep was the only available approximation.
**How to avoid:** Treat the grep results in Q1 purely as evidence that grep undercounts (exactly D-04's own justification for requiring a live query) — never as the checklist itself. Run the Q1 generation query live before writing a single `ADD CONSTRAINT` statement.
**Warning signs:** Migration adds fewer than ~26 new FK constraints — a strong signal the checklist was generated from an incomplete source.

## Code Examples

All concrete SQL is inlined in Q1-Q7 above (checklist generation/verification, dual-FK DDL, sync triggers, backfill, deletion-cascade trigger, DB assertions). No additional standalone examples needed — this phase's entire deliverable _is_ SQL.

## State of the Art

| Old Approach (this repo's own history)                                                           | Current Approach (this phase)                                                                       | When Changed      | Impact                                                                                                                    |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Fix FK drift retroactively after it ships (`20250708191942`, `20250708191946`, `20260327000002`) | Generate the checklist _before_ writing any FK statement, verify with the same query post-migration | This phase (D-04) | Converts a reactive 3-times-shipped bug class into a proactive, query-driven checklist                                    |
| Single migration per table cluster, drift risk across many files                                 | One atomic migration file for all of Phase 1's DDL (D-03)                                           | This phase        | Matches this repo's own "one migration = one reviewable unit" convention, scaled up deliberately for this high-risk phase |

**Deprecated/outdated:** None — this phase doesn't deprecate anything; `students` stays fully live and referenced through Phase 8.

## Assumptions Log

| #   | Claim                                                                                                                                                     | Section                               | Risk if Wrong                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | D-02 ("kept alongside") controls over D-01's literal "dropped and re-added" wording — no `DROP CONSTRAINT` runs in Phase 1                                | Summary, Pattern 1, Q2, Pitfall R-1   | If the owner actually intended D-01 literally (drop-then-recreate, single FK per column, briefly no legacy FK at all mid-migration), the migration's rollback story and the "keeps both satisfiable" reasoning throughout CONTEXT.md would be wrong. Medium risk — D-02's language is fairly explicit ("kept alongside"), but this reconciliation should be confirmed with the owner before the plan is executed, not just inferred by research. |
| A2  | `students.musical_nickname` is the column CONTEXT.md's D-12 informally calls "nickname"                                                                   | User Constraints, Q3, Q4, Pitfall R-2 | Verified directly against the only migration that creates a nickname-shaped column — HIGH confidence, but should still be confirmed with a live `information_schema.columns` query before the migration is finalized, since this research had no live DB access.                                                                                                                                                                                 |
| A3  | The deletion-cron hazard (D-24/D-25) is best closed via a new `AFTER DELETE ON students` trigger rather than editing `process-account-deletions/index.ts` | Q5, Pattern 3                         | If the owner actually wants the fix visible in the Edge Function's own `DATA_CATEGORIES_REMOVED` list/audit trail (not just behaviorally correct via an invisible DB trigger), this recommendation under-delivers on the compliance-evidence angle. Flagged explicitly as a documentation debt in the Runtime State Inventory and Q5 — low functional risk, but a real compliance-optics risk if unconfirmed.                                    |
| A4  | The `--read-only` Supabase MCP flag currently blocks `apply_migration` and likely branch-mutation tools                                                   | Environment Availability, Pitfall R-3 | Based on WebSearch of secondary sources (a GitHub issue and general MCP docs summaries), not verified against this project's exact installed MCP server version. MEDIUM confidence — verify live at the start of execution by attempting a harmless `apply_migration` call and observing the error, rather than assuming.                                                                                                                        |
| A5  | Every FK targeting `students(id)` in this repo uses `ON DELETE CASCADE` (informing the recommended `ON DELETE CASCADE` on new dual FKs)                   | Pattern 1, Q2                         | Grep-sampled from 10 files only (Pitfall R-4) — the live checklist may reveal a table using `SET NULL` or `RESTRICT` instead, which would need its matching new FK to use the same action, not a blanket CASCADE assumption.                                                                                                                                                                                                                     |

## Open Questions (RESOLVED)

1. **Does the owner want the deletion-cron fix to also update `process-account-deletions/index.ts`'s `DATA_CATEGORIES_REMOVED` comment/email content, or is the DB-trigger-only fix sufficient for Phase 1?**
   - What we know: D-25 only requires the `child_profiles` row to actually be removed; it doesn't specify whether the Edge Function's own bookkeeping must reflect the new table.
   - What's unclear: whether under-representing the deleted-data list in the parent-facing compliance email is acceptable for this phase, or must be closed now.
   - Recommendation: Ship the DB-trigger-only fix in Phase 1 (keeps the "Postgres DDL only" boundary intact) and file the Edge Function comment/email update as an explicit backlog item for a later phase (Phase 7 or 8, when Edge Function code is already in scope) rather than silently deferring it.
   - **RESOLVED:** DB-trigger-only fix adopted for Phase 1 → `01-04-PLAN.md` Task 2 installs `cascade_delete_child_profile_on_student_delete` and records the `DATA_CATEGORIES_REMOVED` gap as an explicit DOC DEBT note deferred to Phase 7/8.

2. **Is the D-01/D-02 reconciliation (Assumption A1) actually what the owner intended, or does D-01 need a literal re-read during `/gsd-discuss-phase` follow-up?**
   - What we know: D-02's text is explicit ("is _kept_ alongside").
   - What's unclear: whether this was a deliberate two-step decision (D-01 sets direction, D-02 refines mechanics) or an editing artifact.
   - Recommendation: State the reconciliation explicitly in the plan's first task description so the owner can object before any DDL is written, rather than silently building on an inferred reading.
   - **RESOLVED:** ADD-CONSTRAINT-only reading (legacy FK kept) adopted and surfaced to the owner in the `01-04-PLAN.md` objective NOTE + grep-gated (zero `DROP CONSTRAINT` in the up-migration, Task 3); the owner can object at the Plan 05 apply gate before any production DDL runs.

3. **What are the exact 26 downstream tables and ~30 columns, and which ones are D-07 parent-scoped carve-outs beyond the named candidates (push subscriptions, weekly-report opt-out, consent logs, account-deletion records)?**
   - What we know: The generation query (Q1) will produce the authoritative list; `account_deletion_log` deliberately has no FK at all so won't appear.
   - What's unclear: the live count and the full carve-out set — this research could not query production.
   - Recommendation: Planning's first concrete task should be running the Q1 generation query live and getting owner sign-off on the scope column before any migration DDL is drafted — this is already D-04/D-07's own design, just flagging it as the literal first executable step.
   - **RESOLVED:** Deferred to execution as designed → `01-01-PLAN.md` Task 2 runs the Q1 generation live into `01-fk-checklist.md`; `01-03-PLAN.md` Task 1 is the owner scope/carve-out sign-off gate before any migration DDL (Plan 04) is written.

## Environment Availability

(See table above under its own heading — repeated here per template only if needed; already fully covered.)

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | None (SQL assertion scripts, per D-28 — pgTAP explicitly rejected)                                                                                                                    |
| Config file        | none — `01-db-assertions.sql` is a plain script, run manually against a Supabase branch                                                                                               |
| Quick run command  | `npx supabase db execute --file .planning/phases/01-identity-schema-expand/01-db-assertions.sql` (or paste into Supabase SQL Editor / MCP `execute_sql`) against the rehearsal branch |
| Full suite command | The above SQL assertions, PLUS `npm run test:run` (existing Vitest suite, proves zero client-visible regression per D-29), PLUS the owner's manual production smoke test              |

### Phase Requirements → Test Map

| Req ID                            | Behavior                                                        | Test Type                                           | Automated Command                                                                                                                                                                                          | File Exists?                                         |
| --------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| IDENT-01                          | `parents` table exists, PK shape matches `teachers`             | SQL assertion                                       | `SELECT column_name, data_type FROM information_schema.columns WHERE table_name IN ('parents','teachers') ORDER BY table_name` (manual diff)                                                               | ❌ Wave 0 — add to `01-db-assertions.sql`            |
| IDENT-02                          | `child_profiles` has zero PII columns                           | SQL assertion                                       | `SELECT column_name FROM information_schema.columns WHERE table_name = 'child_profiles'` — assert set equals `{id, parent_id, nickname, avatar_id, birth_year, is_active, created_at, updated_at}` exactly | ❌ Wave 0                                            |
| IDENT-03                          | `parent_id` nullable; 5 rows have `parent_id IS NULL`           | SQL assertion                                       | `SELECT count(*) FROM child_profiles WHERE parent_id IS NULL` — expect 5                                                                                                                                   | ❌ Wave 0                                            |
| IDENT-04                          | Every migrated `child_profiles.id` equals its `students.id`     | SQL assertion                                       | `SELECT count(*) FROM child_profiles cp JOIN students s ON cp.id = s.id` — expect 20 (all migrated rows match)                                                                                             | ❌ Wave 0                                            |
| IDENT-05                          | Every non-carved-out checklist column has a `child_profiles` FK | SQL assertion (diff of two committed query outputs) | Q1's generation query (pre) vs. verifier query (post) — diff `(table_name, column_name)` sets                                                                                                              | ❌ Wave 0                                            |
| D-21 (trigger round-trip)         | Forward + reverse sync, deletion cascade                        | SQL assertion (transactional, rolled back)          | The 3-part `BEGIN...ROLLBACK` script in Q6                                                                                                                                                                 | ❌ Wave 0                                            |
| D-29 (zero client-visible change) | Existing app behavior unchanged                                 | Existing Vitest suite + manual                      | `npm run test:run` + owner smoke test                                                                                                                                                                      | ✅ suite exists; smoke test is manual-only by nature |

### Sampling Rate

- **Per task commit:** Re-run the relevant SQL assertion block from `01-db-assertions.sql` against the rehearsal branch after each DDL statement is added.
- **Per wave merge:** Full `01-db-assertions.sql` + `npm run test:run` against the branch.
- **Phase gate:** Full apply→rollback→re-apply rehearsal (D-27) green, all SQL assertions green, Vitest suite green, owner production smoke test signed off — before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `.planning/phases/01-identity-schema-expand/01-db-assertions.sql` — does not exist yet; write per Q6's template, covering IDENT-01 through IDENT-05 plus the D-21 trigger round-trip and the D-24/D-25 deletion-cascade assertion
- [ ] `.planning/phases/01-identity-schema-expand/01-fk-checklist.md` — does not exist yet; generate from Q1's live query, owner-reviewed for D-07 scope
- [ ] `.planning/phases/01-identity-schema-expand/01-function-inventory.md` — does not exist yet; generate from Q7's `pg_proc` search, cross-referenced against this research's manual findings
- [ ] `.planning/phases/01-identity-schema-expand/01-account-segmentation.md` — does not exist yet; generate from Q4's live query, owner-reviewed for D-10 sign-off
- [ ] Supabase branch rehearsal environment — confirm whether MCP write tools or CLI fallback will be used (Pitfall R-3) before Wave 0 is considered closed

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json`, so this section is included — but scoped to what Phase 1 actually touches, since RLS itself is explicitly Phase 2's work.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                                                                                                                                                |
| --------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | No      | Untouched — `auth.users`/Supabase Auth unmodified this phase                                                                                                                                                                                                    |
| V3 Session Management | No      | Untouched                                                                                                                                                                                                                                                       |
| V4 Access Control     | Partial | New tables (`parents`, `child_profiles`) ship with RLS **enabled, zero policies — deny-all** (D-16). This is the correct default-deny posture; Phase 2 adds real policies. No policy authored in Phase 1 means no V4 control to evaluate yet beyond "is RLS on" |
| V5 Input Validation   | No      | Pure DDL; no user-supplied input path exists yet (no API writes to these tables until Phase 3+)                                                                                                                                                                 |
| V6 Cryptography       | No      | Untouched                                                                                                                                                                                                                                                       |

### Known Threat Patterns for this phase's stack

| Pattern                                                                             | STRIDE                 | Standard Mitigation                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS deny-all misconfigured (e.g. accidentally enabling a permissive default policy) | Information Disclosure | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` with **zero** `CREATE POLICY` statements — verify via `pg_policies` query showing 0 rows for `parents`/`child_profiles` post-migration (matches this repo's own `20260131000001_audit_rls_policies.sql` audit-query precedent)                   |
| Trigger functions running with elevated privilege doing something unintended        | Elevation of Privilege | All new trigger functions in this phase use `SECURITY DEFINER SET search_path = public` (matching this repo's existing convention in `20260201000001_coppa_schema.sql`'s functions) — pins the search path to prevent search-path-hijacking, a documented Postgres `SECURITY DEFINER` footgun |
| Dual FK accidentally weakens referential integrity instead of strengthening it      | Tampering              | Both FKs are enforced independently by Postgres — a write that would violate either FK is rejected; this is strictly more restrictive than the legacy single-FK state, not less                                                                                                               |

## Sources

### Primary (HIGH confidence)

- Direct repository file reads (this session): `.planning/phases/01-identity-schema-expand/01-CONTEXT.md`, `01-DISCUSSION-LOG.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/research/{SUMMARY,ARCHITECTURE,PITFALLS}.md`, `.planning/codebase/{ARCHITECTURE,CONCERNS}.md`, `COPPA_REFACTOR_PRD.md`, `supabase/migrations/{20250625120001_add_teacher_schema,20250115000005_remove_student_auth_fkey,20260201000001_coppa_schema,20260321000001_account_deletion_log,20260327000002_fix_teacher_fk_references,20260126000001_fix_award_xp_security,20260201000002_add_rate_limiting,20260404000001_ensure_subscription_rls,20260708120000_is_free_node_null_safe}.sql`, `supabase/functions/process-account-deletions/index.ts`, `src/services/dataExportService.js`, `.mcp.json`, `.planning/config.json`
- `npx supabase --version` → `2.109.1` (confirmed live command execution, this session)
- `grep -rn "REFERENCES students(id)"` across `supabase/migrations/` (this session — explicitly flagged as non-authoritative, illustrative only)

### Secondary (MEDIUM confidence)

- [GitHub — supabase-community/supabase-mcp Issue #112, "Exclude any mutating tools when in read_only mode"](https://github.com/supabase-community/supabase-mcp/issues/112) — informs the `--read-only` MCP flag caveat (Pitfall R-3, Assumption A4)
- [Supabase Docs — MCP Server](https://supabase.com/docs/guides/ai-tools/mcp) — general `--read-only` flag behavior, not version-pinned to this project's exact MCP server build

### Tertiary (LOW confidence, flagged for validation)

- The exact live count/shape of the 26 downstream tables and 30 FK columns (Open Question 3) — this research had no live Supabase query access; the grep-based approximation in Q1 is explicitly non-authoritative
- The precise version/behavior of the `--read-only` MCP flag as configured in _this_ project's `.mcp.json` (Assumption A4) — based on general web sources, not verified against this exact installed server version

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new libraries, pure Postgres DDL, every pattern copies an existing proven table/function in this repo
- Architecture (dual-FK, sync triggers, deletion trigger): HIGH on mechanics (standard, well-documented Postgres patterns), MEDIUM on whether it matches the owner's exact intent for D-01/D-02 (Assumption A1) — flagged explicitly, not silently assumed
- Pitfalls: HIGH — grounded in this repo's own migration history (3 prior FK-drift fixes) and direct file reads of the exact functions/columns this phase touches
- FK checklist / function inventory completeness: MEDIUM — the _method_ (information_schema/pg_proc live query) is HIGH confidence and matches D-04/D-23's own design; the _specific list_ this research could produce is LOW confidence because no live DB query was possible this session

**Research date:** 2026-07-22
**Valid until:** ~14 days (this is a live-database-dependent research pass; any migration applied to production between now and planning execution could change the FK checklist's actual contents — re-run Q1's generation query fresh at the start of planning, don't reuse this file's illustrative grep results)
