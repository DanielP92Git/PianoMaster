# Requirements: PianoApp v1.1

**Defined:** 2026-02-02
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v1.1 Requirements

Requirements for the Parental Consent Email Service milestone.

### Email Service

- [ ] **EMAIL-01**: Edge Function sends consent verification email via Resend API
- [ ] **EMAIL-02**: Email contains child-friendly branding and clear CTA for parent
- [ ] **EMAIL-03**: Consent URL in email works end-to-end (verify → activate account)

### Bug Fixes

- [ ] **FIX-01**: Eliminate 406 console errors during role detection (use `.maybeSingle()`)
- [ ] **FIX-02**: Handle edge cases (resend, expired tokens, invalid links gracefully)

## Future Requirements

Deferred to later milestones. Not in current roadmap.

### Account Lifecycle

- **ACCT-01**: Edge Function hard-deletes accounts past 30-day grace period
- **ACCT-02**: Scheduled job runs deletion cleanup daily

### Production Deployment

- **DEPLOY-01**: Google Play Store submission
- **DEPLOY-02**: Apple App Store submission
- **DEPLOY-03**: Beta testing with human verification checklist

## Out of Scope

Explicitly excluded from v1.1.

| Feature | Reason |
|---------|--------|
| Custom email templates for other flows | Only consent email needed for COPPA |
| Marketing emails or newsletters | COPPA prohibits marketing to children |
| Email analytics/tracking | Privacy concern, not needed |
| Multi-language emails | English only for v1.1, Hebrew can come later |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EMAIL-01 | Phase 5 | Pending |
| EMAIL-02 | Phase 5 | Pending |
| EMAIL-03 | Phase 5 | Pending |
| FIX-01 | Phase 5 | Pending |
| FIX-02 | Phase 5 | Pending |

**Coverage:**
- v1.1 requirements: 5 total
- Mapped to phases: 5
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after milestone initialization*
