# Phase 16: Parent-Facing Pages and Checkout - Research

**Researched:** 2026-03-01
**Domain:** Lemon Squeezy Checkout Overlay + Supabase Edge Functions + React routing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Pricing page layout:** Side-by-side glass cards for monthly and yearly plans. Yearly card gets "Best Value" badge with savings percentage and equivalent monthly price. Feature checklist below cards. Requires authentication.
- **Currency detection:** Auto-detect from browser locale (he/he-IL = ILS, everything else = USD). No manual switcher. Prices formatted with symbol.
- **Checkout integration:** Lemon Squeezy overlay mode (JS SDK). Pass authenticated student_id as custom checkout data for webhook auto-linking. After overlay closes/completes, navigate to `/subscribe/success`.
- **Success confirmation:** Poll subscription status for up to 10 seconds. On confirmation: "Premium Unlocked!" + "Start Learning" button. On timeout: "Payment received! Activating..." + "Go to Dashboard" button.
- **Parent portal:** Glass card at `/parent-portal` showing plan name, billing period, status, next renewal date. "Cancel Subscription" button with confirmation dialog showing "You'll keep full access until [end date]". After cancellation: shows "Cancelled" status, access end date, "Re-subscribe" button.
- **Cancellation architecture:** Client calls a Supabase Edge Function (server-side). Edge Function makes Lemon Squeezy API call to cancel. Webhook fires back to update `parent_subscriptions`. Matches Phase 13 pattern.
- **Entry points:** Paywall modal "Ask a parent to unlock!" button → `/subscribe`. Settings page Subscription section → `/parent-portal` (if subscribed) or `/subscribe` (if not).
- **No sidebar additions.**
- **Route access model:** Both child and parent see `/subscribe` and `/parent-portal` (one shared account). No separate parent authentication.
- **Language and tone:** Paywall modal = child-friendly. Pricing page = parent-appropriate. COPPA-conscious.
- **i18n:** Full i18n support with translation keys. Hebrew (RTL) layout. Currency display respects locale.

### Claude's Discretion

- Exact glass card styling and spacing
- Loading states and skeleton screens
- Error handling for failed checkout / Edge Function calls
- Re-subscribe flow details (redirect to /subscribe or direct re-activation)
- Mobile responsive layout for plan cards (stack vertically on small screens)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PARENT-01 | A parent visiting `/subscribe` sees prices in ILS or USD based on their account association | Browser locale detection (`navigator.language`); `subscription_plans` table has both ILS and USD rows; amounts in `amount_cents` |
| PARENT-02 | Clicking a plan opens the payment processor's checkout — payment completes without leaving the PWA | Lemon Squeezy overlay via `LemonSqueezy.Url.Open(url)` after server-side checkout URL creation; `checkout_options.embed: true` |
| PARENT-03 | After checkout, the success page confirms subscription activation (polls up to 10 seconds for webhook) | `useSubscription()` hook + polling pattern; Realtime channel already in `SubscriptionContext` for push invalidation |
| PARENT-04 | A parent can cancel from `/parent-portal` without leaving the PWA | `cancel-subscription` Edge Function calling `DELETE /v1/subscriptions/:id`; confirmation dialog in-app |
| PARENT-05 | After cancellation, the child retains access until the current billing period ends | `has_active_subscription()` Postgres function already handles `status='cancelled' AND current_period_end > NOW()` |

</phase_requirements>

---

## Summary

Phase 16 delivers the full monetization front end: three new authenticated routes (`/subscribe`, `/subscribe/success`, `/parent-portal`) and the entry-point wiring into `TrailNodeModal` and `AppSettings`. The technical surface divides into four areas: (1) Lemon Squeezy JS overlay integration, (2) a new `create-checkout` Edge Function that creates a signed checkout URL server-side and returns it to the client, (3) a new `cancel-subscription` Edge Function, and (4) React UI for the three pages.

The overlay checkout approach means the LS JS SDK (`lemon.js`) must be loaded on the `/subscribe` page, a checkout URL fetched from a Supabase Edge Function, and then `window.LemonSqueezy.Url.Open(url)` called to open the overlay. On `Checkout.Success` event the app navigates to `/subscribe/success`, which polls `SubscriptionContext` (already backed by Supabase Realtime) for up to 10 seconds.

