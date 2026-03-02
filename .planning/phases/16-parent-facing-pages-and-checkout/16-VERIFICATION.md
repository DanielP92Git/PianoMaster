---
phase: 16-parent-facing-pages-and-checkout
verified: 2026-03-01T18:00:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Parent visits /subscribe, sees prices in ILS (Hebrew browser) vs USD (English browser)"
    expected: "Monthly and yearly plan cards appear with correct currency amounts and 'Best Value' badge on yearly"
    why_human: "Currency detection relies on navigator.language which cannot be simulated by grep; requires a real browser with locale set to he or en"
  - test: "Clicking a plan card opens the Lemon Squeezy overlay inside the PWA (no navigation away)"
    expected: "LS overlay appears in-app after create-checkout Edge Function returns a checkoutUrl; LemonSqueezy.Url.Open fires without opening a new browser tab"
    why_human: "Requires real LS API keys configured in Supabase secrets and a valid lemon_squeezy_variant_id in subscription_plans — integration cannot be verified statically"
  - test: "After test checkout, /subscribe/success polls and eventually shows 'Premium Unlocked!'"
    expected: "Spinner appears while polling (up to 10s), then confirmed state with green CheckCircle and 'Start Learning' button; or 'Payment Received!' if webhook is slow"
    why_human: "Requires end-to-end webhook delivery from LS to the Supabase Edge Function — cannot verify without live environment"
  - test: "From /parent-portal, click 'Cancel Subscription' and confirm in the dialog"
    expected: "Dialog states 'You'll keep full access until [date]', cancel succeeds without leaving the PWA, portal then shows 'Cancelled' badge and access end date"
    why_human: "Requires an active subscription row in parent_subscriptions and real LS credentials for cancel-subscription Edge Function call"
  - test: "After cancellation, child (student) retains premium access until the billing period end date"
    expected: "isPremium remains true in SubscriptionContext because fetchSubscriptionStatus handles status='cancelled' + current_period_end in future"
    why_human: "Requires a real subscription row with status='cancelled' and a future current_period_end to confirm the DB-side grace period logic fires"
---

# Phase 16: Parent-Facing Pages and Checkout Verification Report

**Phase Goal:** A parent can view pricing in their local currency, initiate checkout via the payment processor without leaving the PWA, confirm activation, and cancel within the app
**Verified:** 2026-03-01T18:00:00Z
**Status:** human_needed — all automated checks passed; 5 items require live environment testing
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A parent visiting `/subscribe` sees prices in ILS or USD based on their account association | VERIFIED | `SubscribePage.jsx` line 29: `navigator.language?.startsWith("he") ? "ILS" : "USD"`. Plans fetched via `fetchSubscriptionPlans(currency)` from `subscription_plans` table. Yearly card has amber border, "Best Value" badge, savings %, and per-month equivalent. |
| 2 | Clicking a plan opens the payment processor's checkout — payment completes without leaving the PWA | VERIFIED | `handlePlanClick` invokes `create-checkout` Edge Function via `supabase.functions.invoke`. On success: `window.LemonSqueezy.Url.Open(data.checkoutUrl)` opens the overlay in-app. Fallback to `window.open` only if overlay not ready. `create-checkout/index.ts` sets `embed: true` and `student_id` in `checkout_data.custom`. |
| 3 | After checkout, the success page confirms subscription activation (polls up to 10 seconds for webhook) | VERIFIED | `SubscribeSuccessPage.jsx` runs a `setInterval` at 1000ms, up to 10 attempts, calling `queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] })`. Three display states: isPolling (spinner), isConfirmed (green CheckCircle + "Premium Unlocked!"), isPending (timeout, "Payment Received!"). |
| 4 | A parent can cancel from `/parent-portal` without leaving the PWA | VERIFIED | `ParentPortalPage.jsx`: cancel button triggers in-app confirmation dialog. `handleCancel` calls `supabase.functions.invoke('cancel-subscription')`. `cancel-subscription/index.ts` calls `DELETE https://api.lemonsqueezy.com/v1/subscriptions/:id`. Optimistic state displayed immediately without navigation. |
| 5 | After cancellation, the child retains access until the current billing period ends | VERIFIED | `fetchSubscriptionStatus` in `subscriptionService.js` lines 36-38: `if (status === "cancelled" && current_period_end && current_period_end > now) { return { isPremium: true }; }`. Additionally, `cancel-subscription` returns `endsAt` for UI display (line 133: fallback to `subscription.current_period_end`). ParentPortalPage shows "Access Until [date]" when cancelled. |

