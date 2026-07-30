---
phase: 01-identity-schema-expand
plan: 05
wave: 4
status: complete
requirements-completed: [IDENT-01, IDENT-02, IDENT-03, IDENT-04, IDENT-05]
---

# 01-05 Summary — dry-run rehearsal + production apply + verification

The Wave 4 gate: rehearse the atomic migration without a paid branch, apply it to
production under owner authorization, and prove zero client-visible change.

## What happened

1. **No-branch rehearsal harness** — `.planning/phases/01-identity-schema-expand/01-dryrun.sql`
   (single `BEGIN … ROLLBACK`): full up-migration + 20-row backfill → read-only assertions →
   synthetic trigger round-trips (SAVEPOINT-isolated) → down-migration → tables-gone
   assertions, all rolled back. Ran in the Dashboard SQL Editor — free, non-persisting.
2. **Bug caught by the rehearsal (harness, not migration):** `42883 sql_identifier[] = text[]`.
   `information_schema.columns.column_name` is domain `sql_identifier`; fixed by casting
   `column_name::text` in the two shape assertions, in both `01-dryrun.sql` and
   `01-db-assertions.sql` (`ba95f36e`). **Migration file never changed.** Second run:
   `DRY-RUN COMPLETE — all assertions passed`.
3. **Pre-migration test baseline** (`b36638d7`): 2160 passed / 0 failed — anchor for D-29.
4. **Owner applied** `20260722120000_add_parents_and_child_profiles.sql` to production
   ("applied — no errors").
5. **Read-only post-apply verification (MCP `execute_sql`):** 12/12 structural checks PASS
   (IDENT-01..05, UUID reuse, 5 parent-less, 15 parents / 1 re-consent, 16 dual FKs, legacy
   students FKs retained per D-02, RLS-on + zero-policy deny-all). All sync/cascade triggers
   present and SECURITY DEFINER; pre-existing students triggers untouched.
6. **Post-migration test suite:** 2160 passed / 0 failed — identical to baseline. D-29 met.

Full evidence in `01-apply-log.md`.

## Requirements

- **IDENT-01..05** — verified live against production, read-only. All PASS.

## Deviations / notes

- **Rehearsal path deviated from plan** (branch → SQL-Editor dry-run) at owner request; no
  paid Supabase branch was used. Rehearsal fidelity preserved via one-transaction rollback.
- **D-01/D-02:** legacy `students(id)` FKs KEPT (confirmed live, ≥16); only `child_profiles(id)`
  dual FKs added. Legacy-FK removal remains Phase 8.
- **Assertion type-cast fix** applies to any future re-run of `01-db-assertions.sql`.

## Outstanding

- **Owner smoke test** on a real student account (dashboard / trail / exercise XP+stars /
  streak). Phase close is gated on this — see `01-apply-log.md` §5.

## Self-Check: PASSED (automated portions)

Dry-run green · baseline == post-apply (2160/0) · 12/12 live structural checks · triggers
present · migration file unchanged since `d4ce32e8`.