All prerequisite infrastructure is already in place: `subscription_plans` table (4 rows seeded, `amount_cents` available), `parent_subscriptions` table with all needed columns, `SubscriptionProvider`/`useSubscription()` hook providing `isPremium` globally, `parent_subscriptions_select_own` RLS policy (student can read own row), `subscription_plans_select_public` RLS policy (public read), `has_active_subscription()` Postgres function already implementing grace periods for cancelled status, and the Phase 13 webhook Edge Function already writing to `parent_subscriptions`. The only missing piece is populating `lemon_squeezy_variant_id` on `subscription_plans` rows (currently NULL) — this is a pre-flight step that requires the user to add real LS variant IDs before checkout works end-to-end.

**Primary recommendation:** Build the `create-checkout` Edge Function first (server-side LS API call returns URL), then wire the Lemon.js overlay into `/subscribe`, then success polling, then cancellation, then entry points. The `upsertSubscription` webhook lib already has a comment noting `plan_id: null — Phase 16 will map ls_variant_id → plan_id`; update `upsertSubscription.ts` to populate `plan_id` from the variant ID map as part of this phase.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Lemon.js (CDN) | latest | Overlay checkout, events | Official LS SDK; only way to get overlay mode |
| Supabase Edge Functions (Deno) | existing | `create-checkout` + `cancel-subscription` server-side API calls | API key never leaves server; matches Phase 13 pattern |
| React + React Router v7 | existing | Three new page routes | Already used throughout |
| TanStack React Query v5 | existing | `subscription_plans` fetch, subscription status polling | Already in `SubscriptionContext` |
| i18next | existing | Translation keys for all new pages | Required by locked decisions |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useSubscription()` | internal | `isPremium`, `isLoading` from `SubscriptionContext` | Success page polling, parent portal status |
| `react-hot-toast` | existing | Error toasts on Edge Function failure | Already used globally |
| Lucide React | existing | Icons (Sparkles, CreditCard, Shield, etc.) | Match existing icon library |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server-side checkout URL creation | Client-side direct to LS | API key would be exposed in browser; rejected |
| Polling `useSubscription` for success | Dedicated Realtime subscription | `SubscriptionContext` already has Realtime; polling adds timeout UX on top |
| Lemon.js CDN script | LS npm package | CDN is the documented pattern; npm package requires build step for Deno |

**Installation:**
```bash
# No npm install needed — Lemon.js loads via CDN in useEffect:
# <script src="https://app.lemonsqueezy.com/js/lemon.js" defer></script>
# OR dynamically in React component
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── pages/
│   ├── SubscribePage.jsx          # /subscribe — pricing page with LS overlay trigger
│   ├── SubscribeSuccessPage.jsx   # /subscribe/success — polls for activation
│   └── ParentPortalPage.jsx       # /parent-portal — subscription management + cancel
├── services/
│   └── subscriptionService.js     # Add: fetchSubscriptionPlans(), fetchSubscriptionDetail()
└── locales/
    ├── en/common.json             # Add: subscribe.* and parentPortal.* keys
    └── he/common.json             # Hebrew equivalents

supabase/functions/
├── create-checkout/
│   └── index.ts                   # POST → returns { checkoutUrl }
└── cancel-subscription/
    └── index.ts                   # POST → calls DELETE /v1/subscriptions/:id
```

### Pattern 1: Lemon.js Overlay in React

**What:** Dynamically load Lemon.js CDN script in a `useEffect`, call `window.createLemonSqueezy()`, then `window.LemonSqueezy.Setup({ eventHandler })` to wire event listeners. Open overlay with `window.LemonSqueezy.Url.Open(checkoutUrl)`.

**When to use:** On the `/subscribe` page when user clicks a plan card.

**Example (verified from official docs):**
```javascript
// Source: https://docs.lemonsqueezy.com/help/lemonjs/using-with-frameworks-libraries

useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
  script.defer = true;
  script.onload = () => {
    window.createLemonSqueezy?.();
    window.LemonSqueezy.Setup({
      eventHandler: (event) => {
        if (event.event === 'Checkout.Success') {
          // Navigate to success page
          navigate('/subscribe/success');
        }
      }
    });
  };
  document.body.appendChild(script);
  return () => document.body.removeChild(script);
}, [navigate]);