**Score:** 5/5 truths verified (automated checks) — live environment testing required for end-to-end confirmation

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/create-checkout/index.ts` | Server-side LS checkout URL creation | VERIFIED | 181 lines. Verifies JWT via `auth.getUser()`, validates `studentId === auth.uid()`, looks up `lemon_squeezy_variant_id` from `subscription_plans`, calls `POST https://api.lemonsqueezy.com/v1/checkouts` with `embed: true` and `student_id` in `checkout_data.custom`, returns `{ checkoutUrl }`. |
| `supabase/functions/cancel-subscription/index.ts` | Server-side LS subscription cancellation | VERIFIED | 142 lines. Verifies JWT, reads `ls_subscription_id` from `parent_subscriptions` via service role, calls `DELETE https://api.lemonsqueezy.com/v1/subscriptions/:id`, returns `{ ok: true, endsAt }` with fallback to `current_period_end`. |
| `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` | plan_id population from ls_variant_id | VERIFIED | Resolves Phase 13 TODO. Lines 26-30: queries `subscription_plans` by `lemon_squeezy_variant_id`, uses `plan?.id ?? null` in upsert. |
| `src/services/subscriptionService.js` | fetchSubscriptionPlans and fetchSubscriptionDetail functions | VERIFIED | `fetchSubscriptionPlans(currency)` queries `subscription_plans` by currency and `is_active`. `fetchSubscriptionDetail(studentId)` queries `parent_subscriptions` then conditionally fetches plan details. Both are substantive (not stubs). |
| `src/pages/SubscribePage.jsx` | Pricing page with plan cards and LS overlay checkout | VERIFIED | 323 lines. Currency detection, `useQuery` for plans, Lemon.js loading with StrictMode guard, `handlePlanClick` wired to `create-checkout`, savings calculation, feature checklist, glass card design, RTL support. |
| `src/pages/SubscribeSuccessPage.jsx` | Post-checkout confirmation with polling | VERIFIED | 134 lines. `setInterval` polling via `invalidateQueries`, three display states (isPolling/isConfirmed/isPending), glass card layout. |
| `src/pages/ParentPortalPage.jsx` | Subscription management page with cancel flow | VERIFIED | 324 lines. `fetchSubscriptionDetail` via `useQuery`, StatusBadge component, cancel confirmation dialog, `handleCancel` calling `cancel-subscription`, optimistic state, re-subscribe CTA. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `supabase/functions/create-checkout/index.ts` | Lemon Squeezy API POST /v1/checkouts | `fetch` with Bearer LS_API_KEY | WIRED | Line 125: `fetch('https://api.lemonsqueezy.com/v1/checkouts', ...)` with Authorization header. |
| `supabase/functions/cancel-subscription/index.ts` | Lemon Squeezy API DELETE /v1/subscriptions/:id | `fetch` with Bearer LS_API_KEY | WIRED | Lines 105-115: `fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscription.ls_subscription_id}`, { method: 'DELETE' })`. |
| `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` | `subscription_plans` table | SELECT id WHERE lemon_squeezy_variant_id | WIRED | Lines 26-30: `.from('subscription_plans').select('id').eq('lemon_squeezy_variant_id', payload.ls_variant_id).maybeSingle()`. |
| `src/pages/SubscribePage.jsx` | `supabase/functions/create-checkout` | `supabase.functions.invoke('create-checkout')` | WIRED | Lines 115-119: `supabase.functions.invoke("create-checkout", { body: { planId: plan.id, studentId: user.id } })`. |
| `src/pages/SubscribePage.jsx` | `window.LemonSqueezy.Url.Open` | Lemon.js overlay | WIRED | Line 127: `window.LemonSqueezy.Url.Open(data.checkoutUrl)` with fallback to `window.open`. |
| `src/pages/SubscribeSuccessPage.jsx` | `useSubscription()` | isPremium polling via query invalidation | WIRED | Lines 41-42: `queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] })` in 1-second interval. |
| `src/App.jsx` | `src/pages/SubscribePage.jsx` | React Router Route | WIRED | Lines 15, 306: import and `<Route path="/subscribe" element={<SubscribePage />} />` inside ProtectedRoute > AppLayout. |
| `src/App.jsx` | `src/pages/SubscribeSuccessPage.jsx` | React Router Route | WIRED | Lines 16, 307: import and `<Route path="/subscribe/success" element={<SubscribeSuccessPage />} />`. |
| `src/App.jsx` | `src/pages/ParentPortalPage.jsx` | React Router Route | WIRED | Lines 17, 308: import and `<Route path="/parent-portal" element={<ParentPortalPage />} />`. |
| `src/pages/ParentPortalPage.jsx` | `supabase/functions/cancel-subscription` | `supabase.functions.invoke('cancel-subscription')` | WIRED | Line 137: `supabase.functions.invoke('cancel-subscription')` (no body — JWT provides student ID). |
| `src/pages/ParentPortalPage.jsx` | `src/services/subscriptionService.js` | `fetchSubscriptionDetail()` | WIRED | Lines 25, 101: imported and used in `useQuery({ queryFn: () => fetchSubscriptionDetail(user?.id) })`. |
| `src/components/trail/TrailNodeModal.jsx` | `/subscribe` | `useNavigate()` on button click | WIRED | Line 439: `onClick={() => { onClose(); navigate('/subscribe'); }}` on "Ask a parent to unlock!" amber button. |
| `src/pages/AppSettings.jsx` | `/parent-portal` or `/subscribe` | Link component | WIRED | Lines 191, 201: `to="/parent-portal"` (premium) and `to="/subscribe"` (free), both confirmed present. |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| PARENT-01 | 16-02, 16-03 | Pricing page displays monthly and yearly plans with prices in user's currency (ILS or USD) | SATISFIED | `SubscribePage.jsx` detects `navigator.language` for currency; `fetchSubscriptionPlans(currency)` returns DB-seeded ILS/USD plans; Intl.NumberFormat formats amounts. ParentPortalPage also shows formatted plan price. |
| PARENT-02 | 16-01, 16-02 | Parent can initiate checkout via the selected payment processor from the pricing page | SATISFIED | `create-checkout` Edge Function creates signed LS checkout URL server-side. `handlePlanClick` opens LS overlay via `LemonSqueezy.Url.Open`. `embed: true` keeps checkout in-PWA. |
| PARENT-03 | 16-02 | Success page confirms subscription activation after webhook processes the payment | SATISFIED | `SubscribeSuccessPage.jsx` polls `isPremium` via React Query invalidation for up to 10 seconds. Shows "Premium Unlocked!" when confirmed, "Payment Received!" on timeout. |
| PARENT-04 | 16-01, 16-03 | Parent can cancel subscription from within the app without leaving to an external portal | SATISFIED | `cancel-subscription` Edge Function calls LS API server-side. `ParentPortalPage` confirmation dialog cancels without any navigation away from the PWA. |
| PARENT-05 | 16-01, 16-03 | Cancellation preserves full access until current billing period ends (no immediate revocation) | SATISFIED | `fetchSubscriptionStatus` grace period logic (lines 36-38 of subscriptionService.js). `cancel-subscription` returns `endsAt` for UI display. ParentPortalPage shows "Access Until [date]" for cancelled status. DB-side: `has_active_subscription()` Postgres function handles `cancelled + current_period_end > NOW()`. |

**Orphaned requirements:** None — all 5 PARENT requirements claimed across plans are accounted for. The active REQUIREMENTS.md (`/planning/REQUIREMENTS.md`) tracks v1.7 mic requirements, not PARENT IDs; the correct tracking file is `.planning/milestones/v1.8-REQUIREMENTS.md` which maps all 5 PARENT requirements to Phase 16.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/pages/SubscribeSuccessPage.jsx` | 127 | Hardcoded English string: "This may take a few seconds…" | Info | Minor i18n gap — the loading subtext is not in the translation files. Does not block functionality; only affects Hebrew users who will see English text in one line of the loading state. |

