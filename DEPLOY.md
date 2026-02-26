# Deployment Guide: Lemon Squeezy Webhook

This checklist covers deploying the `lemon-squeezy-webhook` Supabase Edge Function,
setting required secrets, registering the webhook URL in the Lemon Squeezy dashboard,
and verifying end-to-end operation.

## Prerequisites

- Supabase CLI installed and linked to your project (`supabase link`)
- Lemon Squeezy account with a Store created
- Node.js 20+ (for Supabase CLI)

---

## 1. Set Signing Secret

In the Lemon Squeezy dashboard:
1. Go to **Settings > Webhooks**
2. Note the signing secret (or set one when creating the webhook endpoint)

Set it in Supabase:

```bash
supabase secrets set LS_SIGNING_SECRET=your-signing-secret-here
```

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase — no manual setup needed for these.

Verify the secret was stored:

```bash
supabase secrets list
```

Expected: `LS_SIGNING_SECRET` appears in the output.

---

## 2. Deploy the Edge Function

```bash
supabase functions deploy lemon-squeezy-webhook --no-verify-jwt
```

The function URL will be:

```
https://<project-ref>.supabase.co/functions/v1/lemon-squeezy-webhook
```

Replace `<project-ref>` with your Supabase project reference (found in Project Settings > API).

> The `--no-verify-jwt` flag is also configured in `supabase/config.toml` for reproducibility.

Verify the function deployed:

```bash
supabase functions list
```

Expected: `lemon-squeezy-webhook` appears with a recent deployment timestamp.

---

## 3. Register Webhook URL in Lemon Squeezy

1. Go to **Lemon Squeezy Dashboard > Settings > Webhooks**
2. Click **"Add Endpoint"**
3. URL: `https://<project-ref>.supabase.co/functions/v1/lemon-squeezy-webhook`
4. Select events:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
5. Save

> Copy the **Signing Secret** shown after saving — this must match the value set in step 1.

---

## 4. Update Variant IDs (Manual)

After creating products and variants in Lemon Squeezy, update the `subscription_plans` table
with the real variant IDs. Run these in the Supabase SQL editor or via your database client:

```sql
UPDATE subscription_plans SET lemon_squeezy_variant_id = '<variant-id>' WHERE id = 'monthly-ils';
UPDATE subscription_plans SET lemon_squeezy_variant_id = '<variant-id>' WHERE id = 'monthly-usd';
UPDATE subscription_plans SET lemon_squeezy_variant_id = '<variant-id>' WHERE id = 'yearly-ils';
UPDATE subscription_plans SET lemon_squeezy_variant_id = '<variant-id>' WHERE id = 'yearly-usd';
```

Verify:

```sql
SELECT id, lemon_squeezy_variant_id FROM subscription_plans;
```

Expected: All four plan rows have non-NULL `lemon_squeezy_variant_id` values.

---

## 5. Test with Sandbox

1. In LS dashboard, open the webhook endpoint you created
2. Click **"Send test webhook"**
3. Select `subscription_created` event
4. Add custom data: `{"student_id": "<real-student-uuid>"}`
5. Send

Verify a row was created:

```sql
SELECT * FROM parent_subscriptions WHERE student_id = '<student-uuid>';
```

Expected: One row with `status = 'active'` (or `'on_trial'` depending on LS response).

---

## 6. Verify Idempotency

Send the same test webhook a second time with the same `ls_subscription_id`.
Verify only one row exists:

```sql
SELECT count(*) FROM parent_subscriptions WHERE ls_subscription_id = '<test-subscription-id>';
-- Expected: 1
```

The function uses `ON CONFLICT (ls_subscription_id) DO UPDATE` — duplicate events must not create duplicate rows.

---

## 7. Verify Signature Rejection

Send a request with an invalid signature to confirm the function rejects unsigned requests:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/lemon-squeezy-webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: invalid-signature" \
  -d '{"meta":{"event_name":"subscription_created"},"data":{}}'
```

Expected: HTTP 400 response. No row should be created in `parent_subscriptions`.

---

## Environment Separation

| Environment | Lemon Squeezy Keys | Secret Command |
|-------------|-------------------|----------------|
| Sandbox (dev) | LS sandbox keys | `supabase secrets set LS_SIGNING_SECRET=sandbox-secret` |
| Production | LS live keys | `supabase secrets set LS_SIGNING_SECRET=live-secret` |

Both environments use the same function code — only the signing secret differs.

To switch to production keys:

```bash
supabase secrets set LS_SIGNING_SECRET=your-live-signing-secret
supabase functions deploy lemon-squeezy-webhook --no-verify-jwt
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| HTTP 400 on all requests | `LS_SIGNING_SECRET` mismatch | Re-run `supabase secrets set` with correct value from LS dashboard |
| Function not found (404) | Function not deployed | Run `supabase functions deploy` |
| No row in `parent_subscriptions` after test | Missing `student_id` in custom data | Add `custom_data.student_id` in LS webhook test UI |
| Duplicate rows | Idempotency key not matching | Check `ls_subscription_id` in LS payload matches DB constraint |
| `subscription_updated` not updating status | Event not selected in LS | Re-check webhook event selection in LS dashboard |
