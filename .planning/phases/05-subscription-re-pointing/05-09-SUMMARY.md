---
phase: 05-subscription-re-pointing
plan: 09
subsystem: production-billing-apply
tags: [production-apply, lemon-squeezy, edge-functions, live-billing, sign-off]

# Dependency graph
requires:
  - phase: 05-subscription-re-pointing (plan 05-08)
    provides: "SANDBOX PASS — SC-4 cleared, the hard precondition for touching any live subscription"
  - phase: 05-subscription-re-pointing (plan 05-07)
    provides: "REHEARSAL PASS — the exact SQL this plan applied, already proven inside BEGIN...ROLLBACK against production"
provides:
  - "D-13: forward migration applied to production hdltcvgqrtxuxgjdvzzu — parent_id column/FK/index live, dual SELECT policy, has_active_subscription() body swap, dead-letter table, all six post-apply verification queries + Advisors PASS"
  - "SC-2/D-11: all 9 live parent_subscriptions rows (not 3 — corrected count) individually verified after backfill and owner-signed row by row, not by row count alone"
  - "D-12: all four Edge Functions (lemon-squeezy-webhook, create-checkout, cancel-subscription, process-account-deletions) deployed in the required order with before/after versions and a rollback commit SHA recorded"
  - "frontend_deploy_gate: RELEASED — plan 05-05's parent_id client read path is now safe to merge to main / deploy to Netlify production"
affects: ["Phase 5 complete", "05-05 (client changes now mergeable)", "Phase 8 (future tightening: parent_id NOT NULL, drop legacy student_id branch)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Owner-run-only precedent (established across Waves 4-5 for DB access) does not automatically extend to Edge Function deploys — CLI `db push`/MCP `apply_migration` are mechanically blocked for this project, but `supabase functions deploy` is not. When the owner explicitly authorizes it in the moment (\"you can deploy\"), the orchestrator ran the deploys directly via the already-linked CLI, using its own `functions list` read (not the owner's truncated paste) as the authoritative before/after state."
    - "SQL Editor output pasted into chat truncates the same way PowerShell terminal output did earlier in this phase — long multi-row results reliably lose all but the last 1-2 rows. Mitigation: ask for re-paste in chunks, or better, narrow the query to only the columns that changed (columns provably untouched by a migration don't need re-verification, and skipping them also reduces needless PII re-exposure in chat)."
    - "A plan's literal acceptance-criteria wording (e.g. \"total_rows = 3\", \"one checked line per subscription (three lines)\") can go stale mid-phase when an earlier plan corrects a premise (05-01's SC-2 correction: real count is 9). Treat the corrected, already-documented count as authoritative and annotate the literal wording rather than either silently diverging from it or blocking on it — same pattern 05-apply-log.md already used for `all_3_live_rows_resolved`."

key-files:
  created:
    - .planning/phases/05-subscription-re-pointing/05-09-SUMMARY.md
  modified:
    - .planning/phases/05-subscription-re-pointing/05-apply-log.md
    - .planning/phases/05-subscription-re-pointing/05-subscription-signoff.md
    - .planning/ROADMAP.md

key-decisions:
  - "V6's post-apply row-integrity check expected total_rows=3 per the plan's literal text; recorded as 9/9/9 instead, matching the SC-2 correction already established in 05-discovery.md and reconfirmed by the 05-07 rehearsal. Not a new finding — a carry-forward of an already-approved correction."
  - "Six of the nine live rows carry a pre-existing, pre-approved ls_dashboard_email_matches: no (owner's own dev/test account, LS-stored contact email differs from the auth account email due to repeated manual test checkouts using throwaway addresses — documented in 05-discovery.md before the migration ran). Owner explicitly re-confirmed sign-off on all 9 rows given this was known, unchanged, pre-approved information rather than new post-backfill drift. Did not treat this as a per-row 'no' requiring backout, since the plan's backout trigger language was written for genuinely new anomalies (wrong resolved_parent_id, changed status/period_end), none of which occurred."
  - "The sign-off doc's `**Signed:**` line omitted the owner's own email (departing from the Phase 1 fk-checklist precedent, which included it) because this plan's automated verify gate applies a blunt regex that forbids any email pattern in the file, without distinguishing owner-identity emails from customer PII. Satisfied the mechanical gate rather than fight it."
  - "Edge Function deployment (Task 3) was executed directly by the orchestrator via the already-production-linked Supabase CLI, under the owner's explicit real-time authorization (\"you can deploy\"), rather than handed to the owner to run themselves as the plan's [OWNER] task naming implied. Before-state was captured via the orchestrator's own `functions list` call (read-only) rather than the owner's incompletely-pasted table, for accuracy."

patterns-established:
  - "For a checkpoint:human-action task where the underlying tooling isn't mechanically blocked (unlike DB access), explicit in-the-moment owner authorization is sufficient for the orchestrator to execute directly — the owner-run requirement in this phase was fundamentally about DB safety (CLI/MCP blocks, PII, irreversibility), not a blanket rule against the orchestrator ever touching production."

# Requirements
requirements: [MIGRATE-04]
---

# 05-09: Production Apply — Migration, Per-Row Sign-Off, Edge Function Deploy (Wave 6)

## What this plan did

This is the plan that actually touched the 3-become-9 live subscriptions — the highest blast-radius
step in the entire v4.0 milestone so far. Three tasks, strict order, each gated on the previous.

**Task 0** (mechanical gate) passed immediately: `SANDBOX PASS` (05-08) and `REHEARSAL PASS` (05-07)
both recorded, `origin/main` confirmed free of the `parent_id` client read path (the DEPLOY-GATE check)
— even though local `main` already carried plan 05-05's client code (this repo's workflow commits
phase work directly to local `main` and "deploys" via a later `git push origin main`, not a separate
feature-branch merge; the gate correctly checked the actually-deployed `origin/main`, not local state).

