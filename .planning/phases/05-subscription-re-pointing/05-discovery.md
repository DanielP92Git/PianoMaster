# Phase 5 — Discovery

## 1. parent_subscriptions live schema

**Q1 — real column list** (production project `hdltcvgqrtxuxgjdvzzu`, `pg_catalog.pg_attribute`, not
`information_schema` — see Phase 1 `01-fk-checklist.md` DEVIATION precedent):

| attnum | column_name | data_type | not_null | default_expr |
|---|---|---|---|---|
| 1 | id | uuid | true | gen_random_uuid() |
| 2 | student_id | uuid | true | (none) |
| 3 | ls_subscription_id | text | true | (none) |
| 4 | ls_customer_id | text | false | (none) |
| 5 | ls_variant_id | text | false | (none) |
| 6 | plan_id | text | false | (none) |
| 7 | status | text | true | (none) |
| 8 | current_period_end | timestamp with time zone | false | (none) |
| 9 | parent_email | text | false | (none) |
| 10 | created_at | timestamp with time zone | true | now() |
| 11 | updated_at | timestamp with time zone | true | now() |

No `parent_id` column exists yet — the phase's premise is confirmed valid; it is safe to add it in
plan 05-02.

```
existing_student_id_fk_on_delete: CASCADE
unexpected_columns: id, updated_at
notnull_columns_without_default: student_id, ls_subscription_id, status
```

`unexpected_columns` are both benign: `id` is the expected PK (RESEARCH's application-code-inferred
column list didn't need to name it), `updated_at` is an audit timestamp. Neither blocks plan 05-02;
both are simply additions the migration should not disturb.

`notnull_columns_without_default` are all required on every existing row already — informational for
plan 05-02's `parent_id` column design (it will need its own backfill before any `NOT NULL` could be
added to it), not a blocker.

**Q2 — constraints** (`pg_catalog.pg_constraint`):

| conname | contype | confdeltype | definition |
|---|---|---|---|
| `parent_subscriptions_status_check` | check | — | `CHECK ((status = ANY (ARRAY['on_trial'::text, 'active'::text, 'paused'::text, 'past_due'::text, 'unpaid'::text, 'cancelled'::text, 'expired'::text])))` |
| `parent_subscriptions_plan_id_fkey` | foreign key | a (NO ACTION) | `FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)` |
| `parent_subscriptions_student_id_fkey` | foreign key | c (CASCADE) | `FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE` |
| `parent_subscriptions_pkey` | primary key | — | `PRIMARY KEY (id)` |
| `parent_subscriptions_ls_subscription_id_key` | unique | — | `UNIQUE (ls_subscription_id)` |

