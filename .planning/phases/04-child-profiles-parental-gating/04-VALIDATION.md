---
phase: 4
slug: child-profiles-parental-gating
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-04
finalized: 2026-08-04
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                       |
| ---------------------- | --------------------------------------------------------------------------- |
| **Framework**          | vitest (JSDOM, @testing-library/react)                                      |
| **Config file**        | vitest config in package.json / vite.config; setup `src/test/setupTests.js` |
| **Quick run command**  | `npm run test:run -- <changed file>`                                        |
| **Full suite command** | `npm run test:run`                                                          |
| **Estimated runtime**  | ~60–120 seconds (full suite is large)                                       |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run -- <touched test file>`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

> Filled by the planner from the RESEARCH.md Validation Architecture section. The two
> named acceptance tests below are MANDATORY (Dimension-8) and must be referenced by a plan.

| Task ID      | Plan  | Wave | Requirement             | Threat Ref | Secure Behavior                                                                                                                                                                                              | Test Type   | Automated Command                                                           | File Exists | Status     |
| ------------ | ----- | ---- | ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------- | ----------- | ---------- |
| 04-02 Task 3 | 04-02 | 1    | PROFILE-05              | Pitfall 12 | Switching child clears prior child's React Query cache + localStorage — zero stale/cross-child data (covers unkeyed `["streak-state"]`, `["scores"]`, `resetStreakServiceCaches` singletons) — **MANDATORY** | integration | `npm run test:run -- src/contexts/ActiveChildContext.bleed.test.jsx`        | ❌ W0       | ⬜ pending |
| 04-05 Task 2 | 04-05 | 2    | COPPA-02                | Pitfall 11 | Direct-URL + back/forward into a gated route re-prompts; a real route transition to a child surface closes the window (D-05 4th trigger); pass does not persist for next person — **MANDATORY**              | integration | `npm run test:run -- src/components/auth/ParentGateProtectedRoute.test.jsx` | ❌ W0       | ⬜ pending |
| 04-02 Task 3 | 04-02 | 1    | PROFILE-06              | —          | Active-child id read from localStorage on mount BEFORE first student-scoped query; never used as an authz signal                                                                                             | unit        | `npm run test:run -- src/hooks/useActiveChildId.test.js`                    | ❌ W0       | ⬜ pending |
| 04-03 Task 1 | 04-03 | 1    | COPPA-03/04/05 (SEC-03) | —          | Parent-owned child id passes `verifyStudentDataAccess`; non-owned id is rejected (ownership branch, not client-trusted id)                                                                                   | unit        | `npm run test:run -- src/services/authorizationUtils.test.js`               | ❌ W0       | ⬜ pending |
| 04-03 Task 2 | 04-03 | 1    | COPPA-04                | —          | Export includes all parent-facing child-scoped tables (STUDENT_DATA_TABLES completeness)                                                                                                                     | unit        | `npm run test:run -- src/services/dataExportService.test.js`                | ❌ W0       | ⬜ pending |
| 04-03 Task 3 | 04-03 | 1    | COPPA-05                | —          | Per-child delete removes only that child's data and does NOT call `supabase.auth.signOut`                                                                                                                    | unit        | `npm run test:run -- src/services/accountDeletionService.test.js`           | ❌ W0       | ⬜ pending |
| 04-10        | 04-10 | 3    | COPPA-06                | —          | Deactivate sets `is_active = false`, hides child from switcher, retains data, is reversible                                                                                                                  | unit        | `npm run test:run -- src/pages/ManageChildren` (deactivate case)            | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Test file(s) for `useActiveChildId` hook — active-child resolution (student→user.id, parent→validated localStorage) + mount-before-query ordering (PROFILE-06)
- [ ] Test file for switch-cache-clear routine — proves no cross-child bleed incl. unkeyed queries (PROFILE-05)
- [ ] Test file for shared parental-gate context — mount re-check + close-on-switch/blur/timeout (COPPA-01/02)
- [ ] Test file(s) for `dataExportService` / `accountDeletionService` per-child branches (COPPA-04/05/06)
- [ ] Shared fixtures: mock parent session with N owned children, mock localStorage active-child key

_Existing vitest infrastructure covers component/service testing; Wave 0 adds the stubs above._

---

## Manual-Only Verifications

| Behavior                                   | Requirement                | Why Manual                                                                                           | Test Instructions                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Multi-child device no-bleed (real device)  | PROFILE-05                 | Full cache/remount behavior across a real reload + SessionTimeout is hard to fully simulate in JSDOM | On a device, log in as a parent with ≥2 children, play/generate data as child A, switch to child B, confirm zero of child A's stats/streak/scores appear; reload and confirm active child persists. **Also assert (OQ3):** the SessionTimeout inactivity timer resets on switch — it does not carry child A's elapsed-idle time into child B's session |
| URL/back-button gate bypass (real browser) | COPPA-02                   | Browser history + back/forward interaction with route wrappers                                       | Pass gate, navigate to a child surface, then use direct URL + browser back into Settings/Billing/CRUD — confirm re-prompt; background the app and return — confirm re-prompt                                                                                                                                                                           |
| RTL/He locale parity on all new screens    | PROFILE-01/02/03, COPPA-03 | Visual RTL correctness                                                                               | Switch to Hebrew, verify switcher, gate, Manage Children, avatar picker, nickname guidance render correctly RTL with both locales present                                                                                                                                                                                                              |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-04 (finalized against 11 plans; Wave 0 test files written during execution)