**Task 1** (owner checkpoint — SQL Editor): the forward migration
(`20260805120000_add_parent_subscriptions_parent_id.sql`) was applied to production
`hdltcvgqrtxuxgjdvzzu` by the owner. The `RAISE NOTICE` backfill count wasn't visible in the SQL
Editor (same known limitation the 05-07 rehearsal hit twice) — substituted with an equivalent direct
`WHERE parent_id IS NULL` count, which returned 0. All six post-apply verification queries (column/FK,
dual SELECT policy with plain equality, `has_active_subscription()` body, dead-letter RLS,
duplicate-active audit, row integrity) plus Advisors (0 errors, 120 expected
`multiple_permissive_policies` WARNs) came back exactly as predicted by the rehearsal. Row integrity
came back `9/9/9`, not the plan's literal `3/3/3` — the already-established SC-2 correction, not a new
finding.

**Task 2** (owner checkpoint — per-row sign-off, D-11/SC-2): all 9 live `parent_subscriptions` rows
compared individually, post-backfill, against the pre-migration "Before backfill" predictions.
`predicted_parent_id_matched`, `status_unchanged`, `period_end_unchanged`, and
`legacy_student_id_preserved` were `yes` for all 9 with zero drift. Six rows carried a pre-existing,
pre-approved `ls_dashboard_email_matches: no` (the owner's own dev/test account, LS-stored contact
email differing from the auth email due to repeated manual test checkouts — already explained in
`05-discovery.md` before the migration ran). Owner explicitly confirmed sign-off on all 9 rows given
this was known, unchanged information, not new post-backfill drift. Live smoke test (real authenticated
session) confirmed premium content and Parent Portal both render correctly. `sc2_satisfied: yes`.

**Task 3** (owner checkpoint — Edge Function deploy, D-12): before-state captured via a direct
`supabase functions list` call (the owner's own paste was incompletely truncated by the chat
interface, the same class of issue that hit long terminal pastes earlier in this phase). All four
functions deployed in the required order — webhook first, `process-account-deletions` last — each
incrementing exactly one version with `verify_jwt` settings unchanged. Post-deploy smoke (real app,
re-confirmed after all four deploys, not reused from the Task 2 pre-deploy check) passed, and
`unresolved_webhook_log_count: 0`. `frontend_deploy_gate: RELEASED — 2026-08-11` written last, per the
plan's ordering requirement — this is the line plan 05-05's own verify greps for before it can be
merged to `main` / deployed to Netlify production.

