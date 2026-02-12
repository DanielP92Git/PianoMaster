# Phase 2: COPPA Compliance Implementation - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement COPPA compliance for children under 13: parental consent flows, data export/deletion, username anonymization in shared features, age verification gate, and third-party SDK compliance verification.

</domain>

<decisions>
## Implementation Decisions

### Age Gate & Consent Flow
- Age verification happens **during registration** — user enters DOB before creating account
- DOB picker uses **dropdown selectors** (Month/Day/Year) — familiar, works on all devices
- Parental consent verified via **parent email verification** — sends confirmation link
- **Both pathways supported**: teacher-initiated and student self-registration
- For self-registration, collect **minimal data before consent**: email + DOB only
- Consent email contains **confirm link + privacy summary** — bullet list of what's collected
- **Account suspended until consent verified** — student can't use app
- Suspended students see **child-friendly waiting message**: "Ask your parent to check their email so you can start playing!" with illustration
- Parent can **revoke consent anytime** — triggers account deletion
- **No consent expiration** — once granted, remains valid until revoked
- For teacher-added students, parent email is **required for under-13**
- Teachers see **status indicator** showing which students are pending vs. active, with ability to resend consent email
- When child **turns 13**, send parent email that consent is no longer required
- Consent confirmation page shows **bullet list of data types** collected with purpose

### Existing Users Migration
- Existing users **prompted for DOB on next login**
- Under-13 existing users **suspended until consent** obtained (same as new users)
- Progress is preserved but account locked until parent confirms

### Data Export & Deletion
- Export includes **all user data**: profile, scores, progress, goals, XP, sessions
- Export format: **JSON file**
- Export can be requested by **teacher or parent**
- Parents access export through **shared credentials** with child — export button in account settings
- Deletion requires **typing account name to confirm** — prevents accidents
- **30-day soft delete** grace period — data retained for recovery, but account appears deleted
- During soft delete, account is **inaccessible** (appears deleted to user)
- Recovery process **needs investigation** — involves payment/subscription implications

### Username Anonymization
- Currently exposed in **teacher dashboards** — teachers see their students' names
- Teachers see **only connected students** — strict data isolation
- For future shared features, use **system-assigned musical nicknames** (e.g., "Funny Composer", "Pink Piano")
- Nicknames are **randomly assigned at account creation** — no moderation needed

### Third-Party SDK Handling
- Currently **no known third-party tracking SDKs** — needs audit to confirm
- If found, SDKs should be **disabled entirely for under-13** users
- **Supabase compliance should be verified** — check COPPA stance, DPA, storage locations
- **Full npm dependency audit** for phone-home behavior, analytics, crash reporting
- If problematic SDK found, **replace with COPPA-safe alternative**
- **Audit external requests** (fonts, CDNs) for data collection
- Add **privacy dashboard in settings** — "Your Data" section showing what's collected

### Claude's Discretion
- Deletion cascade timing (immediate vs. background job)
- Exact soft-delete database implementation
- Technical approach for conditional SDK loading
- Privacy dashboard UI design

</decisions>

<specifics>
## Specific Ideas

- "Ask your parent to check their email so you can start playing!" — child-friendly suspended state message with illustration
- Musical nicknames for anonymization: "Funny Composer", "Pink Piano" etc. — music-themed, fun for kids
- Parent notified when child turns 13 and consent is no longer required — proactive communication

</specifics>

<deferred>
## Deferred Ideas

- **Payment/subscription handling on deletion** — recovery flow needs investigation due to payment cancellation implications (noted for research phase)
- **Leaderboards** — if implemented, would use the musical nickname anonymization pattern established here
- **School/organization hierarchy** — visibility policies at school level mentioned but out of scope

</deferred>

---

*Phase: 02-coppa-compliance*
*Context gathered: 2026-01-31*
