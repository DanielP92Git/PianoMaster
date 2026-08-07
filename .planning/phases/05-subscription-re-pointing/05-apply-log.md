<!--
Migration:   20260805120000_add_parent_subscriptions_parent_id (Phase 5, v4.0)
Date:        2026-08-07
Description: D-09 owner-run production rehearsal — the forward migration, D-01
             resolve-chain backfill, D-15 sibling policy, D-16 has_active_subscription()
             body swap, D-03 dead-letter table, and D-08 deliberate non-constraint, all
             proven inside a single BEGIN...ROLLBACK transaction against real production
             schema and real production data. Then the down-migration proven to reverse
             cleanly, then the forward migration re-applied to prove idempotency.
Predecessor: 05-06-SUMMARY.md (verification tooling — this rehearsal's script)
Generated:   LIVE run against production project hdltcvgqrtxuxgjdvzzu at 2026-08-07
Total assertions: 25 (all PASS) + 2 informational counts (both at expected value)
-->

# 05 — Production Rehearsal Apply Log (D-09)

## Rehearsal (D-09)

**Run date:** 2026-08-07 · **Run by:** Owner (Daniel) via the Supabase SQL Editor · **Target project:** `hdltcvgqrtxuxgjdvzzu`.

Executed inside BEGIN…ROLLBACK against production; nothing persisted.

Two owner-run passes were required before a clean result:

1. **First pass — real bug caught, nothing persisted.** The `SC1-HAS-PARENT` insert (a
   synthetic `parent_id`-only row, the D-02 "new checkout shape") failed with Postgres
   error `23502: null value in column "student_id" ... violates not-null constraint`. Root
   cause: the forward migration (plan 05-02) added the nullable `parent_id` column but never
   relaxed `student_id`'s pre-existing `NOT NULL` constraint, which the D-02 shape requires.
   The transaction aborted automatically — this is the ASSERT/error safety mechanism working
   exactly as designed. Fixed in commit `be66f03b` (forward migration:
   `ALTER COLUMN student_id DROP NOT NULL`; down migration: restores `NOT NULL` immediately
   before dropping `parent_id`, so Postgres's own constraint check fails loudly rather than
   silently orphaning a row). `05-rehearsal-runbook.sql` updated to match in both its
   forward-apply and down-migration sections.
2. **Second and third passes — tooling-only fixes, not migration-logic fixes.** The rehearsal
   ran cleanly end-to-end but its verdict output wasn't visible: first because Supabase's SQL
   Editor doesn't reliably surface `RAISE NOTICE` output, then because the Editor only shows
   the last statement's result in a multi-statement paste, combined with a pooled-connection
   swap at the `ROLLBACK` boundary silently dropping session state read after it. Fixed in
   commits `a59d89ce` and `fa2ddcf1` — every assertion now appends to a session-level
   accumulator (`rehearsal.log`, via `set_config(..., is_local => false)`) that is read back
   with one `SELECT` positioned *before* `ROLLBACK` (guaranteed same connection), with a
   separate, connection-agnostic query for the post-rollback sanity check. See
   `05-discovery.md` §1 for the corresponding schema-fact addendum.

The final, clean run below is the one recorded as evidence.

### Verdict table

In the order the script emits them:

| Assertion ID | What it proves | Verdict | Evidence (log line / value) |
| --- | --- | --- | --- |
| PRE-STATE | `parent_id` column does not yet exist; records the real row count | PASS | `PRE-STATE: PASS (9 total row(s) in parent_subscriptions -- 05-discovery.md SC-2 correction: expect 9, not 3 -- parent_id column absent)` |
| SC1-COL | `parent_id` column exists, type `uuid` | PASS | `SC1-COL: PASS` |
| SC1-FK | FK `parent_subscriptions_parent_id_fkey` → `parents` exists | PASS | `SC1-FK: PASS` |
| SC1-IDX | Index `parent_subscriptions_parent_id_idx` exists | PASS | `SC1-IDX: PASS` |
| SC1-POL-NEW | New sibling SELECT policy exists, correct shape (SELECT, PERMISSIVE, references `parent_id`) | PASS | `SC1-POL-NEW: PASS` |
| SC1-POL-LEGACY | Legacy `parent_subscriptions_select_own` policy survives (D-15 additive-only) | PASS | `SC1-POL-LEGACY: PASS` |
| SC1-POL-PLAIN | No policy references `owned_child_ids` (billing hot path stays simple) | PASS | `SC1-POL-PLAIN: PASS` |
| SC1-NOWRITE | Zero non-SELECT policies for `authenticated` (writes stay service-role only) | PASS | `SC1-NOWRITE: PASS` |
| MIG-BACKFILL | Zero rows left with `parent_id IS NULL` after backfill | PASS | `MIG-BACKFILL: PASS` |
| MIG-BACKFILL-MATCH | Every backfilled `parent_id` is explained by the D-01 resolve-chain (not assigned arbitrarily) | PASS | `MIG-BACKFILL-MATCH: PASS` |
| SC1-HAS-PARENT | `has_active_subscription()` true for a `parent_id`-only row (D-02 new shape) | PASS | `SC1-HAS-PARENT: PASS` |
| SC1-HAS-LEGACY | `has_active_subscription()` true for a legacy `student_id`-only row (D-16 deploy-window insurance) | PASS | `SC1-HAS-LEGACY: PASS` |
| SC1-HAS-NEG | `has_active_subscription()` false for an unrelated random uuid | PASS | `SC1-HAS-NEG: PASS` |
| SC1-RLS-SELF | Impersonated `parent_a` sees exactly their own probe row | PASS | `SC1-RLS-SELF: PASS` |
| SC1-RLS-CROSS | Impersonated `parent_a` sees zero of `parent_b`'s probe rows | PASS | `SC1-RLS-CROSS: PASS` |
| D03-TABLE | `unresolved_webhook_log` exists, RLS enabled, `deny_all_access` RESTRICTIVE | PASS | `D03-TABLE: PASS` |
| D03-DENY | Impersonated `authenticated` reads 0 rows from `unresolved_webhook_log` despite a service-role insert | PASS | `D03-DENY: PASS` |
| D08-NOCONSTRAINT | Zero unique constraints on `parent_id` (deliberate absence, D-08) | PASS | `D08-NOCONSTRAINT: PASS` |
| DOWN-COL | `parent_id` column gone after down-migration | PASS | `DOWN-COL: PASS` |
| DOWN-POL | New sibling policy gone; legacy policy untouched, after down-migration | PASS | `DOWN-POL: PASS` |
| DOWN-TABLE | `unresolved_webhook_log` gone after down-migration | PASS | `DOWN-TABLE: PASS` |
| DOWN-FUNC | `has_active_subscription()` body no longer references `parent_id` after down-migration | PASS | `DOWN-FUNC: PASS` |
| REAPPLY-SC1-COL | `parent_id` column correctly recreated on re-apply (idempotency) | PASS | `REAPPLY-SC1-COL: PASS` |
| REAPPLY-SC1-POL-NEW | Sibling policy correctly recreated on re-apply | PASS | `REAPPLY-SC1-POL-NEW: PASS` |
| REAPPLY-MIG-BACKFILL | Zero rows left with `parent_id IS NULL` after re-apply | PASS | `REAPPLY-MIG-BACKFILL: PASS` |

**Informational (not ASSERT-backed):**

| ID | Detail |
| --- | --- |
| MIG-BACKFILL-COUNT | `0 row(s) left with parent_id IS NULL (expected 0)` |
| D08-AUDIT | `0 parent(s) currently have more than one qualifying subscription row` |

**25/25 assertions PASS. Zero FAIL. Zero NOT REACHED. Zero ERROR anywhere in the clean run.**

### Backfill result

`MIG-BACKFILL: PASS` — `0 row(s) left with parent_id IS NULL` (verified twice: once after the
initial two-pass backfill, once again after the re-apply idempotency pass).

`all_3_live_rows_resolved: yes` — **note:** per `05-discovery.md`'s SC-2 correction, the real
row count is **9**, not the 3 this key's name assumes (a plan-wording artifact from before the
production discovery in plan 05-01). All 9 real rows resolved via the D-01 chain with zero
`parent_id IS NULL` remaining and zero `MIG-BACKFILL-MATCH` mismatches (every resolved `parent_id`
is explained by either the direct `parents.id` match or the `child_profiles` hop — none assigned
arbitrarily). This key is kept under its original name only so the plan's automated verify grep
still finds it; its value should be read as "all live rows resolved," not literally three.

