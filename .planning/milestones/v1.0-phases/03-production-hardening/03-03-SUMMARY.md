---
phase: 03
plan: 03
subsystem: authentication
tags: [session-timeout, inactivity, react-idle-timer, cross-tab]
dependency-graph:
  requires: [02-COPPA]
  provides: [session-timeout-infrastructure, inactivity-warning-modal]
  affects: [03-04-app-integration]
tech-stack:
  added: [react-idle-timer@5.7.2]
  patterns: [context-provider, custom-hook, cross-tab-sync]
key-files:
  created:
    - src/hooks/useInactivityTimeout.js
    - src/components/ui/InactivityWarningModal.jsx
    - src/contexts/SessionTimeoutContext.jsx
  modified: []
decisions:
  - id: crossTab-leaderElection
    choice: "crossTab: true with leaderElection: true"
    why: "One tab coordinates timeout across all tabs, prevents logout race conditions"
  - id: activity-events
    choice: "clicks and keydown only (not mousemove)"
    why: "Mouse movement is too sensitive - kids may leave cursor on screen; clicks/keys show intentional activity"
  - id: sessionStorage-logout-reason
    choice: "Store 'logoutReason=inactivity' in sessionStorage"
    why: "Login page can show friendly message explaining why user was logged out"
metrics:
  duration: 4 minutes
  completed: 2026-02-01
---

# Phase 03 Plan 03: Session Timeout Infrastructure Summary

**One-liner:** Cross-tab synchronized inactivity timeout using react-idle-timer with role-based durations and 5-minute warning modal.

## What Was Built

### 1. useInactivityTimeout Hook (`src/hooks/useInactivityTimeout.js`)

Custom hook wrapping react-idle-timer for role-based session timeout:

- **Student timeout:** 30 minutes
- **Teacher timeout:** 2 hours
- **Warning prompt:** 5 minutes before logout
- **Activity events:** clicks and keydown only (not mousemove per requirements)
- **Cross-tab sync:** BroadcastChannel with leader election

```javascript
const { showWarning, stayLoggedIn, pauseTimer, resumeTimer, getRemainingTime } =
  useInactivityTimeout({ isStudent, onLogout: handleLogout });
```

### 2. InactivityWarningModal Component (`src/components/ui/InactivityWarningModal.jsx`)

"Still there?" modal with countdown timer:

- Non-dismissible (no close button, escape, or overlay click)
- Live countdown in M:SS format
- Large, accessible "Stay Logged In" button (min-h-touch)
- Uses existing Modal component with primary variant
- Kid-friendly styling with Clock icon

### 3. SessionTimeoutContext Provider (`src/contexts/SessionTimeoutContext.jsx`)

Context provider for app-wide session timeout management:

- Only activates when user is authenticated
- Stores `logoutReason=inactivity` in sessionStorage for login page
- Exposes `pauseTimer`/`resumeTimer` for games to control timer
- Renders InactivityWarningModal when timeout approaching

## Integration Points

This plan creates the infrastructure only. Plan 03-04 will integrate it into the app:

1. Wrap app in `SessionTimeoutProvider`
2. Add inactivity message display on login page
3. Games can use `useSessionTimeout()` to pause timer during active gameplay

## Commits

| Hash | Description |
|------|-------------|
| f6ee924 | feat(03-03): add useInactivityTimeout hook with react-idle-timer |
| d760894 | feat(03-03): add InactivityWarningModal component |
| ea82622 | feat(03-03): add SessionTimeoutContext for session management |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Checklist

- [x] react-idle-timer@5.7.2 installed
- [x] useInactivityTimeout.js exports hook with role-based config
- [x] InactivityWarningModal.jsx contains "Still there?" text
- [x] SessionTimeoutContext.jsx exports SessionTimeoutProvider and useSessionTimeout
- [x] Timer only active when user is authenticated

## Next Phase Readiness

**Ready for 03-04:** Session timeout integration into App.jsx

Dependencies satisfied:
- Hook created with all timer controls
- Modal component styled and functional
- Context provider ready for app wrapping

## Files Created

```
src/
  hooks/
    useInactivityTimeout.js      # 53 lines - Core timeout hook
  components/
    ui/
      InactivityWarningModal.jsx # 93 lines - Warning modal component
  contexts/
    SessionTimeoutContext.jsx    # 86 lines - App-wide timeout provider
```

## Dependencies Added

```json
{
  "react-idle-timer": "^5.7.2"
}
```
