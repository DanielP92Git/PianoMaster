<!--
Phase:       02-rls-rewrite-ownership-based-access-control (v4.0, Wave 4 / Plan 05, Task 3)
Date:        2026-08-03
Purpose:     Documents the known items Phase 8 (Contract — Legacy Cleanup) inherits
             from this phase: the D-33 Group B FK-target gap, the exact legacy-drop
             candidate query, and the A2 (students_total_score) finding. None of
             these are bugs — they are documented, owner-reasoned deferrals within
             this phase's RLS-only boundary.
-->

# Phase 2 → Phase 8 Handoff

Phase 2 (RLS Rewrite — Ownership-Based Access Control) shipped an **additive,
dual-policy** rollout: 50 new `_parent_owner` policies live alongside every
pre-existing legacy policy, with zero legacy policies dropped or altered. This
was deliberate (D-27 precedent) — it lets the new ownership model prove itself
in production before the old self-only model is retired. Phase 8's contract
step is where that retirement happens. This document is the unambiguous
handoff for that step.

## 1. D-33 — Group B FK-target gap (documented, not fixed)

The following 7 tables have their `student_id` column FK'd to `auth.users`,
**not** to `students` / `child_profiles`:

- `class_enrollments`
- `current_streak`
- `highest_streak`
- `last_practiced_date`
- `practice_sessions`
- `student_achievements`
- `student_profiles`

**This is accepted, not a security hole.** Their `_parent_owner` policies
(shipped this phase) enforce ownership correctly regardless of FK target,
because `child_profiles.id` reuses the old `students.id` UUIDs (the v4.0
architecture anchor) — so `student_id IN (SELECT public.owned_child_ids())`
resolves correctly whether or not the FK literally points at
`child_profiles`. Only the **FK-target correction** (re-pointing the
constraint itself) is out of scope for this RLS-only phase.

**Phase 8 (or an inserted phase) should:** decide whether to re-point these 7
FKs to `child_profiles(id)` for schema clarity/integrity, independent of RLS
correctness. This is a schema hygiene item, not a security fix.

Recorded as accepted risk `AR-02-01` (threat `T-02-19`) in `02-SECURITY.md`,
owner-authorized 2026-08-03.

## 2. Legacy-drop candidate query

Once production traffic against the dual-policy model is verified with zero
regressions over a suitable observation window, Phase 8's contract step drops
the **legacy** (pre-Phase-2) policies — never the `_parent_owner` ones. The
`_parent_owner` naming convention makes the legacy set an unambiguous filter:

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname NOT LIKE '%_parent_owner'
  AND tablename = ANY(ARRAY[
    'assignment_submissions','feedback_submissions','instrument_practice_logs',
    'instrument_practice_streak','notifications','parental_consent_log',
    'parental_consent_tokens','push_subscriptions','rate_limits',
    'student_daily_challenges','student_daily_goals','student_point_transactions',
    'student_skill_progress','student_unit_progress','students_score',
    'user_accessories','class_enrollments','current_streak','highest_streak',
    'last_practiced_date','practice_sessions','student_achievements',
    'student_profiles','child_profiles','user_preferences','accessories',
    'assignments'
  ]);
```

**Notes for whoever runs this in Phase 8:**

- `child_profiles_select_teacher` does NOT carry the `_parent_owner` suffix
  but is a **new**, deliberate Phase 2 policy (D-30 teacher-access shape) —
  it will be caught by this `NOT LIKE` filter and would be **incorrectly**
  identified as legacy. Exclude it explicitly before dropping anything:
  `AND policyname != 'child_profiles_select_teacher'`.
- Drop only after a verified zero-traffic observation window on the legacy
  policies (e.g., via `pg_stat_user_tables` / query logs showing the legacy
  policy names are no longer being evaluated in any live query plan) — this
  phase does not define that window's length; it is a Phase 8 decision.

## 3. A2 — students_total_score finding

`students_total_score` was investigated as a possible 25th in-scope table
during Plan 01 (Wave 0 discovery). **Confirmed NOT in scope**: the table was
dropped 2025-12-07 (`20251207000004_drop_students_total_score_table.sql`) and
never recreated. No action needed in Phase 8 — this is closed, recorded here
only so it isn't independently re-investigated.

## 4. Dead-code note (not a Phase 8 action item, FYI only)

`teacher_student_connections` has its own `student_id = (SELECT auth.uid())`
policy branch that predates the parent-first model and is dead code under the
current auth model (students no longer sign in directly). This is D-30
locked — **not touched in Phase 2** and not a Phase 8 action item; noted here
only for completeness in case Phase 8's broader cleanup scope wants to
reconsider it.

## Summary for Phase 8

| Item                                    | Type                                               | Action needed in Phase 8                                                                                        |
| --------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| D-33 Group B FK-target gap              | Schema hygiene (accepted risk, not a security gap) | Optional: re-point 7 FKs to `child_profiles(id)`                                                                |
| Legacy-drop candidate set               | Contract-step cleanup                              | Drop legacy policies via the query above (exclude `child_profiles_select_teacher`), after verified zero traffic |
| A2 (`students_total_score`)             | Closed finding                                     | None — informational only                                                                                       |
| `teacher_student_connections` dead code | Pre-existing, D-30 locked                          | None required; optional future cleanup                                                                          |
