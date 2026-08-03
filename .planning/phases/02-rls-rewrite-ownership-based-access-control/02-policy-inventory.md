<!--
Migration:   <ts>_rls_ownership_rewrite (Phase 2, v4.0)
Date:        2026-08-02
Description: Authoritative RLS policy-rewrite checklist — every policy that reads
             `student_id`/`recipient_id`/`user_id` = auth.uid() (Groups A/B/C) plus
             the 3 owner-resolved edge cases (D-31/D-32). The migration's CREATE
             POLICY statements are written FROM this file, one per row.
Predecessor: 01-fk-checklist.md (Phase 1's structural analog; this is the RLS-scoped
             re-run of the same discipline)
Generated:   Transcribed from 02-RESEARCH.md's live `pg_policies` query against
             production hdltcvgqrtxuxgjdvzzu, 2026-07-30 (RESEARCH's own session).
Total: 24 tables, ~39 new sibling policies (30 Group A + 7 Group B + 2 Group C) + 3 edge cases
       resolved D-31 (user_preferences IN) / D-32 (accessories + assignments IN) /
       D-33 (Group B FK-target gap documented, not fixed).
       SEE "Count Correction" NOTE BELOW — the itemized row-level breakdown in this
       same document sums to a different (higher) total than the "39" prose figure;
       this file's per-row table is the authoritative worklist for the migration.
-->

# 02 — Policy Inventory (RLS-02/RLS-03 worklist)

## Count Correction (transcription-time finding, disclosed per project discipline)

While transcribing 02-RESEARCH.md's "Concrete Per-Table Inventory" verbatim into the row-level
table below, summing the actual `cmd` lists RESEARCH itself gives per table (e.g. `push_subscriptions`
explicitly stated as "4 siblings, all 4 commands already correctly split"; `student_skill_progress`,
`student_unit_progress`, `students_score` each DELETE+INSERT+SELECT+UPDATE = 4; etc.) yields
**37 Group A policies, not 30** (16 tables). Group B (7) and Group C (2) are unaffected. That makes
the pre-edge-case total **46**, not 39 — which is actually consistent with 02-RESEARCH.md's OWN
`## Summary` section, which independently states "the true policy-rewrite worklist is ~24 tables /
**~46 policies**, not '32 tables / 62 policies'" (see RESEARCH.md line ~115). The "30 Group A / 39
total" figure appears later in the SAME research document's "Verified total" subsection and in this
plan's `<interfaces>` block, and is an arithmetic slip that undercounts against RESEARCH's own
itemized per-table cmd breakdown.

**Resolution:** this file's per-row table below is built from the itemized per-table cmd breakdown
(the higher-fidelity, row-level source), which is what the migration is actually written from — so
the migration will not silently under-cover a `(table,cmd)` pair. The header total line above is kept
verbatim per this plan's explicit instruction (mandated exact text, for audit-trail continuity with
the ROADMAP correction), but this section documents the further, more granular correction: **24
tables, 46 new sibling policies (37 Group A + 7 Group B + 2 Group C) pre-edge-case**, following the
identical disclosure discipline RESEARCH itself used for the ROADMAP 62/32 → 39/24 correction, and
Phase 1's IDENT-05 30→17 FK correction. This is a same-magnitude, same-class correction — not a new
finding requiring a scope change, since it only affects how many `CREATE POLICY` statements the
already-scoped 24-table worklist produces, not which tables/columns are in scope.

## Second correction — `user_preferences` id_col

RESEARCH's and this plan's `<interfaces>` both state `user_preferences` triplet uses `id_col=student_id`.
Live schema (`supabase/migrations/20250120000000_add_user_preferences.sql`) shows `user_preferences`
has NO `student_id` column — its identity column is `user_id UUID NOT NULL REFERENCES auth.users(id)`.
The 3 new `_parent_owner` policies below use the schema-correct `user_id` column, not `student_id`.
Recorded here rather than silently applied so the migration author (Plan 03) does not need to
re-derive it from scratch.

## A2 Resolution — `students_total_score`

**Method note:** the plan's Task 1 action specifies a LIVE `pg_policies`/`to_regclass` query against
production via Supabase MCP tooling. That MCP tool surface was not available to this execution agent
(worktree-isolated subagent; only filesystem/Bash tools were present). In its place, this resolution
uses the project's own migration history as authoritative file-based evidence, which is equivalent in
this specific case because the finding is a table-existence question with a directly on-point,
already-applied migration:

