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

Run 2026-08-07, ~00:54–01:20 UTC. Verified throughout directly against the sandbox via Supabase MCP
(`execute_sql` + `get_logs`), not from console-output paste.

### 4. create-checkout (happy path)

HTTP 200. `checkoutUrl` returned:
`https://pianomaster.lemonsqueezy.com/checkout/custom/c54e7201-2b79-40c1-aa0e-f081bf2341d1?signature=31510b54c949f2d95bbdcc14974d4eefc89e70c7c8556e17e6739b56bbc01b2e`

### 4b. create-checkout (IDOR negative, T-5-04)

HTTP **403**. Body: `{"error":"Forbidden: studentId does not match authenticated user"}`. Confirmed via
function logs: `create-checkout: studentId mismatch { authUid: "82160962-...", requestedStudentId:
"00000000-0000-0000-0000-000000000fff" }`.

### 5. Checkout completion

Paid with Lemon Squeezy test card `4242 4242 4242 4242` (test mode). Resulting row:

| ls_subscription_id | parent_id | student_id | status | plan_id |
| --- | --- | --- | --- | --- |
| `2413013` | `82160962-491c-49ae-8908-1a1114027d77` | `null` | `active` | `sandbox-monthly-usd` |

`parent_id_non_null: yes`
`student_id_null: yes`
`ui_premium_reads_true: yes` — verified via `SELECT has_active_subscription('82160962-...')` returning
`true` directly against the sandbox DB (substituted for a live browser check: the deployed app's env
points at production Supabase, not this throwaway sandbox project, so loading the actual UI against
sandbox data isn't practical — `has_active_subscription()` is the same function the UI's query reads).

Informational, not a defect: `parent_email` on the row is `pagis.daniel@gmail.com` (the real email
typed at the LS test-mode checkout), not `sim-verify@example.invalid` (the sandbox auth account's
email) — harmless, since the resolve-chain uses `custom_data.parent_id`, never email.

### 6. cancel-subscription (single active)

**Deviation found here, not anticipated by plan 05-08 or the runbook:** the D-10a replay suite (Task 1)
left the sandbox parent with **6** lingering `status: active` rows (B1, B2, B3, B4, B10a, B10b — every
branch that reaches the DB writes `active`, not just B10's two), so the very first cancel attempt after
checkout hit the ambiguous-multiple-subscriptions path immediately (see section 7) instead of the
clean single-row path the runbook's step 6 assumes. `05-08-PLAN.md`'s "B10 leaves exactly two
qualifying rows" assumption undercounted by 4. Resolved by deleting the leftover `sim_verify_%` rows
for this parent (keeping only the real `2413013` row), then retrying.

After cleanup, HTTP 200: `{ ok: true, endsAt: "2026-09-07T00:59:28.000000Z" }`. Post-webhook row status
confirmed `cancelled` — landed automatically with no manual resend needed, confirming the earlier
signing-secret fix (section 8 below) held for the whole session, not just one retry.

### 7. cancel-subscription (D-06 ambiguity)

Encountered naturally (see section 6's deviation) rather than via a deliberate B10 re-run — same code
path, stronger evidence (7 qualifying rows instead of 2). HTTP **409**. Body:
`{"error":"Multiple active subscriptions found — cancellation needs manual review",
"code":"AMBIGUOUS_ACTIVE_SUBSCRIPTIONS","count":7}`. Function log:
`CANCEL_AMBIGUOUS: { parentId: "82160962-...", count: 7, ls_subscription_ids: ["sim_verify_2026-08-06_1",
"sim_verify_2026-08-06_2", "sim_verify_2026-08-06_3", "sim_verify_2026-08-06_4",
"sim_verify_2026-08-06_10", "sim_verify_2026-08-06_11", "2413013"] }`.

`ls_dashboard_unchanged: yes — owner-observed` (subscription `2413013` still showed active/unchanged in
the Lemon Squeezy test-mode dashboard at that point) — also structurally guaranteed: the `ambiguous`
branch in `cancel-subscription/index.ts` returns 409 before the code ever reaches the Lemon Squeezy
`DELETE` fetch call, so no LS-side mutation was possible regardless of observation.

### 8. Cleanup

- Sandbox teardown (`DELETE FROM parents WHERE display_name = 'sim-verify-sandbox'`, cascading to
  `child_profiles` and the remaining `parent_subscriptions` row; `subscription_plans` sandbox row
  deleted): done.
- Lemon Squeezy test-mode webhook URL restored from the sandbox function back to production
  (`https://hdltcvgqrtxuxgjdvzzu.supabase.co/functions/v1/lemon-squeezy-webhook`): done.
- Test-mode subscription `2413013` confirmed cancelled in the LS dashboard (from section 6's real
  cancellation): yes.
- Production safety queries (run by the owner against `hdltcvgqrtxuxgjdvzzu`, not automated — production
  access stays owner-run per this phase's established precedent):
  - `SELECT COUNT(*) FROM parent_subscriptions WHERE ls_subscription_id LIKE 'sim_verify_%'` → **0**
  - `SELECT id, name, lemon_squeezy_variant_id FROM subscription_plans` → `monthly-ils` (null),
    `yearly-ils` (null), `monthly-usd` (`1356600`), `yearly-usd` (`1356603`) — no `sandbox-monthly-usd`
    row present. **Correction to RESEARCH Pitfall 2's assumption:** `1356600`/`1356603` are production's
    own real, pre-existing live variant ids, not sandbox-injected ones — empirically, Lemon Squeezy does
    not keep separate test-mode-only variant records for this product; test mode is a payment-processing
    flag on the same catalog, not a separate one. The actual thing that mattered — no foreign
    `sandbox-monthly-usd` row — held true.

`production_clean: yes`

## Sandbox verdict

**SANDBOX PASS — cleared to touch live subscriptions (SC-4 satisfied)**

All required conditions met: SC-3 verdict PASS; step 4b = 403; step 5 `parent_id_non_null: yes` and
`student_id_null: yes`; step 6 = 200 (`ok: true`); step 7 = 409 with `AMBIGUOUS_ACTIVE_SUBSCRIPTIONS`
and `ls_dashboard_unchanged: yes`; step 8 `production_clean: yes`. No Lemon Squeezy API key or signing
secret appears anywhere in this file.