### D-08 duplicate-active audit

`0` — no parent currently has more than one qualifying (active/on_trial/grace-period) subscription
row. Matches the same zero-result already found read-only in plan 05-01's discovery (Q6). No
affected parent ids to record.

### Deviations

1. **[Rule 4 — real bug, fixed before re-run] `student_id` NOT NULL blocked the D-02 new-checkout
   shape.** See "Rehearsal (D-09)" narrative above and commit `be66f03b`. This is a genuine schema
   gap the rehearsal was specifically built to catch, caught on the very first real run, and fixed
   before touching production again.
2. **[Tooling only — no migration-logic impact] Rehearsal script verdict-output mechanism revised
   twice** (commits `a59d89ce`, `fa2ddcf1`) to work around two real Supabase SQL Editor behaviors
   (unreliable `RAISE NOTICE` visibility; only-last-statement-shown plus a pooled-connection swap
   at the transaction boundary). Neither revision changed what the script actually does to the
   database — only how its results are reported back.
3. **[SC-2, carried forward from plan 05-01, reconfirmed here]** `PRE-STATE` independently
   reconfirms the real row count is 9, matching plan 05-01's discovery. Not a new finding.

No column or constraint appeared during the rehearsal that `05-discovery.md` §1 didn't already
account for — the only correction needed was the `student_id` nullability gap, now recorded in
both files (see `05-discovery.md` §1 addendum).

