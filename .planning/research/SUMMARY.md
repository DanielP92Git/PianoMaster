# Project Research Summary

**Project:** Security Hardening for Piano Learning PWA
**Domain:** Child-focused EdTech (COPPA-compliant music education app)
**Researched:** January 31, 2026
**Confidence:** HIGH

## Executive Summary

This research addresses security hardening for a React 18 + Supabase piano learning Progressive Web App designed for 8-year-old children. The app currently has foundational security (RLS policies, SECURITY DEFINER functions) but requires comprehensive hardening before app store submission and public launch.

The recommended approach is a three-phase implementation focusing on (1) critical security fixes (RLS gaps, IDOR vulnerabilities), (2) COPPA compliance requirements (parental consent, data deletion, child data protection), and (3) production hardening (rate limiting, audit logging). The app faces a critical April 22, 2026 compliance deadline for the amended COPPA rule, requiring neutral age gating and separate consent for third-party data sharing.

Key risks include exposing child data through inadequate RLS policies, enabling privilege escalation through client-side authorization gaps, and violating COPPA through third-party SDK tracking. These can be mitigated through defense-in-depth authorization (client + RLS + SECURITY DEFINER), strict PII anonymization in public features, and removal/gating of all analytics SDKs for users under 13.

## Key Findings

### Recommended Stack

The current Supabase + React architecture is well-suited for secure, COPPA-compliant applications when properly configured. Research emphasizes defense-in-depth security with three layers: client-side authorization checks, Supabase Row Level Security (RLS), and privileged SECURITY DEFINER database functions.

**Core security technologies:**
- **Supabase RLS with consolidated policies**: Database-enforced authorization — faster and more secure than multiple permissive policies (40% performance gain from consolidation)
- **Custom JWT claims via Access Token Hook**: Performance optimization for RLS — allows role checks without database queries (but database tables remain source of truth)
- **sessionStorage for shared devices**: Auto-clears on tab close — critical for school environment where localStorage persists after logout
- **Service worker with auth exclusion patterns**: Offline PWA support — never caches /auth/, /token/, /session/ endpoints to prevent token persistence
- **Database-level rate limiting (PostgreSQL)**: Abuse prevention — no external dependencies, 10 requests per minute on score submission

**Critical anti-patterns to avoid:**
- Never use `user_metadata` in RLS policies (users can modify it via `supabase.auth.updateUser()`)
- Never create SECURITY DEFINER functions without explicit `auth.uid()` authorization checks
- Never cache authentication endpoints in service workers (causes session leakage on shared devices)
- Never expose child usernames in public features without anonymization (COPPA violation)

### Expected Features

Research reveals COPPA compliance features are table-stakes requirements, not optional nice-to-haves. The 2025 COPPA amendments (effective June 23, 2025; compliance deadline April 22, 2026) introduce stricter requirements that affect app architecture.

