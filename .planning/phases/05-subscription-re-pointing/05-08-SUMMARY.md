---
phase: 05-subscription-re-pointing
plan: 08
subsystem: lemon-squeezy-sandbox
tags: [lemon-squeezy, webhooks, edge-functions, sandbox-proof, mcp-verification]

# Dependency graph
requires:
  - phase: 05-subscription-re-pointing (plan 05-07)
    provides: "REHEARSAL PASS gate — the migration this sandbox is seeded from"
  - phase: 05-subscription-re-pointing (plan 05-06)
    provides: "05-webhook-replay.mjs, 05-sandbox-runbook.md, 05-sandbox-seed.sql — the verification vehicles this plan executes"
provides:
  - "SC-3 proven: all ten D-10a synthetic webhook branches, including the child_profiles compatibility hop and the signature negative control, verified directly against the sandbox DB/logs via Supabase MCP"
  - "SC-4 proven: one real Lemon Squeezy test-mode checkout completed end to end (create-checkout -> LS -> webhook -> resolve-chain -> DB -> has_active_subscription()), plus the 403 IDOR negative case and the 409 D-06 ambiguity case, all with zero exposure to the 3 live subscriptions"
  - "SANDBOX PASS verdict in 05-sandbox-log.md — the gate 05-09 (production apply) requires before touching any live subscription"
affects: ["05-09 (production apply — now cleared to proceed)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Orchestrator verifies sandbox state directly via Supabase MCP (execute_sql for DB rows, get_logs for edge-function-runtime logs) instead of trusting owner-pasted console output — this session's terminal repeatedly truncated multi-line/long-line pastes, making MCP the authoritative source throughout"
    - "PowerShell secret handling: unquoted `KEY=$env:VAR` arguments to CLI commands get split at whitespace by PowerShell before the CLI ever sees them, silently truncating any secret containing a space. Fix: wrap the whole KEY=VALUE in double quotes. Secrets containing PowerShell-special characters ($, *, :, @, embedded quotes) must be assigned via a here-string (`@'...'@`), never inline in a command"
    - "Lemon Squeezy webhook signing secrets can desync from the deployed function's copy when other fields on the same webhook entry are edited in the LS dashboard — always re-verify (or re-set) the signing secret after any edit to a webhook's URL/config, not just at initial setup"

key-files:
  created:
    - .planning/phases/05-subscription-re-pointing/05-sandbox-log.md
    - .planning/phases/05-subscription-re-pointing/05-webhook-replay-followup.sql
    - .planning/phases/05-subscription-re-pointing/05-08-SUMMARY.md
  modified:
    - .planning/phases/05-subscription-re-pointing/05-discovery.md
    - .planning/phases/05-subscription-re-pointing/05-sandbox-bootstrap.sql
    - .planning/phases/05-subscription-re-pointing/05-sandbox-seed.sql

key-decisions:
  - "subscription_plans.is_active was missing from the hand-authored sandbox bootstrap schema (05-06's gap, surfaced only when create-checkout's real .eq(\"is_active\", true) filter 400'd) — added to both the bootstrap script and the seed insert, and patched live on the already-provisioned sandbox"
  - "The originally recorded test_mode_variant_id (861115, from 05-01's discovery) never corresponded to any real Lemon Squeezy variant — found only by create-checkout's real 404 against the live LS API. Queried the live API directly (GET /v1/products, GET /v1/variants) to find the actual three variants under \"App Payment\" and corrected to 1356600 (Monthly USD). 05-discovery.md addended, not silently overwritten"
  - "D-10a's replay suite (Task 1) leaves 6 status:active rows for the sandbox parent, not just B10's 2 (every branch that reaches the DB writes active) — 05-08-PLAN.md's step 6 assumed a clean single-row state. Resolved by deleting the leftover sim_verify_% rows before step 6's clean-cancel test could run; the resulting premature 409 was repurposed as step 7's D-06 ambiguity evidence (stronger: count=7 not 2) rather than discarded and redone"
  - "RESEARCH Pitfall 2's assumption (\"never write a test-mode variant id into production\" implying test-mode variants are separate from live ones) does not hold for this product — production's own subscription_plans legitimately contains the same 1356600/1356603 variant ids the sandbox uses. Corrected in 05-sandbox-log.md's cleanup section rather than treated as a leak"

patterns-established:
  - "When an owner-run checkpoint needs DB/log verification, the orchestrator should query the target project directly via Supabase MCP rather than asking the owner to paste output — faster, avoids terminal-truncation noise, and keeps secrets out of the conversation entirely (owner never pastes anything the MCP calls can read directly)"

# Requirements
requirements: [MIGRATE-04]
---

# 05-08: Lemon Squeezy Sandbox Proof (SC-3, SC-4)

## What this plan did

**Task 0** (gate: `05-apply-log.md` must contain `REHEARSAL PASS`) passed immediately — plan 05-07's
rehearsal was clean.

**Task 1** (D-10a replay suite) ran cleanly once the owner correctly synced `LS_SIGNING_SECRET` between
their terminal session and the sandbox's Supabase secret (see Deviations). All ten branches (B1-B10)
verified directly against the sandbox via Supabase MCP `execute_sql`/`get_logs` — DB rows, dead-letter
rows, and function log lines all matched expected results exactly, including B3 (the `child_profiles`
compatibility hop) and B8 (signature negative control, zero row delta on both tables). Recorded in
`05-sandbox-log.md`'s `## SC-3` section; `### SC-3 verdict: PASS`.

**Task 2** (real Lemon Squeezy test-mode checkout, owner checkpoint) took substantially longer than
anticipated due to a chain of real, previously-undiscovered sandbox gaps — not owner error, but genuine
environment issues each one uncovered by actually exercising the real LS API for the first time in this
phase:

1. `subscription_plans.is_active` column missing from the sandbox (create-checkout's real query filters
   on it) — fixed live and in the bootstrap script.
2. The recorded `test_mode_variant_id: 861115` never existed as a real LS variant — found via a genuine
   404 from the LS API, corrected to `1356600` (Monthly USD) after querying LS directly for the real
   variant list.
3. `LS_API_KEY` was not correctly synced as a sandbox secret (401 Unauthenticated from LS) — re-set.
4. `LS_SIGNING_SECRET` desynced between the LS dashboard and the sandbox function after the dashboard's
   webhook URL was edited in Task 2's Step 0 (pointing it at the sandbox instead of production) — every
   real webhook delivery failed signature verification until both sides were reset to an identical,
   quoting-safe plain value and the failed `subscription_created` delivery was manually resent from the
   LS dashboard.
5. The D-10a suite's leftover `active` rows (6, not the 2 the plan assumed) put the sandbox parent into
   an ambiguous state before the single-row cancel test could run — cleaned up, and the resulting 409
   repurposed as the D-06 ambiguity evidence instead of wasted.

Once resolved, the full real-checkout loop proved out end to end: `create-checkout` (200 + URL, then 403
IDOR negative) -> real LS test-mode payment -> webhook (after the signature resync) -> `parent_id`
non-null / `student_id` NULL row -> `has_active_subscription()` true -> `cancel-subscription` (200,
webhook flips status to `cancelled` automatically) -> ambiguity re-test (409,
`AMBIGUOUS_ACTIVE_SUBSCRIPTIONS`, zero LS-side mutation). Cleanup verified clean against production by
the owner: zero `sim_verify_%` rows, no sandbox plan row in `subscription_plans`.

`05-sandbox-log.md`'s `## Sandbox verdict`: **SANDBOX PASS — cleared to touch live subscriptions (SC-4
satisfied)**.

