# 05 — Sandbox Runbook (D-10b)

Real Lemon Squeezy test-mode checkout, run in an environment that structurally
cannot reach production billing data. This is the second of the D-10 pair —
`05-webhook-replay.mjs` (D-10a) covers the branches Lemon Squeezy will not
produce on demand; this runbook proves the full LS → webhook → DB → UI loop
end to end, including `create-checkout` and `cancel-subscription` (SC-4).

Executed by plan 05-08, not here — this document and `05-sandbox-seed.sql` are
the finished, copy-pasteable artefacts plan 05-06 produces.

---

## 0. Preconditions

Confirm before starting (all recorded in `05-discovery.md`):

- `sandbox_target: throwaway-project` — Docker is unavailable locally, so the
  local `supabase start` + `supabase functions serve` path is the fallback
  only if Docker becomes available; the primary path is a second, disposable
  Supabase project (§5, Q2).
- `test_mode_variant_id: 861115` (product "App Payment") — confirmed live in
  the Lemon Squeezy dashboard in test mode (§3).
- `test_mode_signing_secret_available: yes`, `test_mode_api_key_available: yes`
  — both confirmed by the owner, values not disclosed in any planning doc.
  Set as environment variables only, **never written to a file**:
  ```bash
  export LS_API_KEY=<test-mode API key>
  export LS_STORE_ID=<the store id>
  export LS_SIGNING_SECRET=<test-mode signing secret>
  ```
- `test_mode_webhook_registration: pending_verification` (§3) — **re-verify
  before doing anything with the webhook registration.** If it turns out to be
  a single registration shared between Test and Live mode (not confirmed
  either way as of `05-discovery.md`), re-pointing it at a sandbox URL for
  this session will temporarily break the live webhook and must be restored
  immediately afterward — budget an explicit owner step for that restore if
  so.

---

## 1. Bring up the sandbox

Follow whichever path matches the confirmed `sandbox_target`.

### Path A — throwaway Supabase project (primary, since Docker is unavailable)

```bash
# Link the CLI to the throwaway project (NOT the production ref hdltcvgqrtxuxgjdvzzu):
npx supabase link --project-ref <throwaway-project-ref>

# Push every migration, including this phase's forward migration:
npx supabase db push

# Deploy all three Lemon Squeezy Edge Functions to the throwaway project:
npx supabase functions deploy lemon-squeezy-webhook --no-verify-jwt
npx supabase functions deploy create-checkout
npx supabase functions deploy cancel-subscription

# Set the test-mode secrets on the throwaway project (never the production ref):
npx supabase secrets set LS_API_KEY="$LS_API_KEY" LS_STORE_ID="$LS_STORE_ID" LS_SIGNING_SECRET="$LS_SIGNING_SECRET"
```

Then open the throwaway project's SQL Editor and run `05-sandbox-seed.sql`
(substitute the real sandbox auth uid from step 1 of that file before running
— see its own header comments for the Auth Admin API call, since a direct
`auth.users` insert does not work on a hosted project).

### Path B — local stack (fallback, only if Docker becomes available)

```bash
npx supabase start
npx supabase db reset   # applies every migration, including this phase's
psql "$(npx supabase status -o env | grep DB_URL | cut -d= -f2)" -f .planning/phases/05-subscription-re-pointing/05-sandbox-seed.sql

# Serve functions locally with test-mode secrets in an UNTRACKED local env file
# (never commit this file):
cat > .env.sandbox.local <<EOF
LS_API_KEY=$LS_API_KEY
LS_STORE_ID=$LS_STORE_ID
LS_SIGNING_SECRET=$LS_SIGNING_SECRET
EOF
npx supabase functions serve --env-file .env.sandbox.local
```

Either path: capture the resulting `WEBHOOK_URL` (throwaway project's
`https://<throwaway-ref>.supabase.co/functions/v1/lemon-squeezy-webhook`, or
`http://localhost:54321/functions/v1/lemon-squeezy-webhook` for the local
path) — needed in section 2.

