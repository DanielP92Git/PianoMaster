---
phase: 01-identity-schema-expand
plan: 04
wave: 3
status: complete
requirements-completed: [IDENT-01, IDENT-02, IDENT-03, IDENT-04]
---

# 01-04 Summary — atomic up-migration + committed down-migration

**Files authored (NOT applied — apply is the Wave 4 owner gate):**

- `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` (253 lines, BEGIN/COMMIT)
- `supabase/migrations/20260722120000_add_parents_and_child_profiles.down.sql`

## What the up-migration does (in order, D-03)

1. `parents` (IDENT-01) — id PK → auth.users, created_at/updated_at, display_name, `requires_reconsent BOOLEAN NOT NULL DEFAULT FALSE`.
2. `child_profiles` (IDENT-02) — exactly the 8 zero-PII columns; `avatar_id UUID REFERENCES avatars(id)` (type confirmed live), `is_active NOT NULL DEFAULT TRUE`, `parent_id … ON DELETE SET NULL`.
3. `idx_child_profiles_parent_id`; RLS enabled on both tables with **zero policies** (deny-all, D-16).
4. `updated_at` triggers reusing `update_updated_at_column()`.
5. **parents backfill** — explicit 15-row `VALUES (id, requires_reconsent)` list transcribed from the owner-signed segmentation; true-count **1** (hallellu), recorded in a comment for the assertion check.
6. **child_profiles backfill** — all 20 via `INSERT … SELECT s.id … LEFT JOIN auth.users` → UUID reuse (IDENT-04), `parent_id NULL` for the 5 auth-less (IDENT-03). Runs **before** trigger creation so it doesn't self-fire.
7. Forward + reverse sync trigger pairs + deletion-cascade trigger — 3 `SECURITY DEFINER SET search_path=public` functions, `pg_trigger_depth() > 1` loop guard in both sync fns, split INSERT/UPDATE triggers, shadow row carries no PII.
8. **16 dual-FK `ADD CONSTRAINT … child_profiles_fkey`** (one per owner-signed child-scoped row, all `ON DELETE CASCADE`). `parent_subscriptions` carved out (D-06). **ADD-only — zero DROP CONSTRAINT** in the up file.

## Down-migration

Reverses every object in reverse order: deletion trigger/fn → reverse sync → forward sync → 16 `DROP CONSTRAINT IF EXISTS` (new child_profiles FKs only, no legacy) → `DROP TABLE … CASCADE` for both new tables. Idempotent (`IF EXISTS`).

## Deviations / notes for owner (surface at Wave 4)

- **D-01/D-02 reconciliation:** D-02 governs — legacy `students(id)` FK is KEPT, only a `child_profiles(id)` FK is ADDED. Zero DROP CONSTRAINT here; legacy FK removal is Phase 8.
- **Not yet syntax-validated against a live DB** — MCP is `--read-only`, so DDL can't be dry-run here. First real execution is the Wave 4 branch rehearsal (apply → assertions → rollback → re-apply). That rehearsal is the syntax gate.
- **DOC DEBT (Phase 7/8):** `process-account-deletions/index.ts` `DATA_CATEGORIES_REMOVED` doesn't list `child_profiles` yet (deletion is correct via trigger; only the parent-facing email list is stale). Noted in the migration comment.

## Self-Check: PASSED

All three task gates OK (Task 1/2/3); 16 child_profiles_fkey; 15 parents rows, 1 TRUE; parent_subscriptions not swept; down.sql balanced.
