<!--
Migration:   20260722120000_add_parents_and_child_profiles (Phase 1, v4.0)
Date:        2026-07-22
Description: Authoritative FK checklist — every FOREIGN KEY currently targeting students(id).
             The migration's ADD CONSTRAINT statements (Plan 04) are written FROM this file,
             one per non-carved-out row. Re-run the verifier query post-migration for IDENT-05.
Predecessor: (none — this is the source-of-truth artifact for the FK repoint)
Generated:   LIVE query against production project hdltcvgqrtxuxgjdvzzu at 2026-07-22 14:17 UTC
Total FK rows targeting students(id): 17
-->

# 01 — FK Checklist (D-04, IDENT-05)

**Live run:** 2026-07-22 14:17 UTC · project `hdltcvgqrtxuxgjdvzzu` · **17 FK constraints** target `public.students(id)`.
All 17 reference column `id` and all use `ON DELETE CASCADE`.

> ⚠️ **DEVIATION — verifier mechanism changed from `information_schema` to `pg_catalog.pg_constraint`.**
> D-04 / RESEARCH §Q1 specify an `information_schema` triple-join (`table_constraints` +
> `key_column_usage` + `constraint_column_usage` + `referential_constraints`) as both the
> generator and the IDENT-05 verifier. **Run live against this project it returns `[]`** —
> zero rows — because `information_schema.constraint_column_usage` only exposes constraints
> the _connection role owns_, and Supabase's query role is not the table owner. The
> `information_schema` verifier would therefore return `[]` post-migration too and produce a
> **false IDENT-05 failure**. This checklist and the IDENT-05 verifier below are built on
> `pg_catalog.pg_constraint` instead, which is authoritative regardless of role. **This must
> be signed off at the Plan 03 owner gate** (it changes the committed IDENT-05 mechanism).

## Checklist

`scope` / `carve_out` columns are the D-06/D-07 classification. Rows marked **TBD — owner review**
are resolved at the **Plan 03 owner gate** (D-07), not defaulted here. A wrongly-scoped row yields a
valid-looking but wrong Phase 2 RLS policy, so judgment calls are deferred to the owner on purpose.

| table_name                 | column_name  | constraint_name                            | on_delete_action | scope                  | carve_out | reason                                                                                                           |
| -------------------------- | ------------ | ------------------------------------------ | ---------------- | ---------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| assignment_submissions     | student_id   | assignment_submissions_student_id_fkey     | CASCADE          | child-scoped           | no        | —                                                                                                                |
| feedback_submissions       | student_id   | feedback_submissions_student_id_fkey       | CASCADE          | child-scoped           | no        | per-child rate-limit ledger                                                                                      |
| instrument_practice_logs   | student_id   | instrument_practice_logs_student_id_fkey   | CASCADE          | child-scoped           | no        | —                                                                                                                |
| instrument_practice_streak | student_id   | instrument_practice_streak_student_id_fkey | CASCADE          | child-scoped           | no        | —                                                                                                                |
| notifications              | recipient_id | notifications_recipient_id_fkey            | CASCADE          | **TBD — owner review** | **TBD**   | D-07 candidate parent-scoped — some notifications are parent-directed                                            |
| parental_consent_log       | student_id   | parental_consent_log_student_id_fkey       | CASCADE          | **TBD — owner review** | **TBD**   | D-07 candidate parent-scoped — a consent record is the _parent's_ attestation                                    |
| parental_consent_tokens    | student_id   | parental_consent_tokens_student_id_fkey    | CASCADE          | **TBD — owner review** | **TBD**   | D-07 candidate parent-scoped — consent verification token, parent-facing                                         |
| parent_subscriptions       | student_id   | parent_subscriptions_student_id_fkey       | CASCADE          | parent-scoped          | **yes**   | **D-06** — Phase 5 re-points to `parents`, not `child_profiles`; sweeping now moves it the known-wrong direction |
| push_subscriptions         | student_id   | push_subscriptions_student_id_fkey         | CASCADE          | **TBD — owner review** | **TBD**   | D-07 candidate parent-scoped — push endpoint typically the parent's device                                       |
| rate_limits                | student_id   | rate_limits_student_id_fkey                | CASCADE          | child-scoped           | no        | per-child XP-farming guard                                                                                       |
| student_daily_challenges   | student_id   | student_daily_challenges_student_id_fkey   | CASCADE          | child-scoped           | no        | —                                                                                                                |
| student_daily_goals        | student_id   | student_daily_goals_student_id_fkey        | CASCADE          | child-scoped           | no        | —                                                                                                                |
| student_point_transactions | student_id   | student_point_transactions_student_id_fkey | CASCADE          | child-scoped           | no        | —                                                                                                                |
| student_skill_progress     | student_id   | student_skill_progress_student_id_fkey     | CASCADE          | child-scoped           | no        | —                                                                                                                |
| students_score             | student_id   | students_score_student_id_fkey             | CASCADE          | child-scoped           | no        | —                                                                                                                |
| student_unit_progress      | student_id   | student_unit_progress_student_id_fkey      | CASCADE          | child-scoped           | no        | —                                                                                                                |
| user_accessories           | user_id      | user_accessories_user_id_fkey              | CASCADE          | child-scoped           | no        | column is `user_id` (not `student_id`) but references students(id)                                               |

