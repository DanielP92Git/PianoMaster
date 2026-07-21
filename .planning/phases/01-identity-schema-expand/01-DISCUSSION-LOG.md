# Phase 1: Identity Schema Expand - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-21
**Phase:** 1-Identity Schema Expand
**Areas discussed:** FK repoint strategy, parents table shape, child_profiles backfill, Expand-window safety, Leftover schema details, New-profile writability, Billing & table scoping, Legacy functions & deletion hazard, Sync scope & naming debt

---

## FK repoint strategy

**Conflict surfaced before questioning:** ROADMAP SC #5 ("all 30 FK columns _resolve to_
`child_profiles`") and research SUMMARY §Phase 1 ("nullable `child_profile_id` columns added
_alongside_") specify two materially different migrations.

| Option                                         | Description                                                                                                           | Selected |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| In-place constraint swap                       | Column names unchanged; drop/re-add FK pointing at `child_profiles(id)`. Zero rows touched, zero client code changes. | ✓        |
| Parallel `child_profile_id` columns            | 30 new nullable columns backfilled by copying. Truly additive but doubles FK surface and needs a later drop pass.     |          |
| Split: in-place for most, parallel for billing | Hedges high-blast-radius tables at the cost of two patterns in one migration.                                         |          |

**User's choice:** In-place constraint swap
**Notes:** Anchor decision (UUID reuse) makes this viable — values are already valid in the new table.

| Option                               | Description                                                                                                                        | Selected |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Dual FK — keep both                  | Both constraints satisfiable via 1:1 UUID mirror; Postgres rejects anything breaking either model. Legacy side dropped in Phase 8. | ✓        |
| Swap outright — drop students FK now | Cleaner end state, matches roadmap wording literally; removes safety net early.                                                    |          |

**User's choice:** Dual FK — keep both
**Notes:** Reframes ROADMAP SC #5 — verification asserts "every identity column has a `child_profiles`
FK", not "zero references to `students(id)` remain". Recorded so a verifier doesn't fail a correct
Phase 1.

| Option                               | Description                                                                                  | Selected |
| ------------------------------------ | -------------------------------------------------------------------------------------------- | -------- |
| One atomic migration                 | Tables + backfill + FKs in one transactional file; rollback is one `DROP TABLE ... CASCADE`. | ✓        |
| Three files: DDL / backfill / FKs    | Easier review; creates real intermediate states.                                             |          |
| Two files: schema+backfill, then FKs | Middle ground; one harmless intermediate state.                                              |          |

**User's choice:** One atomic migration

| Option                                 | Description                                                                                         | Selected |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- | -------- |
| Query-generated, committed checklist   | Explicit statements written from a committed artifact; same query re-runs as IDENT-05 verification. | ✓        |
| Dynamic `DO` block at runtime          | Cannot miss a column; opaque and repoints things nobody consciously decided to repoint.             |          |
| Both — explicit plus runtime assertion | Legible migration that also fails loudly on a stale checklist.                                      |          |

**User's choice:** Query-generated, committed checklist
**Notes:** Pitfall 2 (FK target drift) has shipped 3× in this repo.

---

## parents table shape

| Option                        | Description                                                                       | Selected |
| ----------------------------- | --------------------------------------------------------------------------------- | -------- |
| Minimal: `display_name` only  | id, timestamps, nullable `display_name`. No email (lives in `auth.users`).        | ✓        |
| Minimal + consent columns now | Front-loads Phase 3/6 needs; ships dead columns of unproven shape.                |          |
| Mirror `teachers` fully       | Maximum consistency; collects unused parent PII against the milestone's own goal. |          |

**User's choice:** Minimal: `display_name` only

| Option                                         | Description                                                                               | Selected |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| All 15, plus a re-consent flag                 | Uniform schema now; consent enforced at app layer. Pulls segmentation query into Phase 1. | ✓        |
| Confirmed adults only; minors stay parent-less | Most legally honest; two backfill shapes.                                                 |          |
| All 15 uniformly, segmentation deferred        | Simplest; is exactly what Pitfall 6 looks like.                                           |          |

**User's choice:** All 15, plus a re-consent flag
**Notes:** Tension acknowledged — SC #3 wants `parent_id` resolving for all 15, but auto-creating a
parent row for a child's account is Pitfall 6. Resolved by separating schema completeness from
consent enforcement.

