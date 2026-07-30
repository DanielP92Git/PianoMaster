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

## 3. Production apply — DONE (owner-applied 2026-07-30)

Owner ran `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` in the
SQL Editor: **"applied — no errors"**.

### 3a. Read-only structural verification — 12/12 PASS

Ran against production via MCP `execute_sql` (SELECT-only):

| Check                                                   | Result |
| ------------------------------------------------------- | ------ |
| IDENT-01 parents column set (5 cols)                    | PASS   |
| IDENT-02 child_profiles 8-col zero-PII set              | PASS   |
| IDENT-03 parent_id nullable                             | PASS   |
| IDENT-03 exactly 5 parent-less children                 | PASS   |
| IDENT-04 UUID reuse — every child maps to a student     | PASS   |
| child_profiles rowcount == students rowcount            | PASS   |
| parents rowcount == 15                                  | PASS   |
| parents requires_reconsent TRUE == 1                    | PASS   |
| IDENT-05 16 `*_child_profiles_fkey` FKs (pg_constraint) | PASS   |
| legacy students(id) FKs still present (D-02, ≥16)       | PASS   |
| RLS enabled on both new tables                          | PASS   |
| zero policies on new tables (deny-all, D-16)            | PASS   |

### 3b. Trigger presence — confirmed

- `parents`: `trigger_parents_updated_at` → `update_updated_at_column`
- `child_profiles`: `trigger_child_profiles_updated_at`; sync insert+update →
  `sync_child_profile_to_student` (SECURITY DEFINER)
- `students`: sync insert+update → `sync_student_to_child_profile` (SECURITY DEFINER);
  `trigger_cascade_delete_child_profile` → `cascade_delete_child_profile_on_student_delete`
  (SECURITY DEFINER)
- Pre-existing `students` triggers (`auto_generate_nickname`, `calculate_is_under_13`)
  present and **untouched** — no clobber.

## 4. Post-migration test suite — PASS (2026-07-30)

`npm run test:run` re-run, compared against the §2 baseline:

|            | Pre-migration (§2)    | Post-migration (§4)   |
| ---------- | --------------------- | --------------------- |
| Test Files | 112 passed, 2 skipped | 112 passed, 2 skipped |
| Tests      | 2160 passed, 12 todo  | 2160 passed, 12 todo  |
| Failed     | 0                     | 0                     |

**Identical.** D-29 zero-visible-change satisfied at the test-suite level. Exit code 0.

## 5. Owner smoke test — PENDING

Owner to confirm on a real student account: dashboard, trail map, one completed
exercise (XP + stars award), streak intact. Phase close is gated on this confirmation.
