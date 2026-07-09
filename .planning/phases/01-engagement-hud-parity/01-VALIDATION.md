---
phase: 01
slug: engagement-hud-parity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-09
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                          |
| ---------------------- | ---------------------------------------------- |
| **Framework**          | vitest (JSDOM, @testing-library/react)         |
| **Config file**        | vite.config.js (setup: src/test/setupTests.js) |
| **Quick run command**  | `npx vitest run <changed test file>`           |
| **Full suite command** | `npm run test:run`                             |
| **Estimated runtime**  | ~120 seconds (full suite)                      |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <touched test files>`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID   | Plan | Wave | Requirement | Threat Ref   | Secure Behavior                     | Test Type | Automated Command | File Exists | Status     |
| --------- | ---- | ---- | ----------- | ------------ | ----------------------------------- | --------- | ----------------- | ----------- | ---------- |
| {N}-01-01 | 01   | 1    | REQ-{XX}    | T-{N}-01 / — | {expected secure behavior or "N/A"} | unit      | `{command}`       | ✅ / ❌ W0  | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] {to be filled by planner from RESEARCH.md ## Validation Architecture}

_If none: "Existing infrastructure covers all phase requirements."_

---

## Manual-Only Verifications

| Behavior   | Requirement | Why Manual | Test Instructions |
| ---------- | ----------- | ---------- | ----------------- |
| {behavior} | REQ-{XX}    | {reason}   | {steps}           |

_If none: "All phase behaviors have automated verification."_

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
