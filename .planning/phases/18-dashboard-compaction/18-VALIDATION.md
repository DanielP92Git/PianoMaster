---
phase: 18
slug: dashboard-compaction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Framework**          | Vitest 3.2.4                                            |
| **Config file**        | `vitest.config.js` (project root)                       |
| **Quick run command**  | `npx vitest run src/components/layout/Dashboard.test.*` |
| **Full suite command** | `npm run test:run`                                      |
| **Estimated runtime**  | ~15 seconds                                             |

---

## Sampling Rate

- **After every task commit:** Manual browser check — dashboard loads without hero, greeting bar visible, no PlayNextButton
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green + visual confirmation
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type      | Automated Command                       | File Exists | Status     |
| -------- | ---- | ---- | ----------- | -------------- | --------------------------------------- | ----------- | ---------- |
| 18-01-01 | 01   | 1    | DASH-01     | smoke (render) | `npx vitest run src/components/layout/` | ❌ W0       | ⬜ pending |
| 18-01-02 | 01   | 1    | DASH-02     | unit           | `npx vitest run src/components/layout/` | ❌ W0       | ⬜ pending |
| 18-01-03 | 01   | 1    | DASH-03     | unit           | `npx vitest run src/components/layout/` | ❌ W0       | ⬜ pending |
| 18-01-04 | 01   | 1    | DASH-02     | unit           | `npx vitest run src/locales/`           | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/components/layout/Dashboard.test.jsx` — render test confirming hero absence, greeting bar presence, card list intact (DASH-01, DASH-02, DASH-03). **Optional** — planner may defer given the surgical, visual nature of these changes.

_Note: Dashboard.jsx has no existing test file. The existing test at `src/__tests__/App.test.jsx` tests routing but does not render Dashboard content. Given the surgical nature of these edits, manual smoke-testing in the browser is the most practical verification gate. The planner may opt to treat visual verification as the phase gate rather than adding a new test file._

---

## Manual-Only Verifications

| Behavior                                      | Requirement | Why Manual                                                       | Test Instructions                                                                                                                                                  |
| --------------------------------------------- | ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard renders compact layout without hero | DASH-01     | Visual layout change — no automated assertion for "compact feel" | Load `/dashboard`, verify no hero image, greeting bar shows avatar + name + level pill                                                                             |
| PlayNextButton absent from dashboard          | DASH-02     | Component removal — verify visually it's gone                    | Load `/dashboard`, verify no "Continue Journey" / "Begin Journey" CTA                                                                                              |
| All dashboard cards render                    | DASH-03     | Card presence is visual                                          | Load `/dashboard`, scroll through cards: DailyMessage, UnifiedStats, PracticeLog, Practice Tools (3 buttons), PushOptIn, DailyChallenge, DailyGoals, WeeklySummary |
| Greeting bar RTL                              | DASH-01     | RTL visual layout                                                | Switch to Hebrew, verify greeting bar renders with direction:rtl — avatar on right, pill on left, text between them                                                |
| Push notification URL opens dashboard         | DASH-01     | Requires push notification trigger                               | Send test push, tap it, verify lands on `/dashboard`                                                                                                               |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
