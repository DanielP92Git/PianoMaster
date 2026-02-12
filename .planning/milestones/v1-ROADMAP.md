# Milestone v1.0: Security Hardening

**Status:** SHIPPED 2026-02-01
**Phases:** 1-4
**Total Plans:** 15

## Overview

This security hardening project systematically addresses authorization vulnerabilities, implements COPPA compliance for child data protection, and establishes production-grade safeguards against abuse. The four-phase approach prioritizes critical security fixes (RLS policies, authorization checks, secure logout) before implementing legal requirements (parental consent, data deletion, PII anonymization), production hardening (rate limiting, session timeouts), and eliminating third-party data collection (self-hosted fonts).

## Phases

### Phase 1: Critical Security Fixes

**Goal**: All database operations enforce authorization at RLS policy, SECURITY DEFINER function, and client-side service layers, with secure logout preventing session persistence on shared devices.
**Depends on**: Nothing (first phase)
**Plans**: 3 plans

Plans:
- [x] 01-01: Database Security Audit - RLS policies and SECURITY DEFINER functions
- [x] 01-02: Client-Side Authorization - Service method verification
- [x] 01-03: Secure Logout & Error Messages - localStorage cleanup and i18n

**Details:**
- Fixed 7 RLS policies to use `is_admin()` function instead of user_metadata
- Added auth.uid() checks to 2 SECURITY DEFINER functions
- Created authorizationUtils.js with 21+ calls across services
- Comprehensive logout cleanup preserving only accessibility/i18n/theme settings
- Service worker AUTH_EXCLUDED_PATTERNS prevents auth token caching

### Phase 2: COPPA Compliance Implementation

**Goal**: App complies with COPPA requirements for children under 13, enabling parental data access, complete deletion, and preventing PII exposure in shared features.
**Depends on**: Phase 1 (authorization checks required for data deletion and teacher-parent access)
**Plans**: 7 plans

Plans:
- [x] 02-01: Database Schema for COPPA Compliance
- [x] 02-02: Age Gate UI Component
- [x] 02-03: Third-Party SDK Audit
- [x] 02-04: Consent & Account Services
- [x] 02-05: Signup & Login Flow Integration
- [x] 02-06: Consent UX & Route Guard
- [x] 02-07: Gap Closure - Wire data export and deletion services to UI

**Details:**
- Database schema: date_of_birth, is_under_13 (trigger-computed), parent_email, consent_status, account_status
- AgeGate.jsx: DOB picker with month/day/year dropdowns (neutral collection per COPPA)
- Full consent flow: useSignup -> consentService -> ParentalConsentPending -> ConsentVerifyPage
- DataExportModal.jsx: Teachers can export all student data as JSON
- AccountDeletionModal.jsx: 30-day grace period, name confirmation required

### Phase 3: Production Hardening

**Goal**: Automated safeguards prevent XP farming, protect shared device users from forgotten logouts, and provide audit trail for compliance monitoring.
**Depends on**: Phase 1 (authorization layer required for rate limiting enforcement)
**Plans**: 4 plans

Plans:
- [x] 03-01: Rate limiting database layer (table, function, RLS)
- [x] 03-02: Rate limit UI integration (banner, service, VictoryScreen)
- [x] 03-03: Session timeout infrastructure (hook, modal, context)
- [x] 03-04: Session timeout integration (App.jsx, games, login message)

**Details:**
- Rate limiting: 10 submissions per 5 minutes per student per node
- pg_advisory_xact_lock for race condition prevention
- Session timeout: 30min students, 2hr teachers with 5-min warning
- Cross-tab synchronization via react-idle-timer leaderElection
- Game timers pause during active gameplay phases

### Phase 4: Self-Host Google Fonts

**Goal**: Eliminate all external font CDN requests to prevent third-party data collection from under-13 users, completing COPPA-06 compliance.
**Depends on**: Nothing (independent fix)
**Plans**: 1 plan

Plans:
- [x] 04-01: Install fontsource packages, update imports, remove CDN links

**Details:**
- Installed 7 @fontsource packages (Outfit, Comic Neue, Nunito, Fredoka One, Dancing Script, Heebo, Assistant)
- 27 font weight imports in main.jsx
- 89 .woff2 files bundled (909.95 KB total)
- Service worker cache bumped to v3
- Zero external requests to googleapis.com/gstatic.com

---

## Milestone Summary

**Key Decisions:**

- Use is_admin() function for admin checks (not user_metadata which is user-modifiable)
- Defense-in-depth in trigger functions (verify auth.uid() even when RLS should prevent access)
- Trigger-based computed column for is_under_13 (not GENERATED ALWAYS AS)
- Neutral DOB collection with dropdown menus (COPPA requirement)
- Fixed window rate limiting (simpler than sliding window)
- crossTab with leaderElection for session timeout coordination
- Fontsource packages over manual download (npm versioning, Vite bundling)

**Issues Resolved:**

- RLS policies using user_metadata (exploitable via supabase.auth.updateUser())
- SECURITY DEFINER functions without auth.uid() checks
- Client-side services not verifying studentId matches user
- localStorage persistence on shared devices after logout
- Service worker caching auth tokens
- Third-party data collection via Google Fonts CDN

**Issues Deferred:**

- Hard delete Edge Function for accounts past 30-day grace period
- Parental consent verification method (email vs credit card vs video call) needs legal review
- Privacy policy language requires attorney review
- State age verification laws may require Play Age Signals API

**Technical Debt Incurred:**

- dataExportService.js:7-8 - TODO: Keep tables list in sync with schema changes
- consentService.js:64-68 - TODO: Email service integration (console.log in dev)
- main.jsx:53 - window.supabase debug code (pre-existing, documented)

---

_For current project status, see .planning/ROADMAP.md_
_Archived: 2026-02-01 as part of v1 milestone completion_
