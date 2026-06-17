# Free "Full Version" (Comp) Access for Specific Accounts

How to give a chosen account (e.g. a student's parent) the **full subscription
experience for free**, without payment — and how to take it back.

## How it works (1-paragraph background)

The whole premium gate hinges on **one signal**: a row in the
`parent_subscriptions` table whose `status = 'active'`. The app reads the most
recent such row (`src/services/subscriptionService.js` → `fetchSubscriptionStatus`,
mirrored server-side by `public.has_active_subscription()`) and exposes
`useSubscription().isPremium`, which unlocks the trail and the rest of the paid
experience. `SubscriptionContext.jsx` listens via Supabase **Realtime**, so a
granted account unlocks **immediately, with no logout**.

A "comp" grant simply inserts an `active` row tagged with a synthetic
`ls_subscription_id = 'comp_<uid>'` so it (a) never collides with a real Lemon
Squeezy subscription, (b) is idempotent if you grant the same person twice, and
(c) is easy to find/list. Two SQL helper functions wrap this:
`grant_comp_access(email)` and `revoke_comp_access(email)`.

The function definitions live in the repo at
`supabase/migrations/20260617000001_comp_access_functions.sql`.

---

## One-time setup (do this once, ever)

The two helper functions must exist in the database before you can call them.
They're created by the migration above. Either:

- **If you run migrations** (`supabase db push`) — they get created automatically.
- **Or paste them manually** — open the Supabase dashboard → **SQL Editor** →
  **New query**, paste the entire contents of
  `supabase/migrations/20260617000001_comp_access_functions.sql`, and click **Run**.
  Success = "Success. No rows returned."

> ⚠️ One-time check before first use: confirm the `parent_subscriptions` columns
> match. In the SQL Editor run:
>
> ```sql
> select column_name from information_schema.columns
> where table_schema='public' and table_name='parent_subscriptions';
> ```
>
> You should see `student_id`, `ls_subscription_id`, `status`,
> `current_period_end`, `parent_email`, `plan_id`. If any name differs, the
> INSERT column list in the migration needs adjusting.

---

## Grant access to a parent (the everyday command)

In the Supabase dashboard → **SQL Editor** → **New query**, run (use the email
they **log into the app** with):

```sql
select grant_comp_access('parent@example.com');
```

- ✅ `Comp access GRANTED to … (uid …)` → done, account is full-version now.
- ❌ `NO USER FOUND for …` → email isn't registered / is misspelled. Fix and retry.

Several at once:

```sql
select grant_comp_access('mom1@example.com');
select grant_comp_access('dad2@example.com');
```

Re-running for the same email is safe (it just refreshes the existing grant).

## List everyone who has free access

```sql
select parent_email, status, current_period_end
from parent_subscriptions
where ls_subscription_id like 'comp_%';
```

## Revoke access

```sql
select revoke_comp_access('parent@example.com');
```

Only removes the comp row — a real paid subscription (if any) is left untouched.

---

## Notes

- **Security:** `grant_comp_access` / `revoke_comp_access` have `EXECUTE` revoked
  from `anon`/`authenticated`, so only the SQL Editor / service role can run them.
  A logged-in app user cannot comp themselves.
- **No app code change** is involved — this is purely a database operation.
- **`current_period_end`** is set far in the future (`2999-12-31`) so the grant
  never expires and reads as "premium" everywhere, including the parent portal.
