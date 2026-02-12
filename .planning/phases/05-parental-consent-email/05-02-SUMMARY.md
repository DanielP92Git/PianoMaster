---
phase: 05-parental-consent-email
plan: 02
subsystem: email-client-integration
tags: [supabase-functions, brevo, maybeSingle, consent-flow, session-management]

# Dependency graph
requires:
  - phase: 05-01
    provides: Edge Function for sending consent emails via Brevo API
provides:
  - Client integration calling Edge Function for consent email delivery
  - Fixed 406 errors by using .maybeSingle() instead of .single()
  - Enhanced error handling for consent verification page
  - Session conflict resolution for new user signup
affects: [consent-flow, auth-flow, signup-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase.functions.invoke, .maybeSingle() for optional queries, signOut before signUp]

key-files:
  created: []
  modified:
    - src/services/consentService.js
    - src/services/apiAuth.js
    - src/pages/ConsentVerifyPage.jsx
    - src/App.jsx
    - src/features/authentication/useSignup.js
    - src/services/authorizationUtils.js
    - supabase/functions/send-consent-email/index.ts
    - supabase/functions/.env.example

key-decisions:
  - "Switch from Resend to Brevo for email delivery (Resend free tier domain limitation)"
  - "Use .maybeSingle() instead of .single() to prevent 406 errors on optional queries"
  - "Add signOut before signUp to prevent session conflicts from previous users"
  - "Bypass suspension checks for /consent/verify route so parents can complete verification"

patterns-established:
  - "Edge Function invocation via supabase.functions.invoke() for transactional emails"
  - "Query invalidation after auth state changes to ensure fresh data"
  - "Public route exemptions in AuthenticatedWrapper for consent flows"

# Metrics
duration: ~2 hours (including debugging and provider switch)
completed: 2026-02-02
---

# Phase 05 Plan 02: Client Integration and Bug Fixes

**Wire up Edge Function, fix 406 errors, and complete COPPA consent flow end-to-end**

## Performance

- **Duration:** ~2 hours
- **Started:** 2026-02-02
- **Completed:** 2026-02-02
- **Tasks:** 4/4 (3 auto + 1 checkpoint)
- **Files modified:** 8

## Accomplishments

- Integrated Edge Function with consentService.js using supabase.functions.invoke()
- Fixed 406 errors by changing .single() to .maybeSingle() in apiAuth.js role detection
- Enhanced ConsentVerifyPage with specific error messages for expired/invalid/network errors
- Switched email provider from Resend to Brevo (300 emails/day free tier)
- Fixed CORS preflight by returning explicit 200 status for OPTIONS requests
- Fixed consent verify page not rendering by bypassing suspension checks for public routes
- Fixed session conflicts by adding signOut before signUp and query invalidation after

## Task Commits

1. **Task 1: Edge Function integration** - `e69f477` (feat)
2. **Task 2: Fix 406 errors** - `32ff751` (fix)
3. **Task 3: Enhanced error handling** - `534d26e` (feat)
4. **Bug fixes during verification:**
   - CORS preflight fix - `ab1d9c6` (fix)
   - Configurable sender email - `141897a` (fix)
   - Switch to Brevo - `3a7452e` (feat)
   - Consent verify page bypass - `d6d71a7` (fix)
   - Session conflict resolution - `30a8fe3` (fix)

## Files Modified

- `src/services/consentService.js` - Added supabase.functions.invoke() for email delivery
- `src/services/apiAuth.js` - Changed .single() to .maybeSingle() for role detection
- `src/pages/ConsentVerifyPage.jsx` - Enhanced error handling with specific messages
- `src/App.jsx` - Added public route bypass for /consent/verify in AuthenticatedWrapper
- `src/features/authentication/useSignup.js` - Added signOut before signUp, query invalidation
- `src/services/authorizationUtils.js` - Changed .single() to .maybeSingle() for teacher connection check
- `supabase/functions/send-consent-email/index.ts` - Switched from Resend to Brevo API
- `supabase/functions/.env.example` - Updated for Brevo environment variables

## Decisions Made

**1. Switch from Resend to Brevo**
- **Rationale:** Resend free tier only allows one verified domain; project needed different domain than existing project
- **Impact:** Brevo offers 300 emails/day free tier with multiple domains

**2. Use .maybeSingle() for optional queries**
- **Rationale:** .single() throws 406 error when no rows found; role detection should handle missing records gracefully
- **Impact:** Eliminated console errors during auth flow

**3. SignOut before SignUp**
- **Rationale:** Previous user's session can persist after new user signup, causing authorization mismatches
- **Impact:** Clean session state for new users, consent pending screen shows correctly

**4. Public route bypass in AuthenticatedWrapper**
- **Rationale:** Parents clicking consent verify link were seeing "Almost there!" instead of verification result
- **Impact:** Consent verification page renders correctly regardless of child's account status

## Issues Encountered

1. **CORS preflight failing** - OPTIONS response needed explicit `status: 200`
2. **Resend domain limitation** - Required switch to Brevo
3. **Consent page not rendering** - AuthenticatedWrapper was intercepting before page could render
4. **Session conflicts** - Previous user's session persisted after new signup

All issues were resolved during the human verification checkpoint.

## User Setup Required

**External services require manual configuration:**

1. **Brevo Account:**
   - Create account at https://app.brevo.com
   - Get API key from Settings > API Keys
   - Verify sender email at Settings > Senders

2. **Supabase Secrets:**
   ```bash
   npx supabase secrets set BREVO_API_KEY=xkeysib-xxx
   npx supabase secrets set SENDER_EMAIL=noreply@yourdomain.com
   ```

3. **Deploy Edge Function:**
   ```bash
   npx supabase functions deploy send-consent-email
   ```

## Phase Readiness

**Phase 05 complete.** All requirements met:
- EMAIL-01: Edge Function sends consent verification email via Brevo API
- EMAIL-02: Email contains child-friendly branding and clear CTA
- EMAIL-03: Consent URL works end-to-end (verify -> activate account)
- FIX-01: No 406 errors during role detection
- FIX-02: Resend button works, expired/invalid tokens show helpful messages

---
*Phase: 05-parental-consent-email*
*Completed: 2026-02-02*
