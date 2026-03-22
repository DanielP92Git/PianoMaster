# Requirements: PianoApp

**Defined:** 2026-03-22
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v2.6 Requirements

Requirements for User Feedback milestone. Each maps to roadmap phases.

### Feedback Form

- [ ] **FORM-01**: Parent can access feedback form from Settings page (behind ParentGateMath)
- [ ] **FORM-02**: Parent can select feedback type: Bug / Suggestion / Other
- [ ] **FORM-03**: Parent can enter a free-text message (required, max 1000 chars)
- [ ] **FORM-04**: Form shows success confirmation after submission with cooldown timer
- [ ] **FORM-05**: Form shows error state if submission fails (rate limit, network, server)

### Anti-Spam

- [ ] **SPAM-01**: Edge Function requires valid Supabase JWT (rejects unauthenticated requests)
- [ ] **SPAM-02**: Rate limiting enforced at database level (max 3 submissions per hour per user)
- [ ] **SPAM-03**: Honeypot hidden field rejects bot submissions silently
- [ ] **SPAM-04**: Server-side input validation (min 10 chars, max 1000 chars, type must be valid enum)
- [ ] **SPAM-05**: Cooldown enforced client-side (disable form for 5 min after successful submission)

### Backend

- [ ] **BACK-01**: Supabase Edge Function receives form submissions and sends via Brevo API
- [ ] **BACK-02**: Email includes feedback type, message, student ID (anonymized), and app version

### Email Setup

- [ ] **MAIL-01**: Brevo SENDER_EMAIL updated to new shared support Gmail
- [ ] **MAIL-02**: Existing transactional emails (consent, weekly report) continue working with new sender

### i18n

- [ ] **I18N-01**: Full EN/HE translations for all form labels, placeholders, success/error/rate-limit messages

## Future Requirements

### Evergreen Engagement (v2.7 candidate)

- **SPACED-01**: Spaced repetition "rusty skills" system with accuracy decay
- **EVENT-01**: Weekly bonus events (Double XP, themed weeks)
- **ADAPT-01**: Adaptive difficulty within game sessions

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-app feedback DB storage | Brevo email sufficient for v1; DB table can be added later if volume warrants |
| File/screenshot attachment | Complexity not justified; text description sufficient for initial feedback |
| Auto-reply confirmation email to user | Unnecessary for v1; parent sees success state in UI |
| CAPTCHA | Overkill — app requires Supabase auth + parent gate + honeypot + rate limiting |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORM-01 | — | Pending |
| FORM-02 | — | Pending |
| FORM-03 | — | Pending |
| FORM-04 | — | Pending |
| FORM-05 | — | Pending |
| SPAM-01 | — | Pending |
| SPAM-02 | — | Pending |
| SPAM-03 | — | Pending |
| SPAM-04 | — | Pending |
| SPAM-05 | — | Pending |
| BACK-01 | — | Pending |
| BACK-02 | — | Pending |
| MAIL-01 | — | Pending |
| MAIL-02 | — | Pending |
| I18N-01 | — | Pending |

**Coverage:**
- v2.6 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15 ⚠️

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