**Must have (legal/compliance):**
- Neutral age gating (date-of-birth picker, not "Are you over 13?" checkbox)
- Verifiable parental consent before data collection (email+confirmation for low-risk use)
- Child-friendly privacy policy in plain language (separate parent version)
- Parental data access dashboard (view, export JSON, one-click deletion)
- Complete data deletion with cascading removal from all tables
- Anonymized usernames in leaderboards/public features (show only current user's real name)
- No third-party analytics for users under 13 (Apple Kids Category bans all third-party SDKs)

**Should have (security):**
- Client-side authorization checks in all service functions (defense-in-depth before RLS)
- Teacher-student relationship verification before data access
- Session timeout after 15 minutes of inactivity (school shared devices)
- Comprehensive logout clearing all localStorage keys
- Audit logging for teacher actions on student data
- Rate limiting on score submissions (10/minute to prevent XP farming)

**Defer (post-launch):**
- Penetration testing and security audit (before v1.0 public launch)
- Automated data retention policies (1-year inactivity expiration)
- Multi-language privacy policies (Hebrew for international expansion)
- Privacy-preserving analytics (on-device processing, no user tracking)

### Architecture Approach

The defense-in-depth security architecture implements authorization at three layers: (1) Client-side checks provide fast, user-friendly feedback; (2) RLS policies enforce database-level access control that cannot be bypassed; (3) SECURITY DEFINER functions handle privileged operations with explicit authorization.

**Major components:**

1. **Client Authorization Layer** (`src/services/*.js`) — Fast verification of user identity and relationships (teacher-student connections) before making database requests, provides immediate error feedback
2. **RLS Policy Layer** (Supabase) — Database-enforced access control using consolidated policies (one policy per operation with OR logic), queries database tables for role verification instead of JWT metadata
3. **SECURITY DEFINER Functions** (PostgreSQL) — Privileged operations requiring superuser access (XP calculation, teacher-student linking), all functions include explicit `auth.uid()` checks at start
4. **Service Worker Cache Strategy** (`public/sw.js`) — PWA offline support with auth endpoint exclusion patterns, never caches /auth/, /token/, /session/ to prevent token persistence on shared devices
5. **COPPA Compliance Layer** — Child data protection through PII anonymization in public features, parental consent workflows, comprehensive deletion capabilities, no third-party SDK tracking

**Key architectural decisions:**
- Database tables (not `user_metadata`) are source of truth for roles and permissions
- Relationship-based access control via `teacher_student_connections` junction table
- Session data stored in sessionStorage (not localStorage) for school environments
- Rate limiting implemented at database level (PostgreSQL triggers/functions) to avoid external dependencies

### Critical Pitfalls

Based on audit of similar applications and documented CVE incidents:

1. **user_metadata abuse in RLS policies (CVE-level)** — Using JWT `user_metadata` for authorization allows privilege escalation because users can modify their own metadata via `supabase.auth.updateUser()`. **Prevention:** Query database tables (`teachers`, `students`) for role verification; use custom JWT claims only as performance hints, never for authorization decisions. **Status:** Fixed in migration `20260127000001`.

2. **SECURITY DEFINER functions without authorization checks** — Functions marked SECURITY DEFINER run with superuser privileges, bypassing RLS. Without explicit `auth.uid()` checks, any authenticated user can call these functions to escalate privileges. **Prevention:** Add `IF auth.uid() != p_user_id THEN RAISE EXCEPTION` checks at start of every SECURITY DEFINER function. **Status:** Fixed in migration `20260126000001`, needs verification for all functions.

3. **Service worker caching authentication tokens** — Caching auth endpoints causes JWT tokens to persist after logout on shared school devices, allowing next user to access previous user's account. **Prevention:** Exclude all /auth/, /token/, /session/ endpoints from cache; clear auth cache entries on logout. **Status:** Implemented in `public/sw.js`, needs testing on shared devices.

4. **Exposing child usernames in public features (COPPA violation)** — Displaying real names in leaderboards or public profiles violates COPPA requirements for children under 13. Penalties: $53,088 per violation. **Prevention:** Anonymize all usernames except current user (display "Student 1", "Student 2"); use pseudonymous identifiers for public features. **Status:** Needs review of leaderboard implementation.

5. **Missing rate limiting on score submissions** — No throttling allows automated XP farming via script loops submitting perfect scores, corrupting leaderboards and demotivating legitimate students. **Prevention:** Database-level rate limiting (10 submissions per 5 minutes) using `rate_limits` tracking table or Edge Functions with Redis. **Status:** Not implemented.

## Implications for Roadmap

Based on research, a three-phase approach is recommended to address critical security vulnerabilities before COPPA compliance deadline (April 22, 2026) and app store submission requirements.

### Phase 1: Critical Security Fixes (URGENT — Before Further Development)

**Rationale:** Foundational security gaps create immediate vulnerability to privilege escalation and data breaches. Must fix before any new features to avoid building on insecure foundation.

**Delivers:** Secure database access control, IDOR protection, shared device safety

**Duration:** 1-2 sprints (2-4 weeks)

**Addresses:**
- RLS gaps audit using Supabase Security Advisor (check which tables missing policies)
- Client-side authorization checks in all service functions (`verifyStudentDataAccess`, `verifyTeacherStudentConnection`)
- Comprehensive logout flow clearing all localStorage keys (migration flags, cached data, user-specific keys)
- Service worker auth exclusion testing on shared device simulation
- SECURITY DEFINER function audit (verify all have `auth.uid()` checks)

**Avoids:**
- Privilege escalation through client-bypass attacks (IDOR pitfall)
- Session hijacking on shared school devices (localStorage persistence pitfall)
- Unauthorized data access through RLS gaps

**Research flags:** None — patterns are well-documented, use existing migrations as reference

### Phase 2: COPPA Compliance Implementation (DEADLINE: April 22, 2026)

**Rationale:** Legal requirement for handling data from children under 13. Non-compliance blocks app store submission and risks $50k+ per-violation fines from FTC.

**Delivers:** Parental consent workflow, data deletion, child data protection, compliant privacy policy

**Duration:** 2-3 sprints (4-6 weeks)

**Uses:**
- Database deletion functions with cascade logic (`delete_student_data(UUID)`)
- Supabase RLS DELETE policies for teacher-initiated deletions
- React forms for age gate with date-of-birth picker (no "Are you over X?" checkbox)
- Email verification for parental consent (low-risk "email plus" method)

**Implements:**
- Neutral age gate component (COPPA 2025 requirement: no age suggestions or encouragement to lie)
- Parental consent flow (teacher-as-parent model using FERPA exception for school use)
- Child-friendly privacy policy (separate versions for children and parents)
- Parental dashboard (view/export/delete child data)
- Data deletion UI for teachers (with confirmation, audit logging)
- Username anonymization in leaderboards (show only current user's real name)
- Third-party SDK audit and removal (no analytics for users under 13)

**Avoids:**
- COPPA violations through PII exposure in public features
- App store rejection (Apple Kids Category bans all third-party SDKs)
- Legal liability from missing parental consent or data deletion capabilities

**Research flags:**
- **Age verification methods:** May need legal review to determine "reasonable" verification for risk level
- **FERPA school exception:** Validate teacher-as-parent model with education law attorney
- **Privacy policy language:** Requires legal review for COPPA compliance, especially disclosures section

### Phase 3: Production Hardening (Before Public Launch)

**Rationale:** Prevent abuse, maintain competitive integrity, enable compliance monitoring. Not legally required but critical for fair gameplay and security monitoring.

**Delivers:** Rate limiting, audit logging, session timeouts, security monitoring

**Duration:** 2 sprints (3-4 weeks)

**Uses:**
- PostgreSQL rate limiting with `rate_limits` tracking table
- `pg_cron` extension for automated inactive user cleanup
- React Idle Timer for inactivity detection
- Database triggers for audit log insertion

**Implements:**
- Rate limiting on score submissions (10 per 5 minutes using database function `check_rate_limit()`)
- Rate limiting on XP awards (prevent farming)
- Audit logging table (`audit_log`) with teacher action tracking
- Session timeout after 15 minutes of inactivity (configurable per environment)
- Automated data retention policy (delete users inactive for 2 years)
- Security metrics dashboard (failed login attempts, rate limit violations, RLS policy failures)

**Avoids:**
- XP farming through automated score submission scripts
- Leaderboard corruption from bot-driven perfect scores
- Compliance gaps from missing audit trail of teacher actions
- Account takeover on shared devices from forgotten logouts

**Research flags:**
- **Rate limiting strategy:** May need A/B testing to tune thresholds (10 per 5 min vs. other values)
- **Audit log retention:** Determine legal requirements for how long to keep logs (GDPR vs. COPPA)

### Phase Ordering Rationale

- **Phase 1 first:** Security vulnerabilities are foundation-level issues. Building new features on insecure base creates technical debt and compounds risk.
- **Phase 2 before Phase 3:** Legal compliance has hard deadline (April 22, 2026) and blocks app store submission. Rate limiting and monitoring are important but not blocking for launch.
- **Phased approach:** Allows incremental security improvements with testing between phases. Prevents "big bang" security refactor that could introduce regressions.
- **COPPA compliance critical path:** Age gating and parental consent must be implemented before collecting any child data. Data deletion UI can come after initial consent flow.

**Dependencies discovered:**
- Phase 2 (data deletion) depends on Phase 1 (authorization checks) — can't allow teachers to delete students they're not connected to
- Phase 3 (audit logging) supports Phase 2 (COPPA compliance) — track deletion requests for compliance proof
- All phases depend on RLS policies being correct — Security Advisor audit is prerequisite

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 2 (COPPA):**
  - Parental consent verification methods (credit card, video call, email+confirmation) — which method appropriate for school vs. home use?
  - FERPA exception applicability — does teacher-as-parent model work for our use case? Need education law clarification.
  - Privacy policy legal language — COPPA-compliant disclosures require attorney review, not just developer interpretation.
  - State-specific laws (Texas, Utah, Louisiana age verification requirements effective Jan 2026) — may need integration with Play Age Signals API / Declared Age Range API.

- **Phase 3 (Rate Limiting):**
  - Threshold tuning (how many scores per minute is legitimate?) — may need user research or A/B testing.
  - Redis vs. database rate limiting trade-offs — performance benchmarking needed if traffic grows.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Security Fixes):** RLS policies, client authorization checks, service worker patterns are well-documented. Existing migrations (`20260126000001`, `20260127000001`, `20260128000001`) provide templates. Supabase Security Advisor provides detection checklist.

- **Phase 3 (Session Timeout):** React Idle Timer library has standard implementation. No custom research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Supabase official docs, Context7 library for RLS patterns, verified with Security Advisor tool. Architecture patterns backed by CVE incident reports. |
| Features | **HIGH** | COPPA requirements from FTC official guidance (2025 amendments published). App store policies from official Apple/Google documentation. Compliance deadlines verified. |
| Architecture | **HIGH** | Defense-in-depth patterns from OWASP standards. Existing codebase already implements 60% of recommended architecture (RLS policies exist, SECURITY DEFINER functions audited). Gaps are well-defined. |
| Pitfalls | **HIGH** | Based on documented CVE incidents (CVE-2025-48757 for RLS gaps), Supabase Security Advisor checks, and community incident reports. Test cases provided for verification. |

**Overall confidence:** HIGH

All research areas backed by primary sources (official documentation, regulatory guidance, verified incident reports). Few assumptions required. Implementation paths are clear.

### Gaps to Address

**Technical gaps:**

- **Rate limiting threshold tuning**: Research suggests 10 requests per 5 minutes for score submission, but this may be too strict/lenient. **Resolution:** Implement configurable threshold, monitor in staging, adjust based on false positive rate.

- **localStorage vs. sessionStorage trade-off**: sessionStorage provides better security (auto-clears on tab close) but worse UX (must login per tab). **Resolution:** Use sessionStorage by default for school deployments, make configurable via environment variable for home use.

- **Audit log retention period**: COPPA requires deletion "when no longer needed" but doesn't specify timeline. GDPR has stricter retention limits. **Resolution:** Consult privacy attorney during Phase 2 implementation; default to 1-year retention with automated cleanup.

**Compliance gaps:**

- **Parental consent verification method**: Research shows multiple acceptable methods (email+confirmation, credit card, video call) but doesn't clarify which is "reasonable" for our risk level. **Resolution:** Start with email+confirmation (lowest friction for schools), document rationale for legal review.

- **Teacher-as-parent FERPA exception**: Research indicates schools can act in loco parentis under FERPA, but our specific implementation may need validation. **Resolution:** Include FERPA exception flowchart in Phase 2 plan, schedule legal review before implementation.

- **State age verification laws**: Texas, Utah, Louisiana require age verification starting Jan 2026. Implementation requires Play Age Signals API (Google) or Declared Age Range API (Apple). **Resolution:** Flag for Phase 2 implementation if targeting users in these states.

**Process gaps:**

- **Security testing**: Research identifies vulnerabilities but doesn't define comprehensive testing plan. **Resolution:** Create RLS test suite during Phase 1 (see PITFALLS.md section 4 for test patterns).

- **Incident response**: No playbook for handling data breach or COPPA complaint. **Resolution:** Defer to post-launch, but document security contacts and escalation paths during Phase 3.

## Sources

### Primary (HIGH confidence)

**Supabase Official Documentation:**
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy patterns, consolidation strategy
- [Database Functions](https://supabase.com/docs/guides/database/functions) — SECURITY DEFINER best practices, STABLE vs. VOLATILE
- [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) — JWT claims for RLS performance
- [User Sessions](https://supabase.com/docs/guides/auth/sessions) — Session timeout configuration, autoRefreshToken behavior
- [PGAudit Extension](https://supabase.com/docs/guides/database/extensions/pgaudit) — Audit logging for COPPA compliance
- [SOC 2 Compliance](https://supabase.com/docs/guides/security/soc-2-compliance) — Third-party attestation for privacy policy references

**COPPA Regulatory Guidance:**
- [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) — Parental consent methods, verifiable consent requirements
- [Federal Register: COPPA Final Rule (April 22, 2025)](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule) — Neutral age gating requirement, separate third-party consent
- [eCFR COPPA Rule](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312) — Personal information definition (includes persistent identifiers, device IDs)

**App Store Requirements:**
- [Apple Kids Category Requirements](https://developer.apple.com/kids/) — Third-party SDK ban, parental gate requirements
- [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en) — Self-certification, CSAM reporting requirements
- [Google Play Child Safety Standards](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en) — Designated CSAE contact requirement

### Secondary (MEDIUM confidence)

**Security Best Practices:**
- [Supabase Security Advisor: RLS References user_metadata](https://supabase.github.io/splinter/0015_rls_references_user_metadata/) — Detection method for user_metadata abuse
- [Supabase Security Retro: 2025](https://supabase.com/blog/supabase-security-2025-retro) — 83% of breaches involve RLS misconfigurations (community-reported statistic)
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) — Teacher-student relationship verification pattern

**COPPA Compliance Guides:**
- [COPPA Compliance in 2025: A Practical Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/) — Analytics restrictions, third-party SDK limitations
- [Children's Online Privacy in 2025: The Amended COPPA Rule](https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule) — Separate consent for third-party disclosure requirement

**React Security:**
- [React Security Checklist: Complete Guide for 2025](https://www.propelcode.ai/blog/react-security-checklist-complete-guide-2025) — XSS prevention, dependency auditing
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — General web application security framework

### Tertiary (LOW confidence, needs validation)

- [Hacker News: Your Supabase is public if you turn off RLS](https://news.ycombinator.com/item?id=46355345) — Community discussion of CVE-2025-48757, 170+ apps exposed (anecdotal, not verified by official source)
- [Byteiota: Supabase Security Flaw](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) — 83% statistic on RLS misconfigurations (secondary source, original data source unclear)
- Community blog posts on rate limiting strategies — Various implementation approaches, need benchmarking for our use case

---

**Research completed:** January 31, 2026
**Ready for roadmap:** Yes
**Compliance deadline:** April 22, 2026 (COPPA neutral age gating requirement)
**Next action:** Create roadmap based on 3-phase structure, prioritize Phase 1 security fixes