No blocker anti-patterns found. No TODOs, FIXMEs, or stub implementations detected in any of the 7 artifacts.

---

## Commit Verification

All 6 task commits confirmed in git history:

| Commit | Description |
|--------|-------------|
| `d996c7c` | feat(16-01): create create-checkout and cancel-subscription Edge Functions |
| `e703941` | feat(16-01): resolve plan_id TODO and extend subscriptionService |
| `adb90c1` | feat(16-02): build SubscribePage with Lemon Squeezy overlay checkout |
| `d5d447e` | feat(16-02): build SubscribeSuccessPage and wire /subscribe routes in App.jsx |
| `f42cac9` | feat(16-03): add ParentPortalPage with cancel flow and /parent-portal route |
| `ab12f53` | feat(16-03): add paywall upgrade button to TrailNodeModal and Subscription section to AppSettings |

---

## Human Verification Required

### 1. Currency-Detected Pricing Display

**Test:** Open `/subscribe` in a browser with language set to Hebrew (he-IL), then again with English (en-US)
**Expected:** ILS prices (₪) appear for Hebrew locale; USD prices ($) appear for English locale. Two plan cards with monthly and yearly options. Yearly card has amber border and "Best Value" badge.
**Why human:** `navigator.language` cannot be simulated statically; requires real browser locale switching.

