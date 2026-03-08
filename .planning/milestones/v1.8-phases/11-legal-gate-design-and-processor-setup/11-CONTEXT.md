# Phase 11: Legal, Gate Design, and Processor Setup - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

All pre-code decisions are locked before billing code is written. This phase selects and verifies a payment processor (Israel-compatible with sandbox), validates the free tier boundary against actual unit files, creates the parental consent disclosure naming the processor, and documents that no child PII flows to the billing system.

Requirements covered: PAY-01, COMP-03, COMP-04.

</domain>

<decisions>
## Implementation Decisions

### Free Tier Boundary
- All nodes in Unit 1 per path (treble, bass, rhythm) are free
- Boss nodes at the end of Unit 1 are LOCKED — they are the first paywall and subscription tease
- Boundary defined in a dedicated config file (e.g., `src/config/subscriptionConfig.js`), not inside skillTrail.js
- Config lists exact node IDs and counts explicitly — no dynamic resolution from unit files
- The config is the single source of truth for content gating across the app

### Parental Consent Disclosure
- Implemented as an in-app modal/page shown when a parent navigates to the pricing page — no real email sent
- Warm and reassuring tone, emphasizing child safety ("Your child's privacy is our priority")
- Bilingual via the app's existing i18n system (English + Hebrew)
- Must explicitly cover all four points:
  1. Payment processor identity — "Payments are processed by [Processor Name]"
  2. Data shared with processor — "Only your email address is shared. Your child's name and data are never sent."
  3. Recurring billing terms — "You'll be billed [monthly/yearly] until you cancel."
  4. Cancellation rights — "You can cancel anytime from within the app. Access continues until billing period ends."

### Child PII Isolation
- Parent email collected via a separate field at checkout — completely separate from the child's student account
- Parent email is stored on the subscription record in the app's database (needed for subscription management features)
- PII boundary documented as a simple list: "To processor: parent email, amount, currency. Never sent: child name, age, grade, student ID."
- Automated test verifies no child data fields appear in processor API call payloads — catches regressions

### Claude's Discretion
- Payment processor selection (research will recommend based on Israel support, sandbox availability, pricing)
- Exact layout and visual design of the consent modal
- Technical format of the PII boundary documentation
- Config file naming and export structure

</decisions>

<specifics>
## Specific Ideas

- Boss nodes as paywall is intentional — kids complete the free learning content, see the boss challenge locked, which motivates parents to subscribe
- Consent modal should feel like part of the app experience, not a legal roadblock
- The automated PII test should be a clear regression guard — if someone accidentally adds `student_name` to a processor payload, the test fails

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-legal-gate-design-and-processor-setup*
*Context gathered: 2026-02-25*
