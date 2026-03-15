---
phase: 02
slug: treble-accidentals-content
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | TREB-01 | smoke | `node -e "import('./src/data/units/trebleUnit4Redesigned.js').then(m => console.log(m.default.length))"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | TREB-02 | smoke | `node -e "import('./src/data/units/trebleUnit5Redesigned.js').then(m => console.log(m.default.length))"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | TREB-03 | smoke | `node -e "import('./src/data/units/trebleUnit5Redesigned.js').then(m => { const boss = m.default.find(n => n.id === 'boss_treble_accidentals'); console.log(boss?.isBoss, boss?.exercises?.length) })"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements
- `scripts/validateTrail.mjs` validates prerequisite chains, duplicate IDs, node types — but only after Phase 04 wires files into `expandedNodes.js`
- No new test files needed for Phase 02 — pure data authoring

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Node IDs unique and correctly numbered | TREB-01, TREB-02 | Trail validator runs only after Phase 04 integration | Inspect all `id` fields in both unit files; verify no duplicates with `trebleUnit1-3` |
| Order values sequential with no gaps/collisions | TREB-01, TREB-02, TREB-03 | No automated ordering check pre-integration | Verify Unit 4 starts at 27, Unit 5 starts at 27 + Unit 4 count, boss follows |
| Prerequisite chain is linear within each unit | TREB-01, TREB-02 | Trail validator unavailable pre-integration | Verify each node's `prerequisites` points to previous node; first node → `boss_treble_3` |
| No SIGHT_READING exercises in Unit 5 regular nodes | TREB-02 | Enharmonic mic bug (INTG-03) | Grep for `SIGHT_READING` in trebleUnit5Redesigned.js — should only appear in boss nodes |
| `accidentals: true` on all new nodes | TREB-01, TREB-02, TREB-03 | Config correctness check | Verify every `noteConfig` has `accidentals: true` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
