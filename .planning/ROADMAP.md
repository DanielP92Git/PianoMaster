# Roadmap: PianoApp Security Hardening

## Overview

This security hardening project systematically addresses authorization vulnerabilities, implements COPPA compliance for child data protection, and establishes production-grade safeguards against abuse. The three-phase approach prioritizes critical security fixes (RLS policies, authorization checks, secure logout) before implementing legal requirements (parental consent, data deletion, PII anonymization) and production hardening (rate limiting, session timeouts, audit logging). Completion ensures the app meets app store security requirements and COPPA compliance deadline of April 22, 2026.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Critical Security Fixes** - Secure database access control, authorization verification, and shared device safety
- [x] **Phase 2: COPPA Compliance Implementation** - Parental consent, data deletion, child data protection
- [x] **Phase 3: Production Hardening** - Rate limiting, session timeouts, abuse prevention
- [ ] **Phase 4: Self-Host Google Fonts** - Remove external CDN dependencies for COPPA compliance

## Phase Details

### Phase 1: Critical Security Fixes
**Goal**: All database operations enforce authorization at RLS policy, SECURITY DEFINER function, and client-side service layers, with secure logout preventing session persistence on shared devices.

**Depends on**: Nothing (first phase)

**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04

**Success Criteria** (what must be TRUE):
  1. RLS policies on all tables query database state (teachers/students tables) instead of user_metadata for authorization
  2. All SECURITY DEFINER functions verify auth.uid() matches operation target before execution
  3. Client-side services verify user.id matches studentId before making API calls
  4. Logout clears all user-specific localStorage keys (migration flags, cached data, user-specific progress)
  5. Service worker never caches authentication endpoints (/auth/, /token/, /session/)

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md - Database Security Audit: RLS policies and SECURITY DEFINER functions
- [x] 01-02-PLAN.md - Client-Side Authorization: Service method verification
- [x] 01-03-PLAN.md - Secure Logout & Error Messages: localStorage cleanup and i18n

### Phase 2: COPPA Compliance Implementation
**Goal**: App complies with COPPA requirements for children under 13, enabling parental data access, complete deletion, and preventing PII exposure in shared features.

**Depends on**: Phase 1 (authorization checks required for data deletion and teacher-parent access)

**Requirements**: COPPA-01, COPPA-02, COPPA-03, COPPA-04, COPPA-05, COPPA-06

**Success Criteria** (what must be TRUE):
  1. Teachers can export all student data as downloadable JSON file
  2. Teachers can permanently delete student accounts with cascading removal from all tables
  3. Student usernames are anonymized in any shared/public features (show only current user's real name)
  4. New users encounter age gate with date-of-birth picker (not "Are you 13?" checkbox)
  5. Parental consent flow blocks data collection until teacher/parent provides verified consent
  6. No third-party SDKs collect data from users under 13 (analytics disabled or gated)

**Plans:** 7 plans (6 original + 1 gap closure)

Plans:
- [x] 02-01-PLAN.md - Database Schema for COPPA Compliance
- [x] 02-02-PLAN.md - Age Gate UI Component
- [x] 02-03-PLAN.md - Third-Party SDK Audit
- [x] 02-04-PLAN.md - Consent & Account Services
- [x] 02-05-PLAN.md - Signup & Login Flow Integration
- [x] 02-06-PLAN.md - Consent UX & Route Guard
- [x] 02-07-PLAN.md - Gap Closure: Wire data export and deletion services to UI

### Phase 3: Production Hardening
**Goal**: Automated safeguards prevent XP farming, protect shared device users from forgotten logouts, and provide audit trail for compliance monitoring.

**Depends on**: Phase 1 (authorization layer required for rate limiting enforcement)

**Requirements**: SESS-01, SESS-02, SESS-03, RATE-01, RATE-02, RATE-03

**Success Criteria** (what must be TRUE):
  1. Students are automatically logged out after 30 minutes of inactivity
  2. Teachers are automatically logged out after 2 hours of inactivity
  3. Inactivity timer resets on user interaction (clicks, keypresses, game activity)
  4. Score submissions are limited to 10 per 5 minutes per student per node at database level
  5. Rate limit violations return clear error message to user without breaking game flow
  6. Rate limiting prevents XP farming while allowing normal gameplay pace

**Plans:** 4 plans in 2 waves

Plans:
- [x] 03-01-PLAN.md — Rate limiting database layer (table, function, RLS)
- [x] 03-02-PLAN.md — Rate limit UI integration (banner, service, VictoryScreen)
- [x] 03-03-PLAN.md — Session timeout infrastructure (hook, modal, context)
- [x] 03-04-PLAN.md — Session timeout integration (App.jsx, games, login message)

### Phase 4: Self-Host Google Fonts
**Goal**: Eliminate all external font CDN requests to prevent third-party data collection from under-13 users, completing COPPA-06 compliance.

**Depends on**: Nothing (independent fix)

**Requirements**: COPPA-06

**Gap Closure**: Addresses partial COPPA-06 from v1-MILESTONE-AUDIT.md

**Success Criteria** (what must be TRUE):
  1. All fonts (Outfit, Comic Neue, Nunito, Fredoka One, Dancing Script, Heebo, Assistant, Material Icons Round) are served from `/public/fonts/`
  2. No external requests to fonts.googleapis.com or fonts.gstatic.com in browser Network tab
  3. `@font-face` rules properly define font families with correct weights and styles
  4. All existing font usages in the app continue to work correctly
  5. index.html contains no external Google Fonts links

**Plans:** TBD

Plans:
- [ ] 04-01-PLAN.md — Self-host Google Fonts

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Critical Security Fixes | 3/3 | Complete | 2026-01-31 |
| 2. COPPA Compliance Implementation | 7/7 | Complete | 2026-02-01 |
| 3. Production Hardening | 4/4 | Complete | 2026-02-01 |
| 4. Self-Host Google Fonts | 0/1 | Pending | — |

---
*Roadmap created: 2026-01-31*
*Last updated: 2026-02-01 - Added Phase 4 for gap closure (Google Fonts)*
