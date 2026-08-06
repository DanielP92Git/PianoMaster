---
phase: 05-subscription-re-pointing
plan: 07
subsystem: db-migration
tags: [postgres, rehearsal, pg-catalog, connection-pooling, production-verification]

# Dependency graph
requires:
  - phase: 05-subscription-re-pointing (plan 05-06)
    provides: the transaction-wrapped rehearsal script this plan runs verbatim against production
  - phase: 05-subscription-re-pointing (plan 05-02)
    provides: the forward/down migration pair this rehearsal proves against real schema/data
provides:
  - "SC-1 proven in full against real production schema and real production data, with zero persisted changes (05-apply-log.md, REHEARSAL PASS)"
  - "a real schema gap (student_id NOT NULL blocking the D-02 parent_id-only shape) found and fixed in the migration pair before any production apply, at the cheapest possible point to fix it"
  - "05-rehearsal-runbook.sql corrected to a form that reliably reports its own results through Supabase's SQL Editor (connection-pooling-safe verdict accumulation)"
affects: ["05-08 (sandbox proof — seeded from a migration now proven against real schema)", "05-09 (production apply — the actual thing this rehearsal was a dry run for)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Session-level custom GUC (set_config(..., is_local => false)) as a verdict accumulator that survives a transaction ROLLBACK, when RAISE NOTICE isn't reliably visible in the client"
    - "Read the accumulator BEFORE ROLLBACK, not after -- a transaction is pinned to one pooled connection for its own duration, but the next statement after it ends may land on a different connection, silently losing session state read there"

key-files:
  created:
    - .planning/phases/05-subscription-re-pointing/05-apply-log.md
  modified:
    - supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.sql
    - supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.down.sql
    - .planning/phases/05-subscription-re-pointing/05-rehearsal-runbook.sql
    - .planning/phases/05-subscription-re-pointing/05-discovery.md

key-decisions:
  - "student_id's NOT NULL constraint relaxed in the forward migration (ALTER COLUMN student_id DROP NOT NULL), restored in the down migration immediately before dropping parent_id so a genuine violation fails loudly via Postgres's own constraint check rather than silently orphaning a row -- caught by the rehearsal's own SC1-HAS-PARENT test insert, not anticipated by plan 05-01/05-02"
  - "Verdict reporting rebuilt around a session-level custom GUC read before ROLLBACK, after two dead ends (RAISE NOTICE, then an in-transaction log table read after ROLLBACK) both failed against real Supabase SQL Editor behavior -- documented in the script's own header so a future re-run doesn't repeat the same investigation"

patterns-established:
  - "For owner-run one-paste rehearsal scripts against Supabase: never assume RAISE NOTICE is visible, never assume a statement after a transaction boundary shares connection state with statements before it -- verify visibility empirically with the actual tool before trusting a verdict-reporting design"

# Requirements
requirements: [MIGRATE-04]
---

# 05-07: Production Rehearsal (D-09)

## What this plan did

Task 0 (mechanical pre-flight gate: exactly one `BEGIN;`, one `ROLLBACK;`, zero `COMMIT;` in
`05-rehearsal-runbook.sql`) ran clean on the first attempt and every re-run.

Task 1 (the owner-run rehearsal itself) took three real attempts to reach a trustworthy PASS:

1. **First attempt — caught a real bug.** The `SC1-HAS-PARENT` test insert (a synthetic
   `parent_id`-only row representing the D-02 "new checkout shape") failed with Postgres
   `23502: null value in column "student_id" ... violates not-null constraint`. The forward
   migration (plan 05-02) had added the nullable `parent_id` column but never relaxed
   `student_id`'s pre-existing `NOT NULL` — a gap none of plans 05-01/05-02/05-03 had
   surfaced, because it only manifests when a row is written with `parent_id` set and no
   `student_id` at all, which nothing in the codebase does yet (the webhook code from plan
   05-03 accepts that shape but nothing currently sends it — `create-checkout` from plan
   05-04 always dual-embeds both fields). Fixed in the migration pair (both directions) and
   in the rehearsal script's own inline copy of the migration bodies. Nothing persisted — the
   error safely aborted the transaction.
2. **Second attempt — ran clean, but the verdict output was empty.** `RAISE NOTICE` doesn't
   reliably surface in Supabase's SQL Editor results pane, so a table-based log (read via
   `SELECT` right before `ROLLBACK`) replaced it. But the Editor only displays the *last*
   statement's result in a multi-statement paste, and a post-rollback sanity-check `SELECT`
   came after the verdict `SELECT` in the script — so only the sanity check (four zeros) was
   ever visible.
