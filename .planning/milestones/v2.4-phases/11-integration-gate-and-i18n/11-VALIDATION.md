---
phase: 11
slug: integration-gate-and-i18n
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vite.config.js` (vitest configured via `test` key) |
| **Quick run command** | `npx vitest run src/data/units/` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run verify:trail`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | INTG-01 | build | `npm run build` | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | INTG-01 | unit | `npx vitest run src/data/units/` | ✅ | ⬜ pending |
| 11-01-03 | 01 | 1 | INTG-01 | build | `npm run verify:trail` | ✅ | ⬜ pending |
| 11-02-01 | 02 | 1 | INTG-02 | manual | Inspect FREE_NODE_IDS set | ✅ | ⬜ pending |
| 11-03-01 | 03 | 1 | INTG-03 | manual | Visual inspection of trail.json | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 1 | INTG-03 | manual | Visual inspection of HE trail.json | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No automated test for trail.json translation completeness — verify manually that all node names from the 6 unit files have entries in both EN and HE trail.json

*Existing infrastructure covers INTG-01 structurally via validateTrail.mjs. INTG-03 remains manual-only — acceptable for a data authoring task.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| New nodes gated behind paywall | INTG-02 | Requires UI interaction with subscription state | Attempt to play any new node without subscription — gold paywall overlay must appear |
| Hebrew translations display correctly | INTG-03 | Visual quality check for solfège terms and RTL layout | Switch to Hebrew locale, navigate trail, verify all new node names show Hebrew text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