`npm run test:run` (2346 tests) and `npm run build` both green, satisfying the plan's final acceptance
criterion.

## Deviations

1. **[Documented correction, carried forward — not new] V6 row-integrity expectation.** Plan text says
   `total_rows = 3`; recorded `9/9/9` instead, matching `05-discovery.md`'s SC-2 correction and the
   05-07 rehearsal's own `PRE-STATE` finding. No source file changed — this is a pre-existing,
   already-corrected premise, not a fresh deviation.
2. **[Rule 4 — real, explained anomaly, not a blocker] Six of nine rows show
   `ls_dashboard_email_matches: no`.** All six are the owner's own `1f569340...` dev/test account;
   `resolved_parent_id` for all six correctly resolves to that same account, matching the prediction
   exactly. The email field mismatch is LS-side noise from repeated manual test checkouts using
   throwaway addresses, already documented in `05-discovery.md` before Task 1 ran. Owner explicitly
   confirmed sign-off on all 9 rows with this context visible, rather than the plan's literal
   "any no blocks sign-off" language being applied to a condition that predates the backfill and was
   already reviewed once.
3. **[Gate compliance, no information lost] Owner's own email dropped from the `**Signed:**` line.**
   `05-subscription-signoff.md`'s automated verify gate is a blunt "no email pattern anywhere in this
   file" regex that doesn't distinguish the signer's own identity from customer PII (contrast Phase 1's
   `01-fk-checklist.md` precedent, which did include the signer's email). Recorded as "Daniel (Owner)"
   instead to pass the mechanical check cleanly.
4. **[Scope decision, owner-authorized in the moment] Task 3's deploys run directly by the
   orchestrator, not the owner.** The plan names this an `[OWNER]` checkpoint, mirroring Task 1/2's DB
   checkpoints. Unlike those, `supabase functions deploy` is not mechanically blocked for this project
   (only `db push`/`apply_migration` are). The owner explicitly authorized direct execution
   ("you can deploy") after the pre-deploy gate passed; the orchestrator used its own `functions list`
   call for accurate before-state rather than the owner's truncated paste. No production DB write
   happened outside the owner's own SQL Editor session at any point in this plan.

## Verification

- Task 0 gate: `GATE PASS: SANDBOX PASS + REHEARSAL PASS recorded, DEPLOY-GATE intact` — **PASS**
- Task 1 automated gate (`## Production apply (D-13)`, V1-V6 + Advisors present, `BACKFILL:` /
  `0 row(s) left with parent_id IS NULL` recorded, `### Backout readiness` present): **PASS**
- Task 2 automated gate (`## After backfill`, `## Before/after delta`, `## OWNER SIGN-OFF` with 9
  checked lines, `sc2_satisfied: yes`, zero unredacted emails): **PASS**
- Task 3 automated gate (`sc2_satisfied: yes`, no `| FAIL |` cells, `### Edge Function deployment
  (D-12)` with all 4 functions + rollback SHA + procedure, `unresolved_webhook_log_count:`,
  `### 24h watch`, `### Frontend deploy gate` containing `frontend_deploy_gate: RELEASED`,
  `Deployment completed:` in the sign-off doc): **PASS**
- `npm run test:run`: 2346 passed, 0 failed
- `npm run build`: succeeded (pre-existing chunk-size warnings only, not errors)
- `SELECT COUNT(*) FROM unresolved_webhook_log;` (production, post-deploy): `0`

## Self-Check: PASSED

## Next

Phase 5 (subscription-re-pointing) is now fully complete — all 9 plans across 6 waves done. The
`frontend_deploy_gate: RELEASED` line unblocks merging plan 05-05's client changes to `main` and
deploying to Netlify production whenever the owner is ready. A 24h re-check of
`unresolved_webhook_log` (target 2026-08-12) remains an open follow-up, tracked in
`05-apply-log.md`'s `### 24h watch` checklist. Formal phase-level code review / goal verification
(`gsd-code-review`, `gsd-verifier`) was not run in this session — this plan's changes were
documentation, SQL, and Edge Function deploys with zero application source changes, so it's offered as
an optional follow-up rather than run automatically.