### 2. Lemon Squeezy Overlay Checkout (In-PWA)

**Test:** With LS API keys configured (`LS_API_KEY`, `LS_STORE_ID` set as Supabase secrets, `lemon_squeezy_variant_id` populated in `subscription_plans`), click a plan card
**Expected:** LS checkout overlay appears inside the PWA without navigating to a new tab or page. Payment can be completed within the overlay.
**Why human:** Requires real Lemon Squeezy credentials and a configured Supabase environment; the `lemon_squeezy_variant_id` values in `subscription_plans` must be populated first.

### 3. Success Page Activation Polling

**Test:** Complete a test checkout through the LS overlay. Observe `/subscribe/success`.
**Expected:** Spinner shows while polling (up to 10 seconds). When webhook delivers and `isPremium` becomes true, the page transitions to "Premium Unlocked!" with a green CheckCircle and "Start Learning" button navigating to `/trail`. If webhook is delayed beyond 10s, shows "Payment Received!" with a "Go to Dashboard" button.
**Why human:** Requires end-to-end webhook delivery from LS → Supabase webhook Edge Function → database → React Query cache invalidation.

### 4. In-App Cancellation Flow

**Test:** With an active subscription, navigate to `/parent-portal`. Click "Cancel Subscription".
**Expected:** Confirmation dialog appears (still on the same page — no navigation). Dialog text states "You'll keep full access until [formatted date]". Click "Yes, Cancel". Portal immediately shows "Cancelled" amber badge and "Access until [date]" section with "Re-subscribe" button. No page navigation occurs during the entire flow.
**Why human:** Requires a real `parent_subscriptions` row with an active subscription and `ls_subscription_id` value, plus LS API credentials.

### 5. Post-Cancellation Access Grace Period

**Test:** After cancellation (status = 'cancelled' in `parent_subscriptions`), verify the student's trail nodes remain accessible until `current_period_end`.
**Expected:** `useSubscription()` still returns `isPremium: true`. Trail premium nodes remain accessible. Access revoked only after `current_period_end` passes.
**Why human:** Requires a DB row with `status = 'cancelled'` and a future `current_period_end` date to confirm the grace period logic in `fetchSubscriptionStatus` fires correctly.

---

## Notes for Environment Setup

Before human verification tests can run, the following must be completed (documented in 16-01-SUMMARY.md):

1. **Set Supabase secrets:**
   ```bash
   supabase secrets set LS_API_KEY=your_ls_api_key_here
   supabase secrets set LS_STORE_ID=your_ls_store_id_here
   ```
2. **Populate variant IDs in `subscription_plans` table:**
   ```sql
   UPDATE subscription_plans SET lemon_squeezy_variant_id = '<monthly-ils-variant-id>' WHERE id = 'monthly-ils';
   UPDATE subscription_plans SET lemon_squeezy_variant_id = '<yearly-ils-variant-id>' WHERE id = 'yearly-ils';
   UPDATE subscription_plans SET lemon_squeezy_variant_id = '<monthly-usd-variant-id>' WHERE id = 'monthly-usd';
   UPDATE subscription_plans SET lemon_squeezy_variant_id = '<yearly-usd-variant-id>' WHERE id = 'yearly-usd';
   ```

---

_Verified: 2026-03-01T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
