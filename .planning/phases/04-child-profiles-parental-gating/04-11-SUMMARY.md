---
phase: 04-child-profiles-parental-gating
plan: 11
subsystem: parent-portal
tags: [react-context, react-query, coppa, i18n, vitest]

# Dependency graph
requires:
  - phase: 04-child-profiles-parental-gating (Plan 02)
    provides: useActiveChildId — the single source of the active child id for stat queries
  - phase: 04-child-profiles-parental-gating (Plan 04)
    provides: streakService.getStreakState(childId) signature change
  - phase: 04-child-profiles-parental-gating (Plan 05)
    provides: ParentGateContext / useParentGate — shared, short-lived in-memory parental gate
provides:
  - ParentPortalPage split (D-08) — ungated read-only Quick Stats + heatmap, keyed on active child; gated subscription/notification action rows behind the shared gate with a lock affordance
  - NotificationPermissionCard migrated off its own mount-local ParentGateMath onto the shared ParentGateContext (D-06 — no re-solve when the portal's gate is already open)
  - Privacy Policy link in the parent-settings area (SIGNUP-05 second half, carried from Phase 3)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "On-demand gate prompt pattern: a page-local boolean (`showGatePrompt`) controls ONLY whether ParentGateMath is currently rendered; the actual gate-passed state lives entirely in the shared ParentGateContext (`passed`/`pass`). `pass()` is only ever invoked from ParentGateMath's `onConsent` callback, never called directly by a lock-click handler — preserves the math-verification step."
    - "Lock affordance pattern (UI-SPEC note 2/7): gated SettingsSection swaps its `icon` prop to `Lock` and its content to a `GatedActionLock` button when `!passed`; swaps back to the real icon/content once passed. Matches 'small lock/shield glyph' guidance without auto-popping the math modal on page load."

key-files:
  created:
    - src/components/settings/NotificationPermissionCard.gate.test.jsx
  modified:
    - src/pages/ParentPortalPage.jsx
    - src/pages/ParentPortalPage.test.jsx
    - src/components/settings/NotificationPermissionCard.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "The lock-click handler does NOT call the shared `pass()` directly (even though the plan's interfaces block phrased it as 'on-click invoke the gate (pass())'). Read literally, ParentGateContext.pass() flips `passed` to true immediately with no math check — calling it directly from a lock click would let a child bypass the gate with a single tap. Instead, the lock click sets a page-local `showGatePrompt` flag that renders ParentGateMath; only ParentGateMath's `onConsent` (i.e., after the math problem is solved) calls the shared `pass()`. This mirrors the existing `ParentGateProtectedRoute` precedent (render ParentGateMath, onConsent=pass) while keeping the UI-SPEC's passive 'lock row, no auto-popup' requirement."
  - 'Scope of gating strictly follows 04-UI-SPEC.md note 7 and the plan''s threat register: ONLY subscription management and notification settings are gated. Weekend-pass toggle, account deletion, and the Legal links remain ungated, matching the checker-approved UI-SPEC ("visually mark gated action rows (subscription management, notification settings)" — no other rows named) rather than expanding scope to every action on the page.'
  - "PracticeHeatmapCard's studentId prop rescoped from user?.id to childId (active-child-keyed), consistent with the plan's must_haves truth that stats+heatmap are both keyed on the active child."
  - "auth.signup.terms.privacyLink (existing Phase-3 EN/HE key) reused verbatim for the new parent-settings-area Privacy link rather than inventing a new key, per the plan's explicit instruction."

metrics:
  duration: 35 min
  completed: 2026-08-04
---

# Phase 04 Plan 11: Parent Portal Split Summary

Split the previously fully-gated Parent Portal into ungated read-only child stats (keyed on the active child) and gated parent-action rows behind the shared `ParentGateContext`, and migrated `NotificationPermissionCard`'s own mount-local math gate onto that same shared context so it no longer re-prompts once the portal's gate is already open.

## What Changed

### Task 1 — ParentPortalPage split (D-08)

- Removed the page's own `const [gateOpen, setGateOpen] = useState(true)` and its always-shown `<ParentGateMath>` render. Replaced with `const { passed, pass } = useParentGate()` (Plan 05).
- The three Quick Stats queries (`student-xp`, `student-progress`, `streak-state`) were rescoped from `user?.id` to `childId` (via `useActiveChildId`, Plan 04-02) and their `enabled` condition changed from `!!user?.id && !gateOpen` to `ready && !!childId` — this both removes the gate dependency (queries now fire immediately, ungated) and fixes a pre-existing parent-id-as-studentId bug (a parent viewing the portal was previously fetching stats keyed on their own auth id rather than the active child's id).
- `streakService.getStreakState()` was called with the new required `childId` argument (Plan 04-04 changed its signature).
- `PracticeHeatmapCard`'s `studentId` prop was also rescoped to `childId` to satisfy the plan's must-have that stats AND heatmap are both keyed on the active child.
- Quick Stats + Practice Heatmap sections now render unconditionally (always visible, no gate check).
- Subscription Management and Notification Preferences `SettingsSection`s each swap their header `icon` to `Lock` and their body to a new `GatedActionLock` button (passive, click-to-unlock) when `!passed`; the real content renders once `passed` is true.
- Clicking a `GatedActionLock` sets a page-local `showGatePrompt` boolean, which renders `ParentGateMath` at the top of the page. Its `onConsent` calls the shared `pass()` (and closes the prompt); its `onCancel` just closes the prompt (no `navigate(-1)`, since this is an inline action gate, not a full-route guard).
- Added a Privacy Policy link inside the "Parent Settings" section (`text-white/75 underline hover:text-white`, `target="_blank"`, `rel="noopener noreferrer"`), reusing the existing `auth.signup.terms.privacyLink` i18n key from Phase 3's entry-screen treatment.
- Fixed a stale cache-invalidation key in `handleWeekendPassToggle` (`["streak-state", user?.id]` → `["streak-state", childId]`) so it actually matches the rescoped query key (Rule 1 — this would have silently left stale streak data cached after a weekend-pass toggle).
- Rewrote `ParentPortalPage.test.jsx` (16 tests) to verify: stats/heatmap render ungated on mount; no gate prompt appears until a lock is clicked; stat queries fire with the active `childId`; subscription/notification content is hidden and `NotificationPermissionCard` doesn't mount until `passed`; clicking a lock opens the prompt and solving it calls the shared `pass()`; cancelling the prompt grants no access; weekend-pass toggle works ungated with no gate; the Privacy link has the correct href/target.

### Task 2 — NotificationPermissionCard shared-gate migration (D-06)

- Removed `const [showGate, setShowGate] = useState(false)`, the `ParentGateMath` import, and its own `{showGate && <ParentGateMath .../>}` render.
- Added `const { passed, pass } = useParentGate()`.
- `handleEnableClick` now: `if (!passed) { pass?.(); return; } await performSubscription();` — proceeds straight to subscription when the shared gate is already open (no re-prompt), and otherwise defers to the shared gate (a defensive-only path in practice, since the card only mounts inside the portal's already-gated Notification Preferences section per Task 1).
- `handleConsentGranted` was removed entirely (collapsed into `handleEnableClick`/`performSubscription`, since there's no more local `showGate` to flip).
- `FeedbackForm.jsx` was deliberately left untouched — it keeps its own standalone `ParentGateMath` (fires fresh every time, Phase-3 D-01/D-02/D-03), since it lives in the child-accessible `/settings` surface, not the parent-portal shared-window flow.
- Created `NotificationPermissionCard.gate.test.jsx` (2 tests): with `passed: true`, clicking Enable calls the subscribe service directly and renders no gate; with `passed: false`, clicking Enable calls `pass` and does not subscribe.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale query-invalidation key in `handleWeekendPassToggle`**

- **Found during:** Task 1
- **Issue:** The rescoped `streak-state` query key changed from `["streak-state", user?.id]` to `["streak-state", childId]`, but the existing `handleWeekendPassToggle` still invalidated the old key — the weekend-pass toggle would have silently left stale streak data cached after a successful toggle.
- **Fix:** Updated the invalidation call to `["streak-state", childId]`.
- **Files modified:** `src/pages/ParentPortalPage.jsx`
- **Commit:** `dfa5821c`

### Design clarification (not a deviation, documented for future readers)

The plan's Task 1 interfaces block describes the lock affordance as "on-click invoke the gate (pass())". Read literally against the actual (already-merged, Plan 05) `ParentGateContext.jsx`, `pass()` sets `passed = true` immediately with no math verification — it is designed to be called only from `ParentGateMath`'s `onConsent` callback (see the existing `ParentGateProtectedRoute` precedent). Implementing the lock-click as a direct `pass()` call would have let a child bypass the parental gate with a single tap, which contradicts both COPPA-01 and the plan's own threat register (T-04-11-01/T-04-11-03: subscription/notification actions must require the gate to be _passed_, not merely _requested_). The lock click instead opens `ParentGateMath` on demand via a page-local `showGatePrompt` flag; `pass()` is invoked only from that modal's `onConsent`, after the math problem is solved. This satisfies the plan's stated behavior (clicking a locked row leads to the gate being solved and the action becoming available) while preserving the actual security boundary.

## Known Stubs

None — no stub data or placeholder content was introduced by this plan.

## Threat Flags

None — this plan does not introduce new network endpoints, auth paths, or schema changes beyond what the plan's own threat register already covers (T-04-11-01 through T-04-11-04, all disposed `mitigate`/`accept` and addressed as designed).

## Self-Check: PASSED

- FOUND: `src/pages/ParentPortalPage.jsx`
- FOUND: `src/pages/ParentPortalPage.test.jsx`
- FOUND: `src/components/settings/NotificationPermissionCard.jsx`
- FOUND: `src/components/settings/NotificationPermissionCard.gate.test.jsx`
- FOUND commit `dfa5821c` (Task 1) in `git log`
- FOUND commit `7fa216c4` (Task 2) in `git log`
- `npx vitest run src/pages/ParentPortalPage.test.jsx src/components/settings/NotificationPermissionCard.gate.test.jsx` — 18/18 tests PASSED
- Grep gates verified: `gateOpen` count 0 in ParentPortalPage.jsx; `useParentGate` present in both files; `showGate`/`ParentGateMath` count 0 in NotificationPermissionCard.jsx; `FeedbackForm.jsx` still imports its own `ParentGateMath` (unchanged); stat queries keyed on `childId`; Privacy link has `href="/privacy"` + `target="_blank"`
- `npx eslint` on all 4 touched source/test files — 0 errors, 0 warnings
