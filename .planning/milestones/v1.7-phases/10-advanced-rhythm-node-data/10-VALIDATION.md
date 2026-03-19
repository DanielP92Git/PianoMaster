---
phase: 10
slug: advanced-rhythm-node-data
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.js` |
| **Quick run command** | `npx vitest run src/data/units/` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/data/units/`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | RADV-01 | unit | `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | RADV-02 | unit | `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | RADV-03 | unit | `npx vitest run src/data/units/rhythmUnit8Redesigned.test.js` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 1 | RADV-04 | unit | `npx vitest run src/data/units/rhythmUnit8Redesigned.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/data/units/rhythmUnit7Redesigned.test.js` — stubs for RADV-01, RADV-02 (node structure, field validation, ordering, prerequisites)
- [ ] `src/data/units/rhythmUnit8Redesigned.test.js` — stubs for RADV-03, RADV-04 (syncopation nodes, boss challenge structure)

*Existing vitest infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 6/8 "two big beats" feel | RADV-01 | Subjective musical experience | Play discovery node at slow tempo, verify physical feel of compound meter |
| Boss multi-time-signature transition | RADV-04 | Requires MetronomeTrainer runtime | Complete boss exercises, verify 6/8→4/4 transition works |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