## Deviations

All five numbered items above are Rule-4 deviations (real gaps, fixed before proceeding, documented
rather than silently patched):

1. **`is_active` column gap** — sandbox-only bootstrap/seed fix; production already has this column
   (confirmed against `12-01-PLAN.md`'s original `CREATE TABLE subscription_plans`).
2. **Wrong `test_mode_variant_id`** — `05-discovery.md` §3 addended with the correction and the live-API
   evidence; `05-sandbox-seed.sql` corrected for future re-seeds.
3. **`LS_API_KEY` sync** — sandbox secret only, no source file changed.
4. **`LS_SIGNING_SECRET` desync after dashboard edit** — sandbox secret + LS dashboard value only, no
   source file changed. Documented as a `tech-stack.patterns` entry above so a future re-run of this
   plan (or a similar checkpoint) doesn't repeat the investigation.
5. **D-10a leftover active rows undercounted by `05-08-PLAN.md`** — worked around procedurally (cleanup
   DELETE before step 6, premature 409 repurposed for step 7); not a code or migration defect, a
   plan-assumption gap. No plan file edited (out of this plan's scope to revise its own already-executed
   Task 1 instructions), but recorded prominently in `05-sandbox-log.md` section 6 for anyone re-running
   this plan later.

Additionally, cleanup's production safety query surfaced that `RESEARCH Pitfall 2`'s premise (test-mode
variants are separate from live ones) doesn't hold for this product — corrected in `05-sandbox-log.md`
rather than flagged as a false-positive leak.

## Verification

- Task 1 automated gate (`05-sandbox-log.md` has `## SC-3`, `production_touched: no`, all ten `Bn` rows,
  `WEBHOOK_UNRESOLVED:` evidence, `### SC-3 verdict`): **PASS**
- Task 2 automated gate (`## SC-4` present, `parent_id_non_null: yes`, `student_id_null: yes`,
  `ls_dashboard_unchanged: yes`, `production_clean: yes`, `403`, `AMBIGUOUS_ACTIVE_SUBSCRIPTIONS`, `409`,
  `## Sandbox verdict` contains `SANDBOX PASS`): **PASS**
- No Lemon Squeezy API key or signing secret value appears anywhere in `05-sandbox-log.md` (grepped)
- Production safety queries (owner-run): `sim_verify_%` row count in production `parent_subscriptions`
  = 0; no `sandbox-monthly-usd` row in production `subscription_plans`

## Self-Check: PASSED