The existing `student_id` FK's delete rule is `CASCADE` (`confdeltype = 'c'`). Plan 05-02's new
`parent_id` FK should match this delete rule (confirms the behavioural fact already noted in this
plan's `<interfaces>` block, sourced from `process-account-deletions/index.ts` line 396).

**Q3 — RLS policies** (`pg_policies`, `schemaname = 'public' AND tablename = 'parent_subscriptions'`):

Exactly one policy, as expected: `parent_subscriptions_select_own` — `cmd = SELECT`,
`qual = (student_id = ( SELECT auth.uid() AS uid))`.

(Note: an earlier run in this session accidentally returned unrelated policies from many other
tables due to a stale query in the SQL Editor tab; the query was re-run cleanly and this single-policy
result is the confirmed one. No further action needed — the false alarm is resolved.)

**Q4 — `has_active_subscription()` live definition vs. tracked migration:**

Verified: the LIVE function body in production is byte-for-byte identical (modulo Postgres's own
`pg_get_functiondef` formatting) to what is already recorded in section 6 below from the tracked
migration file `20260404000001_ensure_subscription_rls.sql`. **No drift between the tracked migration
and production.** Signature confirmed: `has_active_subscription(p_student_id uuid)`,
`LANGUAGE sql STABLE SECURITY DEFINER`.

## 2. Live subscription rows (pre-backfill)

**Q6 — D-08 duplicate-active-rows audit:** empty result set (zero rows). Confirms no
duplicate-active-rows anomaly exists today.

```
duplicate_active_rows_today: 0
```

**Q7 — total row count:** `9`.

**SC-2 assumption correction (owner-confirmed anomaly, recorded explicitly):** the plan's SC-2
assumption of "3 live subscriptions" was factually wrong. The real total is **9 rows**, and none of
the 9 represent a currently-billing real Lemon Squeezy customer today. The owner reviewed the raw
per-row Q5 data (see `05-subscription-signoff.md` for the full "before" table) and confirmed:

- Rows 1-7 (all sharing `legacy_student_id = 1f569340-c919-438c-b61c-246d7c3b4cac`, all
  `status: expired`) are the owner's own dev/test account from repeated manual checkout testing during
  development — not 7 distinct customers. The `emails_match: no` on 6 of these 7 rows reflects the
  owner using a different test email at checkout than their real login email — a known, confirmed-benign
  test artifact, not a fraud/mismatch signal.
- `uat-bypass-8650dc76-90f5-48d9-a7c0-aa18542b30d4` and `comp_e79437b8-dcf1-434d-9077-d8fa51223e26` have
  non-numeric `ls_subscription_id` values that no real Lemon Squeezy webhook could ever produce (LS ids
  are always numeric). Neither pattern appears anywhere in the tracked codebase (grepped
  `supabase/functions/`, all migrations, `docs/`) — both were confirmed by the owner to be rows
  inserted manually/out-of-band (one a UAT bypass grant, one a complimentary/friends-access grant with
  a permanent `2999-12-31` expiry sentinel), consistent with this table's already-known out-of-band
  creation history (it has no tracked `CREATE TABLE` migration — see this plan's `<objective>`).
  Neither is a real paying customer.
- **Owner decision:** the D-11 sign-off table in `05-subscription-signoff.md` covers **all 9 rows**
  (not just "live" ones), because plan 05-02's backfill will assign `parent_id` to every row in the
  table regardless of status — this is the correct and safer scope, and is a more conservative choice
  than the plan's original 3-row assumption, not a less conservative one.

**Downstream implication:** plans 05-02, 05-03, 05-04, and 05-09 must all account for 9 rows (not 3),
including the two non-numeric synthetic `ls_subscription_id` values (`uat-bypass-...`, `comp_...`)
surviving the backfill/migration unharmed — they are legitimate rows, not malformed data to be
filtered out.

## 3. Lemon Squeezy test-mode readiness

```
test_mode_variant_exists: yes
test_mode_variant_id: 861115
test_mode_webhook_registration: pending_verification
test_mode_signing_secret_available: yes
test_mode_api_key_available: yes
sandbox_target: throwaway-project
```

`test_mode_webhook_registration: pending_verification` — the owner just submitted store ID
verification/activation and currently cannot toggle Test mode off to compare against the Live webhook
list, so it is not yet confirmed whether this is a separate Test-mode-only registration or one shared
entry serving both modes (RESEARCH Assumption A2 still open). What IS confirmed: exactly one webhook
registration is visible while Test mode is on, URL
`https://hdltcvgqrtxuxgjdvzzu.supabase.co/functions/v1/lemon-squeezy-webhook` (the production Edge
Function URL), listening for 4 events, with a signing secret already configured (owner confirmed yes,
value not disclosed).

The test-mode checkout page was visually confirmed working: navigating the product's Share/Checkout
Link for "App Payment" (variant note: the product has two variants, "Yearly USD" $79.90/yr and
"Monthly USD" — the owner did not specify which variant `861115` corresponds to; recorded here as a
minor open detail, not a blocker) rendered a full checkout form (email, card details placeholder
`XXXX-XXXX-XXXX-4242`, cardholder name, billing address, tax ID, price selector) — the store is
checkout-ready in test mode.

### Consequences for plan 05-08

- `test_mode_variant_id: 861115` is the value plan 05-06's seed script must write into the local
  `subscription_plans.lemon_squeezy_variant_id` column.
- `NEVER write a test-mode variant id into production subscription_plans (RESEARCH Pitfall 2).`
- **Plan 05-08 must first re-verify whether the webhook registration is shared or separate** before
  doing anything with it, since store activation is still pending as of this writing and that
  re-verification could not be completed now. If the registration turns out to be **shared** (one
  registration serving both Test and Live), re-pointing it at a sandbox URL for testing would
  temporarily break the live webhook and require restoring it afterward — plan 05-08 must budget an
  extra owner step for this restore.

## 4. Alerting mechanism (D-03 / D-06)

**Q1 — Is Sentry available inside Deno Edge Functions?**

Commands run:
```
grep -rn "sentry" supabase/functions/ --include=*.ts -i
grep -rn "SENTRY" supabase/config.toml docs/DEPLOY.md
```

Result: **zero matches** for both commands. Neither `supabase/config.toml` nor `docs/DEPLOY.md`
references `SENTRY`, and no `.ts` file under `supabase/functions/` imports or references Sentry
(verified against `lemon-squeezy-webhook/index.ts` and `process-account-deletions/index.ts` — the
most error-handling-heavy existing Edge Function — which imports only
`https://esm.sh/@supabase/supabase-js@2`, no Sentry SDK). The CLAUDE.md "Monitoring: Sentry" line
refers only to the client-side (`src/`) integration.

```
sentry_in_edge_functions: no
```

**Locked-in fallback (RESEARCH-mandated, verbatim):** the D-03 "fire a Sentry error" obligation is
satisfied by `console.error('WEBHOOK_UNRESOLVED:', {...})` with that exact greppable prefix, plus
the dead-letter row as the durable primary record. The identical decision applies to D-06's
"alert": `console.error('CANCEL_AMBIGUOUS:', {...})`.

These two literal prefixes — `WEBHOOK_UNRESOLVED:` and `CANCEL_AMBIGUOUS:` — are the contract that
plans 05-03 and 05-04 implement and their tests assert on.

**Existing convention observed** (`lemon-squeezy-webhook/index.ts` lines 84-92): the current
missing-`student_id` guard already uses `console.error('Webhook: missing student_id in
custom_data', { event, ls_subscription_id })` then returns HTTP 200 to stop LS retries — the new
`WEBHOOK_UNRESOLVED:` prefix follows this exact shape (structured object as second arg), just with
the new prefix and richer payload (per D-03, persisted to a dead-letter table as the durable
primary record, this console.error is the loud secondary signal).

## 5. Sandbox tooling

**Q2 — Is the Supabase CLI local stack usable for the D-10(b) sandbox?**

Commands run:
```
npx supabase --version
docker info > /dev/null 2>&1 && echo DOCKER_OK || echo DOCKER_UNAVAILABLE
```

Result:
```
supabase_cli_version: 2.111.0
docker_verdict: DOCKER_UNAVAILABLE
```

Per the RESEARCH fallback: **a throwaway second Supabase project is the sandbox target instead of
a local stack.** Plan 05-06's seed script must therefore be applied to that throwaway project
rather than run against a local Docker-backed stack.

```
sandbox_target: throwaway-project
```

## 6. has_active_subscription() current body

**Q3 — What is the exact current `has_active_subscription()` source in the repo?**

Command run:
```
sed -n '36,60p' supabase/migrations/20260404000001_ensure_subscription_rls.sql
```

Verbatim "before" reference — plan 05-02's `CREATE OR REPLACE` must preserve this exact signature
(`p_student_id UUID`, arg count and type unchanged — Pitfall 5):

```sql
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM parent_subscriptions
    WHERE student_id = p_student_id
      AND (
        status = 'active'
        OR status = 'on_trial'
        OR (status = 'cancelled' AND current_period_end > NOW())
        OR (status = 'past_due'  AND current_period_end > NOW() - INTERVAL '3 days')
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated;

COMMENT ON FUNCTION public.has_active_subscription IS
  'Returns true if the student has an active, trial, or grace-period subscription. Mirrors JS fetchSubscriptionStatus() logic.';
```

`has_active_subscription(p_student_id UUID)` — signature confirmed: single `UUID` argument, name
`p_student_id`. Plan 05-02's D-16 `CREATE OR REPLACE` must add `parent_id = p_id OR student_id =
p_id` semantics without changing this signature (call sites in `20260801120000_rls_ownership_rewrite.sql`
already pass `(SELECT auth.uid())` positionally, so a signature change would break them silently).