| Option                                          | Description                                                          | Selected |
| ----------------------------------------------- | -------------------------------------------------------------------- | -------- |
| Automated query + manual owner review of all 15 | Heuristic then human sign-off; reviewed table committed. Owner gate. | ✓        |
| Pure automated heuristic                        | Repeatable; a misclassification produces no test failure.            |          |
| Flag all 15 conservatively                      | Zero chance of missing a minor; interrupts adults.                   |          |

**User's choice:** Automated query + manual owner review of all 15

| Option                                    | Description                                                                               | Selected |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| No — created on demand, dual role allowed | `parents` row created when an account first acts as a parent; one uid may hold both rows. | ✓        |
| Yes — backfill for every auth user        | Uniform table; asserts "is a parent" for accounts owning no child.                        |          |
| No, and enforce mutual exclusion          | Cleanest role model; blocks the teacher-who-is-also-a-parent case.                        |          |

**User's choice:** No — created on demand, dual role allowed

---

## child_profiles backfill

| Option                                       | Description                                                         | Selected |
| -------------------------------------------- | ------------------------------------------------------------------- | -------- |
| `students.nickname`, fall back to generated  | Already non-PII by construction; never reads first/last name.       | ✓        |
| `students.first_name`, fall back to nickname | Children keep a familiar name; contradicts IDENT-02 and PROFILE-03. |          |
| Generate fresh for everyone                  | Zero PII carryover; visible regression for 20 children.             |          |

**User's choice:** `students.nickname`, fall back to a generated one

| Option                                | Description                                                                     | Selected |
| ------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Derive year only from `date_of_birth` | Preserves under-13 signal, drops identifying precision.                         | ✓        |
| Leave NULL for all 20                 | Maximum minimization; forces `is_under_13` reads through `students` all window. |          |
| Copy full `date_of_birth`             | Nothing downstream changes; squarely PII and outside IDENT-02's scope.          |          |

**User's choice:** Derive year only from `date_of_birth`

| Option                                     | Description                                                              | Selected |
| ------------------------------------------ | ------------------------------------------------------------------------ | -------- |
| Reuse `avatar_id` FK to existing `avatars` | PROFILE-02's no-upload rule enforced structurally by the FK.             | ✓        |
| Denormalize to a text key                  | Simpler to read; loses FK enforcement of the preset constraint.          |          |
| New preset set                             | Cleaner conceptual break; out-of-scope asset work, changes every avatar. |          |

**User's choice:** Reuse `avatar_id` FK to the existing avatars table

| Option                                  | Description                                                                    | Selected |
| --------------------------------------- | ------------------------------------------------------------------------------ | -------- |
| RLS enabled, zero policies — deny-all   | Default-deny; Advisors clean; Phase 2 adds policies to a locked table.         | ✓        |
| Enabled with minimal self-access policy | Convenient for verification; pre-empts the design RLS-01 reserves for Phase 2. |          |
| RLS off until Phase 2                   | Simplest diff; two tables of children publicly readable for the window.        |          |

**User's choice:** RLS enabled, zero policies — deny-all

---

## Expand-window safety

| Option                                     | Description                                                                      | Selected |
| ------------------------------------------ | -------------------------------------------------------------------------------- | -------- |
| Sync trigger `students` → `child_profiles` | Existing app code keeps writing to `students`; new table stays current for free. | ✓        |
| Freeze `students` read-only                | No drift possible; breaks the zero-client-change promise immediately.            |          |
| Allow drift; reconcile at Phase 6          | Smallest diff; silent drift lands in the riskiest phase.                         |          |

**User's choice:** Sync trigger on students → child_profiles

| Option                                 | Description                                                               | Selected |
| -------------------------------------- | ------------------------------------------------------------------------- | -------- |
| Committed SQL script, run on demand    | No CI plumbing, no local-DB dependency; real schema only exists remotely. | ✓        |
| Vitest test against live schema        | Runs in CI; silently passes on nothing without live credentials.          |          |
| Prebuild hook like `validateTrail.mjs` | Strongest enforcement; makes every build depend on Supabase reachability. |          |

**User's choice:** Committed SQL script, run on demand

| Option                                                        | Description                                                       | Selected |
| ------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| Owner-gated apply + committed rollback, rehearsed on a branch | Proves the rollback restores prior state rather than assuming it. | ✓        |
| Same, no rehearsal                                            | Faster; rollback correctness stays theoretical.                   |          |
| Rollback documented not scripted                              | Lightest; leaves 30 constraints to hand-write under pressure.     |          |

**User's choice:** Owner-gated apply + committed rollback, rehearsed on a branch

