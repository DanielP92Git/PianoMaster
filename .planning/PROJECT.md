# PianoApp Security Hardening

## What This Is

Security hardening and preventive maintenance for a piano learning PWA designed for 8-year-old learners. This project ensures child data protection, safe operation on shared devices, and compliance with app store requirements (Google Play, Apple App Store) in preparation for future deployment.

## Core Value

**Children's data must be protected and inaccessible to unauthorized users.** Every feature, fix, and decision should prioritize preventing unauthorized access to child data, ensuring safe logout on shared devices, and preventing abuse of the XP/progression system.

## Requirements

### Validated

These capabilities exist and are working:

- ✓ Supabase authentication (email/password) — existing
- ✓ Student/teacher role differentiation — existing
- ✓ Trail gamification system with XP and levels — existing
- ✓ Daily goals generation and tracking — existing
- ✓ Service worker with partial auth endpoint exclusion — existing (needs audit)
- ✓ Basic RLS policies on tables — existing (needs audit)
- ✓ Security Hardening Guidelines documented in CLAUDE.md — existing (needs verification)

### Active

Security fixes and critical features to implement:

**Security Fixes:**
- [ ] SEC-01: Move migration tracking from localStorage to database (prevent XP duplication)
- [ ] SEC-02: Audit and fix service worker auth endpoint caching
- [ ] SEC-03: Audit all SECURITY DEFINER functions for auth.uid() checks
- [ ] SEC-04: Audit RLS policies - ensure no user_metadata usage, proper data scoping
- [ ] SEC-05: Audit client-side services for authorization verification before API calls
- [ ] SEC-06: Implement secure logout that clears all user-specific localStorage data
- [ ] SEC-07: Verify role checks use database tables, not JWT user_metadata

**Critical Features:**
- [ ] FEAT-01: Session timeout - logout after 1 hour inactivity for students, 2 hours for teachers
- [ ] FEAT-02: Rate limiting on score submissions (1 per node per 60 seconds per student)
- [ ] FEAT-03: Data export feature for COPPA/GDPR compliance (download all student data as JSON)

**COPPA Compliance:**
- [ ] COPPA-01: Ensure no PII exposed in any shared/public features
- [ ] COPPA-02: Anonymize usernames in any leaderboard or comparison features
- [ ] COPPA-03: Verify data minimization - only necessary data collected

### Out of Scope

Explicitly excluded from this project:

- Performance bottlenecks (sound file bundle, VexFlow rendering, trail data fetching) — separate project, not security-critical
- Code quality improvements (large components, debug code cleanup) — technical debt, address later
- Test coverage gaps — important but not blocking security work
- Known bugs (Memory Game trail integration, exercise progress race condition) — functional bugs, not security
- New features unrelated to security — focus on hardening first

## Context

**Current State:**
- App is in development/beta with a few beta testers
- No dedicated staging environment (using production Supabase)
- Targeting future deployment to Google Play and Apple App Store
- Used by independent users: private teachers, piano students (with or without teachers)
- Not currently used in schools, but must support shared device scenarios

**Security Audit Status:**
- January 2026 security audit documented patterns in CLAUDE.md
- Implementation status unclear — need to verify what's already implemented vs. documented as target
- CONCERNS.md lists specific vulnerabilities to address

**User Demographics:**
- Primary users: 8-year-old children learning piano
- Secondary users: Teachers managing students, parents overseeing progress
- COPPA compliance required for children under 13

**Testing Approach:**
- Use existing Supabase with careful migration rollback plans
- Browser-based shared device simulation (incognito, multiple profiles, localStorage clearing)
- Manual security testing checklist with beta testers
- No separate staging environment needed for beta phase

## Constraints

- **Backend**: Supabase (auth, database, real-time) — no changes to this choice
- **Compatibility**: Must not break existing beta user data or progress
- **Compliance**: Must meet Google Play and Apple App Store security requirements
- **COPPA**: Must comply with children's data protection regulations (under 13)
- **Idempotency**: Migration fixes must handle users who already migrated (no double XP awards)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Move migration tracking to database | localStorage can be manipulated by users; server-side is authoritative | — Pending |
| Rate limit at 1 submission per 60 seconds | Prevents XP farming while allowing normal gameplay pace | — Pending |
| 1-hour session timeout for students | Balance security on shared devices vs. not interrupting practice | — Pending |
| No separate staging environment | Beta phase with few users; adds maintenance burden without proportional benefit | — Pending |
| Audit before implementing | Verify what's already done before duplicating work | — Pending |

---
*Last updated: 2026-01-31 after initialization*
