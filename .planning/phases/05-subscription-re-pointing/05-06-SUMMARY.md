---
phase: 05-subscription-re-pointing
plan: 06
subsystem: testing
tags: [postgres, rls, supabase, lemon-squeezy, hmac, webhooks, verification-tooling]

# Dependency graph
requires:
  - phase: 05-subscription-re-pointing (plans 05-02..05-05)
    provides: the forward/down migration files, the resolveParent/deadLetter webhook modules, and the D-discovery facts (9 live rows, confirmed test-mode variant id) this plan's scripts inline and assert against
provides:
  - a single-paste BEGIN...ROLLBACK rehearsal script proving SC-1/SC-3 against real production data with nothing persisted
  - a standalone HMAC-signed Node replay harness exercising all 10 webhook branches Lemon Squeezy will not produce on demand
  - an isolated sandbox seed + numbered runbook for a real Lemon Squeezy test-mode checkout that structurally cannot touch production
affects: [05-07 (runs the rehearsal), 05-08 (runs the replay suite and the sandbox checkout), 05-09 (production apply + D-11 sign-off)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pg_catalog-only DB verification (pg_attribute/pg_constraint/pg_policies/pg_class/pg_proc), never information_schema, per Phase 1's 01-fk-checklist.md DEVIATION precedent"
    - "single transaction-wrapped BEGIN...ROLLBACK rehearsal against production, cloned from Phase 2's 02-rehearsal-runbook.sql"
    - "sim_verify_<date>_<n> greppable prefix for every synthetic row a verification script writes, with printed cleanup SQL"

key-files:
  created:
    - .planning/phases/05-subscription-re-pointing/05-rehearsal-runbook.sql
    - .planning/phases/05-subscription-re-pointing/05-webhook-replay.mjs
    - .planning/phases/05-subscription-re-pointing/05-sandbox-seed.sql
    - .planning/phases/05-subscription-re-pointing/05-sandbox-runbook.md
  modified: []

key-decisions:
  - "05-rehearsal-runbook.sql's temp-vars table is named _r5 (not _rehearsal_vars) per this plan's own must_haves/verify spec, diverging from Phase 2's naming only for this file"
  - "05-sandbox-seed.sql's auth.users creation is documented as two paths (local-stack direct INSERT, commented out and gated behind an explicit warning; hosted throwaway-project via Auth Admin API/CLI) since 05-discovery.md confirms sandbox_target is a throwaway hosted project, not a local Docker stack"
  - "the webhook replay script's B10 (duplicate active) branch sends two separate signed requests and reports a combined result, rather than modeling it as a single call, since the D-08 scenario it exercises is inherently two webhook deliveries"

patterns-established:
  - "verification-tooling-only plans (author scripts, do not execute them) as their own wave, separate from the plans that later run them against production/sandbox under an owner checkpoint"

requirements-completed: [MIGRATE-04]

# Metrics
duration: 35min
completed: 2026-08-06
---

# Phase 5 Plan 06: Subscription Re-Pointing Verification Tooling Summary

**Authored (not executed) the three D-09/D-10 verification vehicles this phase's evidence rests on: a production BEGIN...ROLLBACK rehearsal script, an HMAC-signed synthetic webhook replay harness covering 10 branches, and an isolated sandbox seed + runbook for a real Lemon Squeezy test-mode checkout.**

## Performance

- **Duration:** 35 min
- **Tasks:** 3
- **Files created:** 4

## Accomplishments

- `05-rehearsal-runbook.sql`: a single continuous-execution script that applies the forward migration, runs 31 `ASSERT` blocks covering every SC-1 property (column/FK/index, dual RLS policy, both `has_active_subscription()` OR-branches, dead-letter table + deny-all RLS, deliberate non-constraint), reverses via the down-migration, re-applies for idempotency, and `ROLLBACK`s — proven to contain exactly one `BEGIN;`, exactly one `ROLLBACK;`, and zero `COMMIT` anywhere.
- `05-webhook-replay.mjs`: a Node ESM script signing and sending the identical raw-body string (not a re-serialized copy) for all 10 branches (B1–B10), including the `child_profiles` resolve-chain hop, the dead-letter unresolved path, a deliberately corrupted signature negative control, and the D-08 duplicate-active-row scenario. Refuses to run without every required env var and never logs the signing secret.
- `05-sandbox-seed.sql` + `05-sandbox-runbook.md`: fixture data and a step-by-step procedure (JWT acquisition, `create-checkout` + its 403 IDOR negative case, the real test-mode checkout, `cancel-subscription`'s happy path and its D-06 409 ambiguity path) that isolates the real Lemon Squeezy checkout loop from production data, ending in a production-side zero-leakage safety check.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author 05-rehearsal-runbook.sql (D-09)** - `cdb72f95` (docs)
2. **Task 2: Author 05-webhook-replay.mjs (D-10a)** - `cd79e115` (docs)
3. **Task 3: Author the isolated sandbox seed and runbook (D-10b)** - `0bcb9a9a` (docs)

_Note: all three are `docs` commits — this plan authors verification tooling and runbooks only; no application source was touched._

## Files Created/Modified

- `.planning/phases/05-subscription-re-pointing/05-rehearsal-runbook.sql` - Owner-run production rehearsal proving SC-1/D-01/D-12 with nothing persisted
- `.planning/phases/05-subscription-re-pointing/05-webhook-replay.mjs` - HMAC-signed synthetic webhook replay harness, 10 branches
- `.planning/phases/05-subscription-re-pointing/05-sandbox-seed.sql` - Sandbox-only fixture data (parent, linked + orphan child, test-mode plan row)
- `.planning/phases/05-subscription-re-pointing/05-sandbox-runbook.md` - Numbered procedure for the real Lemon Squeezy test-mode checkout loop

## Decisions Made

- Named the rehearsal's temp-vars table `_r5` (not Phase 2's `_rehearsal_vars`) to match this plan's own must_haves and automated verify spec exactly.
- Documented `05-sandbox-seed.sql`'s auth-user creation as two explicit paths (hosted Auth Admin API as primary, local-stack direct `auth.users` INSERT as a clearly-gated fallback) since `05-discovery.md` confirms the sandbox target is a throwaway hosted project (Docker unavailable locally), not a local stack — a direct `INSERT INTO auth.users` does not produce a sign-in-able account on a hosted project.
- Modeled the replay script's B10 (D-08 duplicate-active) branch as two separate signed HTTP requests with a combined pass/fail report, since the real-world scenario it rehearses is genuinely two independent webhook deliveries, not one call with two effects.

## Deviations from Plan

None - plan executed exactly as written. All three artifacts satisfy every acceptance criterion in the plan's `<verify>` blocks, confirmed by running the plan's own automated verification commands against each file after authoring (31 `ASSERT` blocks found, `node --check` clean, all 10 branch labels present, all required headings present, zero `information_schema`/hardcoded-secret/`COMMIT` violations).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. This plan only authors scripts; nothing in it was run against any database or external service. Plans 05-07 (rehearsal), 05-08 (replay suite + sandbox checkout), and 05-09 (production apply) are where these artifacts are actually executed, each behind its own owner checkpoint.

## Next Phase Readiness

- All three D-09/D-10 verification vehicles exist as finished, copy-pasteable artefacts ready for plan 05-07 (rehearsal) and 05-08 (replay + sandbox checkout) to execute.
- No database or external service was touched by this plan — confirmed via `git status --porcelain` (clean) and the fact that every script's own header explicitly documents it as sandbox-only or transaction-rolled-back.
- `05-sandbox-runbook.md` section 0 flags one still-open pre-flight item from `05-discovery.md` (`test_mode_webhook_registration: pending_verification` — whether the LS webhook registration is shared between Test and Live mode) that plan 05-08 must re-confirm before running the real checkout.

---
*Phase: 05-subscription-re-pointing*
*Completed: 2026-08-06*

## Self-Check: PASSED

- FOUND: `.planning/phases/05-subscription-re-pointing/05-rehearsal-runbook.sql`
- FOUND: `.planning/phases/05-subscription-re-pointing/05-webhook-replay.mjs`
- FOUND: `.planning/phases/05-subscription-re-pointing/05-sandbox-seed.sql`
- FOUND: `.planning/phases/05-subscription-re-pointing/05-sandbox-runbook.md`
- FOUND: `.planning/phases/05-subscription-re-pointing/05-06-SUMMARY.md`
- FOUND commit: `cdb72f95`
- FOUND commit: `cd79e115`
- FOUND commit: `0bcb9a9a`