| Option                                                | Description                                                                | Selected |
| ----------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| Existing suite green + owner smoke test on production | Per-account check catches what mocks and aggregates miss.                  | ✓        |
| Existing test suite green only                        | Fast; suite runs against mocks, blind to a wrong FK target.                |          |
| Row-count and integrity assertions only               | Matches roadmap criteria; proves shape, not that a child sees their trail. |          |

**User's choice:** Existing suite green + owner smoke test on production

---

## Leftover schema details

| Option                          | Description                                                                    | Selected |
| ------------------------------- | ------------------------------------------------------------------------------ | -------- |
| `is_active` in Phase 1          | Mirrors `teachers.is_active`; COPPA-06 already points at it.                   | ✓        |
| Add in Phase 4 with the feature | Keeps Phase 1 to named requirements; puts DDL inside a UI phase.               |          |
| Reuse `students.account_status` | Consistent; conflates suspension with collection-refusal, on a retiring table. |          |

**User's choice:** `is_active BOOLEAN NOT NULL DEFAULT TRUE` in Phase 1

| Option                                   | Description                                                                                      | Selected |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| `parent_id` SET NULL; downstream CASCADE | Parent deletion leaves parent-less profiles (legal per D-06); child deletion still removes data. | ✓        |
| CASCADE throughout                       | Cleanest "delete my family"; makes one mistake unrecoverable.                                    |          |
| `parent_id` RESTRICT; downstream CASCADE | Safest against accident; breaks the existing deletion flow until Phase 4.                        |          |

**User's choice:** `parent_id` ON DELETE SET NULL; downstream ON DELETE CASCADE

| Option                                      | Description                                                                      | Selected |
| ------------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Phase 1 adds `child_profiles(parent_id)`    | Hottest column in Phase 2's ownership subquery; makes Phase 2's baseline honest. | ✓        |
| Phase 2 adds all indexes after measuring    | Nothing unused ships; first measurement taken against an unindexed hot column.   |          |
| Phase 1 indexes `parent_id` and `is_active` | `is_active` unjustified on a ~20-row table.                                      |          |

**User's choice:** Phase 1 adds `child_profiles(parent_id)`

| Option                                          | Description                                                                      | Selected |
| ----------------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Untouched; scrubbing is Phase 8's job           | Preserves reversibility; recorded as a known exposure with an owner.             | ✓        |
| Scrub non-essential PII in Phase 1              | Removes data sooner; destroys the rollback path.                                 |          |
| Untouched, plus an explicit Phase 8 requirement | Stronger guarantee; edits milestone requirements from inside a phase discussion. |          |

**User's choice:** Untouched in Phase 1; scrubbing is Phase 8's job

---

## New-profile writability (hazard found during discussion)

**Hazard:** the dual-FK decision means a child profile created from Phase 3 onward, having no
`students` row, would fail the retained legacy FK on its first downstream write.

| Option                                       | Description                                                                        | Selected |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| Trigger makes the sync bidirectional         | Shadow `students` row on the same UUID keeps both FKs satisfiable for every child. | ✓        |
| Drop legacy FK per-table as Phase 3 needs it | Retires the constraint where it's in the way; fragments the model into two tiers.  |          |
| Drop legacy FK entirely at start of Phase 3  | Time-boxed and simple; gives up the safety net during the Phase 6 live migration.  |          |

**User's choice:** Trigger makes the sync bidirectional

| Option                               | Description                                                                | Selected |
| ------------------------------------ | -------------------------------------------------------------------------- | -------- |
| Both directions in Phase 1           | Written and tested while schema is fresh; sits inert until Phase 3.        | ✓        |
| Forward only; add reverse in Phase 3 | Minimal Phase 1; books a schema migration into a UI phase.                 |          |
| Both, with an infinite-loop guard    | Strictly more correct; the guard is a how-detail, not a separate decision. |          |

**User's choice:** Both directions in Phase 1
**Notes:** Loop guard folded in as an implementation detail (`WHEN` clause or existence check).

| Option                                          | Description                                                                  | Selected |
| ----------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| INSERT and UPDATE both                          | Renames propagate; the two tables never disagree on a user-visible field.    | ✓        |
| INSERT only — shadow row creation               | Minimal; produces visible split-brain on rename from Phase 4, with no error. |          |
| INSERT + UPDATE, `child_profiles` authoritative | Clearer for debugging; a genuine conflict is hard to construct here.         |          |

**User's choice:** INSERT and UPDATE both

---