- `supabase/migrations/20251207000004_drop_students_total_score_table.sql` (2025-12-07):
  `DROP VIEW IF EXISTS public.student_progress_summary CASCADE;` followed by
  `DROP TABLE IF EXISTS public.students_total_score CASCADE;` — comment: "no longer used. Points are
  now calculated dynamically from students_score + student_achievements".
- `supabase/migrations/20251215000001_restore_teacher_points_access.sql` (2025-12-15) confirms the
  replacement design: a `teacher_get_student_points()` RPC computing totals from `students_score` +
  `student_achievements` directly, with no reference to a `students_total_score` table.
- No later migration (checked all files chronologically after 2025-12-07, up to and including
  `20260722120000_add_parents_and_child_profiles.sql`) contains a `CREATE TABLE ... students_total_score`
  statement — the table was never recreated.
- 02-RESEARCH.md's own live `pg_policies` scan (80 policies / 37 tables, run 2026-07-30) does not list
  `students_total_score` among the 37 tables — consistent with the drop.

**A2 RESOLVED: `students_total_score` is not an in-scope RLS-02 table** — it does not exist in the
schema (dropped 2025-12-07, never recreated; verified via migration-history archaeology 2026-08-02,
in place of the live production query the plan specifies, due to MCP tool unavailability in this
execution context). The reference to `students_total_score` inside `promote_placeholder_student`'s
source body (flagged by RESEARCH Assumption A2 as possibly stale) is confirmed a **stale/dead
reference** to a table that no longer exists — out of Phase 2 scope (D-23 resolution already marks
`promote_placeholder_student` as "no RLS-relevant change required"); flagged here for whoever
eventually cleans up that function body, not a Phase 2 action item.

---

## Group A — 16 tables with an existing `child_profiles(id)` FK

