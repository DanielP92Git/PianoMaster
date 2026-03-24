---
phase: 05
slug: milestone-celebrations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.js |
| **Quick run command** | `npx vitest run src/services/practiceStreakService.test.js` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` on modified test files
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | LOG-04 | unit | `npx vitest run src/services/practiceStreakService.test.js` | TBD | pending |
| 05-02-01 | 02 | 2 | LOG-04 | build+lint | `npm run build && npm run lint` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Vitest + React Testing Library already set up. No new test framework needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Celebration modal appears at milestone | LOG-04 | Visual + timing | Log practice until streak hits 5, verify modal appears with confetti |
| Reduced-motion skips confetti | LOG-04 | Browser preference | Enable prefers-reduced-motion, verify no confetti animation |
| Auto-dismiss after 4 seconds | LOG-04 | Timing behavior | Wait 4s after celebration appears, verify modal closes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
