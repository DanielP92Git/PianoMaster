# Phase 1: Identity Schema Expand - Context

**Gathered:** 2026-07-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Additive, reversible Postgres DDL laying the foundation for parent-owned child identity: a `parents`
table, a `child_profiles` table, a UUID-reuse backfill of the 20 existing student rows, bidirectional
sync triggers keeping legacy and new tables consistent, and an in-place FK repoint of the
identity-bearing columns across the downstream tables. Zero client-visible change; rollback is a
single `DROP TABLE ... CASCADE`.

**Not in this phase:** RLS policies (Phase 2 — new tables ship deny-all), signup/age gate (Phase 3),
profile CRUD or switcher UI (Phase 4), subscription re-pointing (Phase 5 — explicitly carved out
here), live cutover/re-consent UI (Phase 6), recording removal (Phase 7), dropping legacy policies
and constraints (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### FK Repoint Strategy

- **D-01:** **In-place constraint swap.** Every identity-bearing column keeps its current name
  (`student_id` stays `student_id`). The FK constraint is dropped and re-added pointing at
  `child_profiles(id)`. Zero rows are updated and zero client code changes, because UUID reuse means
  the values are already valid. Existing indexes on those columns stay valid too.
- **D-02:** **Dual FK during the expand window.** The legacy FK to `students(id)` is _kept_ alongside
  the new `child_profiles(id)` FK. Both are satisfiable because the two tables mirror 1:1 on the same
  UUID, so Postgres rejects any write that would break either model. The legacy side is dropped in
  Phase 8's contract step.
  - **Consequence — ROADMAP SC #5 is reframed.** Verification must assert _"every identity column has
    a `child_profiles` FK"_, **NOT** _"zero unaccounted-for references to `students(id)` remain"_. The
    latter is only true after Phase 8. A verifier applying the literal roadmap wording would fail a
    correct Phase 1.
- **D-03:** **One atomic migration file.** Tables + backfill + all FK adds in a single transactional
  file, so there is no intermediate state where `child_profiles` exists but is half-wired.
- **D-04:** **Query-generated, committed checklist.** One `information_schema` query is run against
  production, its output committed as a checklist artifact in this phase dir, and the FK statements
  written explicitly from it — one line each, no dynamic `DO`-block discovery. The same query re-runs
  as the IDENT-05 verification, so generation and verification cannot disagree.
- **D-05:** **The columns keep the name `student_id` permanently for now.** The name/target mismatch
  is recorded as known debt owned by Phase 8, which can weigh a rename against the 47 service call
  sites it is already auditing. Deciding before that audit exists would be deciding blind.

### Scope Carve-Outs from the FK Sweep

- **D-06:** **`parent_subscriptions` is excluded from the sweep**, named as an explicit exclusion in
  the checklist with its reason recorded. D-05 (milestone) makes subscriptions parent-scoped, and
  Phase 5's criteria want plain `parent_id` equality with no child-profile indirection in the billing
  hot path — so a blanket sweep would move it in the known-wrong direction. Phase 1 does not touch
  the 3 live subscriptions.
- **D-07:** **All downstream tables get a child-scoped vs parent-scoped classification before
  repointing.** The checklist artifact carries a scope column; anything classified parent-scoped
  (candidates: push subscriptions, weekly-report opt-out, consent logs, account-deletion records) is
  excluded with its reason recorded. Reviewed by the owner in the same pass as the account
  segmentation table. Rationale: 62 RLS policies get written on top of these targets in Phase 2, and
  a wrongly-scoped table yields a working policy that authorizes the wrong person.
  - **Consequence:** the swept column count will be lower than the roadmap's stated 30. The final
    number comes from the reviewed checklist, not from the roadmap.

### `parents` Table

- **D-08:** **Minimal schema:** `id UUID PK REFERENCES auth.users(id)`, `created_at`, `updated_at`,
  `display_name TEXT NULL`. No `email` column (lives in `auth.users`; duplicating it is an explicit
  milestone exclusion). Consent/legal columns are added by whichever phase actually writes them.
- **D-09:** **All 15 auth-having student accounts get a `parents` row** and own their own
  `child_profile`. Accounts identified as self-registered minors carry a re-consent flag that Phase 6
  reads to render its blocking screen. Schema is uniform now; consent is enforced at the app layer
  before the parent role means anything.
  - **Consequence:** the account-segmentation query moves from Phase 6 into Phase 1, because the flag
    must be written during the backfill.
- **D-10:** **Segmentation is automated + owner-reviewed.** The heuristic (DOB under 18 at signup,
  `parent_email` null or equal to the account email, no `consent_verified_at`) produces a 15-row
  table; the owner reviews and signs off on it before the migration runs, and the reviewed table is
  committed as an artifact. **This is an owner gate** — matching this project's precedent for
  high-stakes operations. Rationale: Pitfall 6 (silent child→parent reparenting) produces no test
  failures, and 15 rows is small enough to be certain.
- **D-11:** **Teachers get no `parents` row in Phase 1.** A `parents` row is created on demand the
  first time an account acts as a parent. One `auth.uid()` may hold both a `teachers` and a `parents`
  row — no mutual-exclusion constraint (the "piano teacher who also has kids" case is plausible, and
  Phase 2's helper keys off ownership, not role exclusivity).

### `child_profiles` Table & Backfill

- **D-12:** **`nickname` comes from `students.nickname`**, falling back to the same generation rule
  the existing `trigger_auto_generate_nickname` uses where null. `first_name`/`last_name` are never
  read — that keeps IDENT-02's zero-PII guarantee structural rather than aspirational.
- **D-13:** **`birth_year` is derived as year-only from `students.date_of_birth`**, discarding month
  and day. Preserves the under-13 signal current COPPA logic depends on while dropping the precision
  that makes a full DOB identifying. Full DOB stays behind in `students` until Phase 8.
- **D-14:** **`avatar_id` reuses the existing preset `avatars` table via FK**, copying
  `students.avatar_id` across. PROFILE-02's "preset only, no custom upload" is then enforced
  structurally — there is no column an arbitrary URL could occupy. Every child keeps the avatar they
  already chose.
- **D-15:** **`is_active BOOLEAN NOT NULL DEFAULT TRUE` ships in Phase 1**, mirroring the
  `teachers.is_active` convention. COPPA-06 ("refuse further collection" for one child) is a Phase 4
  requirement with a named legal duty already pointing at this column; shipping it now means Phase 4
  delivers the feature without a mid-feature-phase DDL migration, and Phase 2 writes its policies
  knowing the column exists.
- **D-16:** **RLS is ENABLED with zero policies — deny-all.** Nothing reads these tables in Phase 1,
  so Postgres's default-deny is exactly right, Supabase Advisors stay clean, and Phase 2 adds real
  policies onto an already-locked table rather than opening one up. Phase 1 writes no policy — RLS-01
  requires the ownership helper be designed before any policy references it.
- **D-17:** **Index `child_profiles(parent_id)` in Phase 1.** Postgres does not auto-index FK columns,
  and Phase 2's ownership subquery hits `parent_id` on every policy evaluation across 62 policies.
  Adding it now means Phase 2's `EXPLAIN ANALYZE` measures the real steady state. No index on
  `is_active` (a ~20-row table will sequential-scan regardless). Further indexes are Phase 2's call.

### FK Semantics

- **D-18:** **`child_profiles.parent_id` is `ON DELETE SET NULL`; downstream columns are
  `ON DELETE CASCADE`.** Deleting a parent leaves parent-less child profiles — already a legal state
  per milestone D-06 — rather than destroying a child's data, which keeps accidental parent deletion
  recoverable in the phase that is supposed to be reversible. Downstream cascade matches how
  `students(id)` FKs already behave, so deleting a child profile still removes that child's data as
  COPPA-05 requires.

### Expand-Window Safety

- **D-19:** **Bidirectional sync triggers between `students` and `child_profiles`.**
  - _Forward (`students` → `child_profiles`), INSERT + UPDATE:_ mirrors `nickname`, `avatar_id`,
    `birth_year`. Existing app code keeps writing to `students` unchanged, which is what makes "zero
    client-visible change" actually true.
  - _Reverse (`child_profiles` → `students`), INSERT + UPDATE:_ on INSERT, creates a minimal shadow
    `students` row on the same UUID (nickname + avatar only, no PII); on UPDATE, propagates the same
    display fields back.
  - Both triggers are dropped in Phase 8 together with the legacy FK and the shadow rows.
- **D-20:** **The reverse trigger exists to close a landmine created by D-02.** From Phase 3 onward a
  parent creates a brand-new child profile with no `students` row; the first downstream insert for
  that child must satisfy _both_ FKs, and the legacy one would reject it. The shadow row keeps both
  satisfiable for every child, old or new, through to Phase 8.
- **D-21:** **Both trigger directions are built and tested in Phase 1**, even though nothing writes to
  `child_profiles` until Phase 3. The reverse trigger sits inert — harmless, since nothing inserts
  into `child_profiles` before then — and Phase 3 gets a working substrate instead of discovering a
  blocked INSERT mid-feature-work. Verified in Phase 1 by inserting and rolling back a synthetic
  profile.
  - _Implementation detail (not a separate decision):_ the triggers need a `WHEN` clause or existence
    check so they cannot fire each other in a loop.
- **D-22:** **PII still in `students` (`first_name`, `last_name`, `email`, `date_of_birth`,
  `parent_email`) is untouched in Phase 1.** Scrubbing columns the rollback would need is the one
  thing that would break the reversibility guarantee, and Phase 6's migration may still need
  `date_of_birth` and `parent_email`. Recorded here as a **known open exposure owned by Phase 8**, so
  it cannot quietly become nobody's task once the new tables look clean.

### Legacy Functions & the Deletion Hazard

- **D-23:** **A committed inventory of every function and trigger touching `students(id)`** ships as a
  second artifact alongside the FK checklist — `is_free_node`, `has_active_subscription`, `award_xp`,
  the rate-limiting functions, the COPPA export/delete functions, `trigger_auto_generate_nickname`,
  `trigger_calculate_is_under_13`, and the 30-day-grace deletion cron. FKs do not cover these; they
  resolve identity in function bodies. Phase 2 and Phase 8 re-point them **from this list, not from
  grep**.
- **D-24:** **Phase 1 changes exactly one of them: the account-deletion path.** _Hazard found during
  discussion:_ with dual FK and `ON DELETE CASCADE` on both sides, the live 30-day-grace cron deleting
  a `students` row cascades away all of that child's downstream data while the `child_profiles` row
  survives — leaving an intact-looking profile whose progress, scores, and streaks silently vanished,
  for a ~7-phase window, with no error.
- **D-25:** **Closed by extending the deletion path to remove the `child_profiles` row too** (an added
  statement, or `ON DELETE CASCADE` from `students` to `child_profiles`). The cron deletes a
  student's data on purpose after a grace period — keeping that working end-to-end is correct
  behaviour, not a regression, and COPPA-05's delete duty keeps working throughout the window.
  Blocking deletions instead would trade a hypothetical bug for a live compliance gap.

### Verification, Rollout & Testing

- **D-26:** **IDENT-05 is a committed SQL script, run on demand** — one file listing every identity FK
  column and its current target, run against production before and after the migration and again in
  Phase 8. No CI plumbing and no local-DB dependency, which matters because the real schema only
  exists remotely (a schema check that cannot reach the remote project silently passes on nothing).
  Deliberately _not_ a `validateTrail.mjs`-style prebuild hook — that script validates static JS data
  with no network; this needs a live connection, and every build would then depend on Supabase being
  reachable.
- **D-27:** **Owner-gated apply + committed rollback, rehearsed on a Supabase branch.** The
  down-migration is a committed file alongside the up. Apply → rollback → re-apply is rehearsed on a
  branch first, then production is applied behind explicit owner confirmation — the same gate used for
  the `note_mastery` column and the v3.5 production migration. The FK swap is the part most likely not
  to restore cleanly, so rollback correctness is proven rather than assumed.
- **D-28:** **Database tests are SQL assertions run on that same Supabase branch** — row counts, FK
  targets, and trigger round-trips (insert a student → assert the `child_profiles` row appears; insert
  a child profile → assert the shadow row appears), then roll back. Committed as `.sql` alongside the
  checklist. No new tooling; pgTAP was rejected as new infrastructure with a local-Postgres dependency
  inside the phase meant to be the cheap reversible one.
- **D-29:** **"Zero client-visible change" is proven by the existing Vitest suite staying green _plus_
  an owner smoke test on a real production student account** — trail progress, XP, streak, and
  dashboard rendering identically post-migration. The suite alone is insufficient: it runs against
  mocks, and an FK repointed at the wrong table breaks nothing a mock would notice. This project's own
  precedent is that per-account checks catch what aggregate checks miss.

### Claude's Discretion

Resolve these during planning without returning to the user:

- Shadow-row column defaults and how the existing `trigger_auto_generate_nickname` /
  `trigger_calculate_is_under_13` triggers interact with reverse-sync inserts
- Migration file naming and timestamp
- Trigger implementation specifics (the loop guard's exact form, `WHEN` clause vs existence check)
- Ordering of statements within the atomic migration (`parents` before `child_profiles` before FKs)
- Exact column types and constraint naming conventions, following existing migration style

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & locked decisions

- `.planning/ROADMAP.md` §"Phase 1: Identity Schema Expand" — goal, 5 success criteria, pitfalls.
  **Read alongside D-02 and D-07 above** — SC #5's wording is reframed by this discussion.
- `.planning/REQUIREMENTS.md` — IDENT-01…05 (this phase), Owner Decisions D-01…D-08 (locked, do not
  re-litigate), the anchor UUID-reuse decision, and the Out-of-Scope exclusions table
- `COPPA_REFACTOR_PRD.md` (repo root) — source PRD for target schema and UX

### Research

- `.planning/research/SUMMARY.md` — executive summary, the UUID-reuse anchor rationale, Open
  Questions 1–4, and the 5 critical pitfalls. **Note:** its Phase 1 section proposes parallel
  `child_profile_id` columns; D-01 above supersedes that with an in-place swap.
- `.planning/research/ARCHITECTURE.md` — migration mechanics, ownership-helper design, expand/contract
  sequencing
- `.planning/research/PITFALLS.md` — Pitfall 2 (FK target drift) is the one this phase must defend
  against; it has shipped 3× in this repo

### Existing schema precedents to copy

- `supabase/migrations/20250625120001_add_teacher_schema.sql` — the `teachers` table shape
  (`id UUID PK REFERENCES auth.users(id) ON DELETE CASCADE`, timestamps, `is_active`) that `parents`
  mirrors
- `supabase/migrations/20250115000005_remove_student_auth_fkey.sql` — the precedent that makes UUID
  reuse safe: `students.id` deliberately has no FK to `auth.users`
- `supabase/migrations/20260201000001_coppa_schema.sql` — current `students` PII columns
  (`date_of_birth`, `parent_email`, `consent_verified_at`, `account_status`),
  `trigger_auto_generate_nickname`, `trigger_calculate_is_under_13`, and the deletion-grace machinery
  that D-24/D-25 must not break
- `supabase/migrations/20260321000001_account_deletion_log.sql` — the audit-log pattern, and the
  deletion path implicated in D-24
- `supabase/migrations/20260327000002_fix_teacher_fk_references.sql` — one of the three historical
  FK-drift corrections that justify D-04's checklist discipline

### Codebase maps

- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md` — current identity model and
  known weak points

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`teachers` table** — exact structural template for `parents`. Copy the pattern; do not invent one.
- **`avatars` table + `students.avatar_id` FK** — the preset avatar set PROFILE-02 requires already
  exists and is already indexed. No new assets, no new table.
- **`students.nickname` + `trigger_auto_generate_nickname`** — a non-PII display name already exists
  for every student, along with the generation rule for filling gaps.
- **`account_deletion_log`** — established audit-log pattern; reused again by Phase 7.
- **Owner-gated production migration flow** — precedent set by the `note_mastery` apply and the v3.5
  production migration.

### Established Patterns

- **Fan-out identity tables keyed on `auth.users(id)`** — `teachers` today, `parents` next. Consistent
  with the codebase, and D-11 keeps the pattern non-exclusive.
- **Login-less owned profile rows** — already proven in production by the 5 teacher-created,
  auth-less students; `child_profiles` generalizes it rather than introducing it.
- **SQL-first verification over ORM/codegen** — no ORM in this stack; migrations and
  `information_schema` queries are the idiom.
- **Vitest + JSDOM with no DB harness** — hence D-28's branch-based SQL assertions rather than a new
  test framework.

### Integration Points

- **The ~26 downstream tables' identity FK columns** — the sweep surface, minus D-06/D-07 carve-outs
- **Phase 2's ownership helper** — consumes `child_profiles.parent_id` and the D-17 index; Phase 1
  ships the table deny-all so Phase 2 adds policies to a locked table
- **The 30-day-grace deletion cron** — the one live behaviour Phase 1 changes (D-24/D-25)
- **SECURITY DEFINER functions resolving identity in their bodies** — inventoried (D-23), re-pointed
  by Phases 2 and 8

</code_context>

<specifics>
## Specific Ideas

- **The dual-FK safety net is the organizing idea of this phase.** Rather than trusting review to
  catch a mis-repointed column, both constraints stay live so Postgres itself rejects any write that
  contradicts either model. Phase 8 removes the scaffolding.
- **Two committed review artifacts, both owner-signed:** the FK checklist (with scope classification
  and carve-out reasons) and the 15-row account-segmentation table. These are review gates, not
  documentation.
- **Three hazards were found during this discussion that appear in neither the roadmap nor the
  research** — they were consequences of the decisions made here, and planning must carry them:
  1. New child profiles created from Phase 3 onward would fail the retained legacy FK on their first
     downstream write (→ D-20/D-21, reverse sync trigger)
  2. `parent_subscriptions` would be repointed toward `child_profiles` when Phase 5 needs it pointed
     at `parents` (→ D-06 carve-out), which generalized into D-07's scope classification
  3. The live deletion cron would silently gut a child's data while leaving the profile intact
     (→ D-24/D-25)

</specifics>

<deferred>
## Deferred Ideas

- **Renaming `student_id` → `child_profile_id` across the ~30 columns** — deliberately not decided.
  Phase 8 owns the call, informed by the 47-call-site audit it is already performing (D-05).
- **Scrubbing legacy PII from `students`** — Phase 8. Recorded as a known open exposure (D-22), not
  left implicit.
- **Re-pointing the inventoried SECURITY DEFINER functions** — Phases 2 and 8, working from D-23's
  committed inventory. Only the deletion hazard is addressed in Phase 1.
- **Consent/legal columns on `parents`** — added by the phase that writes them (Phase 3 or 6), not
  speculatively now (D-08).
- **`parent_subscriptions` re-pointing to `parents`** — Phase 5, after Lemon Squeezy sandbox
  verification (D-06).

</deferred>

---

_Phase: 1-Identity Schema Expand_
_Context gathered: 2026-07-21_
