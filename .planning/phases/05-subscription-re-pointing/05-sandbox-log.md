<!--
Plan:        05-08 (Wave 5)
Purpose:     SC-3 (D-10a scripted replay suite) and SC-4 (real Lemon Squeezy test-mode checkout)
             evidence, gating any production apply in plan 05-09.
Sandbox:     bfzdqhsdbqkhznwjfghk (pianomaster-phase5-sandbox), throwaway hosted project per
             05-discovery.md §5 sandbox_target: throwaway-project.
-->

# 05 — Sandbox Proof (SC-3, SC-4)

## Environment

- `sandbox_target`: `throwaway-project` (per `05-discovery.md` §5) — project `bfzdqhsdbqkhznwjfghk`
  ("pianomaster-phase5-sandbox"), never `hdltcvgqrtxuxgjdvzzu` (production).
- Provisioning path taken: dashboard-created project (Supabase MCP `create_project` was blocked —
  MCP runs in blanket read-only mode), CLI linked to the sandbox ref, functions deployed via
  `supabase functions deploy` (works without Docker; `db push`/`db dump`/`db start` do not, and were
  not used). Schema stood up via a hand-authored bootstrap script
  (`05-sandbox-bootstrap.sql`) + the real tracked forward migration
  (`20260805120000_add_parent_subscriptions_parent_id.sql`, already proven in plan 05-07's production
  rehearsal) + the corrected `05-sandbox-seed.sql`, all run by the owner via the sandbox's own SQL
  Editor.
- `test_mode_variant_id` used: `861115` (product "App Payment", per `05-discovery.md` §3).
- Seeded ids (from `05-sandbox-seed.sql`'s export query, confirmed against the sandbox DB):
  - `REPLAY_PARENT_ID` = `82160962-491c-49ae-8908-1a1114027d77`
  - `REPLAY_LINKED_CHILD_ID` = `042d52a5-d169-4e75-8536-ee0ce57639d6`
  - `REPLAY_ORPHAN_CHILD_ID` = `fe7d09c9-6698-4dda-a8a8-0a45497f51f5`
  - `SANDBOX_PLAN_ID` = `sandbox-monthly-usd`
- `production_touched: no — WEBHOOK_URL was https://bfzdqhsdbqkhznwjfghk.supabase.co/functions/v1/lemon-squeezy-webhook`
- Verification method: the orchestrator (this file's author) queried the sandbox database and Edge
  Function runtime logs directly via the Supabase MCP `execute_sql`/`get_logs` tools
  (`project_id: bfzdqhsdbqkhznwjfghk`) after the owner ran the replay script in their own terminal —
  not transcribed from console-output paste (the owner's terminal repeatedly truncated multi-line
  copies). DB rows and function log lines below are the direct, authoritative source.

## SC-3 — D-10(a) replay suite

All ten branches run 2026-08-06 ~23:45:59–23:46:03 UTC against the deployed sandbox function.

| Branch | Scenario | Expected HTTP | Actual HTTP | Expected DB effect | Actual DB effect | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | D-02 new checkout shape (`{ parent_id }`) | 200 | 200 | row with `parent_id = PARENT_ID`, `student_id` NULL | `sim_verify_2026-08-06_1`: `parent_id=82160962-...`, `student_id=null`, `status=active` | PASS |
| B2 | D-01 legacy shape, probe 1 hit (`{ student_id: PARENT_ID }`) | 200 | 200 | same row shape — resolves via probe 1, no LS-side change | `sim_verify_2026-08-06_2`: `parent_id=82160962-...`, `student_id=null`, `status=active` | PASS |
| B3 | D-01 legacy shape, probe 2 hit — `child_profiles` hop (`{ student_id: LINKED_CHILD_ID }`) | 200 | 200 | row's `parent_id` = that child's **parent's** id (`82160962-...`), NOT the child id (`042d52a5-...`) | `sim_verify_2026-08-06_3`: `parent_id=82160962-...` — differs from the submitted child id, matches the child's actual parent | PASS |
| B4 | D-02 preference — both keys present (`{ parent_id: PARENT_ID, student_id: LINKED_CHILD_ID }`) | 200 | 200 | row's `parent_id = PARENT_ID` — `parent_id` wins | `sim_verify_2026-08-06_4`: `parent_id=82160962-...` | PASS |
| B5 | D-03 unresolvable id (`{ student_id: "00000000-...-0fff" }`) | 200 "Unresolved parent — recorded for review" | 200 | new `unresolved_webhook_log` row; `WEBHOOK_UNRESOLVED:` in logs | `unresolved_webhook_log` row: `ls_subscription_id=sim_verify_2026-08-06_5`, `attempted_id=00000000-0000-0000-0000-000000000fff`. Log: `WEBHOOK_UNRESOLVED: { event_name: "subscription_created", ls_subscription_id: "sim_verify_2026-08-06_5", attempted_id: "00000000-0000-0000-0000-000000000fff" }` | PASS |
| B6 | D-03 parent-less child (`{ student_id: ORPHAN_CHILD_ID }`) | 200 | 200 | identical to B5 | `unresolved_webhook_log` row: `ls_subscription_id=sim_verify_2026-08-06_6`, `attempted_id=fe7d09c9-6698-4dda-a8a8-0a45497f51f5`. Log: `WEBHOOK_UNRESOLVED: { event_name: "subscription_created", ls_subscription_id: "sim_verify_2026-08-06_6", attempted_id: "fe7d09c9-6698-4dda-a8a8-0a45497f51f5" }` | PASS |
| B7 | D-03 empty `custom_data` (`{}`) | 200 | 200 | identical to B5 | `unresolved_webhook_log` row: `ls_subscription_id=sim_verify_2026-08-06_7`, `attempted_id=null`. Log: `WEBHOOK_UNRESOLVED: { event_name: "subscription_created", ls_subscription_id: "sim_verify_2026-08-06_7", attempted_id: null }` | PASS |
| B8 | Signature negative control — corrupted `X-Signature` | 400 "Invalid signature" | 400 | NO row in `parent_subscriptions`, NO row in `unresolved_webhook_log` | Log: `Webhook: invalid or missing X-Signature header` (level ERROR). Row-count check: `parent_subscriptions` has exactly 6 `sim_verify_%` rows (B1,B2,B3,B4,B10a,B10b) and `unresolved_webhook_log` has exactly 3 (B5,B6,B7) — `sim_verify_2026-08-06_8` appears in **neither** table, zero delta | PASS |
| B9 | Unhandled event type (`order_created`) | 200 "Event not handled" | 200 | no row anywhere | Log: `Webhook: unhandled event type "order_created", skipping`. `sim_verify_2026-08-06_9` appears in neither table | PASS |
| B10 | D-08 duplicate active — two sends, same parent, both `active` | both 200 | both 200 | parent ends with 2 qualifying rows | `sim_verify_2026-08-06_10` and `_11`: both `parent_id=82160962-...`, both `status=active`. Logs: `Webhook: processed subscription_created for s***@example.invalid { ls_subscription_id: "sim_verify_2026-08-06_10", status: "active" }` and same for `_11`. Rows left in place for Task 2's D-06 test | PASS |

### SC-3 verdict

**PASS** — all ten branches matched expected HTTP status and expected database/log effect, including
the `child_profiles` compatibility hop (B3, dead code for real traffic) and the signature negative
control (B8, zero-row-delta on both tables confirming signature verification happens before any DB
access).

## SC-4 — real test-mode checkout

_Pending — Task 2 (owner-run checkpoint). Not started yet._

## Sandbox verdict

_Pending SC-4._