// Open overlay programmatically:
window.LemonSqueezy.Url.Open(checkoutUrl);
```

**Lemon.js event types (verified):**
- `Checkout.Success` — checkout completed; `event.data` contains Order object
- `PaymentMethodUpdate.Mounted` / `.Closed` / `.Updated` — payment method overlay only

**Note:** There is NO `Checkout.Closed` event documented. Overlay dismissal without purchase has no event to intercept. This means the "after overlay closes, navigate to success" behavior must be triggered only on `Checkout.Success`, not on overlay dismiss.

### Pattern 2: Server-Side Checkout URL Creation (Edge Function)

**What:** Client calls `create-checkout` Edge Function with `{ variantId, studentId }`. Edge Function calls LS API `POST /v1/checkouts` with `checkout_options.embed: true` and `checkout_data.custom.student_id`. Returns `{ checkoutUrl }` to client.

**When to use:** When user clicks a plan card on `/subscribe`.

**Edge Function structure:**
```typescript
// supabase/functions/create-checkout/index.ts
// verify_jwt = true (user must be authenticated)

Deno.serve(async (req) => {
  // 1. Verify JWT (Supabase auto-injects via verify_jwt = true)
  // 2. Extract variantId + studentId from request body
  // 3. Verify studentId matches auth.uid() from JWT (defense in depth)
  // 4. Call POST https://api.lemonsqueezy.com/v1/checkouts
  //    with LS_API_KEY from env
  // 5. Return { checkoutUrl: data.attributes.url }
});
```

**LS Checkout API body (verified from official docs):**
```json
{
  "data": {
    "type": "checkouts",
    "attributes": {
      "checkout_options": {
        "embed": true
      },
      "checkout_data": {
        "custom": {
          "student_id": "<uuid>"
        }
      }
    },
    "relationships": {
      "store": { "data": { "type": "stores", "id": "<LS_STORE_ID>" } },
      "variant": { "data": { "type": "variants", "id": "<variantId>" } }
    }
  }
}
```

**Required env vars for `create-checkout`:**
- `LS_API_KEY` — Lemon Squeezy API key (already used pattern from Phase 13 `LS_SIGNING_SECRET`)
- `LS_STORE_ID` — Lemon Squeezy store ID (new; needed for checkout creation)

### Pattern 3: Cancellation Edge Function

**What:** Client calls `cancel-subscription` Edge Function. Edge Function reads `ls_subscription_id` from `parent_subscriptions` (using student's auth.uid()) and calls `DELETE /v1/subscriptions/:id` on LS API.

**When to use:** When parent confirms cancellation in `/parent-portal`.

**LS Cancel API (verified from official docs):**
```
DELETE https://api.lemonsqueezy.com/v1/subscriptions/{ls_subscription_id}
Authorization: Bearer {LS_API_KEY}
Accept: application/vnd.api+json
Content-Type: application/vnd.api+json
```

Response: subscription object with `status: "cancelled"`, `cancelled: true`, `ends_at` timestamp.

After the DELETE call, LS fires a `subscription_cancelled` webhook which the Phase 13 Edge Function already handles — it upserts `status: 'cancelled'` into `parent_subscriptions`. The Realtime channel in `SubscriptionContext` auto-invalidates the React Query cache.

**Edge Function structure:**
```typescript
// supabase/functions/cancel-subscription/index.ts
// verify_jwt = true

