# Phase 5 — Discovery

## 1. parent_subscriptions live schema

_pending Task 2_

## 2. Live subscription rows (pre-backfill)

_pending Task 2_

## 3. Lemon Squeezy test-mode readiness

_pending Task 3_

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
