---
phase: 20
slug: component-integration-tab-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (JSDOM environment) |
| **Config file** | vite.config.js (test section) |
| **Quick run command** | `npx vitest run src/utils/xpSystem.test.js -x` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/utils/xpSystem.test.js -x`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 0 | PROG-01, PROG-02, PROG-03 | unit | `npx vitest run src/utils/xpSystem.test.js -x` | No — Wave 0 | pending |
| 20-02-01 | 02 | 1 | PROG-01 | unit | `npx vitest run src/utils/xpSystem.test.js -x` | Wave 0 | pending |
| 20-02-02 | 02 | 1 | PROG-01 | unit | same | Wave 0 | pending |
| 20-02-03 | 02 | 1 | PROG-02 | unit | same | Wave 0 | pending |
| 20-02-04 | 02 | 1 | PROG-02 | unit | same | Wave 0 | pending |
| 20-03-01 | 03 | 2 | PROG-03 | unit + manual | `npx vitest run src/utils/xpSystem.test.js -x` | Wave 0 | pending |
| 20-03-02 | 03 | 2 | PROG-03 | manual | N/A (visual) | N/A | pending |
| 20-03-03 | 03 | 2 | PROG-01, PROG-02 | manual | N/A (visual) | N/A | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `src/utils/xpSystem.test.js` — stubs for PROG-01 (30 levels with thresholds), PROG-02 (prestige logic), PROG-03 (level definitions with titles/icons)

*Existing Vitest infrastructure covers framework needs. Only test file creation is needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Level-up celebration modal shows reward | PROG-03 | Visual animation + modal content | 1. Set student XP near level threshold 2. Complete exercise to trigger level-up 3. Verify modal shows title/accessory |
| Prestige tier displays correctly in UI | PROG-02 | Visual styling (golden/amber) | 1. Set student XP beyond level 30 2. Load dashboard 3. Verify prestige tier name + golden styling |
| Progress bar does not freeze at level 30 | PROG-02 | Visual continuity | 1. Set student to level 30 2. Earn XP 3. Verify bar shows progress toward next prestige tier |
| Level 16+ visible on progress bar | PROG-01 | Visual rendering | 1. Set student to level 15 2. Earn XP 3. Verify level 16 name + progress bar updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