**Summary:** 17 rows · 12 firmly child-scoped (get a `child_profiles` ADD CONSTRAINT in Plan 04) ·
1 firm carve-out (`parent_subscriptions`, D-06) · 4 **TBD** awaiting the Plan 03 owner gate.

> **Note on `account_deletion_log`:** it has **no FK** to `students` by design (COPPA audit records
> must survive deletion — `20260321000001_account_deletion_log.sql`). Correctly absent from the query
> output; do **not** add a `child_profiles` FK to it.

## IDENT-05 semantics (D-02 reframed SC #5)

Verification passes when **every non-carved-out `(table_name, column_name)` pair above ALSO has a
second FK targeting `child_profiles(id)`** post-migration — NOT "zero references to students(id) remain"
(that is Phase 8's assertion; Phase 1 keeps the legacy FK, adds a second one, D-02).

## Generation query (authoritative — `pg_constraint`)

```sql
-- Enumerates every FK column currently targeting students(id).
-- Uses pg_catalog.pg_constraint (role-independent) because the information_schema
-- variant returns [] under Supabase's non-owner query role (see DEVIATION above).
SELECT con.conrelid::regclass::text AS table_name,
       att.attname                  AS column_name,
       con.conname                  AS constraint_name,
       refatt.attname               AS references_column,
       CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete_action
FROM pg_constraint con
JOIN unnest(con.conkey)  WITH ORDINALITY AS k(attnum, ord)  ON TRUE
JOIN pg_attribute att    ON att.attrelid = con.conrelid  AND att.attnum = k.attnum
JOIN unnest(con.confkey) WITH ORDINALITY AS fk(attnum, ord) ON fk.ord = k.ord
JOIN pg_attribute refatt ON refatt.attrelid = con.confrelid AND refatt.attnum = fk.attnum
WHERE con.contype = 'f' AND con.confrelid = 'public.students'::regclass
ORDER BY table_name, column_name;
```

## IDENT-05 verifier query (same query, pointed at `child_profiles`)

```sql
-- Post-migration verifier: confirms every non-carved-out checklist row now ALSO has a
-- second FK targeting child_profiles(id). Diff this output against the checklist above;
-- IDENT-05 passes when all 12 firm child-scoped rows (plus any TBD rows the owner marks
-- child-scoped at the Plan 03 gate) appear here.
SELECT con.conrelid::regclass::text AS table_name,
       att.attname                  AS column_name,
       con.conname                  AS constraint_name,
       refatt.attname               AS references_column,
       CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete_action
FROM pg_constraint con
JOIN unnest(con.conkey)  WITH ORDINALITY AS k(attnum, ord)  ON TRUE
JOIN pg_attribute att    ON att.attrelid = con.conrelid  AND att.attnum = k.attnum
JOIN unnest(con.confkey) WITH ORDINALITY AS fk(attnum, ord) ON fk.ord = k.ord
JOIN pg_attribute refatt ON refatt.attrelid = con.confrelid AND refatt.attnum = fk.attnum
WHERE con.contype = 'f' AND con.confrelid = 'public.child_profiles'::regclass
ORDER BY table_name, column_name;
```

**Pre-migration baseline:** the verifier returns `[]` today (the `child_profiles` table does not yet
exist — the `::regclass` cast will error until Plan 04 creates it; that erroring-cast IS the baseline).
