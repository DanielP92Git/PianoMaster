<!--
Migration:   20260722120000_add_parents_and_child_profiles (Phase 1, v4.0)
Date:        2026-07-22
Description: Confirmed apply / rollback / re-apply rehearsal path for D-27, decided BEFORE any DDL.
Confirmed:   2026-07-22 14:17 UTC
-->

# 01 — Rehearsal Environment (D-27 prerequisite)

**Confirmed:** 2026-07-22 14:17 UTC · project `hdltcvgqrtxuxgjdvzzu`.

## Environment probe results

| Check                                              | Result                                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.mcp.json` supabase server has `--read-only` flag | **YES** — present on the `@supabase/mcp-server-supabase` args (line 10). Also passes `--access-token`.                                                             |
| MCP **read** access works                          | **YES** — `list_tables` (39 public tables) and multiple `execute_sql` reads succeeded this session.                                                                |
| MCP **write / branch** tools exposed               | Tool _schemas_ exist (`create_branch`, `apply_migration`, `merge_branch`, …) but `--read-only` **rejects execution**. Not usable for the apply/rollback rehearsal. |
| Supabase CLI available                             | **YES** — `npx supabase --version` → **2.109.1** (not a global binary, not a devDependency; resolves via `npx`).                                                   |
| `SUPABASE_ACCESS_TOKEN`                            | Present in `.mcp.json` env block; the CLI needs it exported in the shell for non-TTY use.                                                                          |

## Chosen primary rehearsal path: **`npx supabase` CLI** (against a Supabase branch)

Because the MCP server is `--read-only`, the D-27 apply→rollback→re-apply rehearsal runs through the
CLI, not MCP. Exact commands the Plan 05 runner will use (owner-gated):

```bash
# 0. Auth (shell env, non-TTY):
export SUPABASE_ACCESS_TOKEN=<token from .mcp.json>
npx supabase link --project-ref hdltcvgqrtxuxgjdvzzu

# 1. Create an isolated rehearsal branch:
npx supabase branches create phase1-identity-rehearsal --project-ref hdltcvgqrtxuxgjdvzzu

# 2. Apply the up-migration to the branch:
npx supabase db push --linked            # (branch context) applies 20260722120000_add_parents_and_child_profiles.sql

# 3. Run the assertion suite on the branch:
#    (via the branch connection string) psql "<branch-conn>" -f .planning/phases/01-identity-schema-expand/01-db-assertions.sql
#    — MCP execute_sql (read) may confirm counts, but the ASSERT/synthetic-insert blocks need a psql/CLI session.

# 4. Roll back (apply the paired down-migration), then re-run assertions to confirm a clean baseline:
#    psql "<branch-conn>" -f supabase/migrations/20260722120000_add_parents_and_child_profiles.down.sql

# 5. Re-apply the up-migration once more to prove apply→rollback→re-apply idempotency.

# 6. Only THEN, behind the explicit owner gate (D-27), apply to PRODUCTION:
#    npx supabase db push --linked   (production context)  — OWNER-AUTHORIZED ONLY

# 7. Clean up the branch after production apply is confirmed:
npx supabase branches delete phase1-identity-rehearsal --project-ref hdltcvgqrtxuxgjdvzzu
```

## Owner decisions required (NOT taken in this phase)

1. **Relaxing `--read-only` in `.mcp.json`** to enable MCP-driven apply is an **owner decision**. This
   phase does **NOT** modify `.mcp.json` (verified unmodified). If the owner prefers the MCP path over
   the CLI, they relax the flag themselves for the execution session and it is **not committed**.
2. **Supabase branches are a billed feature.** Creating a rehearsal branch may incur cost on this
   project's plan. Surface the cost/confirm step to the owner at the Wave 4 gate before branch creation.
3. The exact **branch connection string** for `psql` steps is retrieved at rehearsal time
   (`npx supabase branches get` / dashboard) — not pre-recorded here (it is short-lived credentials).

## Fallback

If CLI branch creation is unavailable at rehearsal time (billing/plan limit), the fallback is the
Supabase **dashboard SQL editor** run against a manually-created branch, or — owner-approved only — a
transaction-wrapped rehearsal directly on production (`BEGIN; <up-migration>; <assertions>; ROLLBACK;`)
to validate the DDL without persisting, before the real gated apply. The transaction-wrapped dry run is
the safest no-branch option and needs no new infrastructure.