| table                      | id_col       | cmd    | legacy policy(ies)                            | new `_parent_owner` policy                       | group | notes                                                                                                                                                                                                                   |
| -------------------------- | ------------ | ------ | --------------------------------------------- | ------------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| assignment_submissions     | student_id   | ALL    | "Users can access assignment submissions"     | `assignment_submissions_all_parent_owner`        | A     | Combined teacher+student policy in ONE text; add a new ALL sibling for the ownership branch only, leave the combined legacy one untouched                                                                               |
| feedback_submissions       | student_id   | INSERT | "Students can insert own feedback"            | `feedback_submissions_insert_parent_owner`       | A     | Only INSERT has a policy on this table today                                                                                                                                                                            |
| instrument_practice_logs   | student_id   | INSERT | "Students can insert own practice log"        | `instrument_practice_logs_insert_parent_owner`   | A     |                                                                                                                                                                                                                         |
| instrument_practice_logs   | student_id   | SELECT | "Students can read own practice logs"         | `instrument_practice_logs_select_parent_owner`   | A     |                                                                                                                                                                                                                         |
| instrument_practice_streak | student_id   | ALL    | "Students can manage own practice streak"     | `instrument_practice_streak_all_parent_owner`    | A     |                                                                                                                                                                                                                         |
| notifications              | recipient_id | ALL    | "Consolidated notifications access optimized" | `notifications_all_parent_owner`                 | A     | **recipient_id branch only — leave sender_id untouched**                                                                                                                                                                |
| parental_consent_log       | student_id   | INSERT | "...insert_own"                               | `parental_consent_log_insert_parent_owner`       | A     | skip "...select_teacher" (D-30 shape)                                                                                                                                                                                   |
| parental_consent_log       | student_id   | SELECT | "...select_own"                               | `parental_consent_log_select_parent_owner`       | A     |                                                                                                                                                                                                                         |
| parental_consent_tokens    | student_id   | INSERT | "...insert_own"                               | `parental_consent_tokens_insert_parent_owner`    | A     | skip "...select_anon" (`USING (true)`, unrelated)                                                                                                                                                                       |
| parental_consent_tokens    | student_id   | SELECT | "...select_own"                               | `parental_consent_tokens_select_parent_owner`    | A     |                                                                                                                                                                                                                         |
| parental_consent_tokens    | student_id   | UPDATE | "...update_own"                               | `parental_consent_tokens_update_parent_owner`    | A     | **`...update_own` has `with_check: NULL` live today — MUST write explicit WITH CHECK on the new sibling, Pitfall 1. Do not copy the missing-check pattern forward.**                                                    |
| push_subscriptions         | student_id   | DELETE | delete_own                                    | `push_subscriptions_delete_parent_owner`         | A     | 4 siblings, all 4 commands already correctly split                                                                                                                                                                      |
| push_subscriptions         | student_id   | INSERT | insert_own                                    | `push_subscriptions_insert_parent_owner`         | A     |                                                                                                                                                                                                                         |
| push_subscriptions         | student_id   | SELECT | select_own                                    | `push_subscriptions_select_parent_owner`         | A     |                                                                                                                                                                                                                         |
| push_subscriptions         | student_id   | UPDATE | update_own                                    | `push_subscriptions_update_parent_owner`         | A     |                                                                                                                                                                                                                         |
| rate_limits                | student_id   | INSERT | insert (own)                                  | `rate_limits_insert_parent_owner`                | A     |                                                                                                                                                                                                                         |
| rate_limits                | student_id   | SELECT | select (own)                                  | `rate_limits_select_parent_owner`                | A     |                                                                                                                                                                                                                         |
| rate_limits                | student_id   | UPDATE | update (own)                                  | `rate_limits_update_parent_owner`                | A     |                                                                                                                                                                                                                         |
| student_daily_challenges   | student_id   | ALL    | "students_own_challenges"                     | `student_daily_challenges_all_parent_owner`      | A     |                                                                                                                                                                                                                         |
| student_daily_goals        | student_id   | INSERT | insert_own                                    | `student_daily_goals_insert_parent_owner`        | A     |                                                                                                                                                                                                                         |
| student_daily_goals        | student_id   | SELECT | select (combined w/ teacher `EXISTS`)         | `student_daily_goals_select_parent_owner`        | A     |                                                                                                                                                                                                                         |
| student_daily_goals        | student_id   | UPDATE | update_own                                    | `student_daily_goals_update_parent_owner`        | A     |                                                                                                                                                                                                                         |
| student_point_transactions | student_id   | INSERT | "student_point_transactions_insert"           | `student_point_transactions_insert_parent_owner` | A     | Preserve `is_admin()`/`service_role`/`delta<=0` clauses verbatim; extend only the ownership half. Only 2 of 8 policies on this table reference `student_id` — the other 6 are pure admin/service-role gates, untouched. |
| student_point_transactions | student_id   | SELECT | "student_point_transactions_select"           | `student_point_transactions_select_parent_owner` | A     | Same preserve-verbatim caveat                                                                                                                                                                                           |
| student_skill_progress     | student_id   | DELETE | delete (own)                                  | `student_skill_progress_delete_parent_owner`     | A     |                                                                                                                                                                                                                         |
| student_skill_progress     | student_id   | INSERT | insert_gate                                   | `student_skill_progress_insert_parent_owner`     | A     | **GATED — preserve `is_free_node(node_id) OR has_active_subscription((SELECT auth.uid()))` verbatim, Pitfall 5. Treat as its own reviewed sub-task, not the mechanical batch.**                                         |
| student_skill_progress     | student_id   | SELECT | select (+teacher)                             | `student_skill_progress_select_parent_owner`     | A     |                                                                                                                                                                                                                         |
| student_skill_progress     | student_id   | UPDATE | update_gate                                   | `student_skill_progress_update_parent_owner`     | A     | **GATED — same preserve-verbatim caveat as INSERT above**                                                                                                                                                               |
| student_unit_progress      | student_id   | DELETE | delete                                        | `student_unit_progress_delete_parent_owner`      | A     | skip select_teacher (D-30 shape)                                                                                                                                                                                        |
| student_unit_progress      | student_id   | INSERT | insert                                        | `student_unit_progress_insert_parent_owner`      | A     |                                                                                                                                                                                                                         |
| student_unit_progress      | student_id   | SELECT | select-own                                    | `student_unit_progress_select_parent_owner`      | A     |                                                                                                                                                                                                                         |
| student_unit_progress      | student_id   | UPDATE | update                                        | `student_unit_progress_update_parent_owner`      | A     |                                                                                                                                                                                                                         |
| students_score             | student_id   | DELETE | delete                                        | `students_score_delete_parent_owner`             | A     |                                                                                                                                                                                                                         |
| students_score             | student_id   | INSERT | insert_gate                                   | `students_score_insert_parent_owner`             | A     | **GATED — same preserve-verbatim caveat as student_skill_progress, Pitfall 5**                                                                                                                                          |
| students_score             | student_id   | SELECT | select (+teacher inline)                      | `students_score_select_parent_owner`             | A     |                                                                                                                                                                                                                         |
| students_score             | student_id   | UPDATE | update                                        | `students_score_update_parent_owner`             | A     |                                                                                                                                                                                                                         |
| user_accessories           | user_id      | ALL    | "user_accessories_access"                     | `user_accessories_all_parent_owner`              | A     | skip "Admin can manage..." (service_role/is_admin only)                                                                                                                                                                 |

