# Deploy Sequencing Guide

Describes the correct deploy order for PianoMaster app changes across Supabase and Netlify.

If the JS deploy references a database column, function, or RLS policy that doesn't exist yet, users will see runtime errors. Always run migrations before deploying frontend code.

---

## 1. Deploy Order

Follow this sequence for every release that spans database, Edge Functions, and frontend:

### Step 1: Run Supabase Migrations

Apply SQL migrations from `supabase/migrations/` before anything else.

**Option A — CLI (recommended):**

```bash
supabase db push
```

**Option B — Dashboard:**

Open the Supabase Dashboard SQL Editor and paste migration SQL manually.

New RLS policies, Postgres functions (e.g., `is_free_node()`, `has_active_subscription()`, `award_xp()`), schema changes, and seed data must be live before the JavaScript code that depends on them ships.

### Step 2: Deploy Edge Functions

Deploy changed Edge Functions after migrations are applied (some functions reference new tables or columns).

```bash
npx supabase functions deploy <function-name>
```

All 10 Edge Functions in this project:

| Function | JWT Verify | Notes |
|----------|-----------|-------|
| `cancel-subscription` | Yes | Cancels subscription via Lemon Squeezy API |
| `create-checkout` | Yes | Creates Lemon Squeezy checkout URL |
| `lemon-squeezy-webhook` | **No** (`--no-verify-jwt`) | Webhook callbacks don't carry user JWT |
| `process-account-deletions` | Yes | Scheduled account deletion processing |
| `send-consent-email` | Yes | COPPA parent consent email |
| `send-daily-push` | Yes | Cron-triggered daily practice reminder |
| `send-feedback` | Yes | User feedback submission |
| `send-weekly-report` | Yes | Cron-triggered weekly parent email |
| `unsubscribe-weekly-report` | Yes | HMAC-signed unsubscribe handler |
| `verify-consent` | Yes | Parent email verification |

Only `lemon-squeezy-webhook` requires `--no-verify-jwt`:

```bash
npx supabase functions deploy lemon-squeezy-webhook --no-verify-jwt
```

### Step 3: Push to Main Branch

Pushing to `main` triggers Netlify auto-build:

1. Netlify runs `npm run build` (configured in `netlify.toml`).
2. The prebuild hook runs `scripts/validateTrail.mjs` — build fails if trail data has errors.
3. Netlify publishes the `dist/` directory.

### Step 4: Verify

1. Check the Netlify deploy log for build errors.
2. Visit `https://my-pianomaster.netlify.app` and confirm new features work.
3. Spot-check that new database-dependent features load correctly (e.g., trail nodes, subscription status).
4. Check Sentry for new errors in the minutes after deploy.

---

## 2. Rollback

### Netlify (Frontend)

- **One-click:** Open Netlify Dashboard > Deploys tab > click a previous successful deploy > "Publish deploy".
- **Git revert:** Run `git revert <commit>` and push to `main`. Netlify rebuilds automatically.

### Supabase Migrations (Database)

Migrations are **forward-only**. To undo a migration:

1. Write a new migration that reverses the change (e.g., `DROP COLUMN`, `DROP FUNCTION`, `DROP POLICY`).
2. Apply via `supabase db push` or the SQL Editor.
3. Never delete migration files from `supabase/migrations/`.

### Edge Functions

Redeploy the previous version from git history:

```bash
git checkout <commit> -- supabase/functions/<function-name>
npx supabase functions deploy <function-name>
```

Then restore your working tree:

```bash
git checkout HEAD -- supabase/functions/<function-name>
```

### Service Worker Cache

Bump `CACHE_NAME` in `public/sw.js` (currently `pianomaster-v9`) to force clients to refresh their cached assets. Users get the new service worker on their next visit because `sw.js` is served with `max-age=0, must-revalidate` (configured in `netlify.toml`).

---

## 3. Environment Variables

> **No secret values in this document.** Only variable names are listed. Actual values are stored in Netlify and Supabase dashboards.

### Netlify (Build-time)

These are injected at build time via Vite's `import.meta.env`:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_VAPID_PUBLIC_KEY` | Web Push VAPID public key |
| `VITE_SITE_URL` | App URL (`https://my-pianomaster.netlify.app`) |
| `SENTRY_DSN` | Sentry error tracking DSN (build plugin) |
| `VITE_SENTRY_DSN` | Sentry DSN exposed to client |

Set via: Netlify Dashboard > Site Settings > Environment Variables.

### Supabase Edge Functions (Runtime secrets)

| Secret | Used by |
|--------|---------|
| `CRON_SECRET` | `send-daily-push`, `send-weekly-report` (cron auth) |
| `VAPID_PUBLIC_KEY` | `send-daily-push` (Web Push) |
| `VAPID_PRIVATE_KEY` | `send-daily-push` (Web Push signing) |
| `VAPID_SUBJECT` | `send-daily-push` (Web Push contact) |
| `BREVO_API_KEY` | `send-weekly-report`, `send-consent-email` (email API) |
| `SENDER_EMAIL` | `send-weekly-report`, `send-consent-email` |
| `SENDER_NAME` | `send-weekly-report`, `send-consent-email` |
| `WEEKLY_REPORT_HMAC_SECRET` | `unsubscribe-weekly-report` (signed unsubscribe links) |
| `LS_SIGNING_SECRET` | `lemon-squeezy-webhook` (webhook signature verification) |

Set via:

```bash
supabase secrets set KEY=value
```

Verify:

```bash
supabase secrets list
```

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the Supabase runtime. Do not set these manually.

---

## 4. Edge Function Deploy

### Prerequisites

Link the Supabase CLI to your project (one-time setup):

```bash
supabase link --project-ref <your-project-ref>
```

### Deploy a Single Function

```bash
npx supabase functions deploy <function-name>
```

Example:

```bash
npx supabase functions deploy send-daily-push
```

### Deploy All Functions

```bash
npx supabase functions deploy
```

This deploys all functions found in `supabase/functions/`.

### Verify Deployment

```bash
npx supabase functions list
```

Check that the function appears with a recent deployment timestamp.

### JWT Verification

All functions verify JWT by default. Only `lemon-squeezy-webhook` uses `--no-verify-jwt` because webhook callbacks from Lemon Squeezy don't carry a user JWT — they authenticate via HMAC signature instead.

```bash
npx supabase functions deploy lemon-squeezy-webhook --no-verify-jwt
```

### Secrets Management

Set secrets:

```bash
supabase secrets set CRON_SECRET=value VAPID_PUBLIC_KEY=value
```

List secrets (names only):

```bash
supabase secrets list
```

Remove a secret:

```bash
supabase secrets unset SECRET_NAME
```

### Cross-Reference

For Lemon Squeezy webhook-specific deploy steps (signing secret setup, webhook URL registration, sandbox testing, idempotency verification), see `docs/DEPLOY.md`.
