---
phase: 05-subscription-re-pointing
plan: 01
subsystem: database
tags: [supabase, pg_catalog, lemon-squeezy, sentry, discovery, coppa]

# Dependency graph
requires:
  - phase: 01-identity-schema-expand
    provides: "parents/child_profiles schema + 01-fk-checklist.md sign-off doc format precedent"
  - phase: 02-rls-rewrite-ownership-based-access-control
    provides: "dual-policy additive rollout convention, owner-gated production apply pattern, pg_catalog over information_schema precedent"
provides:
  - "05-discovery.md scaffolded with sections 4-6 (Sentry verdict, sandbox tooling verdict, has_active_subscription() before-body) filled from local grep/CLI facts"
  - "Sections 1-3 (live schema, pre-backfill rows, LS test-mode readiness) explicitly left pending, gated on two owner checkpoints"
affects: [05-02, 05-06, 05-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "console.error greppable-prefix alerting (WEBHOOK_UNRESOLVED:/CANCEL_AMBIGUOUS:) as the Sentry-unavailable fallback for Deno Edge Functions"
    - "throwaway-Supabase-project sandbox target (Docker unavailable locally)"

key-files:
  created:
    - .planning/phases/05-subscription-re-pointing/05-discovery.md
  modified: []

key-decisions:
  - "sentry_in_edge_functions: no -- zero grep matches across supabase/functions, config.toml, docs/DEPLOY.md; locked in console.error('WEBHOOK_UNRESOLVED:', ...) / console.error('CANCEL_AMBIGUOUS:', ...) as the D-03/D-06 alerting contract for plans 05-03/05-04"
  - "sandbox_target: throwaway-project -- Docker unavailable in this environment (DOCKER_UNAVAILABLE), so plan 05-06's seed script targets a throwaway second Supabase project instead of a local CLI stack"

requirements-completed: []  # MIGRATE-04 NOT complete -- this plan halted at the owner checkpoint gate; do not mark complete until Task 2 + Task 3 close and the full plan verification passes

# Metrics
duration: ~15min (Task 1 only; plan not yet complete)
completed: 2026-08-05
---

# Phase 5 Plan 01: Discovery & Owner-Gated Readiness Checks Summary

**HALTED AT CHECKPOINT — Task 1 (local grep/CLI discovery) complete and committed; Tasks 2 and 3 require the project owner to run a read-only SQL pack in the Supabase SQL Editor and confirm Lemon Squeezy test-mode dashboard state, which this agent has no access to.**

## Performance

- **Duration:** ~15 min (Task 1 only)
- **Started:** 2026-08-05T09:40:00Z (approx)
- **Completed:** N/A — plan not complete, halted at Task 2
- **Tasks:** 1 of 3 completed
- **Files modified:** 1 (`05-discovery.md`, created)

## Accomplishments

- Confirmed via `grep -rn "sentry" supabase/functions/ --include=*.ts -i` and `grep -n "SENTRY" supabase/config.toml docs/DEPLOY.md` that **zero** Sentry references exist anywhere in the Edge Function surface — locked in the RESEARCH-mandated `console.error('WEBHOOK_UNRESOLVED:', {...})` / `console.error('CANCEL_AMBIGUOUS:', {...})` fallback as the binding contract for plans 05-03 and 05-04.
- Ran `npx supabase --version` (2.111.0) and `docker info` (unavailable) — locked in `sandbox_target: throwaway-project` for plan 05-06's D-10(b) seed script, since the local CLI stack cannot be used.
- Captured the verbatim current `has_active_subscription(p_student_id UUID)` function body from `supabase/migrations/20260404000001_ensure_subscription_rls.sql` lines 36-59 as the "before" reference plan 05-02's `CREATE OR REPLACE` must preserve the signature of (Pitfall 5).
- Scaffolded `05-discovery.md` with all six required `## N.` headings in the exact order specified, sections 1-3 explicitly marked `_pending_` per the plan's own instructions (they require live production data only the owner can pull).

## Task Commits

1. **Task 1: Determine Sentry-in-Edge-Functions availability and local-stack tooling readiness** - `022f4637` (docs)

**Plan metadata:** not yet created — plan is incomplete, halted at Task 2's owner checkpoint. This SUMMARY documents partial progress; a follow-up agent (or this same agent resumed) will complete Tasks 2-3 and then finalize the plan-level metadata commit.

## Files Created/Modified

- `.planning/phases/05-subscription-re-pointing/05-discovery.md` - Discovery doc; sections 4 (alerting), 5 (sandbox tooling), 6 (has_active_subscription before-body) populated; sections 1-3 (live schema, pre-backfill rows, LS readiness) left as `_pending_` placeholders awaiting the Task 2/Task 3 owner checkpoints

## Decisions Made

- No architectural decisions made in Task 1 — pure fact-gathering via grep/CLI commands, all outcomes were the RESEARCH-anticipated fallback paths (Sentry absent, Docker unavailable), not novel choices.

## Deviations from Plan

None — Task 1 executed exactly as written. No Rule 1-4 triggers encountered; the three sub-questions (Q1/Q2/Q3) were answered by running the exact commands the plan specified and recording the results verbatim.

## Issues Encountered

None for Task 1. Tasks 2 and 3 are `checkpoint:human-action` by design (`gate="blocking"`) and require the project owner to interact with two external dashboards this agent cannot reach:

1. **Task 2** — Supabase SQL Editor (project `hdltcvgqrtxuxgjdvzzu`): run a 7-query read-only pack against `pg_catalog` (not `information_schema`, per the Phase 1 `01-fk-checklist.md` precedent) covering the real `parent_subscriptions` column list, its constraints/FK delete rule, current RLS policies, the current `has_active_subscription()` definition, the D-11 "before" per-row resolve-chain preview for all 3 live subscriptions, the D-08 duplicate-active-row audit, and a total row-count sanity check.
2. **Task 3** — Lemon Squeezy dashboard: confirm/create a Test-mode product+variant, confirm the Test-mode webhook registration and signing-secret availability, and confirm a Test-mode API key is available — without ever pasting the secret or key values into any file or session.

Per the plan's own gate design and the explicit instruction accompanying this execution, this agent halts here and returns the full verbatim query pack and dashboard checklist to the orchestrator for hand-off to the human owner.

## User Setup Required

**Two owner-run checkpoints remain before this plan can complete.** See the CHECKPOINT REACHED section returned to the orchestrator (this agent's final response) for:
- The full verbatim 7-query SQL pack for Task 2 (Supabase SQL Editor, project `hdltcvgqrtxuxgjdvzzu`)
- The full verbatim Lemon Squeezy dashboard checklist for Task 3
- The exact "report back" response shapes expected for each
- The `<resume-signal>` text for both tasks

## Known Stubs

`05-discovery.md` sections 1-3 are intentionally left as `_pending_` placeholders — this is not a code stub but a data-dependency gate explicitly designed into the plan (`autonomous: false`, two `checkpoint:human-action` tasks). They will be populated when Tasks 2 and 3 execute after the owner provides the required dashboard output. Do not treat this plan as complete until both are filled and the plan's `<verification>` block (which requires "all six numbered sections populated (none left as `_pending_`)") passes.

## Next Phase Readiness

**Not ready.** This plan (05-01) must fully complete — including the D-11 "before" sign-off doc (`05-subscription-signoff.md`, not yet created) and the LS test-mode confirmation — before plan 05-02 (the forward migration) can be planned or written. Plan 05-02 depends on the confirmed live column list, real FK delete rule, and real RLS policy baseline that only Task 2's SQL Editor output supplies.

---

*Phase: 05-subscription-re-pointing*
*Plan: 01*
*Status: HALTED at owner checkpoint (Task 2 of 3) — 2026-08-05*

## Self-Check: PASSED

- FOUND: `.planning/phases/05-subscription-re-pointing/05-discovery.md`
- FOUND: `.planning/phases/05-subscription-re-pointing/05-01-SUMMARY.md`
- FOUND: commit `022f4637` in `git log --oneline --all`