---

## 2. Run the D-10(a) replay suite

Paste the `export REPLAY_...` lines printed by `05-sandbox-seed.sql`'s "IDs TO
EXPORT" query, then:

```bash
export WEBHOOK_URL=<from step 1>
# REPLAY_PARENT_ID, REPLAY_LINKED_CHILD_ID, REPLAY_ORPHAN_CHILD_ID already
# exported from the seed's output above.
node .planning/phases/05-subscription-re-pointing/05-webhook-replay.mjs
```

Then run the follow-up SQL the script prints against the sandbox database.
Expected result per branch:

| Branch | Expected |
|---|---|
| B1 | HTTP 200 `OK`; row with `parent_id = REPLAY_PARENT_ID`, `student_id` NULL |
| B2 | HTTP 200 `OK`; same row shape (legacy `student_id` = a `parents.id`) |
| B3 | HTTP 200 `OK`; row's `parent_id` = the linked child's `parent_id`, NOT the child id |
| B4 | HTTP 200 `OK`; row's `parent_id` = `REPLAY_PARENT_ID` (parent_id wins over student_id) |
| B5 | HTTP 200 `Unresolved parent — recorded for review`; new `unresolved_webhook_log` row |
| B6 | identical to B5 (orphan child has no parent to bill) |
| B7 | identical to B5 (empty `custom_data`) |
| B8 | HTTP 400 `Invalid signature`; NO new row in either table |
| B9 | HTTP 200 `Event not handled`; no row anywhere |
| B10 | both sends HTTP 200; parent now has 2 qualifying active rows |

Tick each branch PASS/FAIL against the actual DB state before proceeding.

---

## 3. Obtain a real JWT

`create-checkout` and `cancel-subscription` both have `verify_jwt = true`
(confirmed in `supabase/config.toml`), so an HMAC signature alone is not
enough — a real Supabase-issued JWT for the sandbox parent is required:

```bash
curl -s -X POST "$SB_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SB_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"sim-verify@example.invalid","password":"<sandbox-password>"}' | jq -r .access_token
```

Where `SB_URL` and `SB_ANON_KEY` are the sandbox project's (throwaway project
or local stack) values, never production's. Save the resulting token as
`$SANDBOX_JWT` for sections 4, 6, and 7.

---

## 4. create-checkout

Invoke with the JWT and the sandbox plan id from the seed's export block:

```bash
curl -s -X POST "$WEBHOOK_URL_BASE/functions/v1/create-checkout" \
  -H "Authorization: Bearer $SANDBOX_JWT" -H "Content-Type: application/json" \
  -d "{\"planId\":\"$SANDBOX_PLAN_ID\",\"studentId\":\"$REPLAY_PARENT_ID\"}"
```

Expected: `{ "checkoutUrl": "https://..." }`.

**Negative case (T-5-04 IDOR check):** re-run with a **different** `studentId`
(any other uuid, not the JWT's own `auth.uid()`):

```bash
curl -s -X POST "$WEBHOOK_URL_BASE/functions/v1/create-checkout" \
  -H "Authorization: Bearer $SANDBOX_JWT" -H "Content-Type: application/json" \
  -d "{\"planId\":\"$SANDBOX_PLAN_ID\",\"studentId\":\"00000000-0000-0000-0000-000000000fff\"}"
```

Expected: HTTP 403, `{ "error": "Forbidden: studentId does not match authenticated user" }`.

---

## 5. Complete a real test-mode checkout

Open the `checkoutUrl` returned by section 4's first (successful) call in a
browser. Pay with Lemon Squeezy's test-mode card `4242 4242 4242 4242` (any
future expiry, any CVC).

After completion, assert against the sandbox database:

```sql
SELECT ls_subscription_id, parent_id, student_id, status, plan_id, parent_email
FROM parent_subscriptions ORDER BY created_at DESC LIMIT 3;
```

