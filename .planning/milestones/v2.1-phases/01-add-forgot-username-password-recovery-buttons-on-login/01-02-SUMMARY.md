---
phase: 01-add-forgot-username-password-recovery-buttons-on-login
plan: 02
subsystem: auth
tags: [react, ui, routing, password-reset, i18n, rtl]

# Dependency graph
requires:
  - 01-01 (API functions, TanStack Query hooks, translations)
provides:
  - Inline forgot password flow in LoginForm (3-state view)
  - ResetPasswordPage with Supabase recovery session detection
  - Public /reset-password route in App.jsx
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-state view pattern (login/forgotPassword/resetSent) within single component"
    - "Cooldown timer with useEffect interval for rate-limiting UI actions"
    - "Supabase PASSWORD_RECOVERY event listener for smart session detection"
    - "URL hash parameter sniffing for immediate expired-link detection"

key-files:
  created:
    - src/pages/ResetPasswordPage.jsx
  modified:
    - src/components/auth/LoginForm.jsx
    - src/App.jsx

key-decisions:
  - "Inline view switching in LoginForm rather than separate modal — keeps UX within the login card"
  - "RTL-aware back arrow with rtl:rotate-180 Tailwind class for Hebrew layout"
  - "Smart session detection: check URL for auth params to show expired state immediately instead of waiting for timeout"
  - "10-second timeout for legitimate reset links, immediate failure for missing URL params"

patterns-established:
  - "Glass card page pattern: full-screen purple gradient + centered max-w-md glass card for standalone auth pages"
  - "Password field pair with independent Eye/EyeOff toggles and client-side validation"

requirements-completed: [PWD-RESET-LOGIN-UI, PWD-RESET-PAGE, PWD-RESET-ROUTE]

# Metrics
duration: 5min
completed: 2026-03-09
---

# Phase 01 Plan 02: Forgot Password UI & Reset Page Summary

**Three-state inline forgot password flow in LoginForm, dedicated ResetPasswordPage with Supabase recovery session detection, and public /reset-password route**

## Performance

- **Duration:** ~5 min (across two sessions)
- **Started:** 2026-03-09T01:02:00Z
- **Completed:** 2026-03-09T12:18:36Z
- **Tasks:** 2 (+ 1 checkpoint verified by user)
- **Files modified:** 3

## Accomplishments
- LoginForm.jsx enhanced with three-state view (login / forgotPassword / resetSent) providing inline password recovery without leaving the login card
- New ResetPasswordPage.jsx (239 lines) with glass card styling matching login, dual password fields with visibility toggles, and Supabase PKCE recovery session detection
- Public /reset-password route wired in App.jsx outside ProtectedRoute
- 60-second cooldown timer prevents rapid re-sends of reset emails
- RTL support with flipped back arrow for Hebrew layout
- Smart expired-link detection: checks URL for auth params to show error immediately rather than waiting for timeout

## Task Commits

Each task was committed atomically:

1. **Task 1: Add inline forgot password flow to LoginForm** - `28818d7` (feat)
2. **Task 2: Create ResetPasswordPage and wire route in App.jsx** - `75ca47e` (feat)

## Post-Checkpoint Fix

3. **UX improvement: RTL arrow + smart session detection** - `b3d29d5` (fix)

## Files Created/Modified
- `src/components/auth/LoginForm.jsx` - Added three-state view (login/forgotPassword/resetSent), useResetPassword hook integration, 60-second cooldown timer, RTL-aware back arrow
- `src/pages/ResetPasswordPage.jsx` - New dedicated reset password page with glass card UI, dual password fields with Eye/EyeOff toggles, Supabase PASSWORD_RECOVERY event detection, smart URL param checking for expired links, 10s timeout fallback
- `src/App.jsx` - Added public route for /reset-password outside ProtectedRoute wrapper

## Decisions Made
- Inline view switching within LoginForm card rather than a separate modal or page -- keeps the UX contained and smooth
- RTL-aware back arrow using `rtl:rotate-180` Tailwind utility class for Hebrew layout correctness
- Smart session detection: sniff URL hash for auth parameters to detect expired/invalid links immediately instead of always waiting for the 10-second timeout
- 10-second timeout as fallback for legitimate reset links where Supabase PKCE processing may take a moment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RTL back arrow direction**
- **Found during:** Post-checkpoint verification
- **Issue:** Back arrow pointed left-to-right in both LTR and RTL layouts, which was confusing in Hebrew mode
- **Fix:** Added `rtl:rotate-180` class to ArrowRight icon in LoginForm.jsx (switched from ArrowLeft to ArrowRight with RTL flip)
- **Files modified:** src/components/auth/LoginForm.jsx
- **Commit:** b3d29d5

**2. [Rule 1 - Bug] Slow expired-link detection**
- **Found during:** Post-checkpoint verification
- **Issue:** ResetPasswordPage always waited for 3-second timeout before showing expired state, even when URL had no auth parameters at all
- **Fix:** Added immediate URL hash/search param check; increased legitimate timeout from 3s to 10s for real reset links
- **Files modified:** src/pages/ResetPasswordPage.jsx
- **Commit:** b3d29d5

---

**Total deviations:** 2 auto-fixed (2 bugs, both in single commit)
**Impact on plan:** UX improvements, no scope creep.

## Issues Encountered
None

## User Setup Required
None - uses existing Supabase auth configuration.

## Next Phase Readiness
- Phase 01 is complete. The full password recovery flow is functional:
  - Login page "Forgot password?" link triggers inline email form
  - Supabase sends reset email with PKCE token link
  - /reset-password page detects recovery session and allows password update
  - Success redirects back to login with toast notification
- No further plans in this phase.

## Self-Check: PASSED

All 3 created/modified files verified present. All task commits (28818d7, 75ca47e, b3d29d5) verified in git log.

---
*Phase: 01-add-forgot-username-password-recovery-buttons-on-login*
*Completed: 2026-03-09*