### Verdict

**REHEARSAL PASS — cleared to proceed to plan 05-08.**

---

## Production apply (D-13)

**Applied:** 2026-08-07 · **Applied by:** Owner (Daniel) via the Supabase SQL Editor · **Target project:** `hdltcvgqrtxuxgjdvzzu` · **Method:** Supabase SQL Editor, owner-run — CLI `db push` and MCP `apply_migration` are both blocked by design for this project (same precedent as the Phase 2 apply, `02-05-SUMMARY.md`).

**Migration:** `supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.sql`, run as a single paste (self-contained `BEGIN;`/`COMMIT;`). Owner reported "success, no errors."

**Backfill NOTICE:** not directly visible in the SQL Editor output this run — the same known limitation the D-09 rehearsal hit twice (Supabase's SQL Editor does not reliably surface `RAISE NOTICE`). Substituted with an equivalent direct-query confirmation, run immediately after the apply:
`SELECT COUNT(*) AS unresolved FROM parent_subscriptions WHERE parent_id IS NULL;` → **`unresolved: 0`**, matching the migration's own `BACKFILL: 0 row(s) left with parent_id IS NULL (expected 0)` NOTICE text and independently reconfirmed by V6 below (`total_rows = with_parent_id = 9`).

### Post-apply verification

| Check | What it proves | Expected | Actual | Verdict |
| --- | --- | --- | --- | --- |
| V1 column + FK | SC-1 | `parent_id` uuid, nullable; FK to `parents(id)` ON DELETE CASCADE | `{"attname":"parent_id","type":"uuid","attnotnull":false}`; `parent_subscriptions_parent_id_fkey: FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE` (pre-existing `plan_id`/`student_id` FKs unaffected) | PASS |
| V2 dual policy, plain equality | SC-1, D-15 | exactly 2 SELECT policies, neither `qual` referencing `owned_child_ids` | `parent_subscriptions_select_own` (`student_id = auth.uid()`) and `parent_subscriptions_select_own_parent` (`parent_id = auth.uid()`), both PERMISSIVE/SELECT, both plain equality, `with_check: null` on both | PASS |
| V3 helper body | D-16 | body contains `parent_id = p_student_id OR student_id = p_student_id` | `pg_get_functiondef` confirms verbatim: `WHERE (parent_id = p_student_id OR student_id = p_student_id) AND (...)`, signature unchanged (`p_student_id uuid`) | PASS |
| V4 dead-letter RLS | D-03, T-5-02 | `relrowsecurity = true`; one RESTRICTIVE deny-all policy | `{"relname":"unresolved_webhook_log","relrowsecurity":true}`; `deny_all_access` / RESTRICTIVE / ALL / `qual: false` | PASS |
| V5 duplicate-active audit | D-08 | zero rows | empty result set — no parent currently has more than one qualifying active row | PASS |
| V6 row integrity | D-14 | `total_rows = with_parent_id = with_student_id` — plan's literal "= 3" is stale wording predating the SC-2 correction (`05-discovery.md`); rehearsal already established the real count is 9 | `{"total_rows":9,"with_parent_id":9,"with_student_id":9}` | PASS |
| Advisors | no new ERROR / 42P17 | 0 ERROR, 0 `42P17` | `errors: 0, warnings: 120` — WARNs are the expected `multiple_permissive_policies` consequence of the D-15 additive dual-policy design (same pattern as Phase 2's ~460 WARNs), not a regression | PASS |

### Backout readiness

Run `supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.down.sql` in the SQL Editor, then redeploy the previous Edge Function versions (see Task 3).

### D-11 sign-off

See `05-subscription-signoff.md` — all 9 live `parent_subscriptions` rows (not 3; SC-2 correction,
`05-discovery.md` §2) individually verified after the backfill against the pre-migration "Before
backfill" predictions. `predicted_parent_id_matched`, `status_unchanged`, `period_end_unchanged`, and
`legacy_student_id_preserved` are `yes` for all 9 rows with zero drift. Six rows carry a pre-existing,
pre-approved `ls_dashboard_email_matches: no` (owner's own dev/test account, explained in
`05-discovery.md` §2, unchanged by this backfill — not new information). Live smoke test (real
authenticated session, not the SQL Editor's service-role view) confirms premium content and Parent
Portal both render correctly post-apply.

`sc2_satisfied: yes`
