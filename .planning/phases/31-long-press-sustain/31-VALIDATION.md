---
phase: 31
slug: long-press-sustain
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                               |
| ---------------------- | ----------------------------------- |
| **Framework**          | vitest                              |
| **Config file**        | `vite.config.js`                    |
| **Quick run command**  | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run test:run`                  |
| **Estimated runtime**  | ~30 seconds                         |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID                 | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status     |
| ----------------------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ----------------- | ----------- | ---------- |
| _Filled after planning_ | —    | —    | PLAY-01     | —          | N/A             | unit      | `npx vitest run`  | ⬜          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior                                            | Requirement | Why Manual                                   | Test Instructions                                                                             |
| --------------------------------------------------- | ----------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Hold ring animation fills smoothly at 60fps         | PLAY-01     | Visual smoothness requires human observation | Open listen&tap game with half notes, hold tap area, verify ring fills smoothly               |
| Sustained piano sound plays for full hold           | PLAY-01     | Audio quality requires human ear             | Hold a half note, verify sound sustains and releases on finger lift                           |
| Reduced-motion respects ring animation              | PLAY-01     | Accessibility visual check                   | Enable reduced-motion in accessibility settings, verify ring shows progress without animation |
| Pointer capture works when finger slides off button | PLAY-01     | Touch interaction edge case                  | Start holding tap area, slide finger off button, verify hold still registers                  |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