## Billing & table scoping (hazard found during discussion)

**Hazard:** `parent_subscriptions.student_id` is in the sweep, but milestone D-05 makes subscriptions
parent-scoped — Phase 1 would move it in the known-wrong direction, on a table with 3 live paying
customers.

| Option                                            | Description                                                                          | Selected |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Carve it out of the sweep entirely                | Named exclusion with reason in the checklist; Phase 5 owns it.                       | ✓        |
| Repoint to `child_profiles` now, again in Phase 5 | Uniform sweep; moves a live-billing column twice, first time wrongly.                |          |
| Repoint straight to `parents` in Phase 1          | Correct end state immediately; pulls MIGRATE-04 forward before sandbox verification. |          |

**User's choice:** Carve it out of the sweep entirely

| Option                                                 | Description                                                                                      | Selected |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------- |
| Classify all tables during checklist review            | Scope column on the checklist, reviewed in the same owner pass; parent-scoped tables carved out. | ✓        |
| Repoint all to `child_profiles`; reclassify in Phase 2 | Mechanical Phase 1; makes Phase 2 correct FK targets while doing its highest-stakes work.        |          |
| Only carve out `parent_subscriptions`                  | Handles the known case; defers the same problem for push subs and report opt-out.                |          |

**User's choice:** Classify during checklist review, carve out parent-scoped tables
**Notes:** Swept column count will be lower than the roadmap's stated 30 — final number comes from the
reviewed checklist.

---

## Legacy functions & the deletion hazard (hazard found during discussion)

**Hazard:** with dual FK and CASCADE on both sides, the live 30-day-grace deletion cron deleting a
`students` row cascades away all of that child's downstream data while the `child_profiles` row
survives — a hollow profile, silently, for ~7 phases.

| Option                                      | Description                                                                      | Selected |
| ------------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Inventory all; fix only the deletion hazard | Committed inventory as a second artifact; act only on what can destroy data now. | ✓        |
| Inventory only; change nothing              | Strictly additive; leaves a live destructive path open for the window.           |          |
| Fix every function in Phase 1               | Ends the window clean; that's Phase 8's job and inflates the reversible phase.   |          |

**User's choice:** Inventory them all; fix only the deletion hazard now

| Option                                                          | Description                                                                    | Selected |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------- |
| Extend the deletion path to remove the `child_profiles` row too | Keeps the shipped COPPA-05 delete duty working end-to-end.                     | ✓        |
| Block deletions during the expand window                        | Safest against data loss; trades a hypothetical bug for a live compliance gap. |          |
| Cascade, then sweep orphan profiles separately                  | Cron untouched; leaves hollow profiles live and adds a second moving part.     |          |

**User's choice:** Extend the deletion path to remove the `child_profiles` row too

---

## Naming debt

| Option                                      | Description                                                                                        | Selected |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Keep names; note debt for Phase 8 to decide | Phase 1 renames nothing; Phase 8 weighs it against the 47-call-site audit it's already doing.      | ✓        |
| Commit now to renaming in Phase 8           | Guarantees the schema eventually reads honestly; pre-commits Phase 8 sight unseen.                 |          |
| Accept permanently, document the mapping    | Zero further churn; leaves a column name contradicting its target in a repo with 3 FK-target bugs. |          |

**User's choice:** Keep the names; note the debt for Phase 8 to decide

---

## Claude's Discretion

- Shadow-row column defaults, and how `trigger_auto_generate_nickname` / `trigger_calculate_is_under_13` interact with reverse-sync inserts
- Migration file naming and timestamp
- Trigger implementation specifics (loop-guard form)
- Statement ordering within the atomic migration
- Column types and constraint naming, following existing migration style

## Deferred Ideas

- Renaming `student_id` → `child_profile_id` — Phase 8's call
- Scrubbing legacy PII from `students` — Phase 8, recorded as a known open exposure
- Re-pointing the inventoried SECURITY DEFINER functions — Phases 2 and 8
- Consent/legal columns on `parents` — the phase that writes them (3 or 6)
- `parent_subscriptions` re-pointing to `parents` — Phase 5, post-sandbox

## Process Notes

- **Stale phase directory:** `init phase-op` resolved Phase 1 to
  `.planning/phases/01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/`, an empty v3.5
  leftover containing only `.gitkeep`. Artifacts were written to `01-identity-schema-expand/` instead.
  The stale directory was left untouched.
- **No SPEC.md, no prior v4.0 CONTEXT.md, no matching todos, advisor mode off.**
