# Requirements Archive: v1.0 Security Hardening

**Archived:** 2026-02-01
**Status:** SHIPPED

This is the archived requirements specification for v1.0.
For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

# Requirements: PianoApp Security Hardening

**Defined:** 2026-01-31
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v1 Requirements

Requirements for this security hardening milestone. Each maps to roadmap phases.

### Security Audits

- [x] **SEC-01**: RLS policies use database state (not user_metadata) for all authorization decisions
- [x] **SEC-02**: All SECURITY DEFINER functions have explicit auth.uid() checks
- [x] **SEC-03**: Client-side services verify user.id matches studentId before API calls
- [x] **SEC-04**: Logout clears all user-specific localStorage keys on shared devices

### Session Management

- [x] **SESS-01**: Students are automatically logged out after 30 minutes of inactivity
- [x] **SESS-02**: Teachers are automatically logged out after 2 hours of inactivity
- [x] **SESS-03**: Inactivity timer resets on user interaction (clicks, keypresses, game activity)

### Rate Limiting

- [x] **RATE-01**: Score submissions are limited to 10 per 5 minutes per student per node
- [x] **RATE-02**: Rate limiting is enforced at database level (not client-side only)
- [x] **RATE-03**: Rate limit violations return clear error message to user

### COPPA Compliance

- [x] **COPPA-01**: Data export API returns all student data as downloadable JSON
- [x] **COPPA-02**: Data deletion API permanently removes all student data from database
- [x] **COPPA-03**: Student usernames are anonymized in any shared/public-facing features
- [x] **COPPA-04**: Neutral age gate collects date of birth (not "Are you 13?" checkbox)
- [x] **COPPA-05**: Parental consent flow blocks data collection until consent verified
- [x] **COPPA-06**: Third-party SDKs are audited and removed if they collect child data

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SESS-01 | Phase 3 | Complete |
| SESS-02 | Phase 3 | Complete |
| SESS-03 | Phase 3 | Complete |
| RATE-01 | Phase 3 | Complete |
| RATE-02 | Phase 3 | Complete |
| RATE-03 | Phase 3 | Complete |
| COPPA-01 | Phase 2 | Complete |
| COPPA-02 | Phase 2 | Complete |
| COPPA-03 | Phase 2 | Complete |
| COPPA-04 | Phase 2 | Complete |
| COPPA-05 | Phase 2 | Complete |
| COPPA-06 | Phase 2 + 4 | Complete |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---

## Milestone Summary

**Shipped:** 16 of 16 v1 requirements

**Adjusted:**
- COPPA-06 required additional Phase 4 (Self-Host Google Fonts) after SDK audit discovered Google Fonts CDN was collecting user IPs

**Dropped:** None

---

*Archived: 2026-02-01 as part of v1 milestone completion*
