---
phase: 20
slug: curriculum-audit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value              |
| ---------------------- | ------------------ |
| **Framework**          | vitest             |
| **Config file**        | `vitest.config.js` |
| **Quick run command**  | `npx vitest run`   |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime**  | ~15 seconds        |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command                       | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | --------------------------------------- | ----------- | ---------- |
| 20-01-01 | 01   | 1    | CURR-01     | —          | N/A             | manual    | Verify audit doc covers all 48 nodes    | N/A         | ⬜ pending |
| 20-01-02 | 01   | 1    | CURR-02     | —          | N/A             | manual    | Verify game-type policy table present   | N/A         | ⬜ pending |
| 20-01-03 | 01   | 1    | CURR-03     | —          | N/A             | manual    | Verify remediation list completeness    | N/A         | ⬜ pending |
| 20-01-04 | 01   | 1    | CURR-04     | —          | N/A             | manual    | Verify audit committed as reference doc | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

_Existing infrastructure covers all phase requirements. Phase 20 is a documentation-only audit — no code changes or new test files needed._

---

## Manual-Only Verifications

| Behavior                                      | Requirement | Why Manual                            | Test Instructions                                                |
| --------------------------------------------- | ----------- | ------------------------------------- | ---------------------------------------------------------------- |
| All 48 nodes reviewed with concept identified | CURR-01     | Documentation audit — no code to test | Review audit doc has one row per node with concept column filled |
| Game-type policy documented                   | CURR-02     | Policy decision, not code             | Verify policy table matches D-04 through D-11                    |
| Remediation list covers all violations        | CURR-03     | Documentation completeness check      | Cross-reference violation flags with remediation entries         |
| Audit committed as reference document         | CURR-04     | Git operation verification            | `git log --oneline` shows audit doc commit                       |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
