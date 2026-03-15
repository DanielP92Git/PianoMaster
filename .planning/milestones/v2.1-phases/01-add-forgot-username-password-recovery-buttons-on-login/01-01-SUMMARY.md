---
phase: 01-add-forgot-username-password-recovery-buttons-on-login
plan: 01
subsystem: auth
tags: [supabase, react-query, i18n, password-reset]

# Dependency graph
requires: []
provides:
  - resetPassword and updatePassword API functions in apiAuth.js
  - useResetPassword TanStack Query hook with anti-enumeration error handling
  - useUpdatePassword TanStack Query hook with success redirect
  - EN and HE translations for forgotPassword and resetPassword UI flows
affects: [01-02-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level siteUrl constant shared across auth functions"
    - "Anti-enumeration pattern: generic error message on reset request failure"
    - "Delayed navigation after password update for success state visibility"

key-files:
  created:
    - src/features/authentication/useResetPassword.js
    - src/features/authentication/useUpdatePassword.js
  modified:
    - src/services/apiAuth.js
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Hoisted siteUrl to module level in apiAuth.js to share across resetPassword and socialAuth"
  - "No retry on password reset mutations (retry: 0) to prevent duplicate emails"
  - "Generic error messages only on reset request to prevent email enumeration"

patterns-established:
  - "Password reset hooks: expose reset() from useMutation for component state management"
  - "i18n key nesting: auth.forgotPassword.* and auth.resetPassword.* under existing auth namespace"

requirements-completed: [PWD-RESET-API, PWD-RESET-I18N]

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 01 Plan 01: Password Reset API & Translations Summary

**Supabase password reset API functions, TanStack Query hooks with anti-enumeration security, and full EN/HE i18n translations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T22:53:48Z
- **Completed:** 2026-03-08T22:56:44Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Two new Supabase auth API functions (resetPassword, updatePassword) with proper redirectTo configuration
- Two TanStack Query hooks following established project patterns with security-conscious error handling
- Complete EN (23 keys) and HE (23 keys) translations for forgot password and reset password UI flows

## Task Commits

Each task was committed atomically:

1. **Task 1: Add password reset API functions and TanStack Query hooks** - `206ec97` (feat)
2. **Task 2: Add EN and HE translations for password reset flow** - `ef3a351` (feat)

## Files Created/Modified
- `src/services/apiAuth.js` - Added resetPassword() and updatePassword() functions, hoisted siteUrl to module level
- `src/features/authentication/useResetPassword.js` - TanStack Query mutation hook for sending password reset email
- `src/features/authentication/useUpdatePassword.js` - TanStack Query mutation hook for setting new password with redirect
- `src/locales/en/common.json` - English translations for auth.forgotPassword (11 keys) and auth.resetPassword (12 keys)
- `src/locales/he/common.json` - Hebrew translations for auth.forgotPassword (11 keys) and auth.resetPassword (12 keys)

## Decisions Made
- Hoisted siteUrl/isDevelopment constants to module level in apiAuth.js, removing duplicate inline definition from socialAuth -- simplifies code and shares the constant with resetPassword
- No retry (retry: 0) on both mutation hooks to prevent duplicate password reset emails
- Generic-only error messages on reset request to prevent email enumeration attacks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate siteUrl variable shadowing in socialAuth**
- **Found during:** Task 1 (adding module-level siteUrl)
- **Issue:** socialAuth had its own inline isDevelopment/siteUrl definitions that shadowed the new module-level constants
- **Fix:** Removed the redundant local variables; socialAuth now uses the module-level siteUrl
- **Files modified:** src/services/apiAuth.js
- **Verification:** socialAuth still references siteUrl correctly via module scope
- **Committed in:** 206ec97 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Cleanup of redundant variable shadowing. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API layer and translations are ready for Plan 02 (UI components: ForgotPasswordModal, ResetPasswordPage, route registration)
- useResetPassword exposes { resetPassword, isPending, isSuccess, reset } for component consumption
- useUpdatePassword exposes { updatePassword, isPending, isSuccess } with built-in success flow
- All translation keys are available for t() calls in React components

## Self-Check: PASSED

All 5 created/modified files verified present. Both task commits (206ec97, ef3a351) verified in git log.

---
*Phase: 01-add-forgot-username-password-recovery-buttons-on-login*
*Completed: 2026-03-09*