Deno.serve(async (req) => {
  // 1. Get auth.uid() from JWT header
  // 2. Fetch ls_subscription_id from parent_subscriptions WHERE student_id = auth.uid()
  //    (uses service role client OR anon client with RLS — parent_subscriptions_select_own policy exists)
  // 3. Call DELETE https://api.lemonsqueezy.com/v1/subscriptions/{ls_subscription_id}
  // 4. Return { ok: true } — UI updates via webhook → Realtime
});
```

### Pattern 4: Success Page Polling

**What:** On `/subscribe/success`, poll `isPremium` from `useSubscription()` every 1 second for up to 10 seconds. Show spinner with "Confirming your subscription..." text. On `isPremium === true`: show success state. On timeout: show fallback state.

**Implementation note:** `useSubscription()` already has `staleTime: 0` and Supabase Realtime push invalidation. The polling interval is a belt-and-suspenders fallback. Use `queryClient.invalidateQueries({ queryKey: ['subscription', userId] })` on interval to force refetches.

```javascript
useEffect(() => {
  if (isPremium) return; // Already confirmed

  let attempts = 0;
  const MAX_ATTEMPTS = 10;

  const interval = setInterval(() => {
    attempts++;
    queryClient.invalidateQueries({ queryKey: ['subscription', userId] });

    if (attempts >= MAX_ATTEMPTS) {
      clearInterval(interval);
      setTimedOut(true);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [isPremium, userId, queryClient]);
```

### Pattern 5: Currency/Locale Detection

**What:** Detect `navigator.language` on page load. Hebrew locale (`he` or `he-IL`) → ILS plans. Everything else → USD plans.

```javascript
const currency = navigator.language?.startsWith('he') ? 'ILS' : 'USD';
// Filter subscription_plans: WHERE currency = currency AND is_active = true
// Plans already seeded: monthly-ils (29.90 ILS), yearly-ils (249.90 ILS),
//                       monthly-usd ($7.99), yearly-usd ($79.90)
```

**Yearly savings calculation:**
```javascript
// ILS: Monthly = 29.90, Yearly = 249.90/12 = 20.83/mo → saves ~30%
// USD: Monthly = $7.99, Yearly = $79.90/12 = $6.66/mo → saves ~17%
const monthlyEquivalent = (yearlyPlan.amount_cents / 100 / 12).toFixed(2);
const savingsPct = Math.round((1 - monthlyEquivalent / (monthlyPlan.amount_cents / 100)) * 100);
```

### Pattern 6: Settings Entry Point

**What:** Add a "Subscription" `SettingsSection` to `AppSettings.jsx`. Uses `useSubscription()` to branch: subscribed → "Manage Subscription" Link to `/parent-portal`; unsubscribed → "Unlock Full Access" Link to `/subscribe`.

Follows exact `SettingsSection` pattern already used for Install, Profile, Accessibility, Notifications, Audio sections.

### Pattern 7: TrailNodeModal Upgrade Button

**What:** The paywall section in `TrailNodeModal.jsx` (lines 418-426) currently shows a static amber message. Replace the `gotIt` close button with two buttons: "Got it" (close) + "Ask a parent to unlock!" (navigate to `/subscribe`).

```javascript
// TrailNodeModal.jsx — isPremiumLocked action buttons (line 430-434)
// Current: single "Got it" button
// New:
<button onClick={onClose}>Got it</button>
<button onClick={() => { onClose(); navigate('/subscribe'); }}>
  {t('trail:modal.button.askParent')}
</button>
```

### Pattern 8: plan_id Population in upsertSubscription

**What:** `upsertSubscription.ts` currently sets `plan_id: null`. This phase must populate it. Map `ls_variant_id` to `plan_id` using the `subscription_plans` table (query by `lemon_squeezy_variant_id`).

**Update `upsertSubscription.ts`:**
```typescript
// Look up plan_id from variant_id
const { data: plan } = await supabase
  .from('subscription_plans')
  .select('id')
  .eq('lemon_squeezy_variant_id', payload.ls_variant_id)
  .maybeSingle();

// Use plan.id if found, null if not (defensive)
plan_id: plan?.id ?? null,
```

**Note:** `subscription_plans.lemon_squeezy_variant_id` is currently NULL for all 4 rows. The user must populate these with real LS variant IDs via a migration or manual update before checkout works end-to-end. This is a pre-flight data step, not a code step.

### Anti-Patterns to Avoid

- **Calling LS API from browser:** API key exposed. Always go through Edge Function.
- **Trusting `studentId` from request body without JWT verification:** IDOR vulnerability. Edge Function must verify `auth.uid() === studentId`.
- **Polling with `setInterval` without cleanup:** Leads to stale closures and memory leaks. Always `clearInterval` in `useEffect` cleanup.
- **Caching checkout URLs:** Checkout URLs from LS are signed and expire. Never cache or reuse.
- **Showing plan prices from hardcoded constants:** Fetch from `subscription_plans` table so price changes don't require code deploys.
- **Using `window.LemonSqueezy` before script loads:** Always gate calls behind `script.onload`. Race condition if called immediately.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Overlay checkout UI | Custom iframe/modal | `LemonSqueezy.Url.Open()` | LS handles PCI compliance, SCA, mobile keyboard |
| Subscription status grace periods | Custom date math | `has_active_subscription()` Postgres function | Already implemented with correct grace period logic |
| Subscription status push | Polling on interval | Supabase Realtime (already in `SubscriptionContext`) | Already wired; Realtime fires when webhook updates `parent_subscriptions` |
| Currency formatting | `toFixed(2) + ' ILS'` | Intl.NumberFormat | Handles locale-specific separators, symbol position |
| HMAC signature verification | Custom crypto | Existing `verifySignature.ts` in webhook function | Already audited and deployed |

**Key insight:** The payment infrastructure is almost entirely built. Phase 16 is primarily UI assembly + two new Edge Functions.

---

## Common Pitfalls

### Pitfall 1: `lemon_squeezy_variant_id` is NULL in production

**What goes wrong:** Checkout creation succeeds technically but LS returns an error about unknown variant, or the webhook arrives with an `ls_variant_id` that maps to no `plan_id`.

**Why it happens:** The `subscription_plans` table was seeded with placeholder rows; `lemon_squeezy_variant_id` is `NULL` for all 4 plans. Without real variant IDs, the `create-checkout` Edge Function cannot pass a valid `variant_id` to LS API.

**How to avoid:** Pre-flight step before any E2E testing: log into Lemon Squeezy dashboard, find variant IDs for each plan, populate via migration:
```sql
UPDATE subscription_plans SET lemon_squeezy_variant_id = '<id>' WHERE id = 'monthly-ils';
-- etc.
```

**Warning signs:** `create-checkout` Edge Function returns LS API 422 error; webhook `ls_variant_id` field doesn't match any `subscription_plans` row.

### Pitfall 2: `LS_STORE_ID` env var not set on Edge Function

**What goes wrong:** `create-checkout` Edge Function crashes with `Cannot read property of undefined` when building the LS API request body.

**Why it happens:** Unlike `LS_SIGNING_SECRET` (needed for Phase 13 webhook), `LS_STORE_ID` is a new env var. Supabase Edge Function env vars must be set via CLI or dashboard.

**How to avoid:** Add `LS_STORE_ID` and `LS_API_KEY` to the Edge Function environment before deployment. Also add to `supabase/functions/.env.example`.

**Warning signs:** Edge Function logs show undefined in the relationships.store.data.id field.

### Pitfall 3: `Checkout.Success` event fires but Realtime hasn't updated yet

**What goes wrong:** Success page shows "Activating..." spinner even after checkout completes, because the webhook hasn't fired yet (LS webhooks can be delayed 1-5 seconds).

**Why it happens:** Browser-side `Checkout.Success` fires immediately when payment succeeds, but the LS webhook → Edge Function → `parent_subscriptions` → Realtime chain has latency.

**How to avoid:** This is expected behavior. The 10-second polling loop on `/subscribe/success` is specifically designed to handle this. The fallback message is the UX safety net. Do not assume `isPremium === true` immediately after `Checkout.Success`.

### Pitfall 4: Lemon.js script loaded multiple times

**What goes wrong:** `window.LemonSqueezy.Setup()` called multiple times, duplicate event handlers fire, `Checkout.Success` navigates to success page twice.

**Why it happens:** React StrictMode double-invokes effects in development. Script appended to body twice.

**How to avoid:** Check `window.LemonSqueezy` before Setup; guard with a ref:
```javascript
const lemonSetupRef = useRef(false);
if (!lemonSetupRef.current) {
  window.LemonSqueezy.Setup({ eventHandler });
  lemonSetupRef.current = true;
}
```
Also check `document.querySelector('script[src*="lemon.js"]')` before appending.

### Pitfall 5: Cancel-then-immediate-access-loss perception

**What goes wrong:** After cancellation, the UI immediately shows "no subscription" state because React Query re-fetches and `status === 'cancelled'` before the webhook has updated `current_period_end`.

**Why it happens:** The LS DELETE response doesn't trigger `SubscriptionContext` — only the webhook does. If cancel-subscription Edge Function returns before webhook fires, `fetchSubscriptionStatus` may temporarily see no row.

**How to avoid:** After cancellation, optimistically update UI to show "Cancelled — access until [end date]" rather than immediately re-fetching. The Realtime channel will correct the state when the webhook arrives. Alternatively, return `ends_at` from the cancel Edge Function (it's in the DELETE response) and display it immediately.

### Pitfall 6: RTL layout breaks plan card side-by-side

**What goes wrong:** Hebrew layout shows plan cards stacked or with reversed hierarchy (yearly on left instead of right in RTL).

**Why it happens:** Flexbox direction reversal in RTL can invert visual order of cards.

**How to avoid:** Use `dir={isRTL ? 'rtl' : 'ltr'}` on the page wrapper (existing pattern). Test with Hebrew language selected. The "Best Value" badge on the yearly card should remain visually prominent regardless of RTL direction.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Lemon.js Script Loading + Setup (React)
```javascript
// Source: https://docs.lemonsqueezy.com/help/lemonjs/using-with-frameworks-libraries
// Pattern used in SubscribePage.jsx

const lemonSetupRef = useRef(false);

useEffect(() => {
  // Guard: don't append if already loaded
  if (document.querySelector('script[src*="lemon.js"]')) {
    if (window.LemonSqueezy && !lemonSetupRef.current) {
      setupLemon();
    }
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
  script.defer = true;
  script.onload = () => {
    window.createLemonSqueezy?.();
    setupLemon();
  };
  document.body.appendChild(script);

  return () => {
    // Only remove if we added it
    if (document.body.contains(script)) {
      document.body.removeChild(script);
    }
  };
}, [navigate]);

function setupLemon() {
  if (lemonSetupRef.current) return;
  lemonSetupRef.current = true;
  window.LemonSqueezy.Setup({
    eventHandler: (event) => {
      if (event.event === 'Checkout.Success') {
        navigate('/subscribe/success');
      }
    }
  });
}
```

### Opening Overlay After Fetching URL
```javascript
// Source: https://docs.lemonsqueezy.com/help/lemonjs/opening-overlays (confirmed)
const handlePlanClick = async (planId) => {
  setIsLoading(true);
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { planId, studentId: user.id }
    });
    if (error) throw error;
    window.LemonSqueezy.Url.Open(data.checkoutUrl);
  } catch (err) {
    toast.error(t('subscribe.checkoutError'));
  } finally {
    setIsLoading(false);
  }
};
```

### create-checkout Edge Function (Deno)
```typescript
// Source: https://docs.lemonsqueezy.com/api/checkouts/create-checkout (verified)
// supabase/functions/create-checkout/index.ts
// verify_jwt: true in config.toml

const LS_API_KEY = Deno.env.get('LS_API_KEY')!;
const LS_STORE_ID = Deno.env.get('LS_STORE_ID')!;

const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
  method: 'POST',
  headers: {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${LS_API_KEY}`,
  },
  body: JSON.stringify({
    data: {
      type: 'checkouts',
      attributes: {
        checkout_options: { embed: true },
        checkout_data: {
          custom: { student_id: studentId }
        }
      },
      relationships: {
        store: { data: { type: 'stores', id: LS_STORE_ID } },
        variant: { data: { type: 'variants', id: variantId } }
      }
    }
  })
});

const json = await response.json();
const checkoutUrl = json?.data?.attributes?.url;
return new Response(JSON.stringify({ checkoutUrl }), {
  headers: { 'Content-Type': 'application/json' }
});
```

### cancel-subscription Edge Function (Deno)
```typescript
// Source: https://docs.lemonsqueezy.com/api/subscriptions/cancel-subscription (verified)
// supabase/functions/cancel-subscription/index.ts
// verify_jwt: true

// Get ls_subscription_id for the authenticated student
const { data: sub } = await supabase
  .from('parent_subscriptions')
  .select('ls_subscription_id, current_period_end')
  .eq('student_id', studentId)
  .maybeSingle();

const response = await fetch(
  `https://api.lemonsqueezy.com/v1/subscriptions/${sub.ls_subscription_id}`,
  {
    method: 'DELETE',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${LS_API_KEY}`,
    }
  }
);

// Response contains ends_at — return to client for optimistic UI
const json = await response.json();
const endsAt = json?.data?.attributes?.ends_at;
return new Response(JSON.stringify({ ok: true, endsAt }), { ... });
```

### Subscription Plans Fetch
```javascript
// Fetch from subscription_plans table (RLS: subscription_plans_select_public = true)
const { data: plans } = await supabase
  .from('subscription_plans')
  .select('id, billing_period, currency, amount_cents, lemon_squeezy_variant_id')
  .eq('currency', currency)  // 'ILS' or 'USD'
  .eq('is_active', true)
  .order('billing_period');  // 'monthly' before 'yearly'
```

### fetchSubscriptionDetail (new service function)
```javascript
// Add to subscriptionService.js — for parent portal display
export async function fetchSubscriptionDetail(studentId) {
  if (!studentId) return null;
  const { data, error } = await supabase
    .from('parent_subscriptions')
    .select('status, current_period_end, plan_id, ls_subscription_id')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
```

### Price Formatting with Intl.NumberFormat
```javascript
// Don't hand-roll — use Intl
const formatPrice = (amountCents, currency) => {
  return new Intl.NumberFormat(
    currency === 'ILS' ? 'he-IL' : 'en-US',
    { style: 'currency', currency, minimumFractionDigits: 2 }
  ).format(amountCents / 100);
  // ILS → "₪29.90", USD → "$7.99"
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redirect to hosted checkout page | Lemon.js overlay mode (`embed: true`) | LS v2 overlay feature | User never leaves PWA |
| `plan_id: null` in webhook upsert | Map `ls_variant_id → plan_id` via DB lookup | Phase 16 (this phase) | Parent portal can display plan name |
| Client-side LS API calls | Server-side Edge Function | Security requirement | API key never exposed to browser |

**Deprecated/outdated:**
- `plan_id: null` comment in `upsertSubscription.ts`: explicitly marked for Phase 16 resolution; must be updated as part of this phase.

---

## Open Questions

1. **LS Store ID and Variant IDs**
   - What we know: `subscription_plans.lemon_squeezy_variant_id` is NULL for all 4 rows; `LS_STORE_ID` not yet in Edge Function env
   - What's unclear: Whether user has a LS account with products/variants created, or whether this is still placeholder infra
   - Recommendation: Surface as a pre-flight requirement at the start of Plan 01. The planner should add a task: "Populate `lemon_squeezy_variant_id` in `subscription_plans` with real LS variant IDs" as a prerequisite. In the meantime, use mock/placeholder variant IDs for structural wiring, with a clear TODO comment.

2. **`LS_API_KEY` env var**
   - What we know: Phase 13 uses `LS_SIGNING_SECRET` for webhook verification. `LS_API_KEY` (for outbound API calls) has not been added to Edge Function env yet.
   - What's unclear: Whether the same key serves both signing and API access, or if LS uses separate keys for each purpose.
   - Recommendation: In LS, the API key and webhook signing secret are separate. `LS_API_KEY` is found in LS Dashboard → API → API Keys. Add to Supabase project secrets alongside `LS_SIGNING_SECRET`.

3. **Re-subscribe flow**
   - What we know: After cancellation, portal shows "Re-subscribe" button. CONTEXT.md defers flow details to Claude's discretion.
   - What's unclear: Whether re-subscribe should navigate to `/subscribe` (new checkout) or directly re-activate the cancelled subscription via LS API.
   - Recommendation: Navigate to `/subscribe` (simplest; new checkout covers all cases including plan changes). Re-activation via LS API (`PATCH /v1/subscriptions/:id` with `cancelled: false`) is possible but adds complexity without user benefit at this stage.

4. **Overlay closes without purchase**
   - What we know: Lemon.js has no `Checkout.Closed` or `Checkout.Dismissed` event documented.
   - What's unclear: Whether there's an undocumented event for overlay dismissal without payment.
   - Recommendation: Do nothing on overlay dismiss (parent just closed without buying). The user remains on `/subscribe`. No navigation, no error. This is the correct UX — the parent can try again or close.

---

## Existing Codebase Integration Map

### Files to Modify (not create)

| File | What to Add |
|------|-------------|
| `src/App.jsx` | Three new `<Route>` entries inside existing `ProtectedRoute > AppLayout` block |
| `src/components/trail/TrailNodeModal.jsx` | Replace single "Got it" button with "Got it" + "Ask a parent to unlock!" in `isPremiumLocked` action block (lines 430-434) |
| `src/pages/AppSettings.jsx` | Add `SettingsSection` for Subscription between existing sections; use `useSubscription()` to branch link destination |
| `src/services/subscriptionService.js` | Add `fetchSubscriptionPlans(currency)` and `fetchSubscriptionDetail(studentId)` |
| `src/locales/en/common.json` | Add `subscribe.*` and `parentPortal.*` translation namespaces |
| `src/locales/he/common.json` | Hebrew equivalents |
| `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` | Add `plan_id` lookup from `subscription_plans` by `ls_variant_id` (replace `plan_id: null`) |
| `supabase/functions/.env.example` | Add `LS_API_KEY` and `LS_STORE_ID` |

### Files to Create (new)

| File | Purpose |
|------|---------|
| `src/pages/SubscribePage.jsx` | `/subscribe` pricing page |
| `src/pages/SubscribeSuccessPage.jsx` | `/subscribe/success` activation confirmation |
| `src/pages/ParentPortalPage.jsx` | `/parent-portal` subscription management |
| `supabase/functions/create-checkout/index.ts` | Server-side LS checkout URL creation |
| `supabase/functions/cancel-subscription/index.ts` | Server-side LS cancellation |

### Existing Infrastructure Confirmed Ready

| Asset | Status | Notes |
|-------|--------|-------|
| `subscription_plans` table | Ready | 4 rows seeded; `lemon_squeezy_variant_id` NULL (needs population) |
| `parent_subscriptions` table | Ready | All columns present: `status`, `current_period_end`, `plan_id`, `ls_subscription_id` |
| `subscription_plans_select_public` RLS | Ready | `USING (true)` — any authenticated (or anon) user can read plans |
| `parent_subscriptions_select_own` RLS | Ready | `student_id = auth.uid()` — student reads own row |
| `has_active_subscription()` | Ready | Handles `cancelled + current_period_end > NOW()` grace period (PARENT-05 satisfied at DB layer) |
| `SubscriptionProvider` / `useSubscription()` | Ready | `isPremium`, `isLoading` available globally; Realtime push invalidation wired |
| `fetchSubscriptionStatus()` in `subscriptionService.js` | Ready | Already implements grace period logic in JS |
| Lemon Squeezy webhook Edge Function | Ready | Handles `subscription_cancelled` event; will update `status` after cancel |
| `TrailNodeModal.jsx` `isPremiumLocked` branch | Partial | Paywall UI exists; needs upgrade button added |
| i18n infrastructure | Ready | `useTranslation`, `src/locales/en/common.json`, `src/locales/he/common.json` |

---

## Sources

### Primary (HIGH confidence)
- Official LS docs: https://docs.lemonsqueezy.com/help/lemonjs/handling-events — Event types and `LemonSqueezy.Setup()` syntax
- Official LS docs: https://docs.lemonsqueezy.com/help/lemonjs/using-with-frameworks-libraries — React dynamic script loading pattern
- Official LS docs: https://docs.lemonsqueezy.com/api/checkouts/create-checkout — Checkout API body structure with `embed: true` and `checkout_data.custom`
- Official LS docs: https://docs.lemonsqueezy.com/api/subscriptions/cancel-subscription — DELETE endpoint, headers, response shape
- Supabase MCP: `parent_subscriptions` schema, `subscription_plans` data (all 4 rows), RLS policies confirmed
- Supabase MCP: `has_active_subscription()` and `is_free_node()` function bodies confirmed in DB
- Existing codebase: `SubscriptionContext.jsx`, `subscriptionService.js`, `TrailNodeModal.jsx`, `AppSettings.jsx`, `App.jsx`, `upsertSubscription.ts` all read directly

### Secondary (MEDIUM confidence)
- WebSearch: Lemon.js CDN URL `https://app.lemonsqueezy.com/js/lemon.js` — confirmed from multiple community references and official guide links
- `window.createLemonSqueezy()` — documented in framework guide; needed for SPA scenarios where Lemon.js loads after DOM elements

### Tertiary (LOW confidence)
- Behavior of overlay on dismiss (no `Checkout.Closed` event) — not explicitly documented; inferred from the fact that only 4 events are listed and none is a dismiss/close for checkout

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are either existing project deps or verified from official LS docs
- Architecture: HIGH — existing patterns (Edge Functions, SubscriptionContext, React Query) all confirmed in codebase; LS API shapes verified from official docs
- Pitfalls: HIGH — variant ID null issue confirmed from DB query; Lemon.js double-setup is a known React StrictMode issue; other pitfalls derived from the confirmed architecture

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (Lemon Squeezy API is stable; Lemon.js changes infrequently)
