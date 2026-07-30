---
phase: 01-identity-schema-expand
plan: 05
artifact: apply-log
---

# 01-05 Apply Log

Chronological record of the production-apply gate for the parents/child_profiles
identity-schema expansion. Newest step appended at the bottom.

## 1. Dry-run rehearsal — PASS (2026-07-30)

- **Harness:** `.planning/phases/01-identity-schema-expand/01-dryrun.sql`
- **Path:** Supabase Dashboard → SQL Editor, single `BEGIN … ROLLBACK` transaction (owner-run).
- **First run:** ERROR `42883: operator does not exist: information_schema.sql_identifier[] = text[]`
  in the IDENT-01/02 shape assertions. Root cause: `information_schema.columns.column_name`
  is domain `sql_identifier`, so `array_agg(column_name)` is `sql_identifier[]` with no `=`
  operator against `text[]`. **Harness bug, not migration bug** — DDL never reached.
- **Fix:** cast `column_name::text` inside both `array_agg` shape assertions, in both
  `01-dryrun.sql` and `01-db-assertions.sql` (commit `ba95f36e`). Migration file untouched.
- **Second run:** `NOTICE: DRY-RUN COMPLETE — all assertions passed`. Rolled back; production
  unchanged. Confirms: up-migration + 20-row backfill + IDENT-01..05 + RLS deny-all +
  parents backfill (1 re-consent flag) + forward/reverse sync triggers + deletion cascade +
  down-migration + tables-gone assertions all pass against real data.

## 2. Pre-migration test baseline — PASS (2026-07-30)

`npm run test:run` before any production apply, to anchor the D-29 zero-visible-change
comparison:

- **Test Files:** 112 passed, 2 skipped (114)
- **Tests:** 2160 passed, 12 todo (2172), **0 failed**
- Exit code 0. (The `[subscriptionService] … Database connection failed` line is an
  intentionally-mocked fixture log, not a real failure.)

Post-apply must match: 2160 passed, 0 failed.

## 3. Production apply — PENDING (owner gate)

Awaiting explicit owner "apply to production" authorization. Nothing applied yet.
