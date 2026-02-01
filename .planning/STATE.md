# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Phase 4 - Self-Host Google Fonts (gap closure)

## Current Position

Phase: 4 of 4 (Self-Host Google Fonts) - COMPLETE
Plan: 1 of 1 complete
Status: All phases complete - ready for production
Last activity: 2026-02-01 - Completed 04-01-PLAN.md (Self-host Google Fonts)

Progress: [###############] 100% (15/15 plans: 3 phase 1 + 7 phase 2 + 4 phase 3 + 1 phase 4)

## Performance Metrics

**Velocity:**
- Total plans completed: 15
- Average duration: 4.3 minutes
- Total execution time: 64 minutes

**By Phase:**

| Phase | Plans | Completed | Total Time | Avg/Plan |
|-------|-------|-----------|------------|----------|
| 01 Critical Security | 3 | 3 | 15 min | 5 min |
| 02 COPPA Compliance | 7 | 7 | 29 min | 4.1 min |
| 03 Production Hardening | 4 | 4 | 15 min | 3.75 min |
| 04 Self-Host Google Fonts | 1 | 1 | 5 min | 5 min |

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
- Plan 03-02: 4 minutes (Rate limit UI integration)
- Plan 03-03: 4 minutes (Session timeout infrastructure)
- Plan 03-04: 4 minutes (Session timeout integration)
- Plan 04-01: 5 minutes (Self-host Google Fonts)
- Trend: Consistent, fast execution - ALL PHASES COMPLETE

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
- **'Great Practice!' title when rate limited** - Positive framing keeps children encouraged (03-02)
- **Teacher bypass via skipRateLimit option** - Services remain agnostic, caller handles role check (03-02)
- **Pause timer during active gameplay phases only** - COUNT_IN, DISPLAY, PERFORMANCE (not SETUP, FEEDBACK) (03-04)
- **try-catch for useSessionTimeout hook** - Graceful degradation outside SessionTimeoutProvider (03-04)
- **Blue info color for inactivity message** - Expected behavior, not an error (03-04)
- **Fontsource packages over manual download** - npm packages with auto-updates, version control, Vite bundling (04-01)
- **Skip material-icons-round** - Research found ZERO usage of icon font in codebase (uses Lucide React) (04-01)
- **Font imports before React imports** - Ensures fonts load early in application lifecycle (04-01)
- **Service worker cache v3** - Invalidates old Google Fonts cache entries, forces self-hosted assets (04-01)

### Pending Todos

None.

### Blockers/Concerns

**Outstanding items (non-blocking for compliance):**
- Parental consent verification method needs legal review (email+confirmation vs. credit card vs. video call)
- FERPA teacher-as-parent exception may need validation for specific implementation
- Privacy policy language requires attorney review for COPPA compliance
- State age verification laws (TX, UT, LA) may require Play Age Signals API integration
- **react-router vulnerabilities should be patched** (02-03 finding) - Low priority, no known exploits
- **Hard delete Edge Function needed** - Scheduled job for accounts past 30-day grace period (02-04)
- Rate limiting thresholds may need tuning based on real-world usage patterns (10 per 5 min baseline)

**RESOLVED:**
- ✓ Google Fonts self-hosted (04-01) - COPPA-06 compliance complete

## Session Continuity

Last session: 2026-02-01
Stopped at: Completed 04-01-PLAN.md - All 4 phases complete
Resume file: None
Next step: Production deployment

---
*State initialized: 2026-01-31*
*Last updated: 2026-02-01 - Completed Phase 4 (Self-Host Google Fonts) - ALL PHASES COMPLETE*
