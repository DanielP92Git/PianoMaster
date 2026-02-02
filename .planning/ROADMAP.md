# Roadmap: PianoApp v1.1

**Milestone:** v1.1 Parental Consent Email Service
**Created:** 2026-02-02
**Phases:** 1 (continues from v1.0 Phase 4 -> v1.1 Phase 5)

## Overview

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 5 | Parental Consent Email | Enable working parental consent emails so under-13 children can complete COPPA-required consent flow | EMAIL-01, EMAIL-02, EMAIL-03, FIX-01, FIX-02 | Complete |

## Phase 5: Parental Consent Email

**Goal:** Enable working parental consent emails so under-13 children can complete COPPA-required consent flow.

**Plans:** 2 plans

Plans:
- [x] 05-01-PLAN.md - Create Edge Function with Resend API and email template
- [x] 05-02-PLAN.md - Client integration, 406 fix, and error handling

**Requirements covered:**
- EMAIL-01: Edge Function sends consent verification email via Resend API
- EMAIL-02: Email contains child-friendly branding and clear CTA for parent
- EMAIL-03: Consent URL in email works end-to-end (verify -> activate account)
- FIX-01: Eliminate 406 console errors during role detection
- FIX-02: Handle edge cases (resend, expired tokens, invalid links)

**Success criteria:**
1. Parent receives email within 30 seconds of child signup/resend request
2. Email displays correctly in Gmail, Outlook, Apple Mail
3. Clicking consent link activates child's account (status -> 'active')
4. No 406 errors appear in browser console during any auth flow
5. Resend button works and invalidates previous tokens
6. Expired/invalid token links show helpful error message

**Technical approach:**
1. Create Supabase Edge Function `send-consent-email`
2. Integrate Resend API (store API key in Supabase secrets)
3. Update `consentService.js` to call Edge Function
4. Fix `apiAuth.js` to use `.maybeSingle()` instead of `.single()`
5. Test full flow: signup -> email -> click -> verify -> dashboard access

**Dependencies:**
- Resend account and API key
- Supabase Edge Functions enabled on project

---

## Milestone Success Criteria

v1.1 is complete when:
- [x] Under-13 user can sign up and parent receives consent email
- [x] Parent can click email link and successfully verify consent
- [x] Child account becomes active and can access app
- [x] No 406 errors in console during normal app usage
- [x] Resend functionality works for parents who didn't receive initial email

---
*Roadmap created: 2026-02-02*
*Last updated: 2026-02-02 — Milestone v1.1 Complete*
