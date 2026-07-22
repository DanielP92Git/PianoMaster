<!--
Migration:   20260722120000_add_parents_and_child_profiles (Phase 1, v4.0)
Date:        2026-07-22
Description: Committed inventory (D-23) of every function/trigger that touches students(id),
             so Phases 2/5/8 re-point from a query-generated list, not grep.
Generated:   LIVE pg_proc source-text search against production hdltcvgqrtxuxgjdvzzu, 2026-07-22 14:17 UTC
-->

# 01 — Function / Trigger Inventory (D-23)

**Live run:** 2026-07-22 14:17 UTC · project `hdltcvgqrtxuxgjdvzzu`.

The live `pg_proc` search (`pg_get_functiondef(...) ILIKE '%students%'`, fenced to `public` normal
functions via `OFFSET 0` + `prokind='f'` to avoid the aggregate-function error) returned **7 functions
whose definition literally contains the string `students`**. The table below merges those 7 (marked
**LIVE**) with the RESEARCH §Q7 manual seed list (marked _seed_) — several seed entries do **not**
contain the literal `students` (they act on `NEW`/`OLD` inside a trigger, or on other tables) and so
are absent from the live output; that absence is expected and noted per row.

> **Phase 1 changes EXACTLY ONE path** — the account-deletion cascade (D-24/D-25), handled in Plan 04
> as a new `AFTER DELETE ON students` trigger. **Every other function below is inventory-only** and is
> re-pointed by Phases 2 / 5 / 8. This file is the source-of-truth for that later work.

| function_name                                           | source   | references students?               | volatility / secdef     | notes                                                                                                                                                                                                                 | re-point owner      |
| ------------------------------------------------------- | -------- | ---------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| award_xp                                                | **LIVE** | yes                                | VOLATILE · SECDEF       | XP award resolves student identity                                                                                                                                                                                    | Phase 2             |
| promote_placeholder_student                             | **LIVE** | yes                                | VOLATILE · SECDEF       | **NEW live finding — not in RESEARCH seed list.** Placeholder→real student promotion touches identity                                                                                                                 | Phase 2 / review    |
| request_parental_consent                                | **LIVE** | yes                                | VOLATILE · SECDEF       | COPPA consent flow                                                                                                                                                                                                    | Phase 5/6 (consent) |
| revoke_parental_consent                                 | **LIVE** | yes                                | VOLATILE · SECDEF       | COPPA consent flow                                                                                                                                                                                                    | Phase 5/6 (consent) |
| verify_parental_consent                                 | **LIVE** | yes                                | VOLATILE · SECDEF       | COPPA consent flow                                                                                                                                                                                                    | Phase 5/6 (consent) |
| teacher_get_student_points                              | **LIVE** | yes                                | VOLATILE · SECDEF (sql) | **NEW live finding — not in RESEARCH seed list.** Teacher reads a student's point balance                                                                                                                             | Phase 2             |
| teacher_link_student                                    | **LIVE** | yes                                | VOLATILE · SECDEF       | **NEW live finding — not in RESEARCH seed list.** Links a teacher to a student row                                                                                                                                    | Phase 2             |
| has_active_subscription                                 | _seed_   | not via literal `students` in body | —                       | Did NOT surface in live search (body resolves via `parent_subscriptions`, not the literal `students`); pair member, no identity resolution on students(id)                                                            | Phase 5             |
| is_free_node                                            | _seed_   | no                                 | —                       | No identity resolution; pair member only. Absent from live output (no `students` literal)                                                                                                                             | none                |
| check_rate_limit                                        | _seed_   | not via literal `students` in body | —                       | Absent from live output; operates on `rate_limits`. Verify at Phase 2 re-point                                                                                                                                        | Phase 2             |
| auto_generate_nickname / trigger_auto_generate_nickname | _seed_   | no literal `students`              | —                       | BEFORE-INSERT trigger fn on students; acts on `NEW`, no `students` literal → absent from live search (expected)                                                                                                       | Phase 8             |
| calculate_is_under_13 / trigger_calculate_is_under_13   | _seed_   | no literal `students`              | —                       | BEFORE trigger fn on students; acts on `NEW.date_of_birth` → absent from live search (expected)                                                                                                                       | Phase 8             |
| **generate_musical_nickname**                           | _seed_   | **no**                             | VOLATILE                | **No identity resolution** — generates a random nickname. Called in the Plan 04 backfill `COALESCE(students.musical_nickname, generate_musical_nickname())`. Correctly absent from the live `students`-literal search | none (reused as-is) |

## Related out-of-scope finding (client code, not a DB function)

`src/services/dataExportService.js` hard-codes an identity-table list for GDPR export. It is **client
code**, outside this phase's DDL-only boundary — flagged here so the Phase 8 audit re-points it
alongside the DB functions. Not changed in Phase 1.

## Phase 1 action

The only function/trigger **created** in Phase 1 is the deletion-cascade trigger
`cascade_delete_child_profile_on_student_delete()` + `trigger_cascade_delete_child_profile`
(`AFTER DELETE ON students`), authored in Plan 04. It removes the matching `child_profiles` row when a
`students` row is hard-deleted by the `process-account-deletions` Edge Function — closing the
hollow-profile hazard (D-24/D-25) with **no Edge Function code change**.

> **Documentation debt (flag for Phase 7+):** `process-account-deletions/index.ts`'s
> `DATA_CATEGORIES_REMOVED` constant (used for the parent-facing deletion-confirmation email, a
> compliance artifact) will not list `child_profiles` even though the row is now correctly removed via
> the trigger. Update that list when Edge Function code is next touched.
