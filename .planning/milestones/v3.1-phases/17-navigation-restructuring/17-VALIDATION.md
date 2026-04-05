---
phase: 17
slug: navigation-restructuring
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-05
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                   |
| ---------------------- | --------------------------------------- |
| **Framework**          | vitest                                  |
| **Config file**        | vite.config.js (vitest config embedded) |
| **Quick run command**  | `npx vitest run --reporter=verbose`     |
| **Full suite command** | `npm run test:run`                      |
| **Estimated runtime**  | ~15 seconds                             |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement    | Test Type | Automated Command                    | File Exists | Status  |
| -------- | ---- | ---- | -------------- | --------- | ------------------------------------ | ----------- | ------- |
| 17-01-01 | 01   | 1    | NAV-01, NAV-02 | unit      | `npx vitest run appNavigationConfig` | W0          | pending |
| 17-01-02 | 01   | 1    | NAV-04         | unit      | `npx vitest run appNavigationConfig` | W0          | pending |
| 17-01-03 | 01   | 1    | NAV-03         | unit      | `npx vitest run App.test`            | W0          | pending |
| 17-01-04 | 01   | 1    | DASH-04        | unit      | `npx vitest run appNavigationConfig` | W0          | pending |
| 17-02-01 | 02   | 1    | NAV-01, NAV-02 | manual    | N/A — visual layout verification     | N/A         | pending |

_Status: pending / green / red / flaky_

---

## Wave 0 Requirements

- [ ] `src/components/layout/appNavigationConfig.test.js` — tests for NAV-01, NAV-02, NAV-04, DASH-04 (nav item order, trail presence, tab composition, end prop passthrough) — **created by Plan 17-01 Task 1**
- [ ] `src/__tests__/App.test.jsx` — test for NAV-03 (index route renders TrailMapPage for students) — **created by Plan 17-01 Task 2**

_Existing test infrastructure (vitest + @testing-library/react) covers all framework needs._

---

## Manual-Only Verifications

| Behavior                           | Requirement | Why Manual                                 | Test Instructions                                                                 |
| ---------------------------------- | ----------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| Trail page shows within app shell  | NAV-01      | Visual layout cannot be tested with vitest | Open trail page, verify sidebar visible on desktop, bottom tabs visible on mobile |
| Active tab highlights correctly    | NAV-04      | Requires browser navigation and CSS checks | Navigate between trail/dashboard/settings, verify active state changes in nav     |
| TrailMapPage fills available space | NAV-01      | Visual viewport behavior                   | Resize browser, verify trail fills space with dark bg and no gaps                 |
| Bottom tabs not overlapping trail  | NAV-02      | Layout measurement                         | Open on mobile viewport, verify trail content doesn't extend behind bottom tabs   |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