3. **Third attempt — still incomplete.** Rebuilt around a session-level custom GUC
   (`set_config('rehearsal.log', ..., false)`) so the verdict `SELECT` could be the true last
   statement. Still came back nearly empty (only the post-rollback line). Root cause: the
   Editor connects through a pooler. A transaction stays pinned to one physical connection for
   its own duration (proven — `BEGIN...ROLLBACK` correctly reversed real DDL across all three
   attempts), but the pooler can hand the *next* statement a different connection the instant
   the transaction ends, and session-level GUC state doesn't travel with it.
4. **Fourth run — clean.** Moved the accumulator's one read to *before* `ROLLBACK` (guaranteed
   same connection throughout), made `ROLLBACK` the true final statement with nothing after
   it, and moved the post-rollback sanity check into a separate, connection-agnostic
   second query the owner runs independently. Full text output pasted back: 25/25 assertions
   PASS, 2 informational counts both at their expected value (0), zero FAIL, zero
   NOT REACHED, zero ERROR. The separate post-rollback query confirmed all four sanity counts
   at 0 — nothing persisted.

`05-apply-log.md` was built from that clean run's pasted output: a per-assertion verdict table
(25 rows, one per assertion id, in script-emission order), the backfill result, the D-08
duplicate-active audit (0), a `Deviations` section documenting both the real schema-gap fix and
the tooling-only verdict-reporting fixes, and a final `REHEARSAL PASS` verdict.

## Deviations

**1. [Rule 4 — real bug, owner-approved fix before re-run] `student_id` NOT NULL blocked the D-02
new-checkout shape.**
- **What:** The forward migration never relaxed `student_id`'s pre-existing `NOT NULL`
  constraint, making the already-deployed webhook's `parent_id`-only row shape physically
  impossible to write.
- **Why it wasn't caught earlier:** No existing code path currently produces a `parent_id`-only
  row (create-checkout always dual-embeds both fields in this phase; only the webhook's
  forward-compatible resolve-chain accepts the shape, for Phase 8's eventual benefit).
- **Fix:** `ALTER COLUMN student_id DROP NOT NULL` in the forward migration; the down migration
  restores `NOT NULL` immediately before dropping `parent_id`, so Postgres's own constraint
  check aborts a backout loudly rather than silently orphaning any row that ever used the new
  shape.
- **Files:** both migration files, `05-rehearsal-runbook.sql` (both forward-apply occurrences:
  initial apply and the idempotency re-apply, plus the down-migration section), `05-discovery.md`
  §1 addendum.

**2. [Tooling only — no migration-logic impact] Rehearsal verdict-reporting mechanism rebuilt
twice.**
- **What:** `RAISE NOTICE`, then an in-transaction log table read after `ROLLBACK`, both failed
  to reliably surface results through Supabase's SQL Editor. Replaced with a session-level
  custom GUC read *before* `ROLLBACK`.
- **Why:** Neither failure mode was anticipated by plan 05-06 (which had no way to test against
  the real Editor before an owner actually ran it) or by this plan's own design (the first fix
  attempt still assumed session state survives a transaction boundary on a pooled connection).
- **Impact:** Zero change to what the script does to the database at any point — only to how its
  results are reported back. Documented prominently in the script's own header so a future
  re-run (e.g. if 05-09 needs to re-rehearse after further changes) doesn't repeat the same
  investigation.

## Verification

- Task 0 gate: `GATE PASS: 1 BEGIN, 1 ROLLBACK, 0 COMMIT` (re-verified after every script edit)
- Task 1 automated verify (`05-apply-log.md` structure + all 9 named assertion ids present): PASS
- No unredacted email addresses in `05-apply-log.md` (grep for email pattern): 0 matches
- Post-rollback sanity re-check (separate connection, run independently by the owner):
  `parent_id_column_count=0, new_policy_count=0, dead_letter_table_count=0, probe_rows_count=0`
- Overall plan `<verification>` block: verdict-row count covers every named assertion id in the
  script; every verdict is PASS (no FAIL, no NOT REACHED); `### Verdict` reads `REHEARSAL PASS`

## Self-Check: PASSED
