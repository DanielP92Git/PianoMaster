# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Phase 3 - Production Hardening (Session Timeout)

## Current Position

Phase: 3 of 3 (Production Hardening)
Plan: 3 of 4 complete (Session Timeout Infrastructure)
Status: In progress
Last activity: 2026-02-01 - Completed 03-03-PLAN.md

Progress: [██████████] 100% (13/14 plans: 3 phase 1 + 7 phase 2 + 3 phase 3)

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 4.2 minutes
- Total execution time: 55 minutes

**By Phase:**

| Phase | Plans | Completed | Total Time | Avg/Plan |
|-------|-------|-----------|------------|----------|
| 01 Critical Security | 3 | 3 | 15 min | 5 min |
| 02 COPPA Compliance | 7 | 7 | 29 min | 4.1 min |
| 03 Production Hardening | 3 | 3 | 11 min | 3.7 min |

**Recent Trend:**
- Plan 01-01: 4 minutes (database authorization audit)
- Plan 01-02: 8 minutes (client-side authorization)
- Plan 01-03: 4 minutes (secure logout and i18n errors)
- Plan 02-01: 0 minutes (schema bundled with 02-02)
- Plan 02-02: 3 minutes (Age Gate UI component)
- Plan 02-03: 4 minutes (Third-party SDK audit)
- Plan 02-04: 3 minutes (COPPA compliance services)
- Plan 02-05: 5 minutes (Signup flow modification)
- Plan 02-06: 5 minutes (Consent UX)
- Plan 02-07: 6 minutes (COPPA UI wiring)
- Plan 03-01: 3 minutes (Rate limiting infrastructure)
- Plan 03-02: 4 minutes (Score submission integration)
- Plan 03-03: 4 minutes (Session timeout infrastructure)
- Trend: Consistent, fast execution

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Move migration tracking to database (prevents localStorage manipulation, XP duplication)
- Rate limit at 10 per 5 minutes (prevents XP farming while allowing normal gameplay)
- 30-minute session timeout for students (balances security on shared devices vs. not interrupting practice)
- No separate staging environment (beta phase with few users, adds maintenance burden)
- Audit before implementing (verify what's already done before duplicating work)
- Use is_admin() function for admin checks (not user_metadata which is user-modifiable)
- Defense-in-depth in trigger functions (verify auth.uid() even when RLS should prevent access)
- Preserve accessibility_, i18nextLng, theme, security_update_shown on logout (01-03)
- Clear all sb-* (Supabase) keys on logout to prevent token persistence (01-03)
- Use UUID regex pattern to catch any user ID stored as localStorage key (01-03)
- streakService already secure by design (uses session.user.id internally) (01-02)
- XP operations restricted to self only (user.id === studentId) (01-02)
- **Trigger-based computed column** - Used trigger instead of GENERATED ALWAYS AS for is_under_13 (02-01)
- **Service functions for consent** - Centralizes business logic in database layer (02-01)
- **No direct RLS on consent tokens** - Tokens only accessed through service functions (02-01)
- **Neutral DOB collection** - COPPA requires dropdown menus not leading questions (02-02)
- **100-year range for birth year** - Reasonable age limit for dropdown (02-02)
- **Google Fonts as only blocking issue** - Self-host via fontsource packages (02-03)
- **Debug logging safe** - Disabled by default, localhost-only (02-03)
- **Supabase requires DPA** - Data Processing Addendum before collecting child data (02-03)
- **SHA-256 token hashing** - Web Crypto API for browser-native secure hashing (02-04)
- **Parallel export queries** - Query all tables simultaneously for performance (02-04)
- **Name confirmation for deletion** - Prevent accidental deletion of child accounts (02-04)
- **Two-stage signup flow** - Age gate first, then parent email if under-13, then account details (02-05)
- **Client + server age calculation** - Defense in depth for age verification (02-05)
- **Suspended consent status** - Under-13 accounts created as suspended_consent (02-05)
- **Teachers bypass account status check** - PGRST116 error code = not a student, returns 'active' (02-06)
- **60-second resend cooldown** - Client-side rate limit prevents consent email spam (02-06)
- **COPPA data summary on verification** - Parent sees what data is collected when approving (02-06)
- **Dark theme for teacher modals** - bg-gray-900 text-white to match TeacherDashboard aesthetic (02-07)
- **Blob URL download pattern** - Client-side JSON download, no server storage for COPPA compliance (02-07)
- **Case-insensitive name confirmation** - Prevents typos from blocking legitimate deletions (02-07)
- **Icon differentiation for deletion types** - Orange AlertTriangle for COPPA account deletion vs red Trash2 for teacher connection removal (02-07)
- **Fixed window rate limiting** - Simpler than sliding window, reset after 5 min of inactivity (03-01)
- **pg_advisory_xact_lock for race prevention** - Transaction-scoped lock on student_id + node_id (03-01)
- **crossTab with leaderElection** - One tab coordinates timeout across all tabs (03-03)
- **clicks and keydown only** - Mouse movement too sensitive for activity detection (03-03)
- **sessionStorage for logout reason** - Login page shows friendly inactivity message (03-03)

### Pending Todos

None.

### Blockers/Concerns

**Phase 2 outstanding items (non-blocking for compliance):**
- Parental consent verification method needs legal review (email+confirmation vs. credit card vs. video call)
- FERPA teacher-as-parent exception may need validation for specific implementation
- Privacy policy language requires attorney review for COPPA compliance
- State age verification laws (TX, UT, LA) may require Play Age Signals API integration
- **Google Fonts must be self-hosted before collecting child data** (02-03 finding)
- **react-router vulnerabilities should be patched** (02-03 finding)
- **Hard delete Edge Function needed** - Scheduled job for accounts past 30-day grace period (02-04)

**Phase 3 concerns:**
- Rate limiting thresholds may need tuning based on real-world usage patterns (10 per 5 min baseline)

## Session Continuity

Last session: 2026-02-01
Stopped at: Completed 03-03-PLAN.md (Session Timeout Infrastructure)
Resume file: None
Next step: Execute 03-04-PLAN.md (Session Timeout Integration)

---
*State initialized: 2026-01-31*
*Last updated: 2026-02-01 - Completed 03-03 (Session Timeout Infrastructure)*
