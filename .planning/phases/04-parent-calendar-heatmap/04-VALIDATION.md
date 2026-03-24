---
phase: 4
slug: parent-calendar-heatmap
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vite.config.js (vitest section) |
| **Quick run command** | `npx vitest run src/services/practiceLogService.test.js` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/services/practiceLogService.test.js`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | PARENT-01 | unit | `npx vitest run src/services/practiceLogService.test.js` | ✅ (extend) | ⬜ pending |
| 04-01-02 | 01 | 1 | PARENT-01 | unit | `npx vitest run src/services/practiceLogService.test.js` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | PARENT-01 | unit | `npx vitest run src/services/practiceLogService.test.js` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | PARENT-02 | unit | `npx vitest run src/services/practiceLogService.test.js` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | PARENT-02 | unit | `npx vitest run src/services/practiceLogService.test.js` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | PARENT-01 | component | manual / visual | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/services/practiceLogService.test.js` — Add tests for `getHistoricalLogs()`, `buildHeatmapData()`, `computeLongestStreak()`
- [ ] Binary theme test: practiced days level=1, others level=0
- [ ] Empty state test: all 364 entries at level=0

*Existing infrastructure covers framework needs — Vitest + testing-library already installed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PracticeHeatmapCard renders correctly | PARENT-01 | Visual component — no component tests per project convention | 1. Navigate to /parent-portal 2. Verify heatmap card renders below subscription card 3. Verify glass card styling matches existing cards |
| RTL heatmap direction | PARENT-02 | Visual layout verification | 1. Switch to Hebrew locale 2. Verify most recent week is rightmost 3. Verify month labels are in Hebrew |
| Empty state display | PARENT-01 | Visual verification | 1. Use account with no practice logs 2. Verify full gray grid with encouraging message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