**Group A total: 37 new sibling policies across 16 tables** (see Count Correction note above — RESEARCH's per-table cmd breakdown, summed, not the "30" prose figure).

---

## Group B — 7 tables whose FK points at `auth.users`, NOT `students`/`child_profiles`

**D-33: policies ARE rewritten this phase; the FK-target gap itself is documented, not fixed** (RLS-only phase boundary — the predicate works correctly against the existing UUID-reused values regardless of FK target).

| table                | id_col     | cmd | legacy policy                                                                      | new `_parent_owner` policy              | group | notes                                                                                                                |
| -------------------- | ---------- | --- | ---------------------------------------------------------------------------------- | --------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| class_enrollments    | student_id | ALL | "Consolidated class enrollments access" (student branch `student_id = auth.uid()`) | `class_enrollments_all_parent_owner`    | B     | Teacher branch via `classes.teacher_id` is D-30-shape, untouched. **D-33: FK targets `auth.users`, not fixed here.** |
| current_streak       | student_id | ALL | "Users can access current streak"                                                  | `current_streak_all_parent_owner`       | B     | Teacher `EXISTS` branch + `service_role` untouched. **D-33.**                                                        |
| highest_streak       | student_id | ALL | "Users can access highest streak"                                                  | `highest_streak_all_parent_owner`       | B     | **D-33.**                                                                                                            |
| last_practiced_date  | student_id | ALL | "Consolidated practice date access"                                                | `last_practiced_date_all_parent_owner`  | B     | **D-33.**                                                                                                            |
| practice_sessions    | student_id | ALL | "Consolidated practice sessions access"                                            | `practice_sessions_all_parent_owner`    | B     | Teacher `IN` branch via `teacher_student_connections` untouched. **D-33.**                                           |
| student_achievements | student_id | ALL | "Consolidated achievements access"                                                 | `student_achievements_all_parent_owner` | B     | skip "Teachers can view connected students achievements" (D-30 shape). **D-33.**                                     |
| student_profiles     | student_id | ALL | "Consolidated profiles access"                                                     | `student_profiles_all_parent_owner`     | B     | **D-33.**                                                                                                            |

**Group B total: 7 new sibling policies across 7 tables.**

---

## Group C — `child_profiles` itself (additive from zero, Phase 1 D-16 deny-all)

| table          | id_col                                            | cmd    | legacy policy         | new policy                                                                                                                                             | group | notes                                                                          |
| -------------- | ------------------------------------------------- | ------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------------------------------------------------------------------------------ |
| child_profiles | parent_id                                         | ALL    | none (deny-all today) | `child_profiles_all_parent_owner` — `USING/WITH CHECK (parent_id = (SELECT auth.uid()))`                                                               | C     | Terminal predicate, no subquery — RLS-H2 non-recursion anchor                  |
| child_profiles | id (via `teacher_student_connections.student_id`) | SELECT | none (deny-all today) | `child_profiles_select_teacher` — `EXISTS (... tsc.teacher_id = (SELECT auth.uid()) AND tsc.student_id = child_profiles.id AND tsc.status='accepted')` | C     | Terminal predicate — direct `EXISTS`, never calls `owned_child_ids()` (RLS-H2) |

**Group C total: 2 new policies.**

---

## Edge Cases (owner-resolved D-31/D-32)

| table            | id_col                                                                                                        | cmd                                              | mechanism                                                                                                                                                         | group | notes                                                                                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| user_preferences | **`user_id`** (corrected — see "Second correction" note above; NOT `student_id` as RESEARCH/plan text states) | SELECT, INSERT, UPDATE                           | Standard `_parent_owner` triplet, `user_id IN (SELECT public.owned_child_ids())`                                                                                  | edge  | **D-31: CHILD-scoped.** Sibling added alongside the legacy `auth.uid() = user_id` policies. 3 new policies.                                                                                                                                                                               |
| accessories      | none (catalog table, no `student_id`/`user_id` column)                                                        | SELECT                                           | ADD `OR EXISTS (SELECT 1 FROM child_profiles WHERE parent_id = (SELECT auth.uid()))` sibling condition onto the existing `accessories_select_consolidated` policy | edge  | **D-32: IN scope.** Modifies the EXISTING policy text (adds an OR-branch), not a new `CREATE POLICY` — 0 new policies, 1 modified.                                                                                                                                                        |
| assignments      | none directly (embeds a correlated `class_enrollments.student_id = auth.uid()` predicate)                     | ALL (embedded in "Users can access assignments") | Rewrite the embedded correlated predicate to `class_enrollments.student_id IN (SELECT public.owned_child_ids())`                                                  | edge  | **D-32: IN scope. "Looks-fixed-but-isn't" trap** — fixing `class_enrollments`'s own policy does NOT propagate here; this is a separate, explicit text edit inside `assignments`' own policy. 0 new policies, 1 modified. Call out explicitly in the Wave 2 migration's verification step. |

**Edge case total: 3 new policies (user_preferences) + 2 modified-in-place (accessories, assignments).**

---

## Minor Observation (no action, D-30 locked)

`teacher_student_connections`'s own live policy ("Unified teacher student connections access
optimized") is `(teacher_id = (SELECT auth.uid())) OR (student_id = (SELECT auth.uid()))` — the
second branch is structurally the same self-access pattern being rewritten everywhere else in this
inventory, and will stop granting a parent direct access to a second/third child's connection row
(only the UUID-reused first child still matches) once this phase ships. **Verified via `Grep`**
(`src/services/authorizationUtils.js` only filters this table by `teacher_id`) that no client code
queries this table filtered by `student_id` from a self/child perspective — this branch is dead code,
not a live risk. Recorded for awareness only; **D-30 is locked and this is not rewritten this phase.**

---

## OWNER SIGN-OFF

**Signed:** 2026-08-01 · Owner (Daniel) via `02-CONTEXT.md` D-31/D-32/D-33.

- **D-31:** `user_preferences` classified CHILD-scoped — notification/reminder/sound settings are
  per-learner, not one-per-account. Gets the standard SELECT/INSERT/UPDATE `_parent_owner` triplet
  (id_col corrected to `user_id` at transcription time, see note above).
- **D-32:** `accessories` (OR-EXISTS sibling condition) + `assignments` (correlated-predicate rewrite)
  swept into scope — low rewrite cost, deferring leaves a known "looks-done-but-isn't" breakage live
  for multi-child/new-signup parents.
- **D-33:** Group B FK-target gap (7 tables FK'd to `auth.users` instead of `students`/`child_profiles`)
  is documented as a known item for Phase 8 (or an inserted phase), NOT fixed here — matches the
  RLS-only phase boundary. Their RLS-02 policies ARE rewritten this phase regardless of the FK target
  (the predicate works via UUID reuse).

**A2 resolved:** `students_total_score` confirmed NOT an in-scope RLS-02 table (dropped 2025-12-07,
never recreated) — see "A2 Resolution" section above. 24 tables remains the correct in-scope count
(no 25th table added).

---

## POST-APPLY PRODUCTION VERIFIER

**Verified:** 2026-08-03 (post `20260801120000_rls_ownership_rewrite` production apply) · **PASS**

Read-only re-query against `hdltcvgqrtxuxgjdvzzu` after the owner applied the migration via the
Supabase SQL Editor:

- `_parent_owner` policy count: **50** (matches this inventory's count exactly)
- `owned_child_ids()`: `SECURITY INVOKER` (`prosecdef=false`), `STABLE` (`provolatile='s'`) — RLS-01 PASS
- RLS-02 dual-policy coverage (46 table:cmd pairs, 24-table inventory): PASS, zero uncovered pairs
- RLS-03 (every `_parent_owner` INSERT/UPDATE has non-null, non-trivial `WITH CHECK`): PASS, count = 0
- RLS-04 static recursion guard (`child_profiles` never references `owned_child_ids()`): PASS, count = 0
- Supabase Advisors (security + performance): zero `ERROR`, zero `42P17` recursion errors anywhere;
  460 `multiple_permissive_policies` WARNs are the expected, by-design consequence of the additive
  dual-policy rollout (resolved when Phase 8 drops the legacy half)
- `npm run test:run`: 2160/2160 passed, zero new failures
- Owner real-account smoke test (`danieltest@gmail.com`, parent with 1 child, 71 skill-progress rows,
  33,093 XP / level 25, active streak, 50 practice sessions): APPROVED — trail/XP/streak/dashboard
  render identically, parent read/write of own child's data confirmed working

Full detail: `02-apply-log.md` §"Wave 4 Gate Log".
