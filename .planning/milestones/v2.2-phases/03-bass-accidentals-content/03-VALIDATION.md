---
phase: 03
slug: bass-accidentals-content
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (config: `vitest.config.js`) |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Manual node structure review + dynamic import export count check
- **After every plan wave:** Run `npx vitest run` (existing tests)
- **Before `/gsd:verify-work`:** Full suite must be green + manual review of all IDs, orders, prerequisites, enharmonic safety
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | BASS-01 | smoke | `node -e "import('./src/data/units/bassUnit4Redesigned.js').then(m=>console.log(m.default.length))"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | BASS-02 | smoke | `node -e "import('./src/data/units/bassUnit5Redesigned.js').then(m=>console.log(m.default.length))"` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | BASS-03 | smoke | `node -e "import('./src/data/units/bassUnit5Redesigned.js').then(m=>{const b=m.default.at(-1);console.log(b.id,b.category,b.isBoss,b.exercises.length)})"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validateTrail.mjs` — covers BASS-01, BASS-02, BASS-03 (runs only after Phase 04 integration)
- No new Vitest test files needed — pure data authoring with structural validation via validateTrail.mjs in Phase 04

*Existing infrastructure covers all runtime behaviors. Phase 03 introduces no runtime logic.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Node IDs, order values, prerequisite chains are correct | BASS-01, BASS-02 | Data files not wired into expandedNodes.js until Phase 04 | Review each unit file: verify sequential order values, correct prerequisites, no gaps |
| No SIGHT_READING in flats regular nodes (enharmonic safety) | BASS-01, BASS-02 | Structural review of exercise types | Grep each flats node for exercise types; confirm SIGHT_READING only in boss nodes |
| Accidentals flags set correctly on all nodes | BASS-01, BASS-02, BASS-03 | Node metadata review | Verify `hasAccidentals: true` on all accidental nodes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
