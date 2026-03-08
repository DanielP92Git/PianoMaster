# Phase 16: Parent-Facing Pages and Checkout - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

A parent can view pricing in their local currency, initiate checkout via the payment processor without leaving the PWA, confirm subscription activation, and cancel within the app. Cancellation preserves access until the current billing period ends.

Three new routes: `/subscribe` (pricing page), `/subscribe/success` (activation confirmation), `/parent-portal` (subscription management + cancellation).

</domain>

<decisions>
## Implementation Decisions

### Pricing page layout
- Side-by-side glass cards for monthly and yearly plans
- Yearly card gets a "Best Value" badge/highlight with savings percentage
- Show equivalent monthly price on the yearly card (e.g., "20.83/mo")
- Feature checklist below plan cards: all 93 nodes, boss challenges, future content, no ads
- Page requires authentication (no public pricing page)

### Currency detection
- Auto-detect from browser locale (he/he-IL = ILS, everything else = USD)
- No manual currency switcher — keep it simple
- Prices formatted with currency symbol (29.90 ILS or $7.99 USD)

### Checkout integration
- Lemon Squeezy overlay mode (JS SDK) — parent stays in the PWA
- Pass authenticated student_id as custom checkout data for webhook auto-linking
- After overlay closes/completes, navigate to `/subscribe/success`

### Success confirmation
- Dedicated `/subscribe/success` page
- Poll subscription status for up to 10 seconds (matches success criteria)
- On confirmation within 10s: show "Premium Unlocked!" with "Start Learning" button
- On timeout (>10s): show "Payment received! Your subscription is being activated." with "Go to Dashboard" button — Realtime subscription will auto-update when webhook fires

### Parent portal
- Simple subscription status glass card at `/parent-portal`
- Shows: plan name, billing period, status, next renewal date
- "Cancel Subscription" button with confirmation dialog
- Confirmation dialog shows: "You'll keep full access until [end date]"
- After cancellation: card updates to show "Cancelled" status, access end date, and "Re-subscribe" button

### Cancellation architecture
- Client calls a Supabase Edge Function (server-side)
- Edge Function makes the Lemon Squeezy API call to cancel (API key stays server-side)
- Webhook fires back to update parent_subscriptions status
- Matches the secure webhook pattern from Phase 13

### Entry points and navigation
- Primary: paywall modal on premium-locked trail nodes gets "Ask a parent to unlock!" button -> navigates to /subscribe
- Secondary: Settings page gets a "Subscription" section with "Manage Subscription" button -> /parent-portal (if subscribed) or /subscribe (if not)
- No sidebar additions — keep navigation clean

### Route access model
- Both child and parent see /subscribe and /parent-portal (one shared account)
- Flow: child hits paywall -> taps upgrade -> hands phone to parent -> parent completes checkout
- No separate parent authentication required

### Language and tone
- Paywall modal: child-friendly language ("Ask a parent to unlock!")
- Pricing page: parent-appropriate language ("Unlock Full Access", "Choose your plan")
- COPPA-conscious: child is not making the purchase decision

### Internationalization
- Full i18n support — all text uses translation keys
- Hebrew (RTL) layout supported on all new pages
- Currency display respects locale (ILS for Hebrew users)

### Claude's Discretion
- Exact glass card styling and spacing
- Loading states and skeleton screens
- Error handling for failed checkout / Edge Function calls
- Re-subscribe flow details (redirect to /subscribe or direct re-activation)
- Mobile responsive layout for plan cards (stack vertically on small screens)

</decisions>

<specifics>
## Specific Ideas

- Plan cards should match the existing glass card design system (bg-white/10, backdrop-blur-md, border-white/20)
- Yearly card should have a visually distinct highlight (e.g., brighter border, badge) to nudge toward higher LTV
- Success page should feel celebratory — the parent just made a purchase for their child
- Cancel flow should be respectful and simple — no dark patterns or multi-step retention flows
- "Ask a parent to unlock!" wording on the paywall makes it clear the child shouldn't attempt to pay

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SubscriptionContext` + `useSubscription()`: Already provides `isPremium` globally — success page and portal can use this
- `subscriptionService.js` / `fetchSubscriptionStatus()`: Premium status logic with grace periods already implemented
- `subscriptionConfig.js`: Free tier boundary and `isFreeNode()` — used by paywall display
- `TrailNode.jsx` + `TrailNodeModal.jsx`: Already have `isPremiumLocked` state and paywall message UI — need to add the upgrade button
- Glass card pattern: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg` used across Settings, Dashboard, Achievements
- `subscription_plans` table: 4 plans seeded (monthly-ils, monthly-usd, yearly-ils, yearly-usd) with `amount_cents`
- `parent_subscriptions` table: Ready with status, current_period_end, ls_subscription_id columns
- Supabase Realtime channel in SubscriptionContext: Auto-invalidates on parent_subscriptions changes

### Established Patterns
- React Query with staleTime: 0 for subscription data (SVC-02)
- Supabase Realtime for push-based invalidation (SVC-03)
- i18next with `useTranslation()` hook, namespaced translation files in `src/locales/`
- Protected routes via `ProtectedRoute` component in App.jsx
- Edge Functions for server-side operations (existing pattern from webhook)

### Integration Points
- `App.jsx`: Add three new routes (/subscribe, /subscribe/success, /parent-portal) inside ProtectedRoute
- `TrailNodeModal.jsx`: Add "Ask a parent to unlock!" button to paywall section, navigating to /subscribe
- `AppSettings.jsx`: Add Subscription section with link to /parent-portal or /subscribe
- `subscription_plans.lemon_squeezy_variant_id`: Currently NULL — must be populated with real Lemon Squeezy variant IDs for checkout to work
- Edge Function: New `cancel-subscription` function needed for server-side Lemon Squeezy API call

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-parent-facing-pages-and-checkout*
*Context gathered: 2026-03-01*
