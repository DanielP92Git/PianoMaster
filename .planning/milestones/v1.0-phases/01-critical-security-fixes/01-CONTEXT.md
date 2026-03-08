# Phase 1: Critical Security Fixes - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

All database operations enforce authorization at RLS policy, SECURITY DEFINER function, and client-side service layers, with secure logout preventing session persistence on shared devices. This phase establishes the authorization foundation required before COPPA compliance (Phase 2) and production hardening (Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Authorization Violation Handling
- Show specific, helpful error messages (not generic "something went wrong")
- Error messages include guidance: "You don't have permission. Try selecting a student from your list."
- Block unauthorized teacher-student operations with clear error (no redirect)
- Do not notify teachers about student-side violations — just block silently
- Rate limit after threshold: 3 violations per resource type in 5 minutes
- Rate limiting is per-resource-type (student access separate from score violations)

### Rate Limit Behavior
- User decision: 3 violations in 5 minutes triggers rate limit
- Track violations separately per resource type

### Logout Data Clearing
- Keep app-wide preferences (language, accessibility settings) after logout
- Clear auth tokens + user-specific data (progress cache, migration flags)
- Show confirmation dialog before logout ("Are you sure?")
- Show error on failed logout attempt, let user retry manually
- Add subtle "Remember to log out" reminder on dashboard for shared devices

### Error Messaging Approach
- Very simple, child-friendly messages for students: "Oops! You can't see that."
- All error messages translated via i18n system (Hebrew/English)

### Migration Strategy
- Force re-login for all users after deploying new RLS policies
- Create mandatory database backup before applying migration
- Show security update notice that explains the re-login: "You were logged out for a security update"
- Document rollback plan for reverting if issues arise
- Deploy directly to production (with backup), no staging branch
- Deploy at midnight to minimize disruption

### Claude's Discretion
- Whether to log authorization violations for audit (likely yes for compliance)
- Block duration for rate-limited users (likely 5-15 minutes)
- Whether rate-limited users get force-logged-out or just blocked from the action
- Whether to differentiate "honest mistakes" from "suspicious" violations (likely not worth complexity)
- Error display style (modal vs toast vs inline) — pick based on context
- SECURITY DEFINER function behavior on auth failure (exception vs null)
- Whether rate-limited teachers can still access their legitimate students
- Violation dashboard/visibility for admins (likely not needed for Phase 1)
- Whether to show countdown timer for rate-limited users
- Console logging approach (dev-only detailed, production minimal)
- Whether to include error codes for support
- IndexedDB cleanup on logout (check what's stored)
- Service worker cache invalidation on logout (check what's cached)
- Post-logout confirmation message ("Successfully logged out")
- Handle inconsistent/orphaned data during migration
- Handle localStorage migration flags (likely clear all for fresh start)
- Deploy incrementally or all at once (likely all at once for Phase 1)
- Security update notice duration (one-time vs dismissible)
- Session restoration on rollback (likely no — keep users logged out)

</decisions>

<specifics>
## Specific Ideas

- Error messages should be understandable by 8-year-olds: "Oops! You can't see that."
- Teachers get slightly more detail but still clear, not technical
- The "remember to log out" reminder should be subtle, not nagging
- Security update notice should be brief and reassuring, not alarming

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-critical-security-fixes*
*Context gathered: 2026-01-31*
