# Requirements: PianoApp Security Hardening

**Defined:** 2026-01-31
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v1 Requirements

Requirements for this security hardening milestone. Each maps to roadmap phases.

### Security Audits

- [ ] **SEC-01**: RLS policies use database state (not user_metadata) for all authorization decisions
- [ ] **SEC-02**: All SECURITY DEFINER functions have explicit auth.uid() checks
- [ ] **SEC-03**: Client-side services verify user.id matches studentId before API calls
- [ ] **SEC-04**: Logout clears all user-specific localStorage keys on shared devices

### Session Management

- [ ] **SESS-01**: Students are automatically logged out after 30 minutes of inactivity
- [ ] **SESS-02**: Teachers are automatically logged out after 2 hours of inactivity
- [ ] **SESS-03**: Inactivity timer resets on user interaction (clicks, keypresses, game activity)

### Rate Limiting

- [ ] **RATE-01**: Score submissions are limited to 10 per 5 minutes per student per node
- [ ] **RATE-02**: Rate limiting is enforced at database level (not client-side only)
- [ ] **RATE-03**: Rate limit violations return clear error message to user

### COPPA Compliance

- [ ] **COPPA-01**: Data export API returns all student data as downloadable JSON
- [ ] **COPPA-02**: Data deletion API permanently removes all student data from database
- [ ] **COPPA-03**: Student usernames are anonymized in any shared/public-facing features
- [ ] **COPPA-04**: Neutral age gate collects date of birth (not "Are you 13?" checkbox)
- [ ] **COPPA-05**: Parental consent flow blocks data collection until consent verified
- [ ] **COPPA-06**: Third-party SDKs are audited and removed if they collect child data

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Service Worker Security

- **SW-01**: Service worker auth endpoint exclusion is tested with automated tests
- **SW-02**: All auth-related URL patterns are verified to bypass cache

### Enhanced Security

- **ENH-01**: Audit logging for sensitive operations (data access, exports, deletions)
- **ENH-02**: Automated security scanning in CI/CD pipeline
- **ENH-03**: Penetration testing before app store submission

### Advanced COPPA

- **COPPA-07**: Parental dashboard to view child's data and progress
- **COPPA-08**: Parent can manage consent preferences (revoke, update)
- **COPPA-09**: Automated data retention policies (delete inactive accounts)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Performance optimizations | Not security-critical, separate project |
| Memory Game trail integration bug | Functional bug, not security |
| Debug code cleanup | Code quality, not security |
| Test coverage expansion | Important but not blocking security work |
| VexFlow rendering optimization | Performance, not security |
| Sound file bundle reduction | Performance, not security |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | TBD | Pending |
| SEC-02 | TBD | Pending |
| SEC-03 | TBD | Pending |
| SEC-04 | TBD | Pending |
| SESS-01 | TBD | Pending |
| SESS-02 | TBD | Pending |
| SESS-03 | TBD | Pending |
| RATE-01 | TBD | Pending |
| RATE-02 | TBD | Pending |
| RATE-03 | TBD | Pending |
| COPPA-01 | TBD | Pending |
| COPPA-02 | TBD | Pending |
| COPPA-03 | TBD | Pending |
| COPPA-04 | TBD | Pending |
| COPPA-05 | TBD | Pending |
| COPPA-06 | TBD | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16 ⚠️

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initial definition*