Expected: a new row with a **non-null `parent_id` equal to the sandbox parent
uid** and a **NULL `student_id`** — this single row is the primary SC-4
evidence, proving the entire LS → webhook → resolve-chain → DB loop lands on
parent identity with no manual intervention.

Then load the app pointed at the sandbox (or query `fetchSubscriptionStatus`'s
underlying query directly against the sandbox parent id) and confirm premium
reads `true` — the UI half of the loop.

---

## 6. cancel-subscription (single active row)

```bash
curl -s -X POST "$WEBHOOK_URL_BASE/functions/v1/cancel-subscription" \
  -H "Authorization: Bearer $SANDBOX_JWT"
```

Expected: `{ "ok": true, "endsAt": "..." }`. After the resulting
`subscription_cancelled` webhook lands, confirm:

```sql
SELECT status FROM parent_subscriptions WHERE ls_subscription_id = '<from section 5>';
-- expect: cancelled
```

---

## 7. cancel-subscription (D-06 ambiguity)

Re-run replay branch B10 to give the sandbox parent a second active row:

```bash
node .planning/phases/05-subscription-re-pointing/05-webhook-replay.mjs --only=B10
```

Then invoke cancel again:

```bash
curl -s -X POST "$WEBHOOK_URL_BASE/functions/v1/cancel-subscription" \
  -H "Authorization: Bearer $SANDBOX_JWT"
```

Expected: **HTTP 409**, `{ "error": "Multiple active subscriptions found — cancellation needs manual review", "code": "AMBIGUOUS_ACTIVE_SUBSCRIPTIONS", "count": 2 }`, `CANCEL_AMBIGUOUS:` in the function logs, and — critically — **no** change in the Lemon Squeezy dashboard, proving no cancellation was attempted.

---

## 8. Evidence to capture

Checklist mapping each step to the line it contributes to `05-sandbox-log.md`
(authored by plan 05-08 when this runbook is actually executed):

| Step | Evidence | Contributes to |
|---|---|---|
| 2 | Per-branch PASS/FAIL table (B1–B10) | SC-3 (webhook resolve-chain + dead-letter) |
| 4 | `checkoutUrl` response + 403 IDOR negative case | T-5-04 |
| 5 | The `parent_id`-populated row + premium UI read | SC-4 (primary evidence) |
| 6 | `{ ok: true }` + `status = 'cancelled'` | D-06 happy path |
| 7 | HTTP 409 + `AMBIGUOUS_ACTIVE_SUBSCRIPTIONS` + unchanged LS dashboard | D-06 ambiguity path |

Per-branch PASS/FAIL column: tick off B1–B10 from section 2 alongside steps
4–7's individual pass/fail, then sign and date at the bottom of
`05-sandbox-log.md`.

---

## Cleanup

1. Run the seed's TEARDOWN block (uncomment the three `DELETE` statements at
   the bottom of `05-sandbox-seed.sql` and execute against the sandbox
   database — CASCADE removes the child_profiles and parent_subscriptions
   rows automatically via the `parents` FK).
2. `npx supabase stop` (local path) or delete the throwaway project entirely
   (Path A — the cleanest guarantee no sandbox data or secrets linger).
3. Cancel the test-mode subscription in the Lemon Squeezy dashboard if step 6
   did not already leave it cancelled.
4. If section 0's webhook-registration re-verification found a **shared**
   registration and it was re-pointed at the sandbox URL for this session,
   restore it to the production Edge Function URL now.
5. Confirm **zero** `sim_verify_%` rows and **zero** test-mode variant ids
   exist in production:

```sql
-- RUN THIS ONE AGAINST PRODUCTION as the final safety check:
SELECT COUNT(*) FROM parent_subscriptions WHERE ls_subscription_id LIKE 'sim_verify_%';   -- expect 0
SELECT id, name, lemon_squeezy_variant_id FROM subscription_plans;                        -- expect no sandbox variant id
```
