<!--
Migration:   20260722120000_add_parents_and_child_profiles (Phase 1, v4.0)
Date:        2026-07-22
Description: OWNER GATE (D-10) — 15-row account segmentation. Decides which auth accounts are
             self-registered minors needing parents.requires_reconsent = true (Phase 6 re-consent).
             This is an owner REVIEW artifact, not documentation. Consumed by Plan 03 (sign-off)
             and Plan 04 (backfill literal values).
Generated:   LIVE read-only query against production hdltcvgqrtxuxgjdvzzu, 2026-07-22 14:17 UTC
-->

# 01 — Account Segmentation (D-09 / D-10, IDENT-03)

**Live run:** 2026-07-22 14:17 UTC · project `hdltcvgqrtxuxgjdvzzu`.
**Split confirmed:** 15 auth-having students + **5 auth-less** students = 20 total ✓ (matches `students` row count).

## Re-consent heuristic

An auth account is flagged `flag_self_registered_minor = true` when **all three** hold:

1. `date_of_birth` is set AND indicates **under 18 at signup** (`dob > auth.created_at - 18 years`), **and**
2. `parent_email` is NULL or equals the account's own email (`parent_email_null_or_self`), **and**
3. no consent was ever verified (`consent_verified_at IS NULL`).

A `true` flag becomes **`parents.requires_reconsent = true`** in the Plan 04 backfill → drives the Phase 6
re-consent flow. `owner_override` lets the owner flip any row before the backfill is written from it.

> **⚠️ OWNER GATE (Plan 03):** silent child→parent reparenting (Pitfall 6) produces **no test failure**.
> Review all 15 rows. If any `owner_override` flips a flag, the `requires_reconsent = true` count below
> changes and the `01-db-assertions.sql` literal (currently **1**) must be reconciled before the Plan 05 apply.

## Segmentation table — 15 auth-having students

| id                                   | auth_email               | auth_created_at | date_of_birth | parent_email       | consent_verified_at | dob_under_18_at_signup | parent_email_null_or_self | no_consent_verified | flag_self_registered_minor | owner_override | notes                                                     |
| ------------------------------------ | ------------------------ | --------------- | ------------- | ------------------ | ------------------- | ---------------------- | ------------------------- | ------------------- | -------------------------- | -------------- | --------------------------------------------------------- |
| 1dfb9e09-fb9e-4f22-85ba-cb0d82fc0893 | danielnosub@gmail.com    | 2026-06-28      | 2000-01-01    | —                  | —                   | false                  | true                      | true                | **false**                  |                | adult DOB                                                 |
| 1f569340-c919-438c-b61c-246d7c3b4cac | danielstudent@gmail.com  | 2025-07-08      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| 2c85985d-275c-42d7-a24e-72463909937a | tamar.kfir91@gmail.com   | 2025-09-29      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| 42b28d4b-14a6-4982-a08a-d2543edd77c9 | sivanshani2000@gmail.com | 2025-11-16      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| 674c6094-5292-423d-8ac8-b631428ac31e | shaul.kfir@gmail.com     | 2025-11-15      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| 8650dc76-90f5-48d9-a7c0-aa18542b30d4 | danieltest@gmail.com     | 2026-05-03      | 1997-01-01    | —                  | —                   | false                  | true                      | true                | **false**                  |                | adult DOB                                                 |
| 87ee7640-fdc2-4032-a2d6-a22aa29255f2 | michalkatom@gmail.com    | 2026-05-05      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| 891ede89-8f4d-487a-be52-4ec434220122 | shlomit132@gmail.com     | 2025-12-01      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| 92109e06-75aa-4bad-86c8-c5051e977a4d | avigail.ab@gmail.com     | 2025-12-01      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| bd83a9c2-4d99-4345-b946-41a3f5e374f3 | anatp9292@gmail.com      | 2025-09-26      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| ca83835b-f020-440d-9e80-571a47c7993d | oritik@gmail.com         | 2025-11-25      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| cdef3658-4e11-49b4-ab2a-7c2a4867dcb7 | araro2013@gmail.com      | 2025-11-30      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| ce7a53c8-d0ab-4558-96ff-b3cec89a9c22 | beri.rozenberg@gmail.com | 2025-12-12      | —             | —                  | —                   | false                  | true                      | true                | **false**                  |                | no DOB                                                    |
| e211389a-43e2-483d-98c8-1fdfb82fef15 | tehilakarmeli@gmail.com  | 2026-06-22      | 2000-01-01    | —                  | —                   | false                  | true                      | true                | **false**                  |                | adult DOB                                                 |
| e79437b8-dcf1-434d-9077-d8fa51223e26 | hallellu@gmail.com       | 2026-06-23      | 2015-01-01    | hallellu@gmail.com | —                   | true                   | true                      | true                | **TRUE**                   |                | **self-registered minor** (DOB 2015, parent_email = self) |

**`flag_self_registered_minor = true` count: 1** (only `e79437b8…` / hallellu@gmail.com).
→ `parents.requires_reconsent = true` count for the backfill = **1** (this is the literal the assertion suite checks).

> Observation for owner review: 11 of 15 accounts have **no `date_of_birth`** at all, so the heuristic
> cannot judge their age — it defaults them to `false` (not a self-registered minor). If any of these are
> in fact children who self-registered, set `owner_override` accordingly at the Plan 03 gate.

## The 5 auth-less students (teacher-created → `parent_id = NULL`, IDENT-03)

Trivially `parent_id = NULL` — no heuristic needed. Confirmed **exactly 5** (matches CONTEXT assumption).

| id                                   | musical_nickname                                  | avatar_id | date_of_birth |
| ------------------------------------ | ------------------------------------------------- | --------- | ------------- |
| 40225ab5-8832-4d82-950f-78c203da56f3 | Merry Tempo                                       | —         | —             |
| 413d07e5-5254-4a62-996f-067475bc01de | Sunny Clef                                        | —         | —             |
| 7635a40a-c398-4b21-ab11-3a82e168380a | _(null → `generate_musical_nickname()` fallback)_ | —         | —             |
| 862da1a7-30d1-47e6-8cf1-fd538be22c06 | Cheerful Harmony                                  | —         | 2016-04-04    |
| 9631f5d0-c770-4d80-95f9-5e90a6fa5ac0 | Cheerful Bass                                     | —         | —             |

## Backfill derivation notes (consumed by Plan 04)

- **`birth_year`** (D-13): `EXTRACT(YEAR FROM date_of_birth)::INTEGER` — month/day discarded; NULL propagates
  (e.g. row `862da1a7` → `birth_year = 2016`; all NULL-DOB rows → `birth_year = NULL`).
- **`nickname`** (D-12): `COALESCE(musical_nickname, generate_musical_nickname())` — only row `7635a40a`
  needs the fallback (its `musical_nickname` is NULL).
- **`avatar_id`**: all 20 rows currently have `avatar_id = NULL`; FK-reused as-is (nullable).
- **`parents` backfill**: 15 rows (one per auth-having student above); `requires_reconsent = true` for the 1
  flagged row, `false` for the other 14 (subject to `owner_override` at the Plan 03 gate).
